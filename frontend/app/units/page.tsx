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
        <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">module structure</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              modules
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              browse the five ap cybersecurity modules and open their topic assessments.
            </p>
          </div>

          {units.length === 0 ? (
            <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
              no modules have been added yet. run the course seed script to add them.
            </section>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-5">
              {units.map((unit) => (
                <Link
                  key={unit.id}
                  href={`/units/${unit.id}`}
                  className="group grid gap-3 rounded-md border border-slate-200 bg-white p-4 transition hover:border-emerald-500"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      module {unit.order_index}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-950">
                      {unit.title}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {unit.description}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                      {unit.modules.reduce(
                        (assessmentCount, module) =>
                          assessmentCount + module.lessons.length,
                        0,
                      )}{" "}
                      assessments
                    </span>
                    <span className="text-xs font-semibold text-slate-400 transition group-hover:text-emerald-700">
                      open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      )}
    </CourseLoader>
  );
}
