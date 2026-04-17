import Link from "next/link";
import { listAccounts } from "@/lib/data";
import { signIn } from "./actions";

export default function SignInPage() {
  const accounts = listAccounts();

  return (
    <main className="authShell">
      <section className="authPanel panel">
        <div>
          <p className="eyebrow">Private access</p>
          <h1 className="authTitle">Dazed Days stays inside the band.</h1>
          <p className="lede">
            Pick your account to review `Dazed Days`, check comments, and track feedback from the band.
          </p>
        </div>

        <div className="authGrid">
          <div className="authCard softPanel panel">
            <p className="authLabel">Choose your account</p>
            <form action={signIn}>
              <label className="fieldLabel" htmlFor="handle">Account</label>
              <select className="fieldInput" id="handle" name="handle">
                {accounts.map((account) => (
                  <option key={account.handle} value={account.handle ?? ""}>
                    {account.name} ({account.role})
                  </option>
                ))}
              </select>
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
                  <span>@{account.handle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}