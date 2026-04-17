"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const sessionCookie = "musegit_session";

export async function signIn() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, "demo-user", {
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
