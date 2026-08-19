import Link from "next/link";

import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid w-full max-w-md gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Log In
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Access your cipher dashboard and continue your AP Cybersecurity work.
        </p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <AuthForm mode="login" />
      </section>

      <p className="text-sm text-slate-600">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-emerald-700">
          Register
        </Link>
      </p>
    </main>
  );
}
