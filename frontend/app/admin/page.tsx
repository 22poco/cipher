"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import { formatDate } from "./admin-ui";
import {
  fetchAdminReviewDashboard,
  updateAdminPsetReview,
  type AdminPsetResponse,
  type AdminQuizAttempt,
  type AdminReviewDashboard,
  type QuizAttemptAnswer,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {(user) => <AdminDashboard email={user.email} />}
    </ProtectedPage>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [reviewDashboard, setReviewDashboard] = useState<AdminReviewDashboard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAdminData = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setError("");

    try {
      const reviewData = await fetchAdminReviewDashboard(token);
      setReviewDashboard(reviewData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not load dashboard data",
      );
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAdminData]);

  async function togglePsetReview(response: AdminPsetResponse, feedback?: string | null) {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      await updateAdminPsetReview(response.id, { reviewed: !response.reviewed, feedback }, token);
      const refreshed = await fetchAdminReviewDashboard(token);
      setReviewDashboard(refreshed);
      setMessage(response.reviewed ? "pset marked pending" : "pset marked reviewed");
      setError("");
    } catch (caughtError) {
      setMessage("");
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("something went wrong");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">teacher dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          grading &amp; review
        </h1>
        <p className="text-sm text-slate-600">
          signed in as {email}. review pset responses and quiz attempts, then leave
          feedback for students.
        </p>
        <nav className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
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

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["students", reviewDashboard?.total_students ?? "—"],
          ["pending psets", reviewDashboard?.pending_psets ?? "—"],
          ["reviewed psets", reviewDashboard?.reviewed_psets ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {reviewDashboard ? (
        <ReviewPanel
          dashboard={reviewDashboard}
          isSaving={isSaving}
          onTogglePsetReview={(response) => void togglePsetReview(response)}
        />
      ) : (
        <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
          loading review queue...
        </section>
      )}
    </main>
  );
}

function ReviewPanel({
  dashboard,
  isSaving,
  onTogglePsetReview,
}: {
  dashboard: AdminReviewDashboard;
  isSaving: boolean;
  onTogglePsetReview: (response: AdminPsetResponse) => void;
}) {
  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">pset review queue</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            review written responses and leave feedback for students.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">
            {dashboard.pending_psets} pending
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
            {dashboard.reviewed_psets} reviewed
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {dashboard.pset_responses.length > 0 ? (
          dashboard.pset_responses.map((response) => (
            <PsetReviewCard
              key={response.id}
              response={response}
              isSaving={isSaving}
              onToggleReview={onTogglePsetReview}
            />
          ))
        ) : (
          <p className="text-sm text-slate-500">no pset responses submitted yet.</p>
        )}
      </div>

      <details className="rounded-md border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-slate-950">
          quiz attempt review ({dashboard.quiz_attempts.length})
        </summary>
        <div className="mt-4 grid gap-3">
          {dashboard.quiz_attempts.length > 0 ? (
            dashboard.quiz_attempts.map((attempt) => (
              <QuizAttemptReview key={attempt.id} attempt={attempt} />
            ))
          ) : (
            <p className="text-sm text-slate-500">no quiz attempts submitted yet.</p>
          )}
        </div>
      </details>
    </section>
  );
}

function PsetReviewCard({
  response,
  isSaving,
  onToggleReview,
}: {
  response: AdminPsetResponse;
  isSaving: boolean;
  onToggleReview: (response: AdminPsetResponse, feedback?: string | null) => void;
}) {
  return (
    <article
      className={`rounded-md border p-3 ${
        response.reviewed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-700">
            module {response.module_order_index}: {response.module_title}
          </p>
          <h4 className="mt-1 font-semibold text-slate-950">
            {response.assessment_title}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {response.student_name} / {response.student_email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            submitted {formatDate(response.submitted_at)}
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onToggleReview(response)}
          className={`h-9 w-fit rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
            response.reviewed
              ? "border border-slate-300 bg-white text-slate-700 hover:border-slate-950"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          {response.reviewed ? "mark pending" : "mark reviewed"}
        </button>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          view response
        </summary>
        <p className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
          {response.response_text}
        </p>
        {response.feedback ? (
          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-700">feedback</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{response.feedback}</p>
          </div>
        ) : null}
      </details>
      {!response.reviewed ? (
        <FeedbackInput
          onSave={(feedback) => onToggleReview(response, feedback)}
          isSaving={isSaving}
        />
      ) : null}
    </article>
  );
}

function QuizAttemptReview({ attempt }: { attempt: AdminQuizAttempt }) {
  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer">
        <span className="font-semibold text-slate-950">
          {attempt.student_name} scored {attempt.score}% on {attempt.assessment_title}
        </span>
        <span className="ml-2 text-xs text-slate-500">
          module {attempt.module_order_index} / {formatDate(attempt.submitted_at)}
        </span>
      </summary>
      <div className="mt-3 grid gap-2">
        {attempt.answers.length > 0 ? (
          attempt.answers.map((answer, index) => (
            <QuizAnswerReview key={answer.id} answer={answer} index={index} />
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
            this older attempt does not have stored answer history.
          </p>
        )}
      </div>
    </details>
  );
}

function QuizAnswerReview({
  answer,
  index,
}: {
  answer: QuizAttemptAnswer;
  index: number;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        answer.is_correct ? "border-emerald-200 bg-white" : "border-red-200 bg-red-50"
      }`}
    >
      <p className="font-semibold text-slate-950">
        {index + 1}. {answer.question_text}
      </p>
      <p className="mt-2 text-slate-700">student answer: {answer.selected_option_text}</p>
      {!answer.is_correct && answer.correct_option_text ? (
        <p className="mt-1 text-red-700">correct answer: {answer.correct_option_text}</p>
      ) : null}
    </div>
  );
}

function FeedbackInput({
  onSave,
  isSaving,
}: {
  onSave: (feedback: string) => void;
  isSaving: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="mt-3 h-9 w-fit rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
      >
        add feedback
      </button>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        rows={3}
        placeholder="write feedback for the student..."
        className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isSaving || !feedback.trim()}
          onClick={() => {
            onSave(feedback.trim());
            setIsExpanded(false);
            setFeedback("");
          }}
          className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          save feedback &amp; review
        </button>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setFeedback("");
          }}
          className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
