import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAudioFilePath } from "@/lib/data";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function GET(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId } = await params;
  console.log("Audio API: versionId =", versionId);
  
  const audio = getAudioFilePath(Number(versionId));
  console.log("Audio API: audio =", audio);

  if (!audio?.file_path) {
    return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
  }

  const contents = await readFile(join(/* turbopackIgnore: true */ process.cwd(), audio.file_path));
  console.log("Audio API: file size =", contents.length);

  const response = new NextResponse(contents, {
    headers: {
      "Content-Type": audio.mime_type ?? "audio/mpeg",
      "Content-Length": String(contents.length),
      "Cache-Control": "private, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true"
    }
  });

  return response;
}