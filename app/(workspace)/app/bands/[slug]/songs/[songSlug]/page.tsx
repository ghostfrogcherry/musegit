import { notFound } from "next/navigation";
import { getSong } from "@/lib/mock-data";
import { SongReviewDemo } from "./song-review-demo";

type PageProps = {
  params: Promise<{ slug: string; songSlug: string }>;
};

export default async function SongPage({ params }: PageProps) {
  const { slug, songSlug } = await params;
  const songEntry = getSong(slug, songSlug);

  if (!songEntry) {
    notFound();
  }

  const { workspace, song } = songEntry;

  return <SongReviewDemo song={song} workspace={workspace} />;
}
