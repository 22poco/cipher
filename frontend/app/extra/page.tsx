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
          <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-10 sm:px-6">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-emerald-700">practice</p>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                extra
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                one ungraded case study per topic. work through it and check
                yourself against a sample solution — nothing here reaches your
                teacher, and your drafts save in this browser only.
              </p>
            </div>

            {cases.length === 0 ? (
              <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
                no extra case studies yet.
              </section>
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-5">
                {[...byModule.entries()].map(([unitOrder, group]) => (
                  <section
                    key={unitOrder}
                    className="grid gap-3 rounded-md border border-slate-200 bg-white p-4"
                  >
                    <h2 className="text-sm font-semibold text-slate-950">
                      <span className="text-slate-400">module {unitOrder}</span> ·{" "}
                      {group.title}
                    </h2>
                    <div className="grid gap-2">
                      {group.items.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/lessons/${entry.lesson_id}/practice`}
                          className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50"
                        >
                          {entry.lesson_title}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>
        );
      }}
    </CourseLoader>
  );
}
