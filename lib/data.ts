import "server-only";

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import type { Account, Comment, ReviewState, Song, Version, Workspace } from "@/lib/domain";

type SeedComment = {
  authorHandle: string;
  postedAt: string;
  body: string;
  timestampSeconds?: number;
};

type SeedVersion = {
  fileName: string;
  uploadedByHandle: string;
  uploadedAt: string;
  status: ReviewState;
  summary: string;
  durationSeconds: number;
  comments: SeedComment[];
};

const accountsSeed = [
  { name: "Nathan", role: "Bass player", email: "hoppinghosts@proton.me", handle: "ghostfrogcherry" },
  { name: "Landon", role: "Band Manager / Singer / Guitarist", email: "landon@dazeddays.local", handle: "landon" },
  { name: "Austin", role: "Guitarist", email: "austin@dazeddays.local", handle: "austin" },
  { name: "Emmerson", role: "Drummer", email: "emmerson@dazeddays.local", handle: "emmerson" }
] as const;

const songSeed: {
  workspace: { slug: string; name: string; genre: string };
  song: { slug: string; name: string; note: string; bpm: number; key: string };
  versions: SeedVersion[];
} = {
  workspace: {
    slug: "dazed-days-sessions",
    name: "Dazed Days Sessions",
    genre: "Private band workspace"
  },
  song: {
    slug: "dazed-days",
    name: "Dazed Days",
    note: "Lock the chorus energy and decide whether bass should push harder in the second verse.",
    bpm: 112,
    key: "E minor"
  },
  versions: [
    {
      fileName: "mix-v4.wav",
      uploadedByHandle: "landon",
      uploadedAt: isoOffset({ minutes: 28 }),
      status: "Pending review",
      summary: "Latest working mix with louder chorus guitars, tighter bass pocket, and a cleaner vocal delay throw.",
      durationSeconds: 246,
      comments: [
        {
          authorHandle: "ghostfrogcherry",
          postedAt: isoOffset({ minutes: 21 }),
          timestampSeconds: 82,
          body: "Bass is sitting better here, but I think the second verse could still hit a little harder."
        },
        {
          authorHandle: "emmerson",
          postedAt: isoOffset({ minutes: 17 }),
          timestampSeconds: 168,
          body: "Chorus lift feels right. I would keep the kick punchy and not wash it out with more room."
        },
        {
          authorHandle: "austin",
          postedAt: isoOffset({ minutes: 9 }),
          body: "The guitars are finally opening up in the hook without stepping on the vocal."
        }
      ]
    },
    {
      fileName: "mix-v3.wav",
      uploadedByHandle: "landon",
      uploadedAt: isoOffset({ hours: 24 }),
      status: "Changes requested",
      summary: "Pulled the lead vocal forward and tucked the rhythm guitars to make room for the chorus melody.",
      durationSeconds: 246,
      comments: [
        {
          authorHandle: "ghostfrogcherry",
          postedAt: isoOffset({ hours: 23 }),
          timestampSeconds: 54,
          body: "Verse groove improved, but the bass disappears when the chorus doubles come in."
        },
        {
          authorHandle: "landon",
          postedAt: isoOffset({ hours: 22 }),
          body: "Need one more pass where the hook feels wider without losing the vocal."
        }
      ]
    },
    {
      fileName: "mix-v2.wav",
      uploadedByHandle: "austin",
      uploadedAt: isoOffset({ days: 3 }),
      status: "Approved",
      summary: "Arrangement reference bounce after the intro guitar cleanup and tighter bridge transition.",
      durationSeconds: 245,
      comments: [
        {
          authorHandle: "emmerson",
          postedAt: isoOffset({ days: 3, minutes: -10 }),
          body: "Good reference point for arrangement. The bridge move works."
        }
      ]
    }
  ]
};

const dataDirectory = join(/* turbopackIgnore: true */ process.cwd(), "data");
const uploadsDirectory = join(/* turbopackIgnore: true */ process.cwd(), "uploads", "audio");
const dbPath = join(dataDirectory, "musegit.db");

let database: Database.Database | null = null;

function isoOffset(offset: { minutes?: number; hours?: number; days?: number }) {
  const date = new Date();
  const minutes = offset.minutes ?? 0;
  const hours = offset.hours ?? 0;
  const days = offset.days ?? 0;

  date.setMinutes(date.getMinutes() - minutes);
  date.setHours(date.getHours() - hours);
  date.setDate(date.getDate() - days);

  return date.toISOString();
}

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
      handle TEXT NOT NULL UNIQUE
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
      PRIMARY KEY (workspace_id, user_id)
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
}

function seed(db: Database.Database) {
  const existingWorkspace = db.prepare("SELECT COUNT(*) AS count FROM workspaces").get() as { count: number };

  if (existingWorkspace.count > 0) {
    return;
  }

  const insertUser = db.prepare("INSERT INTO users (name, role, email, handle) VALUES (?, ?, ?, ?)");
  const insertWorkspace = db.prepare("INSERT INTO workspaces (slug, name, genre) VALUES (?, ?, ?)");
  const insertMembership = db.prepare("INSERT INTO workspace_members (workspace_id, user_id) VALUES (?, ?)");
  const insertSong = db.prepare(
    "INSERT INTO songs (workspace_id, slug, name, status, note, bpm, key_signature) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertVersion = db.prepare(
    "INSERT INTO versions (song_id, file_name, uploaded_by_user_id, created_at, status, summary, duration_seconds, file_path, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertComment = db.prepare(
    "INSERT INTO comments (version_id, user_id, created_at, body, timestamp_seconds) VALUES (?, ?, ?, ?, ?)"
  );
  const updateSongLatest = db.prepare("UPDATE songs SET latest_version_id = ?, status = ? WHERE id = ?");

  const userIds = new Map<string, number>();

  for (const account of accountsSeed) {
    const result = insertUser.run(account.name, account.role, account.email, account.handle);
    userIds.set(account.handle, Number(result.lastInsertRowid));
  }

  const workspaceResult = insertWorkspace.run(songSeed.workspace.slug, songSeed.workspace.name, songSeed.workspace.genre);
  const workspaceId = Number(workspaceResult.lastInsertRowid);

  for (const account of accountsSeed) {
    insertMembership.run(workspaceId, userIds.get(account.handle));
  }

  const songResult = insertSong.run(
    workspaceId,
    songSeed.song.slug,
    songSeed.song.name,
    songSeed.versions[0].status,
    songSeed.song.note,
    songSeed.song.bpm,
    songSeed.song.key
  );
  const songId = Number(songResult.lastInsertRowid);

  let latestVersionId = 0;

  for (const version of songSeed.versions) {
    const versionResult = insertVersion.run(
      songId,
      version.fileName,
      userIds.get(version.uploadedByHandle),
      version.uploadedAt,
      version.status,
      version.summary,
      version.durationSeconds,
      null,
      null
    );
    const versionId = Number(versionResult.lastInsertRowid);

    if (!latestVersionId) {
      latestVersionId = versionId;
    }

    for (const comment of version.comments) {
      insertComment.run(
        versionId,
        userIds.get(comment.authorHandle),
        comment.postedAt,
        comment.body,
        comment.timestampSeconds ?? null
      );
    }
  }

  updateSongLatest.run(latestVersionId, songSeed.versions[0].status, songId);
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

function getMembersForWorkspace(workspaceId: number) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT users.id, users.name, users.role, users.email, users.handle
       FROM workspace_members
       INNER JOIN users ON users.id = workspace_members.user_id
       WHERE workspace_members.workspace_id = ?
       ORDER BY users.id`
    )
    .all(workspaceId) as Account[];

  return rows;
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
    comments: getCommentsForVersion(row.id)
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
       LIMIT 3`
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
       LIMIT 3`
    )
    .all(workspaceId) as Array<{ created_at: string; user_name: string; song_name: string; body: string }>;

  const items = [
    ...versionRows.map((row) => ({ created_at: row.created_at, text: `${row.user_name} uploaded ${row.file_name} to ${row.song_name}` })),
    ...commentRows.map((row) => ({ created_at: row.created_at, text: `${row.user_name} commented on ${row.song_name}: ${row.body}` }))
  ]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 4)
    .map((item) => item.text);

  return items;
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

export function listAccounts() {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users ORDER BY id").all() as Account[];
}

export function getUserByHandle(handle: string) {
  const db = getDb();
  return db.prepare("SELECT id, name, role, email, handle FROM users WHERE handle = ?").get(handle) as Account | undefined;
}

export function getDemoUser() {
  return getUserByHandle("ghostfrogcherry") ?? listAccounts()[0];
}

export function listWorkspaces() {
  const db = getDb();
  const rows = db.prepare("SELECT id, slug, name, genre FROM workspaces ORDER BY id").all() as Array<{
    id: number;
    slug: string;
    name: string;
    genre: string;
  }>;

  return rows.map(buildWorkspaceFromRow);
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

export function getSongById(songId: number) {
  const db = getDb();
  const row = db.prepare("SELECT id, workspace_id, slug, name FROM songs WHERE id = ?").get(songId) as {
    id: number;
    workspace_id: number;
    slug: string;
    name: string;
  } | undefined;

  return row;
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
    comments: getCommentsForVersion(row.id)
  } satisfies Version;
}

export function getAudioFilePath(versionId: number) {
  const db = getDb();
  const row = db.prepare("SELECT file_path, mime_type FROM versions WHERE id = ?").get(versionId) as {
    file_path: string | null;
    mime_type: string | null;
  } | undefined;

  return row;
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
