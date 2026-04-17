"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByHandle } from "@/lib/data";
import { sessionCookie } from "@/lib/session";

export async function signIn(formData: FormData) {
  const handle = formData.get("handle");

  if (typeof handle !== "string" || !handle.trim()) {
    redirect("/sign-in");
  }

  const user = getUserByHandle(handle.trim());

  if (!user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, user.handle ?? handle.trim(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  redirect("/app");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
  redirect("/");
}
