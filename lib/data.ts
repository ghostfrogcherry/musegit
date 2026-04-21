import "server-only";

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import type { Account, Comment, ReviewState, Song, Version, Workspace } from "@/lib/domain";
import { hashPassword } from "@/lib/security";

const adminSeed = {
  name: "Nathan",
  role: "Admin",
  email: "hoppinghosts@proton.me",
  handle: "ghostfrogcherry",
  password: "lowend4life"
} as const;

const legacyHandles = ["landon", "austin", "emmerson"] as const;
const dataDirectory = join(/* turbopackIgnore: true */ process.cwd(), "data");
const uploadsDirectory = join(/* turbopackIgnore: true */ process.cwd(), "uploads", "audio");
const dbPath = join(dataDirectory, "musegit.db");

let database: Database.Database | null = null;

function getDb() {
  if (!database) {
    mkdirSync(dataDirectory, { recursive: true });
    mkdirSync(uploadsDirectory, { recursive: true });
    database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    initialize(database);
    seed(database);
  }

  return database;
}

function initialize(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      genre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      PRIMARY KEY (workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS version_approvals (
      version_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      approved_at TEXT NOT NULL,
      PRIMARY KEY (version_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      key_signature TEXT NOT NULL,
      latest_version_id INTEGER,
      UNIQUE (workspace_id, slug)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_by_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      duration_seconds INTEGER,
      file_path TEXT,
      mime_type TEXT
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      body TEXT NOT NULL,
      timestamp_seconds INTEGER
    );
  `);

  ensureColumn(db, "users", "password_hash", "TEXT");
}

function ensureColumn(db: Database.Database, tableName: string, columnName: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function seed(db: Database.Database) {
  cleanupLegacyDemoData(db);
  ensureAdminAccount(db);
}

function cleanupLegacyDemoData(db: Database.Database) {
  const legacyWorkspace = db.prepare("SELECT id FROM workspaces WHERE slug = ?").get("dazed-days-sessions") as { id: number } | undefined;
  const legacyUsers = db
    .prepare(`SELECT COUNT(*) AS count FROM users WHERE handle IN (${legacyHandles.map(() => "?").join(", ")})`)
    .get(...legacyHandles) as { count: number };

  if (!legacyWorkspace && legacyUsers.count === 0) {
    return;
  }

  db.prepare("DELETE FROM comments").run();
  db.prepare("DELETE FROM versions").run();
  db.prepare("DELETE FROM songs").run();
  db.prepare("DELETE FROM workspace_members").run();
  db.prepare("DELETE FROM workspaces").run();
  db.prepare("DELETE FROM users WHERE handle != ?").run(adminSeed.handle);
}

function ensureAdminAccount(db: Database.Database) {
  const existing = db.prepare("SELECT id, password_hash FROM users WHERE handle = ?").get(adminSeed.handle) as
    | { id: number; password_hash: string | null }
    | undefined;

  if (!existing) {
    db.prepare("INSERT INTO users (name, role, email, handle, password_hash) VALUES (?, ?, ?, ?, ?)").run(
      adminSeed.name,
      adminSeed.role,
      adminSeed.email,
      adminSeed.handle,
      hashPassword(adminSeed.password)
    );
    return;
  }

  db.prepare("UPDATE users SET name = ?, role = ?, email = ? WHERE id = ?").run(
    adminSeed.name,
    adminSeed.role,
    adminSeed.email,
    existing.id
  );

  if (!existing.password_hash) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(adminSeed.password), existing.id);
  }
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 1) {
    return "just now";
  }

  if (Math.abs(diffMinutes) < 60) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffDays, "day");
}

function formatDuration(seconds: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return "--:--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatTimestamp(seconds: number | null) {
  if (seconds === null || seconds === undefined) {
    return undefined;
  }

  return formatDuration(seconds);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function createUniqueWorkspaceSlug(db: Database.Database, name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (db.prepare("SELECT 1 FROM workspaces WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function createUniqueSongSlug(db: Database.Database, workspaceId: number, name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (db.prepare("SELECT 1 FROM songs WHERE workspace_id = ? AND slug = ?").get(workspaceId, slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function getMembersForWorkspace(workspaceId: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT users.id, users.name, users.role, users.email, users.handle, workspace_members.role AS workspace_role
       FROM workspace_members
       INNER JOIN users ON users.id = workspace_members.user_id
       WHERE workspace_members.workspace_id = ?
       ORDER BY users.id`
    )
    .all(workspaceId) as (Account & { workspace_role: string })[];
}

function getCommentsForVersion(versionId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT comments.id, users.name AS author, comments.created_at, comments.body, comments.timestamp_seconds
       FROM comments
       INNER JOIN users ON users.id = comments.user_id
       WHERE comments.version_id = ?
       ORDER BY comments.created_at DESC, comments.id DESC`
    )
    .all(versionId) as Array<{
      id: number;
      author: string;
      created_at: string;
      body: string;
      timestamp_seconds: number | null;
    }>;

  return rows.map<Comment>((row) => ({
    id: row.id,
    author: row.author,
    postedAt: formatRelativeTime(row.created_at),
    body: row.body,
    timestamp: formatTimestamp(row.timestamp_seconds)
  }));
}

function getVersionsForSong(songId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT versions.id, versions.file_name, versions.created_at, versions.status, versions.summary, versions.duration_seconds,
              versions.file_path, users.name AS uploaded_by
       FROM versions
       INNER JOIN users ON users.id = versions.uploaded_by_user_id
       WHERE versions.song_id = ?
       ORDER BY versions.created_at DESC, versions.id DESC`
    )
    .all(songId) as Array<{
      id: number;
      file_name: string;
      created_at: string;
      status: ReviewState;
      summary: string;
      duration_seconds: number | null;
      file_path: string | null;
      uploaded_by: string;
    }>;

  return rows.map<Version>((row) => ({
    id: row.id,
    fileName: row.file_name,
    uploadedBy: row.uploaded_by,
    uploadedAt: formatRelativeTime(row.created_at),
    status: row.status,
    summary: row.summary,
    duration: formatDuration(row.duration_seconds),
    audioUrl: row.file_path ? `/api/audio/${row.id}` : null,
    comments: getCommentsForVersion(row.id),
    approvals: getApprovalsForVersion(row.id)
  }));
}

function buildSongFromRow(row: {
  id: number;
  slug: string;
  name: string;
  status: ReviewState;
  note: string;
  bpm: number;
  key_signature: string;
  latest_version_id: number | null;
}) {
  const versions = getVersionsForSong(row.id);
  const latestVersionId = row.latest_version_id ?? versions[0]?.id ?? 0;
  const latestVersion = versions.find((version) => version.id === latestVersionId) ?? versions[0];
  const totalComments = versions.reduce((count, version) => count + version.comments.length, 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    version: latestVersion?.fileName ?? "No versions yet",
    note: row.note,
    comments: totalComments,
    updatedAt: latestVersion?.uploadedAt ?? "just now",
    bpm: row.bpm,
    key: row.key_signature,
    latestVersionId,
    versions
  } satisfies Song;
}

function getSongsForWorkspace(workspaceId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, slug, name, status, note, bpm, key_signature, latest_version_id
       FROM songs
       WHERE workspace_id = ?
       ORDER BY id`
    )
    .all(workspaceId) as Array<{
      id: number;
      slug: string;
      name: string;
      status: ReviewState;
      note: string;
      bpm: number;
      key_signature: string;
      latest_version_id: number | null;
    }>;

  return rows.map(buildSongFromRow);
}

function getActivityForWorkspace(workspaceId: number) {
  const db = getDb();
  const versionRows = db
    .prepare(
      `SELECT versions.created_at, users.name AS user_name, versions.file_name, songs.name AS song_name
       FROM versions
       INNER JOIN songs ON songs.id = versions.song_id
       INNER JOIN users ON users.id = versions.uploaded_by_user_id
       WHERE songs.workspace_id = ?
       ORDER BY versions.created_at DESC, versions.id DESC
       LIMIT 4`
    )
    .all(workspaceId) as Array<{ created_at: string; user_name: string; file_name: string; song_name: string }>;
  const commentRows = db
    .prepare(
      `SELECT comments.created_at, users.name AS user_name, songs.name AS song_name, comments.body
       FROM comments
       INNER JOIN versions ON versions.id = comments.version_id
       INNER JOIN songs ON songs.id = versions.song_id
       INNER JOIN users ON users.id = comments.user_id
       WHERE songs.workspace_id = ?
       ORDER BY comments.created_at DESC, comments.id DESC
       LIMIT 4`
    )
    .all(workspaceId) as Array<{ created_at: string; user_name: string; song_name: string; body: string }>;

  return [
    ...versionRows.map((row) => ({ created_at: row.created_at, text: `${row.user_name} uploaded ${row.file_name} to ${row.song_name}` })),
    ...commentRows.map((row) => ({ created_at: row.created_at, text: `${row.user_name} commented on ${row.song_name}: ${row.body}` }))
  ]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 6)
    .map((item) => item.text);
}

function buildWorkspaceFromRow(row: { id: number; slug: string; name: string; genre: string }) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre,
    members: getMembersForWorkspace(row.id),
    songs: getSongsForWorkspace(row.id),
    activity: getActivityForWorkspace(row.id)
  } satisfies Workspace;
}

function buildUserWorkspaces(userId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT workspaces.id, workspaces.slug, workspaces.name, workspaces.genre
       FROM workspace_members
       INNER JOIN workspaces ON workspaces.id = workspace_members.workspace_id
       WHERE workspace_members.user_id = ?
       ORDER BY workspaces.id DESC`
    )
    .all(userId) as Array<{ id: number; slug: string; name: string; genre: string }>;

  return rows.map(buildWorkspaceFromRow);
}

export function listAccounts() {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users ORDER BY id").all() as Account[];
}

export function getUserById(id: number) {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users WHERE id = ?").get(id) as Account | undefined;
}

export function getUserByHandle(handle: string) {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users WHERE handle = ?").get(handle) as Account | undefined;
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users WHERE email = ?").get(email) as Account | undefined;
}

export function getUserForSignIn(identifier: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, role, email, handle, password_hash
       FROM users
       WHERE lower(handle) = lower(?) OR lower(email) = lower(?)
       LIMIT 1`
    )
    .get(identifier, identifier) as
    | (Account & { password_hash: string | null })
    | undefined;
}

export function createUserAccount(input: { name: string; email: string; handle: string; password: string }) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?) OR lower(handle) = lower(?)")
    .get(input.email, input.handle) as { id: number } | undefined;

  if (existing) {
    return { error: "An account with that email or handle already exists." } as const;
  }

  const result = db.prepare("INSERT INTO users (name, role, email, handle, password_hash) VALUES (?, ?, ?, ?, ?)").run(
    input.name,
    "Member",
    input.email,
    input.handle,
    hashPassword(input.password)
  );
  const userId = Number(result.lastInsertRowid);

  createWorkspace({
    userId,
    name: `${input.name.split(" ")[0] || input.name}'s First Album`,
    genre: "Album in progress"
  });

  return { userId } as const;
}

export function listWorkspaces() {
  const db = getDb();
  const rows = db.prepare("SELECT id, slug, name, genre FROM workspaces ORDER BY id DESC").all() as Array<{
    id: number;
    slug: string;
    name: string;
    genre: string;
  }>;

  return rows.map(buildWorkspaceFromRow);
}

export function listUserWorkspaces(userId: number) {
  return buildUserWorkspaces(userId);
}

export function listUserActivity(userId: number) {
  return buildUserWorkspaces(userId)
    .flatMap((workspace) => workspace.activity.map((text) => ({ workspace: workspace.name, text })))
    .slice(0, 10);
}

export function getWorkspace(slug: string) {
  const db = getDb();
  const row = db.prepare("SELECT id, slug, name, genre FROM workspaces WHERE slug = ?").get(slug) as {
    id: number;
    slug: string;
    name: string;
    genre: string;
  } | undefined;

  return row ? buildWorkspaceFromRow(row) : undefined;
}

export function getWorkspaceForUser(userId: number, slug: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT workspaces.id, workspaces.slug, workspaces.name, workspaces.genre
       FROM workspace_members
       INNER JOIN workspaces ON workspaces.id = workspace_members.workspace_id
       WHERE workspace_members.user_id = ? AND workspaces.slug = ?`
    )
    .get(userId, slug) as { id: number; slug: string; name: string; genre: string } | undefined;

  return row ? buildWorkspaceFromRow(row) : undefined;
}

export function getSong(workspaceSlug: string, songSlug: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT songs.id, songs.slug, songs.name, songs.status, songs.note, songs.bpm, songs.key_signature, songs.latest_version_id,
              workspaces.id AS workspace_id, workspaces.slug AS workspace_slug, workspaces.name AS workspace_name, workspaces.genre AS workspace_genre
       FROM songs
       INNER JOIN workspaces ON workspaces.id = songs.workspace_id
       WHERE workspaces.slug = ? AND songs.slug = ?`
    )
    .get(workspaceSlug, songSlug) as
    | {
        id: number;
        slug: string;
        name: string;
        status: ReviewState;
        note: string;
        bpm: number;
        key_signature: string;
        latest_version_id: number | null;
        workspace_id: number;
        workspace_slug: string;
        workspace_name: string;
        workspace_genre: string;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  const workspace = buildWorkspaceFromRow({
    id: row.workspace_id,
    slug: row.workspace_slug,
    name: row.workspace_name,
    genre: row.workspace_genre
  });
  const song = buildSongFromRow(row);
  const currentVersion = song.versions.find((version) => version.id === song.latestVersionId) ?? song.versions[0];

  return { workspace, song, currentVersion };
}

export function getSongForUser(userId: number, workspaceSlug: string, songSlug: string) {
  const workspace = getWorkspaceForUser(userId, workspaceSlug);

  if (!workspace) {
    return undefined;
  }

  const song = workspace.songs.find((entry) => entry.slug === songSlug);

  if (!song) {
    return undefined;
  }

  const currentVersion = song.versions.find((version) => version.id === song.latestVersionId) ?? song.versions[0];
  return { workspace, song, currentVersion };
}

export function createWorkspace(input: { userId: number; name: string; genre?: string }) {
  const db = getDb();
  const name = input.name.trim();

  if (!name) {
    return undefined;
  }

  const slug = createUniqueWorkspaceSlug(db, name);
  const result = db.prepare("INSERT INTO workspaces (slug, name, genre) VALUES (?, ?, ?)").run(
    slug,
    name,
    input.genre?.trim() || "Album in progress"
  );
  const workspaceId = Number(result.lastInsertRowid);

  db.prepare("INSERT INTO workspace_members (workspace_id, user_id) VALUES (?, ?)").run(workspaceId, input.userId);

  return getWorkspace(slug);
}

export function addWorkspaceMember(workspaceId: number, userId: number, role: string = "member") {
  const db = getDb();
  try {
    db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)").run(workspaceId, userId, role);
    return true;
  } catch {
    return false;
  }
}

export function updateWorkspaceMemberRole(workspaceId: number, userId: number, role: string) {
  const db = getDb();
  db.prepare("UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?").run(role, workspaceId, userId);
}

export function removeWorkspaceMember(workspaceId: number, userId: number) {
  const db = getDb();
  db.prepare("DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?").run(workspaceId, userId);
}

export function createSongRecord(input: { workspaceId: number; name: string; note?: string }) {
  const db = getDb();
  const name = input.name.trim();

  if (!name) {
    return undefined;
  }

  const slug = createUniqueSongSlug(db, input.workspaceId, name);
  const result = db
    .prepare(
      `INSERT INTO songs (workspace_id, slug, name, status, note, bpm, key_signature, latest_version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.workspaceId,
      slug,
      name,
      "Pending review",
      input.note?.trim() || "Capture notes, upload a version, and start review.",
      120,
      "C major",
      null
    );

  return db.prepare("SELECT id, workspace_id, slug, name FROM songs WHERE id = ?").get(Number(result.lastInsertRowid)) as {
    id: number;
    workspace_id: number;
    slug: string;
    name: string;
  };
}

export function getSongById(songId: number) {
  const db = getDb();
  return db.prepare("SELECT id, workspace_id, slug, name FROM songs WHERE id = ?").get(songId) as {
    id: number;
    workspace_id: number;
    slug: string;
    name: string;
  } | undefined;
}

export function updateVersionStatus(versionId: number, status: ReviewState) {
  const db = getDb();
  const version = db.prepare("SELECT id, song_id FROM versions WHERE id = ?").get(versionId) as { id: number; song_id: number } | undefined;

  if (!version) {
    return undefined;
  }

  db.prepare("UPDATE versions SET status = ? WHERE id = ?").run(status, versionId);

  const song = db.prepare("SELECT latest_version_id FROM songs WHERE id = ?").get(version.song_id) as { latest_version_id: number | null };

  if (song.latest_version_id === versionId) {
    db.prepare("UPDATE songs SET status = ? WHERE id = ?").run(status, version.song_id);
  }

  return getVersion(versionId);
}

export function createComment(input: { versionId: number; userId: number; body: string; timestampSeconds?: number }) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO comments (version_id, user_id, created_at, body, timestamp_seconds) VALUES (?, ?, ?, ?, ?)")
    .run(input.versionId, input.userId, createdAt, input.body, input.timestampSeconds ?? null);

  return getComment(Number(result.lastInsertRowid));
}

export function addVersionApproval(versionId: number, userId: number) {
  const db = getDb();
  const approvedAt = new Date().toISOString();
  db.prepare(
    "INSERT OR REPLACE INTO version_approvals (version_id, user_id, approved_at) VALUES (?, ?, ?)"
  ).run(versionId, userId, approvedAt);
}

export function removeVersionApproval(versionId: number, userId: number) {
  const db = getDb();
  db.prepare("DELETE FROM version_approvals WHERE version_id = ? AND user_id = ?").run(versionId, userId);
}

export function removeAllApprovalsForVersion(versionId: number) {
  const db = getDb();
  db.prepare("DELETE FROM version_approvals WHERE version_id = ?").run(versionId);
}

export function getApprovalsForVersion(versionId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT version_id AS versionId, user_id AS userId, approved_at AS approvedAt
       FROM version_approvals
       WHERE version_id = ?`
    )
    .all(versionId) as { versionId: number; userId: number; approvedAt: string }[];
  return rows;
}

export function getWorkspaceMembers(workspaceId: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT users.id, users.name, users.role, users.email, users.handle, workspace_members.role AS workspace_role
       FROM workspace_members
       INNER JOIN users ON users.id = workspace_members.user_id
       WHERE workspace_members.workspace_id = ?
       ORDER BY users.id`
    )
    .all(workspaceId) as (Account & { workspace_role: string })[];
}

export function createVersion(input: {
  songId: number;
  uploadedByUserId: number;
  fileName: string;
  summary: string;
  durationSeconds?: number;
  filePath: string;
  mimeType: string;
}) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO versions (song_id, file_name, uploaded_by_user_id, created_at, status, summary, duration_seconds, file_path, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.songId,
      input.fileName,
      input.uploadedByUserId,
      createdAt,
      "Pending review",
      input.summary,
      input.durationSeconds ?? null,
      input.filePath,
      input.mimeType
    );
  const versionId = Number(result.lastInsertRowid);

  db.prepare("UPDATE songs SET latest_version_id = ?, status = ? WHERE id = ?").run(versionId, "Pending review", input.songId);

  return getVersion(versionId);
}

export function getVersion(versionId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT versions.id, versions.file_name, versions.created_at, versions.status, versions.summary, versions.duration_seconds,
              versions.file_path, users.name AS uploaded_by
       FROM versions
       INNER JOIN users ON users.id = versions.uploaded_by_user_id
       WHERE versions.id = ?`
    )
    .get(versionId) as
    | {
        id: number;
        file_name: string;
        created_at: string;
        status: ReviewState;
        summary: string;
        duration_seconds: number | null;
        file_path: string | null;
        uploaded_by: string;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    fileName: row.file_name,
    uploadedBy: row.uploaded_by,
    uploadedAt: formatRelativeTime(row.created_at),
    status: row.status,
    summary: row.summary,
    duration: formatDuration(row.duration_seconds),
    audioUrl: row.file_path ? `/api/audio/${row.id}` : null,
    comments: getCommentsForVersion(row.id),
    approvals: getApprovalsForVersion(row.id)
  } satisfies Version;
}

export function getAudioFilePath(versionId: number) {
  const db = getDb();
  return db.prepare("SELECT file_path, mime_type FROM versions WHERE id = ?").get(versionId) as {
    file_path: string | null;
    mime_type: string | null;
  } | undefined;
}

function getComment(commentId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT comments.id, comments.created_at, comments.body, comments.timestamp_seconds, users.name AS author
       FROM comments
       INNER JOIN users ON users.id = comments.user_id
       WHERE comments.id = ?`
    )
    .get(commentId) as
    | {
        id: number;
        created_at: string;
        body: string;
        timestamp_seconds: number | null;
        author: string;
      }
    | undefined;

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    author: row.author,
    postedAt: formatRelativeTime(row.created_at),
    body: row.body,
    timestamp: formatTimestamp(row.timestamp_seconds)
  } satisfies Comment;
}
