import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getSongForUser, getWorkspaceMembers } from "@/lib/data";
import { SongReviewDemo } from "./song-review-demo";

type PageProps = {
  params: Promise<{ slug: string; songSlug: string }>;
};

export default async function SongPage({ params }: PageProps) {
  const { slug, songSlug } = await params;
  const currentUser = await requireCurrentUser();
  const songEntry = getSongForUser(currentUser.id, slug, songSlug);

  if (!songEntry) {
    notFound();
  }

  const { workspace, song } = songEntry;
  const members = getWorkspaceMembers(workspace.id);

  return <SongReviewDemo currentUser={currentUser} song={song} workspace={workspace} members={members} />;
}
