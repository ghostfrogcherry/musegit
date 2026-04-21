import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStem, getVersion } from "@/lib/data";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { versionId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const version = getVersion(Number(versionId));
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const instrument = String(formData.get("instrument") ?? "").trim();
  const audio = formData.get("audio");

  if (!name || !(audio instanceof File)) {
    return NextResponse.json({ error: "Name and audio file required" }, { status: 400 });
  }

  if (!audio.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Only audio files allowed" }, { status: 400 });
  }

  const extension = audio.name.includes(".") ? audio.name.slice(audio.name.lastIndexOf(".")) : "";
  const storedName = `${randomUUID()}${extension}`;
  const relativePath = join("uploads", "stems", storedName);
  const absolutePath = join(/* turbopackIgnore: true */ process.cwd(), relativePath);
  const buffer = Buffer.from(await audio.arrayBuffer());

  await writeFile(absolutePath, buffer);

  const stemId = createStem({
    versionId: Number(versionId),
    name,
    instrument: instrument || undefined,
    filePath: relativePath,
    mimeType: audio.type
  });

  return NextResponse.json({ stemId }, { status: 201 });
}