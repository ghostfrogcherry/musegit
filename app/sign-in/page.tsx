import Link from "next/link";
import { demoUser, workspaces } from "@/lib/mock-data";
import { signIn } from "./actions";

export default function SignInPage() {
  return (
    <main className="authShell">
      <section className="authPanel panel">
        <div>
          <p className="eyebrow">Private access</p>
          <h1 className="authTitle">Band workspaces stay invite-only.</h1>
          <p className="lede">
            This demo signs you into a private workspace view with band members, song status, and review activity.
          </p>
        </div>

        <div className="authGrid">
          <div className="authCard softPanel panel">
            <p className="authLabel">Demo identity</p>
            <h2>{demoUser.name}</h2>
            <p>{demoUser.email}</p>
            <p>{demoUser.role}</p>
            <form action={signIn}>
              <button className="primaryButton buttonReset" type="submit">Sign in to private app</button>
            </form>
            <Link className="secondaryButton inlineButton" href="/">Back to landing</Link>
          </div>

          <div className="authCard softPanel panel">
            <p className="authLabel">Visible after sign-in</p>
            <ul className="authList">
              {workspaces.map((workspace) => (
                <li key={workspace.slug}>
                  <strong>{workspace.name}</strong>
                  <span>{workspace.members.length} collaborators</span>
                  <span>{workspace.songs.length} active songs</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
