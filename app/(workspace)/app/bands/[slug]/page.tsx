import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getWorkspaceForUser, getWorkspaceMembers } from "@/lib/data";
import { MembersPanel } from "./members-panel";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspacePage({ params }: PageProps) {
  const { slug } = await params;
  const currentUser = await requireCurrentUser();
  const workspace = getWorkspaceForUser(currentUser.id, slug);

  if (!workspace) {
    notFound();
  }

  const members = getWorkspaceMembers(workspace.id);

  return (
    <main className="appMain">
      <section className="workspaceHero panel">
        <div>
          <p className="eyebrow">Album</p>
          <h1 className="workspaceTitle">{workspace.name}</h1>
          <p className="lede">{workspace.genre}</p>
        </div>
        <div className="workspaceMeta panel softPanel">
          <span>{workspace.songs.length} active songs</span>
          <span>{workspace.activity.length} recent updates</span>
          <span>Private album space</span>
        </div>
      </section>

      <section className="detailGrid">
        <article className="panel detailPanel">
          <div className="sectionHeading">
            <h2>Songs</h2>
            <span>Versions, review state, and ongoing work</span>
          </div>
          <div className="songItems">
            {workspace.songs.map((song) => (
              <article className="songItem" key={song.name}>
                <div className="songTopRow">
                  <Link className="songLink" href={`/app/bands/${workspace.slug}/songs/${song.slug}`}>
                    {song.name}
                  </Link>
                  <span className={`status status-${song.status.toLowerCase().replace(/\s+/g, "-")}`}>{song.status}</span>
                </div>
                <p className="versionName">{song.version}</p>
                <p className="songNote">{song.note}</p>
                <div className="songFooterMeta">
                  <span>{song.comments} comments</span>
                  <span>Updated {song.updatedAt}</span>
                </div>
                <Link className="secondaryButton inlineButton topSpace" href={`/app/bands/${workspace.slug}/songs/${song.slug}`}>
                  Open song review
                </Link>
              </article>
            ))}
          </div>
        </article>

        <aside className="stackColumn">
          <MembersPanel workspaceSlug={workspace.slug} initialMembers={members} currentUserId={currentUser.id} />
          
          <article className="panel detailPanel">
            <div className="sectionHeading">
              <h2>Recent activity</h2>
              <span>Newest changes inside this album</span>
            </div>
            <ul className="activityList">
              {workspace.activity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="secondaryButton inlineButton topSpace" href="/app">
              Back to dashboard
            </Link>
          </article>
        </aside>
      </section>
    </main>
  );
}
