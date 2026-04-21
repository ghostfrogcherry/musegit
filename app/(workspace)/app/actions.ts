"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { createSongRecord, createWorkspace, getWorkspaceForUser } from "@/lib/data";

export async function createAlbum(formData: FormData) {
  const user = await requireCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();

  if (!name) {
    redirect("/app?error=album");
  }

  const workspace = createWorkspace({ userId: user.id, name, genre });

  if (!workspace) {
    redirect("/app?error=album");
  }

  redirect(`/app/bands/${workspace.slug}`);
}

export async function createSong(formData: FormData) {
  const user = await requireCurrentUser();
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!workspaceSlug || !name) {
    redirect("/app?error=song");
  }

  const workspace = getWorkspaceForUser(user.id, workspaceSlug);

  if (!workspace) {
    redirect("/app?error=song");
  }

  const song = createSongRecord({ workspaceId: workspace.id, name, note });

  if (!song) {
    redirect("/app?error=song");
  }

  redirect(`/app/bands/${workspace.slug}/songs/${song.slug}`);
}
