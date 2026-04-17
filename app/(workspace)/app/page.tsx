import Link from "next/link";
import { pendingReviews, totalSongs, workspaces } from "@/lib/mock-data";

export default function AppPage() {
  return (
    <main className="appMain">
      <section className="overviewGrid">
        <article className="panel statCard">
          <p className="authLabel">Workspaces</p>
          <h2>{workspaces.length}</h2>
          <p className="songNote">Private collaboration spaces you can access right now.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Songs</p>
          <h2>{totalSongs}</h2>
          <p className="songNote">Tracked mixes and demos across all private bands.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Pending review</p>
          <h2>{pendingReviews}</h2>
          <p className="songNote">Versions still waiting on feedback or approval.</p>
        </article>
      </section>

      <section className="panel workspaceDirectory">
        <div className="sectionHeading">
          <h2>Your private workspaces</h2>
          <span>Select a band to review songs, members, and recent activity.</span>
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
