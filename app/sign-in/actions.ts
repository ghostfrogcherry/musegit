"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createUserAccount, getUserForSignIn } from "@/lib/data";
import { sessionCookie, sessionMaxAgeSeconds } from "@/lib/session";
import { createSessionValue, verifyPassword } from "@/lib/security";

export async function signIn(formData: FormData) {
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  if (typeof identifier !== "string" || !identifier.trim() || typeof password !== "string" || !password) {
    redirect("/sign-in?error=invalid");
  }

  const user = getUserForSignIn(identifier.trim());

  if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
    redirect("/sign-in?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, createSessionValue(user.id, Date.now() + sessionMaxAgeSeconds * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });

  redirect("/app");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !handle || password.length < 8) {
    redirect("/sign-in?error=signup");
  }

  const result = createUserAccount({ name, email, handle, password });

  if ("error" in result) {
    redirect("/sign-in?error=exists");
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, createSessionValue(result.userId, Date.now() + sessionMaxAgeSeconds * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });

  redirect("/app");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
  redirect("/");
}

export async function signOutWithStop() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
  redirect("/?stop=1");
}
