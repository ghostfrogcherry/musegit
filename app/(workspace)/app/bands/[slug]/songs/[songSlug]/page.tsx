import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSong } from "@/lib/data";
import { SongReviewDemo } from "./song-review-demo";

type PageProps = {
  params: Promise<{ slug: string; songSlug: string }>;
};

export default async function SongPage({ params }: PageProps) {
  const { slug, songSlug } = await params;
  const songEntry = getSong(slug, songSlug);
  const currentUser = await getCurrentUser();

  if (!songEntry) {
    notFound();
  }

  const { workspace, song } = songEntry;

  return <SongReviewDemo currentUser={currentUser} song={song} workspace={workspace} />;
}
