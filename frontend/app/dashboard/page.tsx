"use client";

import Link from "next/link";

import { ProtectedPage } from "../components/protected-page";

export default function DashboardPage() {
  return (
    <ProtectedPage>
      {(user) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">student dashboard</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              welcome, {user.name}
            </h1>
            <p className="text-sm text-slate-600">
              signed in as {user.email} with the {user.role} role.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["current unit", "unit 1 placeholder"],
              ["lesson progress", "0 lessons complete"],
              ["quiz status", "no attempts yet"],
            ].map(([title, value]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">unit 1</h2>
                <p className="mt-1 text-sm text-slate-600">
                  social engineering placeholder content is ready for week 3.
                </p>
              </div>
              <Link
                href="/units"
                className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                view units
              </Link>
            </div>
          </section>
        </main>
      )}
    </ProtectedPage>
  );
}
