"use client";

import Link from "next/link";
import { useCallback } from "react";

import { CourseLoader } from "../components/course-loader";
import { fetchUnits, type Unit } from "@/lib/api";

export default function UnitsPage() {
  const loadUnits = useCallback((token: string) => fetchUnits(token), []);

  return (
    <CourseLoader load={loadUnits}>
      {(units: Unit[]) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">course structure</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              units
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              browse the course structure. unit 1 is seeded with placeholder
              modules and lessons so content can be expanded next.
            </p>
          </div>

          {units.length === 0 ? (
            <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
              no units have been added yet. run the course seed script to add unit 1.
            </section>
          ) : (
            <section className="grid gap-4">
              {units.map((unit) => (
                <article
                  key={unit.id}
                  className="rounded-md border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        unit {unit.order_index}
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                        {unit.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {unit.description}
                      </p>
                    </div>
                    <Link
                      href={`/units/${unit.id}`}
                      className="flex h-10 w-fit items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      open unit
                    </Link>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-1">
                      {unit.modules.length} modules
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1">
                      {unit.modules.reduce(
                        (lessonCount, module) => lessonCount + module.lessons.length,
                        0,
                      )}{" "}
                      lessons
                    </span>
                  </div>
                </article>
              ))}
            </section>
          )}

          <Link
            href="/dashboard"
            className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            back to dashboard
          </Link>
        </main>
      )}
    </CourseLoader>
  );
}
