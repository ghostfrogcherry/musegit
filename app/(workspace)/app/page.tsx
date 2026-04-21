import Link from "next/link";
import { createAlbum, createSong } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { listUserActivity, listUserWorkspaces } from "@/lib/data";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AppPage({ searchParams }: PageProps) {
  const currentUser = await requireCurrentUser();
  const workspaces = listUserWorkspaces(currentUser.id);
  const updates = listUserActivity(currentUser.id);
  const params = await searchParams;
  const totalSongs = workspaces.reduce((count, workspace) => count + workspace.songs.length, 0);
  const pendingReviews = workspaces.reduce(
    (count, workspace) => count + workspace.songs.filter((song) => song.status === "Pending review").length,
    0
  );

  return (
    <main className="appMain">
      <section className="overviewGrid">
        <article className="panel statCard">
          <p className="authLabel">Albums</p>
          <h2>{workspaces.length}</h2>
          <p className="songNote">Albums currently active in your account.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Songs</p>
          <h2>{totalSongs}</h2>
          <p className="songNote">Songs you are currently working on.</p>
        </article>
        <article className="panel statCard">
          <p className="authLabel">Pending review</p>
          <h2>{pendingReviews}</h2>
          <p className="songNote">Versions still waiting for feedback or approval.</p>
        </article>
      </section>

      <section className="dashboardColumns">
        <aside className="panel detailPanel dashboardPanel">
          <div className="sectionHeading">
            <h2>Recent updates</h2>
            <span>Latest activity across your albums and songs</span>
          </div>
          {updates.length > 0 ? (
            <ul className="activityList dashboardUpdatesList">
              {updates.map((item) => (
                <li key={`${item.workspace}-${item.text}`}>
                  <strong>{item.workspace}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="emptyState">
              <strong>No updates yet</strong>
              <p>Create an album, add a song, and your activity timeline will start here.</p>
            </div>
          )}
        </aside>

        <section className="dashboardRightColumn">
          <section className="panel workspaceDirectory">
            <div className="sectionHeading">
              <h2>Albums and songs currently working on</h2>
              <span>Organize your work from album to song to version.</span>
            </div>

            <form action={createAlbum} className="dashboardComposer">
              <div className="sectionHeading compactHeading">
                <h3>Create album</h3>
                <span>You will be taken straight into the album after creating it.</span>
              </div>
              <div className="dashboardComposerRow">
                <input className="fieldInput" name="name" placeholder="New album name" required />
                <input className="fieldInput" name="genre" placeholder="Album note or type" />
                <button className="primaryButton buttonReset" type="submit">Create album</button>
              </div>
              {params.error === "album" ? <p className="formError">Add a name before creating the album.</p> : null}
            </form>

            <div className="dashboardAlbumGrid">
              {workspaces.map((workspace) => (
                <article className="workspaceCard" key={workspace.slug}>
                  <div>
                    <p className="authLabel">{workspace.genre}</p>
                    <h3>{workspace.name}</h3>
                  </div>
                  <ul className="workspaceFacts">
                    <li>{workspace.songs.length} songs in progress</li>
                    <li>{workspace.activity[0] ?? "No activity yet"}</li>
                  </ul>

                  <div className="cardActionRow">
                    <Link className="secondaryButton inlineButton" href={`/app/bands/${workspace.slug}`}>
                      Open album
                    </Link>
                    {workspace.songs[0] ? (
                      <Link className="secondaryButton inlineButton" href={`/app/bands/${workspace.slug}/songs/${workspace.songs[0].slug}`}>
                        Continue latest song
                      </Link>
                    ) : null}
                  </div>

                  <form action={createSong} className="dashboardComposer compactComposer">
                    <div className="sectionHeading compactHeading">
                      <h3>Add song</h3>
                      <span>New songs open immediately so you can upload the first version.</span>
                    </div>
                    <input name="workspaceSlug" type="hidden" value={workspace.slug} />
                    <input className="fieldInput" name="name" placeholder="Add a song" required />
                    <input className="fieldInput" name="note" placeholder="Working note" />
                    <button className="secondaryButton buttonReset inlineButton" type="submit">Add song</button>
                  </form>

                  {workspace.songs.length > 0 ? (
                    <div className="songItems topSpace">
                      {workspace.songs.map((song) => (
                        <article className="songItem" key={song.id}>
                          <div className="songTopRow">
                            <Link className="songLink" href={`/app/bands/${workspace.slug}/songs/${song.slug}`}>
                              {song.name}
                            </Link>
                            <span className={`status status-${song.status.toLowerCase().replace(/\s+/g, "-")}`}>{song.status}</span>
                          </div>
                          <p className="versionName">{song.version}</p>
                          <p className="songNote">{song.note}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyState topSpace">
                      <strong>No songs yet</strong>
                      <p>Add the first song for this album to start tracking versions and review notes.</p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {workspaces.length === 0 ? (
              <div className="emptyState topSpace">
                <strong>No albums yet</strong>
                <p>Create your first album to start organizing songs and recent review activity.</p>
              </div>
            ) : null}

            {params.error === "song" ? <p className="formError topSpace">Pick a valid album and add a song name.</p> : null}
          </section>
        </section>
      </section>
    </main>
  );
}
