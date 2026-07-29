"use client";

import Link from "next/link";
import { useCallback } from "react";

import { CourseLoader } from "../components/course-loader";
import {
  fetchMyProgress,
  fetchUnits,
  type ProgressSummary,
  type Unit,
} from "@/lib/api";

function assessmentLessons(unit: Unit) {
  return unit.modules
    .filter((module) => module.title.toLowerCase() === "topic assessments")
    .flatMap((module) => module.lessons);
}

export default function AssessmentsPage() {
  const loadAssessmentState = useCallback(async (token: string) => {
    const [units, progress] = await Promise.all([
      fetchUnits(token),
      fetchMyProgress(token),
    ]);

    return { units, progress };
  }, []);

  return (
    <CourseLoader load={loadAssessmentState}>
      {({ units, progress }: { units: Unit[]; progress: ProgressSummary }) => {
        const completedLessonIds = new Set(
          progress.lesson_progress
            .filter((entry) => entry.completed)
            .map((entry) => entry.lesson_id),
        );

        return (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">assessment hub</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              AP cybersecurity modules
            </h1>
            <p className="max-w-5xl text-sm leading-6 text-slate-600">
              complete AP CED-aligned scenario checks, quizzes, and pset responses.
              each module follows the same assessment pattern so practice feels predictable.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            {units.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
                no assessment modules have been seeded yet.
              </div>
            ) : (
              units.map((unit) => {
                const lessons = assessmentLessons(unit);

                return (
                  <article
                    key={unit.id}
                    className="grid min-w-0 gap-4 rounded-md border border-slate-200 bg-white p-5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        module {unit.order_index}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950">
                        {unit.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {unit.description}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        {lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length}/
                        {lessons.length} complete
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {lessons.length > 0 ? (
                        lessons.map((lesson) => {
                          const isComplete = completedLessonIds.has(lesson.id);

                          return (
                            <Link
                              key={lesson.id}
                              href={`/lessons/${lesson.id}`}
                              className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-3 transition hover:border-emerald-600 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <span>
                                <span className="block font-medium text-slate-950">
                                  {lesson.title}
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                  scenario check, quiz, and written response
                                </span>
                              </span>
                              <span
                                className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${
                                  isComplete
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isComplete ? "complete" : "start"}
                              </span>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                          assessment placeholder not added yet.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>
        );
      }}
    </CourseLoader>
  );
}
