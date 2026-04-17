import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/sign-in/actions";
import { demoUser } from "@/lib/mock-data";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="appShell">
      <header className="appHeader">
        <div>
          <Link className="brandLink" href="/app">musegit</Link>
          <p className="appSubhead">Private workspaces for bands, songs, mixes, and review decisions.</p>
        </div>
        <div className="appHeaderActions">
          <div className="userChip panel softPanel">
            <span>{demoUser.name}</span>
            <span>{demoUser.role}</span>
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
