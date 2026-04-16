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

const songStates = [
  { name: "Velvet Static", status: "Approved", version: "mix-v12.wav", note: "Master candidate signed off by all 4 members." },
  { name: "Night Window", status: "Changes requested", version: "mix-v7.wav", note: "Vocals need to come forward in the second chorus." },
  { name: "Ghost Signal", status: "Pending review", version: "demo-v3.wav", note: "New rhythm guitar pass uploaded 18 minutes ago." }
];

const activity = [
  "Rin uploaded mix-v12.wav to Velvet Static",
  "Noah approved version 12 and marked it release-ready",
  "Ivy commented on Night Window: try less delay on the bridge vocal",
  "Ari invited Jules to the band workspace"
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Private band collaboration, web-only first</p>
          <h1>Keep songs, mixes, and review decisions in one place.</h1>
          <p className="lede">
            musegit is a focused workspace for indie bands and remote collaborators who need versioned music assets,
            clear feedback, and a fast answer to one question: what is the current approved mix?
          </p>
          <div className="ctaRow">
            <a className="primaryButton" href="#workspace">View MVP workspace</a>
            <a className="secondaryButton" href="#spec">Read product shape</a>
          </div>
        </div>
        <div className="heroCard">
          <p className="heroCardLabel">Latest approved version</p>
          <h2>Velvet Static</h2>
          <p className="heroCardMeta">mix-v12.wav</p>
          <ul>
            <li>Approved by 4 collaborators</li>
            <li>Comments resolved on chorus compression</li>
            <li>Uploaded 2 hours ago</li>
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
            <p className="eyebrow">Mock workspace</p>
            <h2>Moonlit Receiver</h2>
          </div>
          <div className="workspaceMeta panel softPanel">
            <span>4 collaborators</span>
            <span>9 songs</span>
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
              {songStates.map((song) => (
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
              {activity.map((item) => (
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
      </section>
    </main>
  );
}
