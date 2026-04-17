"use client";

import { useRef, useState } from "react";
import type { Account, ReviewState, Song, Workspace } from "@/lib/domain";
import { WaveformPlayer } from "./waveform-player";

type SongReviewDemoProps = {
  currentUser: Account;
  workspace: Workspace;
  song: Song;
};

type UploadDraft = {
  summary: string;
};

function statusClassName(status: ReviewState) {
  return `status status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function parseTimestamp(input: string) {
  if (!input.trim()) {
    return undefined;
  }

  const parts = input.split(":").map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return undefined;
}

function parseDurationToSeconds(duration: string) {
  if (!duration) return 180;

  const parts = duration.split(":").map(Number);

  if (parts.length === 2 && !parts.some(Number.isNaN)) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 1 && !Number.isNaN(parts[0])) {
    return parts[0];
  }

  return 180;
}

export function SongReviewDemo({ currentUser, workspace, song }: SongReviewDemoProps) {
  const [versions, setVersions] = useState(song.versions);
  const [latestVersionId, setLatestVersionId] = useState(song.latestVersionId);
  const [selectedVersionId, setSelectedVersionId] = useState(song.latestVersionId);
  const [songStatus, setSongStatus] = useState<ReviewState>(song.status);
  const [songVersion, setSongVersion] = useState(song.version);
  const [songUpdatedAt, setSongUpdatedAt] = useState(song.updatedAt);
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentTimestamp, setCommentTimestamp] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadPending, setUploadPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({
    summary: "Tightened low-end, nudged lead vocal forward, and cleaned the bridge transition."
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const commentCount = versions.reduce((count, version) => count + version.comments.length, 0);

  async function applyReviewState(nextState: ReviewState) {
    setStatusPending(true);

    const response = await fetch(`/api/versions/${selectedVersionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextState })
    });

    setStatusPending(false);

    if (!response.ok) {
      return;
    }

    const version = await response.json();
    if (selectedVersionId === latestVersionId) {
      setSongStatus(nextState);
    }
    setSongUpdatedAt("just now");
    setVersions((current) => current.map((entry) => (entry.id === selectedVersionId ? version : entry)));
  }

  async function addComment() {
    const trimmedBody = commentBody.trim();

    if (!trimmedBody) {
      setCommentError("Comment text is required.");
      return;
    }

    setCommentPending(true);
    setCommentError("");

    const response = await fetch(`/api/versions/${selectedVersionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: trimmedBody,
        timestampSeconds: parseTimestamp(commentTimestamp)
      })
    });

    setCommentPending(false);

    if (!response.ok) {
      setCommentError("Could not save the comment.");
      return;
    }

    const comment = await response.json();

    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersionId
          ? { ...version, comments: [comment, ...version.comments] }
          : version
      )
    );
    setCommentBody("");
    setCommentTimestamp("");
  }

  async function addVersion() {
    const trimmedSummary = uploadDraft.summary.trim();
    const file = fileInputRef.current?.files?.[0];

    if (!file || !trimmedSummary) {
      setUploadError("Select an audio file and add a short summary.");
      return;
    }

    setUploadPending(true);
    setUploadError("");

    const formData = new FormData();
    formData.set("songId", String(song.id));
    formData.set("summary", trimmedSummary);
    formData.set("audio", file);

    const response = await fetch(`/api/songs/${song.id}/versions`, {
      method: "POST",
      body: formData
    });

    setUploadPending(false);

    if (!response.ok) {
      setUploadError("Could not upload the audio file.");
      return;
    }

    const newVersion = await response.json();
    setVersions((current) => [newVersion, ...current]);
    setLatestVersionId(newVersion.id);
    setSelectedVersionId(newVersion.id);
    setSongStatus("Pending review");
    setSongVersion(newVersion.fileName);
    setSongUpdatedAt("just now");
    setComposerOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function jumpToTimestamp(timestamp?: string) {
    if (!timestamp || !audioRef.current) {
      return;
    }

    const seconds = parseTimestamp(timestamp);

    if (seconds === undefined) {
      return;
    }

    audioRef.current.currentTime = seconds;
    void audioRef.current.play();
  }

  return (
    <main className="appMain">
      <section className="workspaceHero panel">
        <div>
          <p className="eyebrow">Song review</p>
          <h1 className="workspaceTitle">{song.name}</h1>
          <p className="lede">{workspace.name} · {song.key} · {song.bpm} BPM</p>
        </div>
        <div className="workspaceMeta panel softPanel">
          <span>{songVersion}</span>
          <span>{commentCount} comments</span>
          <span className={statusClassName(songStatus)}>{songStatus}</span>
        </div>
      </section>

      <section className="detailGrid songDetailGrid">
        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Current version</h2>
            <span>{currentVersion.fileName} · uploaded {currentVersion.uploadedAt}</span>
          </div>
          <div className="currentVersionCard">
            <div className="versionBadgeRow">
              <span className="versionPill">{currentVersion.duration}</span>
              <span className={statusClassName(currentVersion.status)}>{currentVersion.status}</span>
            </div>
            <p className="currentVersionSummary">{currentVersion.summary}</p>
            {currentVersion.audioUrl ? (
              <WaveformPlayer
                audioSrc={currentVersion.audioUrl}
                durationSeconds={parseDurationToSeconds(currentVersion.duration)}
                comments={currentVersion.comments}
              />
            ) : (
              <p className="songNote topSpace">No audio file attached to this version yet. Upload a new pass to add playback.</p>
            )}
            <div className="metaPairGrid topSpace">
              <div className="metaBlock softPanel panel">
                <p className="authLabel">Uploaded by</p>
                <strong>{currentVersion.uploadedBy}</strong>
              </div>
              <div className="metaBlock softPanel panel">
                <p className="authLabel">Review guidance</p>
                <strong>{song.note}</strong>
              </div>
            </div>
          </div>
        </article>

        <aside className="stackColumn">
          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Review state</h2>
              <span>What the band should do next</span>
            </div>
            <div className="reviewActions">
              <button className={`reviewButton approve buttonReset${songStatus === "Approved" ? " reviewButtonActive" : ""}`} disabled={statusPending} onClick={() => applyReviewState("Approved")} type="button">Approve version</button>
              <button className={`reviewButton request buttonReset${songStatus === "Changes requested" ? " reviewButtonActive" : ""}`} disabled={statusPending} onClick={() => applyReviewState("Changes requested")} type="button">Request changes</button>
              <button className={`reviewButton pending buttonReset${songStatus === "Pending review" ? " reviewButtonActive" : ""}`} disabled={statusPending} onClick={() => applyReviewState("Pending review")} type="button">Leave pending</button>
            </div>
            <p className="songNote topSpace">Review changes now persist to the local SQLite store.</p>
          </article>

          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Upload next version</h2>
              <button className="secondaryButton buttonReset inlineButton" onClick={() => setComposerOpen((open) => !open)} type="button">
                {composerOpen ? "Hide composer" : "Open composer"}
              </button>
            </div>
            {composerOpen ? (
              <div className="uploadComposer">
                <label className="fieldLabel" htmlFor="audioFile">Audio file</label>
                <input accept="audio/*" className="fieldInput" id="audioFile" ref={fileInputRef} type="file" />
                <label className="fieldLabel" htmlFor="summary">What changed</label>
                <textarea className="fieldInput fieldTextarea" id="summary" onChange={(event) => setUploadDraft({ summary: event.target.value })} value={uploadDraft.summary} />
                {uploadError ? <p className="formError">{uploadError}</p> : null}
                <button className="primaryButton buttonReset inlineButton" disabled={uploadPending} onClick={addVersion} type="button">{uploadPending ? "Uploading..." : "Upload audio version"}</button>
              </div>
            ) : (
              <p className="songNote">Upload an actual audio file to create a playable version inside the song thread.</p>
            )}
          </article>

          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Navigate</h2>
              <span>Back to the band board</span>
            </div>
            <a className="secondaryButton inlineButton" href={`/app/bands/${workspace.slug}`}>Back to {workspace.name}</a>
            <p className="songNote topSpace">Signed in as {currentUser.name}. Updated {songUpdatedAt}</p>
          </article>
        </aside>
      </section>

      <section className="detailGrid songLowerGrid">
        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Version timeline</h2>
            <span>Select a revision to inspect its notes, comments, and audio</span>
          </div>
          <div className="versionTimeline">
            {versions.map((version) => (
              <button className={`timelineItem buttonReset textLeft${version.id === selectedVersionId ? " timelineCurrent" : ""}`} key={version.id} onClick={() => setSelectedVersionId(version.id)} type="button">
                <div className="songTopRow">
                  <div>
                    <h3>{version.fileName}</h3>
                    <p className="versionName">{version.uploadedBy} · {version.uploadedAt}</p>
                  </div>
                  <span className={statusClassName(version.status)}>{version.status}</span>
                </div>
                <p className="songNote">{version.summary}</p>
                <p className="timelineMeta">{version.duration} · {version.comments.length} comments · {version.audioUrl ? "audio ready" : "no audio"}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Comment thread</h2>
            <span>Feedback pinned to {currentVersion.fileName}</span>
          </div>
          <div className="uploadComposer">
            <label className="fieldLabel" htmlFor="commentBody">New comment</label>
            <textarea className="fieldInput fieldTextarea" id="commentBody" onChange={(event) => setCommentBody(event.target.value)} value={commentBody} />
            <label className="fieldLabel" htmlFor="commentTimestamp">Timestamp (optional, `mm:ss`)</label>
            <input className="fieldInput" id="commentTimestamp" onChange={(event) => setCommentTimestamp(event.target.value)} placeholder="01:22" value={commentTimestamp} />
            {commentError ? <p className="formError">{commentError}</p> : null}
            <button className="primaryButton buttonReset inlineButton" disabled={commentPending} onClick={addComment} type="button">{commentPending ? "Posting..." : "Post comment"}</button>
          </div>
          <div className="commentList topSpace">
            {currentVersion.comments.map((comment) => (
              <article className="commentCard" key={comment.id}>
                <div className="commentHeader">
                  <strong>{comment.author}</strong>
                  <span>{comment.postedAt}</span>
                </div>
                {comment.timestamp ? (
                  <button className="timestampButton buttonReset" onClick={() => jumpToTimestamp(comment.timestamp)} type="button">
                    Jump to {comment.timestamp}
                  </button>
                ) : null}
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
