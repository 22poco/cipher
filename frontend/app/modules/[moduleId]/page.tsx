"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { CourseLoader } from "../../components/course-loader";
import { fetchModule, type CourseModule } from "@/lib/api";

export default function ModuleDetailPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const loadModule = useCallback(
    (token: string) => fetchModule(moduleId, token),
    [moduleId],
  );

  return (
    <CourseLoader load={loadModule}>
      {(module: CourseModule) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link href="/units" className="font-medium text-slate-700 hover:text-slate-950">
              modules
            </Link>{" "}
            / assessment set
          </nav>

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">
              assessment set
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              {module.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {module.description}
            </p>
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">assessments</h2>
            <div className="mt-4 grid gap-3">
              {module.lessons.length === 0 ? (
                <p className="text-sm text-slate-600">
                  no assessments have been added to this module yet.
                </p>
              ) : (
                module.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 transition hover:border-emerald-600 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{lesson.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        assessment {lesson.order_index}
                      </p>
                    </div>
                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {lesson.lesson_type}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>
      )}
    </CourseLoader>
  );
}
