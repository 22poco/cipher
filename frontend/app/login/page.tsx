"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { ApiError, loginUser } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { AuthPageShell } from "../components/auth-shell";
import { GoogleSignInButton } from "../components/google-signin-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      const auth = await loginUser({ email, password });
      saveSession(auth);
      router.push(auth.user.role === "student" ? "/dashboard" : "/teacher");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't sign you in. Try again.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthPageShell
      topRight={
        <p className="text-sm text-muted">
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <h2 className="text-4xl font-bold text-navy">Welcome back</h2>
      <p className="mt-3 text-lg text-muted">Login to continue your learning journey.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-navy">
            Email address
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-navy placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-navy">
            Password
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLock}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-16 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-navy placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:text-body"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <a href="#" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg bg-primary-light px-4 py-2.5 text-sm font-medium text-primary">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-16 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-primary to-primary-hover text-base font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-sm text-muted">or continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleSignInButton onError={setError} onBusyChange={setLoading} />
    </AuthPageShell>
  );
}
