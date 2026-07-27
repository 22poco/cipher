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
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { ApiError, registerUser } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { AuthPageShell } from "../components/auth-shell";
import { GoogleSignInButton } from "../components/google-signin-button";

const FIELD_CLASS =
  "h-16 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-navy placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Public registration always creates a student account (enforced server-side).
      const auth = await registerUser({ name: name.trim(), email, password, role: "student" });
      saveSession(auth);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't create your account. Try again.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthPageShell
      topRight={
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <h2 className="text-4xl font-bold text-navy">Create your account</h2>
      <p className="mt-3 text-lg text-muted">
        Start practicing AP Cybersecurity skills in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-navy">
            Full name
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faUser}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>

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
              className={FIELD_CLASS}
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
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${FIELD_CLASS} pr-12`}
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
          <p className="text-xs text-muted">Use at least 8 characters.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-semibold text-navy">
            Confirm password
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLock}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`${FIELD_CLASS} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-subtle transition hover:text-body"
            >
              <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} aria-hidden="true" />
            </button>
          </div>
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-sm text-muted">or sign up with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleSignInButton onError={setError} onBusyChange={setLoading} />
    </AuthPageShell>
  );
}
