import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/data";

type RouteProps = {
  params: Promise<{ stemId: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stemId } = await params;
  const db = getDb();
  const stem = db.prepare("SELECT file_path, mime_type FROM stems WHERE id = ?").get(Number(stemId)) as { file_path: string; mime_type: string } | undefined;

  if (!stem) {
    return NextResponse.json({ error: "Stem not found" }, { status: 404 });
  }

  const contents = await readFile(join(/* turbopackIgnore: true */ process.cwd(), stem.file_path));

  return new NextResponse(contents, {
    headers: {
      "Content-Type": stem.mime_type ?? "audio/mpeg",
      "Cache-Control": "private, max-age=3600"
    }
  });
}