import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/lib/mock-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspacePage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = getWorkspace(slug);

  if (!workspace) {
    notFound();
  }

  return (
    <main className="appMain">
      <section className="workspaceHero panel">
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1 className="workspaceTitle">{workspace.name}</h1>
          <p className="lede">{workspace.genre}</p>
        </div>
        <div className="workspaceMeta panel softPanel">
          <span>{workspace.members.length} collaborators</span>
          <span>{workspace.songs.length} active songs</span>
          <span>Invite-only access</span>
        </div>
      </section>

      <section className="detailGrid">
        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Song board</h2>
            <span>Mixes, review state, and open discussion</span>
          </div>
          <div className="songItems">
            {workspace.songs.map((song) => (
              <article className="songItem" key={song.name}>
                <div className="songTopRow">
                  <h3>{song.name}</h3>
                  <span className={`status status-${song.status.toLowerCase().replace(/\s+/g, "-")}`}>{song.status}</span>
                </div>
                <p className="versionName">{song.version}</p>
                <p className="songNote">{song.note}</p>
                <div className="songFooterMeta">
                  <span>{song.comments} comments</span>
                  <span>Updated {song.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="stackColumn">
          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Members</h2>
              <span>Private workspace roles</span>
            </div>
            <ul className="memberList">
              {workspace.members.map((member) => (
                <li className="memberRow" key={member.name}>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Recent activity</h2>
              <span>Newest changes inside this workspace</span>
            </div>
            <ul className="activityList">
              {workspace.activity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="secondaryButton inlineButton topSpace" href="/app">
              Back to all workspaces
            </Link>
          </article>
        </aside>
      </section>
    </main>
  );
}
