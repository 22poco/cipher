"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProtectedPage } from "../../components/protected-page";
import { formatDate } from "../admin-ui";
import {
  fetchAdminMockExamGrading,
  updateAdminMockExamGrading,
  type AdminMockExamAttempt,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { attemptLabel } from "@/app/mock-exam/progress";

export default function AdminMockExamGradingPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {() => <GradingDashboard />}
    </ProtectedPage>
  );
}

const TOTAL_FRQ_POINTS = 14;

function GradingDashboard() {
  const [attempts, setAttempts] = useState<AdminMockExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttempts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const list = await fetchAdminMockExamGrading(token);
      setAttempts(list);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "could not load mock exam attempts",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAttempts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAttempts]);

  const frqQueue = attempts.filter(
    (attempt) => attempt.frq_response !== null && !attempt.frq_reviewed,
  );
  const ungradedCount = frqQueue.length;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">teacher dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          mock exam frq grading
        </h1>
        <p className="text-sm text-slate-600">
          grade the device security analysis free-response question against the 14-point
          rubric. grading combines with the mcq score (70/30) on the student&apos;s
          dashboard.
        </p>
        <nav className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            &larr; back to grading
          </Link>
          <Link
            href="/admin/gradebook"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            gradebook
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

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["frq queue", ungradedCount],
          ["total attempts", attempts.length],
          [
            "frq graded",
            attempts.filter((attempt) => attempt.frq_reviewed).length,
          ],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-slate-950">
          rubric reminder
        </h2>
        <p className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          part a (2 pts) · part b (2 pts) · part c (3 pts) · part d (3 pts) · part e
          (4 pts) — award credit only for answers that cite specific evidence from the
          sources. total {TOTAL_FRQ_POINTS} points.
        </p>
      </section>

      {isLoading ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
          loading attempts...
        </section>
      ) : attempts.length === 0 ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
          no mock exam attempts yet.
        </section>
      ) : (
        <section className="grid gap-3">
          {attempts.map((attempt) => (
            <GradingCard key={attempt.id} attempt={attempt} onSaved={loadAttempts} />
          ))}
        </section>
      )}
    </main>
  );
}

function GradingCard({
  attempt,
  onSaved,
}: {
  attempt: AdminMockExamAttempt;
  onSaved: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(
    attempt.frq_score === null ? "" : String(attempt.frq_score),
  );
  const [feedback, setFeedback] = useState(attempt.frq_feedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const partScores = parsePartScores(attempt.frq_part_scores);
  const scoreValue = Number(score);
  const hasValidScore = score !== "" && Number.isFinite(scoreValue);

  async function handleSave(reviewed: boolean) {
    const token = getToken();
    if (!token) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      await updateAdminMockExamGrading(
        attempt.id,
        {
          frq_reviewed: reviewed,
          frq_score: hasValidScore ? scoreValue : undefined,
          frq_feedback: feedback.trim() ? feedback.trim() : undefined,
          frq_part_scores: JSON.stringify(capturePartScores()),
        },
        token,
      );
      setIsEditing(false);
      onSaved();
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error ? caughtError.message : "could not save grading",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function capturePartScores() {
    const parts = ["a", "b", "c", "d", "e"];
    const result: Record<string, number> = {};
    for (const part of parts) {
      const field = document.getElementById(
        `part-${attempt.id}-${part}`,
      ) as HTMLInputElement | null;
      const value = field?.value ? Number(field.value) : null;
      if (value !== null && Number.isFinite(value)) {
        result[part] = value;
      }
    }
    return result;
  }

  function renderPartScoreFields() {
    const maxima: Record<string, number> = { a: 2, b: 2, c: 3, d: 3, e: 4 };
    return (
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(maxima).map(([part, max]) => (
          <label key={part} className="text-xs font-semibold text-slate-600">
            part {part} / {max}
            <input
              id={`part-${attempt.id}-${part}`}
              type="number"
              min={0}
              max={max}
              step={1}
              defaultValue={partScores[part] ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-950 outline-none focus:border-emerald-600"
            />
          </label>
        ))}
      </div>
    );
  }

  return (
    <article
      className={`grid gap-3 rounded-md border p-4 ${
        attempt.frq_reviewed
          ? "border-emerald-200 bg-emerald-50"
          : attempt.frq_response !== null
            ? "border-slate-200 bg-white"
            : "border-slate-100 bg-slate-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">
            {attempt.student_name}{" "}
            <span className="text-xs font-normal text-slate-500">
              {attempt.student_email}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {attemptLabel(attempt.exam_kind, attempt.unit_id)} · mcq{" "}
            {attempt.correct_count}/{attempt.total_questions} (
            {Math.round(
              (attempt.correct_count / Math.max(1, attempt.total_questions)) * 100,
            )}
            %) · submitted {formatDate(attempt.submitted_at)}
            {attempt.duration_seconds !== null
              ? ` · ${Math.round(attempt.duration_seconds / 60)} min`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {attempt.frq_reviewed ? (
            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              frq {attempt.frq_score}/14 · total {attempt.score}%
            </span>
          ) : attempt.frq_response !== null ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              needs grading
            </span>
          ) : (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              mcq only · total {attempt.score}%
            </span>
          )}
        </div>
      </div>

      {attempt.frq_response !== null ? (
        <>
          <details className="rounded-md border border-slate-200 bg-white p-3" open={isEditing}>
            <summary
              className="cursor-pointer text-sm font-semibold text-slate-800"
              onClick={(event) => {
                // prevent <details> toggle from fighting the edit state
                if (isEditing) {
                  event.preventDefault();
                }
              }}
            >
              view frq response
            </summary>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-800">
              {attempt.frq_response}
            </p>
          </details>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {attempt.frq_reviewed ? "revise grading" : "grade this frq"}
            </button>
          ) : (
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
              {renderPartScoreFields()}
              <label className="text-xs font-semibold text-slate-600">
                total frq score (0–14)
                <input
                  type="number"
                  min={0}
                  max={14}
                  step={1}
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  className="mt-1 w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-950 outline-none focus:border-emerald-600"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                feedback for the student
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm text-slate-950 outline-none focus:border-emerald-600"
                />
              </label>
              {saveError ? (
                <p className="text-sm text-red-700">{saveError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSave(true)}
                  className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSaving ? "saving..." : "save grading"}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError("");
                  }}
                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </article>
  );
}

function parsePartScores(raw: string | null): Record<string, number> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        result[key] = numeric;
      }
    }
    return result;
  } catch {
    return {};
  }
}
