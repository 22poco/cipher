"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import { fetchMyProgress, fetchUnits, type ProgressSummary, type Unit } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <ProtectedPage>
      {(user) => <StudentDashboard name={user.name} role={user.role} />}
    </ProtectedPage>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(241 245 249)"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(5 150 105)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-950">{clamped}%</span>
        <span className="text-xs font-medium text-slate-500">complete</span>
      </div>
    </div>
  );
}

function QuizScoreChart({ attempts }: { attempts: ProgressSummary["quiz_attempts"] }) {
  const recent = attempts.slice(0, 8).reverse();

  if (recent.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
        no quiz attempts yet
      </div>
    );
  }

  return (
    <div className="flex h-32 items-end gap-2">
      {recent.map((attempt) => (
        <div key={attempt.id} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs font-semibold text-slate-950">{attempt.score}%</span>
          <div className="flex h-20 w-full items-end">
            <div
              className={`w-full rounded-t-md transition ${
                attempt.score >= 75
                  ? "bg-emerald-500 group-hover:bg-emerald-600"
                  : attempt.score >= 50
                    ? "bg-amber-400 group-hover:bg-amber-500"
                    : "bg-red-400 group-hover:bg-red-500"
              }`}
              style={{ height: `${Math.max(attempt.score, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentDashboard({ name, role }: { name: string; role: string }) {
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
        setError(caughtError instanceof Error ? caughtError.message : "could not load progress"),
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
  const quizAttempts = progress?.quiz_attempts ?? [];
  const averageQuizScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length,
      )
    : null;

  return (
    <main className="grid w-full gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">student dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          welcome, {name}
        </h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="flex items-center gap-5 rounded-md border border-slate-200 bg-white p-5">
          <ProgressRing percent={overallPercent} />
          <div className="grid gap-1 text-sm">
            <p className="font-semibold text-slate-950">course progress</p>
            <p className="text-slate-600">
              {progress ? `${completedAssessments}/${totalAssessments}` : "..."} assessments
            </p>
            <p className="text-slate-600">
              {averageQuizScore !== null
                ? `${averageQuizScore}% average quiz score`
                : "no quiz scores yet"}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-950">recent quiz scores</h2>
            {latestAttempt ? (
              <span className="text-xs text-slate-500">latest {latestAttempt.score}%</span>
            ) : null}
          </div>
          <div className="mt-3">
            <QuizScoreChart attempts={quizAttempts} />
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-950">jump back in</h2>
          {moduleProgress.find(({ percent }) => percent < 100) ? (
            (() => {
              const next = moduleProgress.find(({ percent }) => percent < 100)!;
              return (
                <>
                  <p className="text-sm text-slate-600">
                    module {next.unit.order_index}: {next.unit.title} — {next.completed}/
                    {next.total} assessments done.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/units/${next.unit.id}`}
                      className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      continue module
                    </Link>
                    <Link
                      href="/mock-exam"
                      className="flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
                    >
                      practice exams
                    </Link>
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <p className="text-sm text-slate-600">
                all topic assessments are complete. use the mock exams to prep for the real
                thing.
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href="/mock-exam"
                  className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  open exams
                </Link>
              </div>
            </>
          )}
          {role === "admin" ? (
            <Link
              href="/admin"
              className="mt-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              open teacher tools →
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">module progress</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
              {moduleProgress.map(({ unit, completed, total, percent }) => (
                <div key={unit.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">
                      module {unit.order_index}: {unit.title}
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
            className="flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950 lg:justify-self-end"
          >
            view modules
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">practice exams</h2>
            <p className="mt-1 text-sm text-slate-600">
              six ap-style mock exams: one full course exam (60 questions + free
              response, 2 hours) and one 1-hour exam per unit. scored, saved, and
              frq-graded by your teacher.
            </p>
          </div>
          <Link
            href="/mock-exam"
            className="flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            open exams
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">recent quiz attempts</h2>
        <div className="mt-4 grid gap-2">
          {quizAttempts.length > 0 ? (
            quizAttempts.slice(0, 5).map((attempt) => (
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
              no quiz attempts yet. open an assessment to see scores here.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
