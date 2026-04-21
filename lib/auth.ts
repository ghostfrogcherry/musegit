import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/data";
import { sessionCookie } from "@/lib/session";
import { verifySessionValue } from "@/lib/security";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(sessionCookie)?.value;

  if (!sessionValue) {
    return undefined;
  }

  const session = verifySessionValue(sessionValue);

  if (!session) {
    return undefined;
  }

  return getUserById(session.userId);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
