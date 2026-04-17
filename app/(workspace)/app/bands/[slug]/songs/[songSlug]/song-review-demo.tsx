"use client";

import { useState } from "react";
import type { ReviewState, Song, Workspace } from "@/lib/mock-data";
import { demoUser } from "@/lib/mock-data";

type SongReviewDemoProps = {
  workspace: Workspace;
  song: Song;
};

type UploadDraft = {
  fileName: string;
  summary: string;
  duration: string;
};

function statusClassName(status: ReviewState) {
  return `status status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function nextVersionId(versions: Song["versions"]) {
  return `v${versions.length + 1}-demo-${Date.now()}`;
}

function inferNextFileName(song: Song) {
  const latest = song.version.match(/v(\d+)/i);
  const nextNumber = latest ? Number(latest[1]) + 1 : song.versions.length + 1;
  const extension = song.version.endsWith(".wav") ? "wav" : "mp3";
  return `mix-v${nextNumber}.${extension}`;
}

export function SongReviewDemo({ workspace, song }: SongReviewDemoProps) {
  const [versions, setVersions] = useState(song.versions);
  const [selectedVersionId, setSelectedVersionId] = useState(song.latestVersionId);
  const [songStatus, setSongStatus] = useState<ReviewState>(song.status);
  const [songVersion, setSongVersion] = useState(song.version);
  const [songUpdatedAt, setSongUpdatedAt] = useState(song.updatedAt);
  const [composerOpen, setComposerOpen] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({
    fileName: inferNextFileName(song),
    summary: "Tightened low-end, nudged lead vocal forward, and cleaned the bridge transition.",
    duration: song.versions[0]?.duration ?? "4:00"
  });

  const currentVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const commentCount = versions.reduce((count, version) => count + version.comments.length, 0);

  function applyReviewState(nextState: ReviewState) {
    setSongStatus(nextState);
    setSongUpdatedAt("just now");
    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersionId
          ? {
              ...version,
              status: nextState
            }
          : version
      )
    );
  }

  function handleDraftChange(field: keyof UploadDraft, value: string) {
    setUploadDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function addDemoVersion() {
    const trimmedName = uploadDraft.fileName.trim();
    const trimmedSummary = uploadDraft.summary.trim();
    const trimmedDuration = uploadDraft.duration.trim();

    if (!trimmedName || !trimmedSummary || !trimmedDuration) {
      return;
    }

    const newVersion = {
      id: nextVersionId(versions),
      fileName: trimmedName,
      uploadedBy: demoUser.name,
      uploadedAt: "just now",
      status: "Pending review" as ReviewState,
      summary: trimmedSummary,
      duration: trimmedDuration,
      comments: [
        {
          author: demoUser.name,
          postedAt: "just now",
          body: "Uploaded this demo pass for review. Focus on balance, vocal clarity, and whether the transition lands."
        }
      ]
    };

    setVersions((current) => [newVersion, ...current]);
    setSelectedVersionId(newVersion.id);
    setSongStatus("Pending review");
    setSongVersion(newVersion.fileName);
    setSongUpdatedAt("just now");
    setComposerOpen(false);
    setUploadDraft({
      fileName: inferNextFileName({ ...song, version: newVersion.fileName, versions: [newVersion, ...versions] }),
      summary: uploadDraft.summary,
      duration: trimmedDuration
    });
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
              <button className={`reviewButton approve buttonReset${songStatus === "Approved" ? " reviewButtonActive" : ""}`} onClick={() => applyReviewState("Approved")} type="button">Approve version</button>
              <button className={`reviewButton request buttonReset${songStatus === "Changes requested" ? " reviewButtonActive" : ""}`} onClick={() => applyReviewState("Changes requested")} type="button">Request changes</button>
              <button className={`reviewButton pending buttonReset${songStatus === "Pending review" ? " reviewButtonActive" : ""}`} onClick={() => applyReviewState("Pending review")} type="button">Leave pending</button>
            </div>
            <p className="songNote topSpace">Current demo state updates locally so you can test the review workflow without a backend yet.</p>
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
                <label className="fieldLabel" htmlFor="fileName">File name</label>
                <input className="fieldInput" id="fileName" onChange={(event) => handleDraftChange("fileName", event.target.value)} value={uploadDraft.fileName} />
                <label className="fieldLabel" htmlFor="summary">What changed</label>
                <textarea className="fieldInput fieldTextarea" id="summary" onChange={(event) => handleDraftChange("summary", event.target.value)} value={uploadDraft.summary} />
                <label className="fieldLabel" htmlFor="duration">Duration</label>
                <input className="fieldInput" id="duration" onChange={(event) => handleDraftChange("duration", event.target.value)} value={uploadDraft.duration} />
                <button className="primaryButton buttonReset inlineButton" onClick={addDemoVersion} type="button">Add demo upload</button>
              </div>
            ) : (
              <p className="songNote">Create a new demo version locally to preview how the timeline and review surface react.</p>
            )}
          </article>

          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Navigate</h2>
              <span>Back to the band board</span>
            </div>
            <a className="secondaryButton inlineButton" href={`/app/bands/${workspace.slug}`}>Back to {workspace.name}</a>
            <p className="songNote topSpace">Updated {songUpdatedAt}</p>
          </article>
        </aside>
      </section>

      <section className="detailGrid songLowerGrid">
        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Version timeline</h2>
            <span>Select a revision to inspect its notes and comments</span>
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
                <p className="timelineMeta">{version.duration} · {version.comments.length} comments</p>
              </button>
            ))}
          </div>
        </article>

        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Comment thread</h2>
            <span>Feedback pinned to {currentVersion.fileName}</span>
          </div>
          <div className="commentList">
            {currentVersion.comments.map((comment, index) => (
              <article className="commentCard" key={`${comment.author}-${index}`}>
                <div className="commentHeader">
                  <strong>{comment.author}</strong>
                  <span>{comment.postedAt}</span>
                </div>
                {comment.timestamp ? <p className="commentTimestamp">At {comment.timestamp}</p> : null}
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
