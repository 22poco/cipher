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

// nearest to test day-level readiness: the frq is 30% of the score, so a
// strong mcq run with the frq still unreviewed lands around this band.
const FULL_EXAM_SCORE_HINT = 70;

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
              what each module covers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  n: 1,
                  title: "think like an attacker",
                  body: "social engineering, suspicious logins, public networks, and how ai shows up on both sides of an attack.",
                  soft: "bg-emerald-50",
                  bar: "bg-emerald-500",
                  label: "text-emerald-700",
                },
                {
                  n: 2,
                  title: "secure physical spaces",
                  body: "door locks to server rooms: physical vulnerabilities, controls that stop them, and how attacks get detected.",
                  soft: "bg-sky-50",
                  bar: "bg-sky-500",
                  label: "text-sky-700",
                },
                {
                  n: 3,
                  title: "secure networks",
                  body: "network attacks and wireless weaknesses, then the segmentation, firewalls, and monitoring that catch them.",
                  soft: "bg-violet-50",
                  bar: "bg-violet-500",
                  label: "text-violet-700",
                },
                {
                  n: 4,
                  title: "secure devices",
                  body: "device vulnerabilities and authentication, hardening endpoints, and spotting a device under attack.",
                  soft: "bg-amber-50",
                  bar: "bg-amber-500",
                  label: "text-amber-700",
                },
                {
                  n: 5,
                  title: "secure applications and data",
                  body: "application and data attacks, access control, cryptography from symmetric to asymmetric, and detection.",
                  soft: "bg-rose-50",
                  bar: "bg-rose-500",
                  label: "text-rose-700",
                },
                {
                  n: 6,
                  title: "how scoring works",
                  body: `every mcq section is 70% of the score; the device security frq your teacher grades is the other 30%, against a 14-point rubric.`,
                  soft: "bg-slate-50",
                  bar: "bg-slate-700",
                  label: "text-slate-700",
                },
              ].map((tile) => (
                <div
                  key={tile.n}
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
