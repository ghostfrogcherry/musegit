import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createComment } from "@/lib/data";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { versionId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { body?: string; timestampSeconds?: number };

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Comment body is required." }, { status: 400 });
  }

  const comment = createComment({
    versionId: Number(versionId),
    userId: user.id,
    body: body.body.trim(),
    timestampSeconds: body.timestampSeconds
  });

  return NextResponse.json(comment, { status: 201 });
}
