"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { CourseLoader } from "../../components/course-loader";
import { fetchUnit, type Unit } from "@/lib/api";

export default function UnitDetailPage() {
  const params = useParams<{ unitId: string }>();
  const unitId = params.unitId;
  const loadUnit = useCallback((token: string) => fetchUnit(unitId, token), [unitId]);

  return (
    <CourseLoader load={loadUnit}>
      {(unit: Unit) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link href="/units" className="font-medium text-slate-700 hover:text-slate-950">
              units
            </Link>{" "}
            / unit {unit.order_index}
          </nav>

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">
              unit {unit.order_index}
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              {unit.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {unit.description}
            </p>
          </div>

          <section className="grid gap-4">
            {unit.modules.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
                no modules have been added to this unit yet.
              </div>
            ) : (
              unit.modules.map((module) => (
                <article
                  key={module.id}
                  className="rounded-md border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        module {module.order_index}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950">
                        {module.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {module.description}
                      </p>
                    </div>
                    <Link
                      href={`/modules/${module.id}`}
                      className="flex h-10 w-fit items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      open module
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className="flex flex-col gap-1 rounded-md border border-slate-200 px-3 py-2 transition hover:border-emerald-600 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-medium text-slate-950">
                          {lesson.title}
                        </span>
                        <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {lesson.lesson_type}
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))
            )}
          </section>
        </main>
      )}
    </CourseLoader>
  );
}
