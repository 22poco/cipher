"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import { fetchMyProgress, type ProgressSummary } from "@/lib/api";
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
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    fetchMyProgress(token)
      .then(setProgress)
      .catch((caughtError) =>
        setError(caughtError instanceof Error ? caughtError.message : "could not load progress"),
      );
  }, []);

  const latestAttempt = progress?.quiz_attempts[0];
  const progressPercent = progress?.unit_1_progress_percent ?? 0;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">student dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          welcome, {name}
        </h1>
        <p className="text-sm text-slate-600">
          signed in as {email} with the {role} role.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["unit 1 progress", `${progressPercent}% complete`],
          [
            "lesson progress",
            progress
              ? `${progress.completed_lessons}/${progress.total_lessons} lessons complete`
              : "loading progress...",
          ],
          [
            "latest quiz",
            latestAttempt ? `${latestAttempt.score}% score` : "no attempts yet",
          ],
        ].map(([title, value]) => (
          <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-950">unit 1</h2>
            <p className="mt-1 text-sm text-slate-600">
              social engineering, linux basics, and the first quiz are ready.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
          <Link
            href="/assessments"
            className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            view assessments
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">recent quiz attempts</h2>
        <div className="mt-4 grid gap-2">
          {progress && progress.quiz_attempts.length > 0 ? (
            progress.quiz_attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-700">quiz {attempt.quiz_id}</span>
                <span className="text-slate-950">{attempt.score}%</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              no quiz attempts yet. take the unit 1 quiz to see scores here.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
