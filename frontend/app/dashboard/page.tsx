"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import { fetchMyProgress, fetchUnits, type ProgressSummary, type Unit } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <ProtectedPage>
      {(user) => <StudentDashboard name={user.name} email={user.email} role={user.role} />}
    </ProtectedPage>
  );
}

function StudentDashboard({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    Promise.all([fetchMyProgress(token), fetchUnits(token)])
      .then(([progressData, unitsData]) => {
        setProgress(progressData);
        setUnits(unitsData);
      })
      .catch((caughtError) =>
        setError(caughtError instanceof Error ? caughtError.message : "Could not load progress."),
      );
  }, []);

  const latestAttempt = progress?.quiz_attempts[0];
  const completedLessonIds = new Set(
    progress?.lesson_progress.map((entry) => entry.lesson_id) ?? [],
  );
  const moduleProgress = units.map((unit) => {
    const assessments = unit.modules
      .filter((module) => module.title.toLowerCase() === "topic assessments")
      .flatMap((module) => module.lessons);
    const completed = assessments.filter((lesson) => completedLessonIds.has(lesson.id)).length;
    const percent = assessments.length
      ? Math.round((completed / assessments.length) * 100)
      : 0;

    return {
      unit,
      completed,
      total: assessments.length,
      percent,
    };
  });
  const totalAssessments = moduleProgress.reduce((sum, item) => sum + item.total, 0);
  const completedAssessments = moduleProgress.reduce(
    (sum, item) => sum + item.completed,
    0,
  );
  const overallPercent = totalAssessments
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">Student Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Welcome, {name}
        </h1>
        <p className="text-sm text-slate-600">
          Signed in as {email} with the {role} role.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Overall Progress", `${overallPercent}% Complete`],
          [
            "Assessment Progress",
            progress
              ? `${completedAssessments}/${totalAssessments} assessments complete`
              : "Loading progress...",
          ],
          [
            "Latest Quiz",
            latestAttempt ? `${latestAttempt.score}% score` : "No attempts yet",
          ],
        ].map(([title, value]) => (
          <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 lg:max-w-3xl">
            <h2 className="text-lg font-semibold text-slate-950">Module Progress</h2>
            <div className="mt-4 grid gap-3">
              {moduleProgress.map(({ unit, completed, total, percent }) => (
                <div key={unit.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">
                      Module {unit.order_index}: {unit.title}
                    </span>
                    <span className="text-slate-500">
                      {completed}/{total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/units"
            className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 lg:justify-self-end"
          >
            View Modules
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Recent Quiz Attempts</h2>
        <div className="mt-4 grid gap-2">
          {progress && progress.quiz_attempts.length > 0 ? (
            progress.quiz_attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-700">{attempt.quiz_title ?? `quiz ${attempt.quiz_id}`}</span>
                <span className="text-slate-950">{attempt.score}%</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              No quiz attempts yet. Open an assessment to see scores here.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
