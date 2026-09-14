"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import {
  fetchMockExamDefinitions,
  fetchMyMockExamAttempts,
  type MockExamAttempt,
  type MockExamDefinition,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  attemptLabel,
  clearSavedProgress,
  effectiveRemainingSeconds,
  formatClock,
  formatDuration,
  readSavedProgress,
} from "./progress";

export default function MockExamPage() {
  return (
    <ProtectedPage>
      {() => <MockExamHub />}
    </ProtectedPage>
  );
}

function MockExamHub() {
  const [exams, setExams] = useState<MockExamDefinition[]>([]);
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHub = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const [definitions, myAttempts] = await Promise.all([
        fetchMockExamDefinitions(token),
        fetchMyMockExamAttempts(token),
      ]);
      setExams(definitions);
      setAttempts(myAttempts);
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not load the exams",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadHub();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadHub]);

  const fullExam = exams.find((exam) => exam.kind === "full");
  const unitExams = exams
    .filter((exam) => exam.kind === "unit")
    .sort((a, b) => (a.unit_id ?? 0) - (b.unit_id ?? 0));

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">practice</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          mock exams
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          six ap-style practice exams: one full course exam with the exact structure of
          the real ap cybersecurity exam, plus one shorter exam for each unit. every exam
          ends with the device security analysis free-response question, graded by your
          teacher against the 14-point rubric.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          preparing exams...
        </section>
      ) : (
        <>
          {fullExam ? <FullExamCard exam={fullExam} /> : null}

          <section className="grid gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-950">unit exams</h2>
              <p className="text-sm text-slate-600">
                30 questions + frq — half the length of the full exam.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {unitExams.map((exam) => (
                <UnitExamCard key={exam.key} exam={exam} />
              ))}
            </div>
          </section>

          {attempts.length > 0 ? (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">past attempts</h2>
              <div className="mt-4 grid gap-2">
                {attempts.slice(0, 8).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-600">
                      {attemptLabel(attempt.exam_kind, attempt.unit_id)} ·{" "}
                      {new Date(attempt.submitted_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-2">
                      {attempt.frq_reviewed && attempt.frq_score !== null ? (
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          frq {attempt.frq_score}/14
                        </span>
                      ) : null}
                      <span className="font-semibold text-slate-950">
                        {attempt.score}% ({attempt.correct_count}/{attempt.total_questions})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function FullExamCard({ exam }: { exam: MockExamDefinition }) {
  return (
    <ExamCardShell exam={exam} featured>
      <div className="grid gap-3 text-sm leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-slate-950">format:</span> {exam.mcq_count}{" "}
          multiple-choice questions across all five units (80 min on the real exam) plus
          the device security analysis free-response question (50 min). weighted 70% mcq
          / 30% frq once your teacher grades the frq.
        </p>
        <p>
          <span className="font-semibold text-slate-950">time limit:</span>{" "}
          {formatDuration((exam.time_limit_minutes ?? 0) * 60)} — slightly longer than
          the real 2 hr 10 min exam, with questions written to be harder than exam
          difficulty.
        </p>
        <p>
          <span className="font-semibold text-slate-950">rules:</span> the timer keeps
          running even if you quit or close the tab. skipped questions score zero, so
          answer everything before time runs out.
        </p>
      </div>
    </ExamCardShell>
  );
}

function UnitExamCard({ exam }: { exam: MockExamDefinition }) {
  return (
    <ExamCardShell exam={exam}>
      <div className="grid gap-3 text-sm leading-6 text-slate-700">
        <p>{exam.description}</p>
        <p>
          <span className="font-semibold text-slate-950">time limit:</span>{" "}
          {formatDuration((exam.time_limit_minutes ?? 0) * 60)} — the clock keeps running
          if you quit before submitting.
        </p>
      </div>
    </ExamCardShell>
  );
}

function ExamCardShell({
  exam,
  featured = false,
  children,
}: {
  exam: MockExamDefinition;
  featured?: boolean;
  children: React.ReactNode;
}) {
  const [resume, setResume] = useState(() => readSavedProgress(exam.key));
  const [isDiscarding, setIsDiscarding] = useState(false);

  // when any exam is started, submitted, or discarded this session, re-check
  // this card so it shows a resume banner instead of a plain start button.
  useEffect(() => {
    const sync = () => {
      setResume(readSavedProgress(exam.key));
    };
    window.addEventListener("cipher-mock-exam-progress-change", sync);
    return () => window.removeEventListener("cipher-mock-exam-progress-change", sync);
  }, [exam.key]);

  const remaining = resume ? effectiveRemainingSeconds(resume) : 0;
  const answeredCount = resume ? Object.keys(resume.answers).length : 0;
  const started = Boolean(resume);

  function handleDiscard() {
    clearSavedProgress(exam.key);
    setResume(null);
    setIsDiscarding(false);
    window.dispatchEvent(new Event("cipher-mock-exam-progress-change"));
  }

  return (
    <section
      className={`grid gap-4 rounded-md border bg-white p-6 ${
        featured ? "border-slate-950 shadow-sm" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              featured ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {featured ? "full course exam" : "unit exam"}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">{exam.title}</h3>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          {exam.mcq_count} mcq + frq · {formatDuration((exam.time_limit_minutes ?? 0) * 60)}
        </span>
      </div>

      {children}

      {resume && started ? (
        isDiscarding ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            discard this attempt? the saved answers are deleted and the paper is gone.
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                yes, discard and reset
              </button>
              <button
                type="button"
                onClick={() => setIsDiscarding(false)}
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            attempt in progress — about{" "}
            <span className="font-semibold">{formatClock(remaining)}</span> left,{" "}
            {answeredCount} question{answeredCount === 1 ? "" : "s"} answered
            {resume.frqResponse ? ", frq drafted" : ""}. the timer kept running while you
            were away.
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/mock-exam/${exam.key}`}
                className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold leading-10 text-white transition hover:bg-emerald-700"
              >
                resume exam
              </Link>
              <button
                type="button"
                onClick={() => setIsDiscarding(true)}
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                discard and reset
              </button>
            </div>
          </div>
        )
      ) : exam.questions_available > 0 ? (
        <Link
          href={`/mock-exam/${exam.key}`}
          className={`h-12 rounded-md px-6 text-center text-sm font-semibold leading-[3rem] transition ${
            featured
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white"
          }`}
        >
          start exam
        </Link>
      ) : (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          exam bank is still loading for this unit — ask your teacher to run the seed
          script.
        </p>
      )}
    </section>
  );
}
