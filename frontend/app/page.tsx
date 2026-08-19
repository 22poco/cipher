"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { getStoredUser, subscribeToSessionChange } from "@/lib/auth";

const getServerUser = () => null;

export default function Home() {
  const user = useSyncExternalStore(
    subscribeToSessionChange,
    getStoredUser,
    getServerUser,
  );

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
      <section className="grid content-start gap-8">
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-emerald-700">AP Cybersecurity</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            cipher
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            an AP cybersecurity assessment platform for case scenarios, quizzes,
            pset-style responses, mock exam practice, and teacher review.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <>
              <Link
                href="/units"
                className="flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Modules
              </Link>
              <Link
                href={user.role === "admin" ? "/admin" : "/dashboard"}
                className="flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
              >
                Open Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Modules", "AP CED structure"],
            ["Assessments", "Scenario + Quiz + Pset"],
            ["Admin", "Teacher Assessment Tools"],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-md border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Current Status</h2>
        <div className="mt-4 grid gap-3 text-sm">
          {[
            ["Backend", "API and PostgreSQL connected"],
            ["Modules", "5 AP CED modules seeded"],
            ["Assessments", "24 topic assessments"],
            ["Next Focus", "Admin review and mock exam flow"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <span className="font-medium text-slate-600">{label}</span>
              <span className="text-right text-slate-950">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
