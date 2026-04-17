import "server-only";

import { cookies } from "next/headers";
import { getDemoUser, getUserByHandle } from "@/lib/data";
import { sessionCookie } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const handle = cookieStore.get(sessionCookie)?.value;

  if (handle) {
    const user = getUserByHandle(handle);

    if (user) {
      return user;
    }
  }

  return getDemoUser();
}
