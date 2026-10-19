"use client";

import Link from "next/link";
import { useCallback } from "react";

import { CourseLoader } from "../components/course-loader";
import { fetchUnits, type Unit } from "@/lib/api";

// one accent per module: number chip, label, badge, and hover accent stay in
// family so the row reads as an intentional rainbow rather than noise.
const unitColors: Record<
  number,
  { chip: string; text: string; badge: string; hover: string }
> = {
  1: {
    chip: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
    hover: "group-hover:text-emerald-700",
  },
  2: {
    chip: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    badge: "bg-sky-50 text-sky-700",
    hover: "group-hover:text-sky-700",
  },
  3: {
    chip: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    badge: "bg-violet-50 text-violet-700",
    hover: "group-hover:text-violet-700",
  },
  4: {
    chip: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700",
    hover: "group-hover:text-amber-700",
  },
  5: {
    chip: "bg-rose-100 text-rose-700",
    text: "text-rose-700",
    badge: "bg-rose-50 text-rose-700",
    hover: "group-hover:text-rose-700",
  },
};

// facts pulled straight from the AP Cybersecurity CED / College Board exam
// format page — the stuff students won't already know just from class.
const examFacts: {
  title: string;
  body: string;
  soft: string;
  bar: string;
  label: string;
}[] = [
  {
    title: "60 questions · 80 minutes",
    body: "Section I is 60 scenario-based multiple-choice questions in 80 minutes, worth 70% of the score. every question comes attached to realistic artifacts — logs, firewall rules, network diagrams, packet captures — not standalone recall.",
    soft: "bg-emerald-50",
    bar: "bg-emerald-500",
    label: "text-emerald-700",
  },
  {
    title: "1 frq · 50 minutes · 30%",
    body: "Section II is a single Device Security Analysis free-response question: 50 minutes, 30% of the score, graded against a 14-point rubric. it draws on the Mitigate Risk and Detect Attacks skill categories.",
    soft: "bg-rose-50",
    bar: "bg-rose-500",
    label: "text-rose-700",
  },
  {
    title: "skills are weighted 25–40%",
    body: "the College Board publishes weighting by skill category, not by unit: Analyze Risk, Mitigate Risk, and Detect Attacks each land in a band of 25–40% of the exam — so no single unit dominates the score.",
    soft: "bg-sky-50",
    bar: "bg-sky-500",
    label: "text-sky-700",
  },
  {
    title: "task verbs signal what graders want",
    body: "the frq runs on Identify, Describe, Explain, and Determine. an Explain part needs a reason backed by evidence from the provided sources; a Determine part needs a specific result, not a general description.",
    soft: "bg-violet-50",
    bar: "bg-violet-500",
    label: "text-violet-700",
  },
  {
    title: "evidence citations win the frq",
    body: "generic claims earn zero on the device security analysis. a strong response quotes the artifact — a log line, a firewall rule, a permission string — then classifies the attack and ties it to the evidence.",
    soft: "bg-amber-50",
    bar: "bg-amber-500",
    label: "text-amber-700",
  },
  {
    title: "a qualifying score stacks three ways",
    body: "a passing score earns college credit/placement, the employer-endorsed AP Cybersecurity Credential aligned to the NICE framework, and a CompTIA Security+ exam voucher worth up to $350.",
    soft: "bg-slate-50",
    bar: "bg-slate-700",
    label: "text-slate-700",
  },
];

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
            <div className="grid gap-4 lg:grid-cols-5">
              {units.map((unit) => (
                <Link
                  key={unit.id}
                  href={`/units/${unit.id}`}
                  className={`group grid grid-rows-[auto_1fr_auto] gap-3 rounded-md border border-slate-200 bg-white p-5 transition hover:border-emerald-500`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-md text-lg font-bold ${
                      unitColors[unit.order_index]?.chip ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {unit.order_index}
                  </div>
                  <div className="grid content-start gap-1">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        unitColors[unit.order_index]?.text ?? "text-slate-400"
                      }`}
                    >
                      module {unit.order_index}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                      {unit.title}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {unit.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        unitColors[unit.order_index]?.badge ??
                        "bg-slate-100 text-slate-600"
                      } transition group-hover:brightness-95`}
                    >
                      {unit.modules.reduce(
                        (assessmentCount, module) =>
                          assessmentCount + module.lessons.length,
                        0,
                      )}{" "}
                      assessments
                    </span>
                    <span
                      className={`text-xs font-semibold text-slate-400 transition ${
                        unitColors[unit.order_index]?.hover ??
                        "group-hover:text-emerald-700"
                      }`}
                    >
                      open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              the ap cybersecurity exam, by the numbers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {examFacts.map((tile) => (
                <div
                  key={tile.title}
                  className={`grid content-start gap-1.5 rounded-md border border-slate-100 ${tile.soft} p-3`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-6 rounded-full ${tile.bar}`} />
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${tile.label}`}
                    >
                      {tile.title}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-slate-600">{tile.body}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </CourseLoader>
  );
}
