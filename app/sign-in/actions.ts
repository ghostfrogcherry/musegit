"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie } from "@/lib/session";

export async function signIn() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, "ghostfrogcherry", {
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
