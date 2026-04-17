import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getAudioFilePath } from "@/lib/data";
import { sessionCookie } from "@/lib/session";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader.includes(`${sessionCookie}=`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId } = await params;
  const audio = getAudioFilePath(Number(versionId));

  if (!audio?.file_path) {
    return NextResponse.json({ error: "Audio file not found." }, { status: 404 });
  }

  const contents = await readFile(join(/* turbopackIgnore: true */ process.cwd(), audio.file_path));

  return new NextResponse(contents, {
    headers: {
      "Content-Type": audio.mime_type ?? "audio/mpeg",
      "Cache-Control": "private, max-age=0, must-revalidate"
    }
  });
}
