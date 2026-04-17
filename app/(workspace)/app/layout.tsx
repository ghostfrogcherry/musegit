import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/sign-in/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const demoUser = await getCurrentUser();

  return (
    <div className="appShell">
      <header className="appHeader">
        <div>
          <Link className="brandLink" href="/app">ChuneUp</Link>
          <p className="appSubhead">Private band workspaces for songs, mixes, and reviews.</p>
        </div>
        <div className="appHeaderActions">
          <div className="userChip panel softPanel">
            <span>{demoUser.name}</span>
            <span>{demoUser.role}</span>
            {demoUser.handle ? <span>@{demoUser.handle}</span> : null}
          </div>
          <form action={signOut}>
            <button className="secondaryButton buttonReset" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
