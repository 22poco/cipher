"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ApiError, loginUser, registerUser, type UserRole } from "@/lib/api";
import { saveSession } from "@/lib/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const auth = isRegister
        ? await registerUser({ name, email, password, role })
        : await loginUser({ email, password });

      saveSession(auth);
      router.push(auth.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("could not reach the cipher api");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isRegister ? (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      {isRegister ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-slate-700">role</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["student", "admin"] as UserRole[]).map((option) => (
              <label
                key={option}
                className={`flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition ${
                  role === option
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-950"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "working..." : isRegister ? "create account" : "log in"}
      </button>
    </form>
  );
}
