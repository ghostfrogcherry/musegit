import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { signOut } from "@/app/sign-in/actions";
import { requireCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const currentUser = await requireCurrentUser();

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="brandRow">
          <Image alt="ChuneUp logo" className="brandLogo" height={32} src="/logo.png" width={32} />
          <Link className="brandLink" href="/app">ChuneUp</Link>
        </div>
        <p className="appSubhead">Albums, songs, versions, and review updates in one place.</p>
        <div className="appHeaderActions">
          <div className="userChip panel softPanel">
            <span>{currentUser.name}</span>
            <span>{currentUser.role}</span>
            {currentUser.handle ? <span>@{currentUser.handle}</span> : null}
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
