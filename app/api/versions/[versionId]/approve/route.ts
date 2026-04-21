import { NextResponse } from "next/server";
import { addVersionApproval, removeVersionApproval, getApprovalsForVersion, getVersion } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

type RouteProps = {
  params: Promise<{ versionId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId } = await params;
  const version = getVersion(Number(versionId));

  if (!version) {
    return NextResponse.json({ error: "Version not found." }, { status: 404 });
  }

  addVersionApproval(Number(versionId), user.id);
  const approvals = getApprovalsForVersion(Number(versionId));

  return NextResponse.json({ approvals });
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId } = await params;
  const version = getVersion(Number(versionId));

  if (!version) {
    return NextResponse.json({ error: "Version not found." }, { status: 404 });
  }

  removeVersionApproval(Number(versionId), user.id);
  const approvals = getApprovalsForVersion(Number(versionId));

  return NextResponse.json({ approvals });
}