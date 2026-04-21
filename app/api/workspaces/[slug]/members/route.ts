import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspace, getWorkspaceMembers, getUserByEmail, getUserByHandle, addWorkspaceMember, updateWorkspaceMemberRole, removeWorkspaceMember } from "@/lib/data";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const workspace = getWorkspace(slug);
  
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const members = getWorkspaceMembers(workspace.id);
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const workspace = getWorkspace(slug);
  
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const members = getWorkspaceMembers(workspace.id);
  const currentMember = members.find(m => m.id === user.id);
  const isManager = currentMember?.workspace_role === "manager" || user.role === "Admin";

  if (!isManager) {
    return NextResponse.json({ error: "Only managers can invite members" }, { status: 403 });
  }

  const body = await request.json();
  const { identifier, role = "member" } = body;

  if (!identifier) {
    return NextResponse.json({ error: "Email or handle required" }, { status: 400 });
  }

  let newMember = getUserByEmail(identifier) || getUserByHandle(identifier);
  
  if (!newMember) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const alreadyMember = members.some(m => m.id === newMember!.id);
  if (alreadyMember) {
    return NextResponse.json({ error: "User is already a member" }, { status: 400 });
  }

  const success = addWorkspaceMember(workspace.id, newMember.id, role);
  
  if (!success) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const workspace = getWorkspace(slug);
  
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const members = getWorkspaceMembers(workspace.id);
  const currentMember = members.find(m => m.id === user.id);
  const isManager = currentMember?.workspace_role === "manager" || user.role === "Admin";

  if (!isManager) {
    return NextResponse.json({ error: "Only managers can update members" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }

  if (Number(userId) === user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  updateWorkspaceMemberRole(workspace.id, Number(userId), role);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const workspace = getWorkspace(slug);
  
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const members = getWorkspaceMembers(workspace.id);
  const currentMember = members.find(m => m.id === user.id);
  const isManager = currentMember?.workspace_role === "manager" || user.role === "Admin";

  if (!isManager) {
    return NextResponse.json({ error: "Only managers can remove members" }, { status: 403 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (Number(userId) === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  removeWorkspaceMember(workspace.id, Number(userId));

  return NextResponse.json({ success: true });
}