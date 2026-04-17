import Link from "next/link";
import { getDemoUser, listAccounts, listWorkspaces } from "@/lib/data";
import { signIn } from "./actions";

export default function SignInPage() {
  const demoUser = getDemoUser();
  const accounts = listAccounts();
  const workspaces = listWorkspaces();

  return (
    <main className="authShell">
      <section className="authPanel panel">
        <div>
          <p className="eyebrow">Private access</p>
          <h1 className="authTitle">Dazed Days stays inside the band.</h1>
          <p className="lede">
            Sign in as Nathan to review the current `Dazed Days` mix, check comments, and track feedback from the band.
          </p>
        </div>

        <div className="authGrid">
          <div className="authCard softPanel panel">
            <p className="authLabel">Signed-in account</p>
            <h2>{demoUser.name}</h2>
            <p>{demoUser.email}</p>
            <p>{demoUser.role}</p>
            <p>@{demoUser.handle}</p>
            <form action={signIn}>
              <button className="primaryButton buttonReset" type="submit">Sign in to private app</button>
            </form>
            <Link className="secondaryButton inlineButton" href="/">Back to landing</Link>
          </div>

          <div className="authCard softPanel panel">
            <p className="authLabel">Band accounts</p>
            <ul className="authList">
              {accounts.map((account) => (
                <li key={account.name}>
                  <strong>{account.name}</strong>
                  <span>{account.role}</span>
                  <span>{account.handle ? `@${account.handle}` : workspaces[0].name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
