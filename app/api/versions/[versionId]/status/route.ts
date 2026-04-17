import { NextResponse } from "next/server";
import type { ReviewState } from "@/lib/domain";
import { updateVersionStatus } from "@/lib/data";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

const validStates: ReviewState[] = ["Approved", "Changes requested", "Pending review"];

export async function PATCH(request: Request, { params }: RouteProps) {
  const { versionId } = await params;
  const body = (await request.json()) as { status?: ReviewState };

  if (!body.status || !validStates.includes(body.status)) {
    return NextResponse.json({ error: "Invalid review state." }, { status: 400 });
  }

  const version = updateVersionStatus(Number(versionId), body.status);

  if (!version) {
    return NextResponse.json({ error: "Version not found." }, { status: 404 });
  }

  return NextResponse.json(version);
}
