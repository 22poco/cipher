"use client";

import Link from "next/link";

import { ProtectedPage } from "../components/protected-page";

const unitOneModules = [
  {
    title: "social engineering",
    status: "placeholder",
    description: "phishing, trust, manipulation, and basic defense habits.",
  },
  {
    title: "linux basics",
    status: "planned",
    description: "commands students need for hands-on cybersecurity practice.",
  },
  {
    title: "case study",
    status: "planned",
    description: "a guided analysis activity for unit 1.",
  },
];

export default function UnitsPage() {
  return (
    <ProtectedPage>
      {(user) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">course structure</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              units
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              this is the first course-structure placeholder. it gives {user.name} a
              protected place to start unit 1 while lessons are built next week.
            </p>
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">unit 1</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  cybersecurity foundations
                </h2>
              </div>
              <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                placeholder ready
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {unitOneModules.map((module) => (
                <article
                  key={module.title}
                  className="rounded-md border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-slate-950">{module.title}</h3>
                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {module.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {module.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <Link
            href="/dashboard"
            className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            back to dashboard
          </Link>
        </main>
      )}
    </ProtectedPage>
  );
}
