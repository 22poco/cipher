"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CourseLoader } from "../components/course-loader";
import {
  fetchAllPracticeCases,
  type PracticeCaseIndex,
} from "@/lib/api";

// same accent families as the modules page so the two tabs read as one system.
const unitColors: Record<
  number,
  { chip: string; text: string; itemHover: string; banner: string; edge: string }
> = {
  1: {
    chip: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    itemHover: "hover:border-emerald-500 hover:bg-emerald-50",
    banner: "bg-emerald-500",
    edge: "border-l-emerald-300",
  },
  2: {
    chip: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    itemHover: "hover:border-sky-500 hover:bg-sky-50",
    banner: "bg-sky-500",
    edge: "border-l-sky-300",
  },
  3: {
    chip: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    itemHover: "hover:border-violet-500 hover:bg-violet-50",
    banner: "bg-violet-500",
    edge: "border-l-violet-300",
  },
  4: {
    chip: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    itemHover: "hover:border-amber-500 hover:bg-amber-50",
    banner: "bg-amber-500",
    edge: "border-l-amber-300",
  },
  5: {
    chip: "bg-rose-100 text-rose-700",
    text: "text-rose-700",
    itemHover: "hover:border-rose-500 hover:bg-rose-50",
    banner: "bg-rose-500",
    edge: "border-l-rose-300",
  },
};

const FALLBACK = {
  chip: "bg-slate-100 text-slate-700",
  text: "text-slate-700",
  itemHover: "hover:border-slate-500 hover:bg-slate-50",
  banner: "bg-slate-500",
  edge: "border-l-slate-300",
};

export default function ExtraPage() {
  const loadCases = (token: string) => fetchAllPracticeCases(token);

  return (
    <CourseLoader load={loadCases}>
      {(cases: PracticeCaseIndex[]) => <ExtraCarousel cases={cases} />}
    </CourseLoader>
  );
}

function ExtraCarousel({ cases }: { cases: PracticeCaseIndex[] }) {
  const modules = useMemo(() => {
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
    return [...byModule.entries()]
      .map(([unitOrder, group]) => ({ order: unitOrder, ...group }))
      .sort((a, b) => a.order - b.order);
  }, [cases]);

  const [current, setCurrent] = useState(0);
  const active = modules[current];
  const colors = active ? unitColors[active.order] ?? FALLBACK : FALLBACK;

  function go(delta: number) {
    setCurrent((prev) => {
      if (modules.length === 0) {
        return prev;
      }
      const next = prev + delta;
      // wrap around so both arrows always do something
      if (next < 0) return modules.length - 1;
      if (next >= modules.length) return 0;
      return next;
    });
  }

  if (cases.length === 0 || !active) {
    return (
      <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-10 sm:px-6">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-emerald-700">practice</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            extra
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            bonus practice that does not count for anything. no one sees this
            work, so it is a safe place to mess up and try again.
          </p>
        </div>
        <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
          no extra case studies yet.
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className={`text-sm font-semibold ${colors.text}`}>practice</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          extra
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          bonus practice that does not count for anything. no one sees this
          work, so it is a safe place to mess up and try again.
        </p>
      </div>

      <section
        className={`overflow-hidden rounded-md border border-slate-200 bg-white`}
      >
        {/* banner header in the module family color, distinct from the plain
            white cards on the modules tab */}
        <div className="grid justify-items-center gap-4 p-6 pb-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-md text-xl font-bold ${colors.chip}`}
            >
              {active.order}
            </div>
            <div className="text-center">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}
              >
                module {active.order}
              </p>
              <h2 className="mt-0.5 text-2xl font-semibold text-slate-950">
                {active.title}
              </h2>
            </div>
          </div>

          {/* module selector dots: jump straight to any module; arrows sit
              beside the dot row so it reads as one centered control strip */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="previous module"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-base font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
            >
              ←
            </button>
            {modules.map((m, index) => (
              <button
                key={m.order}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`show module ${m.order}`}
                className={`h-2.5 w-8 rounded-full transition ${
                  index === current
                    ? unitColors[m.order]?.banner ?? FALLBACK.banner
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="next module"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-base font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
            >
              →
            </button>
          </div>
        </div>

        {/* topic tiles. a plain centered flex-wrap row: rows establish
            their own width, so a partial last row (4 topics -> 2+2, 5 -> 3+2)
            always centers itself with equal margins on both sides. */}
        <div
          className="flex flex-wrap justify-center gap-3 border-t border-slate-100 p-6"
        >
          {active.items.map((entry) => (
            <div
              key={entry.id}
              className={`w-full sm:w-[calc(50%-0.375rem)] ${
                active.items.length === 4
                  ? ""
                  : "lg:w-[calc(33.333%-0.5rem)]"
              }`}
            >
              <Link
                href={`/lessons/${entry.lesson_id}/practice`}
                className={`grid h-full content-center justify-items-center gap-0.5 rounded-md border border-slate-100 border-l-4 ${colors.edge} bg-slate-50 px-4 py-4 text-center text-sm font-medium text-slate-800 transition ${colors.itemHover}`}
              >
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {entry.lesson_title.split(" ")[0]}
                </span>
                <span>{entry.lesson_title.replace(/^\d+\.\d+\s*/, "")}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-slate-500">
        module {current + 1} of {modules.length}
      </p>
    </main>
  );
}
