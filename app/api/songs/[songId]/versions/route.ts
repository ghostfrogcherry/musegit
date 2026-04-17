import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVersion, getSongById } from "@/lib/data";

type RouteProps = {
  params: Promise<{ songId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { songId } = await params;
  const currentUser = await getCurrentUser();
  const formData = await request.formData();
  const summary = String(formData.get("summary") ?? "").trim();
  const audio = formData.get("audio");

  if (!summary) {
    return NextResponse.json({ error: "Summary is required." }, { status: 400 });
  }

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
  }

  if (!audio.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Only audio uploads are supported." }, { status: 400 });
  }

  const song = getSongById(Number(songId));

  if (!song) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  const extension = audio.name.includes(".") ? audio.name.slice(audio.name.lastIndexOf(".")) : "";
  const storedName = `${randomUUID()}${extension}`;
  const relativePath = join("uploads", "audio", storedName);
  const absolutePath = join(/* turbopackIgnore: true */ process.cwd(), relativePath);
  const buffer = Buffer.from(await audio.arrayBuffer());

  await writeFile(absolutePath, buffer);

  const version = createVersion({
    songId: song.id,
    uploadedByUserId: currentUser.id,
    fileName: audio.name,
    summary,
    durationSeconds: undefined,
    filePath: relativePath,
    mimeType: audio.type
  });

  return NextResponse.json(version, { status: 201 });
}
