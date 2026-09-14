"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProtectedPage } from "../../components/protected-page";
import { fetchAdminReviewDashboard, type AdminGradebookRow } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminGradebookPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {() => <GradebookPage />}
    </ProtectedPage>
  );
}

function GradebookPage() {
  const [gradebook, setGradebook] = useState<AdminGradebookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGradebook = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const dashboard = await fetchAdminReviewDashboard(token);
      setGradebook(dashboard.gradebook);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not load gradebook",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGradebook();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadGradebook]);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">teacher dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">gradebook</h1>
        <p className="text-sm text-slate-600">
          per-student progress across all assessments.
        </p>
        <nav className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            &larr; back to grading
          </Link>
          <Link
            href="/admin/content"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            content tools
          </Link>
        </nav>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="py-3 px-4">student</th>
              <th className="py-3 px-4">lessons</th>
              <th className="py-3 px-4">quiz attempts</th>
              <th className="py-3 px-4">latest quiz</th>
              <th className="py-3 px-4">avg quiz</th>
              <th className="py-3 px-4">psets</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-slate-500">
                  loading gradebook...
                </td>
              </tr>
            ) : gradebook.length > 0 ? (
              gradebook.map((row) => <GradebookRow key={row.student_id} row={row} />)
            ) : (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-slate-500">
                  no student accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function GradebookRow({ row }: { row: AdminGradebookRow }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 px-4">
        <p className="font-semibold text-slate-950">{row.student_name}</p>
        <p className="mt-1 text-xs text-slate-500">{row.student_email}</p>
      </td>
      <td className="py-3 px-4 text-slate-700">
        {row.completed_lessons}/{row.total_assessments}
      </td>
      <td className="py-3 px-4 text-slate-700">{row.quiz_attempts}</td>
      <td className="py-3 px-4 text-slate-700">
        {row.latest_quiz_score === null ? "—" : `${row.latest_quiz_score}%`}
      </td>
      <td className="py-3 px-4 text-slate-700">
        {row.average_quiz_score === null ? "—" : `${row.average_quiz_score}%`}
      </td>
      <td className="py-3 px-4 text-slate-700">
        {row.pset_submissions} submitted, {row.pending_psets} pending
      </td>
    </tr>
  );
}
