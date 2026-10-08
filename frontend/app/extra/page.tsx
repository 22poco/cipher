"use client";

import Link from "next/link";

import { CourseLoader } from "../components/course-loader";
import {
  fetchAllPracticeCases,
  type PracticeCaseIndex,
} from "@/lib/api";

export default function ExtraPage() {
  const loadCases = (token: string) => fetchAllPracticeCases(token);

  return (
    <CourseLoader load={loadCases}>
      {(cases: PracticeCaseIndex[]) => {
        const byModule = new Map<
          number,
          { title: string; items: PracticeCaseIndex[] }
        >();
        for (const entry of cases) {
          const group = byModule.get(entry.unit_order) ?? {
            title: entry.unit_title,
            items: [],
          };
          group.items.push(entry);
          byModule.set(entry.unit_order, group);
        }

        return (
          <main className="w-full grid gap-6 px-4 py-10 sm:px-6">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-emerald-700">practice</p>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                extra
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                one ungraded case study per topic, for as many reps as you want.
                nothing here reaches your teacher, and your drafts save in this
                browser only.
              </p>
            </div>

            {cases.length === 0 ? (
              <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
                no extra case studies yet.
              </section>
            ) : (
              [...byModule.entries()].map(([unitOrder, group]) => (
                <section
                  key={unitOrder}
                  className="rounded-md border border-slate-200 bg-white p-5"
                >
                  <h2 className="text-lg font-semibold text-slate-950">
                    module {unitOrder}: {group.title}
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/lessons/${entry.lesson_id}/practice`}
                        className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 transition hover:border-emerald-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-950">
                            {entry.lesson_title}
                          </span>
                          <span className="w-fit shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {entry.points ?? "?"} pts
                          </span>
                        </div>
                        <span className="mt-auto text-sm font-semibold text-emerald-700">
                          open case study →
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>
        );
      }}
    </CourseLoader>
  );
}
