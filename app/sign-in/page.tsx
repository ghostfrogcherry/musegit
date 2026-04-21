import Link from "next/link";
import { signIn, signUp } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasError = params.error === "invalid";
  const hasSignUpError = params.error === "signup";
  const hasExistsError = params.error === "exists";

  return (
    <main className="authShell">
      <section className="authPanel panel">
        <div>
          <p className="eyebrow">Account access</p>
          <h1 className="authTitle">Sign in or create your account.</h1>
          <p className="lede">
            ChuneUp is now set up for any user. Log in to your dashboard or create an account to start organizing
            albums, songs, and review updates.
          </p>
        </div>

        <div className="authGrid">
          <div className="authCard softPanel panel">
            <p className="authLabel">Login</p>
            <form action={signIn} className="authForm">
              <label className="fieldLabel" htmlFor="identifier">Handle or email</label>
              <input autoComplete="username" className="fieldInput" id="identifier" name="identifier" required />

              <label className="fieldLabel" htmlFor="password">Password</label>
              <input
                autoComplete="current-password"
                className="fieldInput"
                id="password"
                name="password"
                required
                type="password"
              />

              {hasError ? <p className="formError">That handle, email, or password did not match.</p> : null}

              <button className="primaryButton buttonReset" type="submit">Log in</button>
            </form>
            <p className="authHelper">Use either your handle or your email address to get back into your workspace quickly.</p>
            <Link className="secondaryButton inlineButton" href="/">Back to landing</Link>
          </div>

          <div className="authCard softPanel panel">
            <p className="authLabel">Create account</p>
            <form action={signUp} className="authForm">
              <label className="fieldLabel" htmlFor="name">Name</label>
              <input className="fieldInput" id="name" name="name" required />

              <label className="fieldLabel" htmlFor="email">Email</label>
              <input autoComplete="email" className="fieldInput" id="email" name="email" required type="email" />

              <label className="fieldLabel" htmlFor="handle">Handle</label>
              <input autoComplete="username" className="fieldInput" id="handle" name="handle" required />

              <label className="fieldLabel" htmlFor="signUpPassword">Password</label>
              <input
                autoComplete="new-password"
                className="fieldInput"
                id="signUpPassword"
                minLength={8}
                name="password"
                required
                type="password"
              />

              {hasSignUpError ? <p className="formError">Use all fields and choose a password with at least 8 characters.</p> : null}
              {hasExistsError ? <p className="formError">That email or handle is already in use.</p> : null}

              <button className="primaryButton buttonReset" type="submit">Create account</button>
            </form>
            <p className="authHelper">New accounts start with a first album so you can begin adding songs right away.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
