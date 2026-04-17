import Link from "next/link";
import Image from "next/image";
import { listWorkspaces } from "@/lib/data";

const workflow = [
  {
    title: "Upload a new mix",
    detail: "Versioned uploads keep every bounce attached to the song instead of buried in a folder."
  },
  {
    title: "Review in context",
    detail: "Comments, approval state, and version history stay on the same page as the file being discussed."
  },
  {
    title: "Ship the right file",
    detail: "The latest approved mix stays visible, so nobody has to ask which export is final."
  }
];

export default function HomePage() {
  const featuredWorkspace = listWorkspaces()[0];

  return (
    <main className="shell">
      <section className="hero panel">
        <div>
          <div className="heroLogo">
            <Image alt="ChuneUp logo" height={120} src="/logo.png" width={120} />
          </div>
          <p className="eyebrow">Private band collaboration, web-first</p>
          <h1>Keep songs, mixes, and reviews in one place.</h1>
          <p className="lede">
            ChuneUp is a playful workspace for bands to track song versions, share feedback,
            and never ask "which mix is final?" again.
          </p>
          <div className="ctaRow">
            <Link className="primaryButton" href="/sign-in">Enter private app</Link>
            <a className="secondaryButton" href="#spec">Read product shape</a>
          </div>
        </div>
        <div className="heroCard">
          <p className="heroCardLabel">Current working song</p>
          <h2>Dazed Days</h2>
          <p className="heroCardMeta">mix-v4.wav</p>
          <ul>
            <li>4 band accounts in the session</li>
            <li>Pending review on the latest mix</li>
            <li>Updated 28 minutes ago</li>
          </ul>
        </div>
      </section>

      <section className="gridThree">
        {workflow.map((step) => (
          <article className="panel featureCard" key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.detail}</p>
          </article>
        ))}
      </section>

      <section className="workspace" id="workspace">
        <div className="workspaceHeader">
          <div>
            <p className="eyebrow">Band workspace</p>
            <h2>{featuredWorkspace.name}</h2>
          </div>
          <div className="workspaceMeta panel softPanel">
            <span>{featuredWorkspace.members.length} collaborators</span>
            <span>{featuredWorkspace.songs.length} songs</span>
            <span>Private band space</span>
          </div>
        </div>

        <div className="workspaceGrid">
          <section className="panel songList">
            <div className="sectionHeading">
              <h3>Song board</h3>
              <span>Current status at a glance</span>
            </div>
            <div className="songItems">
              {featuredWorkspace.songs.map((song) => (
                <article className="songItem" key={song.name}>
                  <div className="songTopRow">
                    <h4>{song.name}</h4>
                    <span className={`status status-${song.status.toLowerCase().replace(/\s+/g, "-")}`}>{song.status}</span>
                  </div>
                  <p className="versionName">{song.version}</p>
                  <p className="songNote">{song.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel activityPanel">
            <div className="sectionHeading">
              <h3>Recent activity</h3>
              <span>Uploads, reviews, and member changes</span>
            </div>
            <ul className="activityList">
              {featuredWorkspace.activity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="panel specPanel" id="spec">
        <div className="sectionHeading">
          <h2>MVP shape</h2>
          <span>Built around songs, mixes, comments, and private collaboration</span>
        </div>
        <div className="specGrid">
          <div>
            <h3>In scope</h3>
            <ul>
              <li>Band workspaces with invites and roles</li>
              <li>Song pages with versioned mix uploads</li>
              <li>Comments and review state on each version</li>
              <li>Activity feed per workspace and song</li>
            </ul>
          </div>
          <div>
            <h3>Not in v1</h3>
            <ul>
              <li>Public artist pages or discovery</li>
              <li>Distribution to streaming platforms</li>
              <li>Realtime DAW co-editing</li>
              <li>Mobile apps</li>
            </ul>
          </div>
        </div>
        <div className="ctaRow topSpace">
          <Link className="primaryButton" href="/app">Preview protected workspace</Link>
        </div>
      </section>
    </main>
  );
}
