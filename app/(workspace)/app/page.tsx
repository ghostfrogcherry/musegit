import Link from "next/link";
import { listWorkspaces } from "@/lib/data";

export default function AppPage() {
  const workspaces = listWorkspaces();
  const totalSongs = workspaces.reduce((count, workspace) => count + workspace.songs.length, 0);
  const pendingReviews = workspaces.reduce(
    (count, workspace) => count + workspace.songs.filter((song) => song.status === "Pending review").length,
    0
  );

  return (
    <main className="appMain">
      <section className="overviewGrid">
        <article className="panel statCard">
          <p className="authLabel">Workspace</p>
          <h2>{workspaces.length}</h2>
          <p className="songNote">Private band space for the current writing and mix cycle.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Active song</p>
          <h2>{totalSongs}</h2>
          <p className="songNote">Tracked versions and comments for `Dazed Days`.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Pending review</p>
          <h2>{pendingReviews}</h2>
          <p className="songNote">Versions still waiting on feedback or approval.</p>
        </article>
      </section>

      <section className="panel workspaceDirectory">
        <div className="sectionHeading">
          <h2>Your private workspace</h2>
          <span>Open the band board to review `Dazed Days`, members, and recent activity.</span>
        </div>
        <div className="directoryGrid">
          {workspaces.map((workspace) => (
            <article className="workspaceCard" key={workspace.slug}>
              <div>
                <p className="authLabel">{workspace.genre}</p>
                <h3>{workspace.name}</h3>
              </div>
              <ul className="workspaceFacts">
                <li>{workspace.members.length} collaborators</li>
                <li>{workspace.songs.length} songs in progress</li>
                <li>{workspace.activity[0]}</li>
              </ul>
              <Link className="primaryButton inlineButton" href={`/app/bands/${workspace.slug}`}>
                Open workspace
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
