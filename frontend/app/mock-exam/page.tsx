"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProtectedPage } from "../components/protected-page";
import {
  ApiError,
  fetchMockExam,
  fetchMyMockExamAttempts,
  submitMockExam,
  type MockExam,
  type MockExamAttempt,
  type MockExamSubmitResult,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

type Phase = "intro" | "taking" | "results";

const STORAGE_KEY = "cipher-mock-exam-progress";

type SavedProgress = {
  seed: number;
  answers: Record<number, number>;
  remainingSeconds: number;
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MockExamPage() {
  return (
    <ProtectedPage>
      {() => <MockExamFlow />}
    </ProtectedPage>
  );
}

function MockExamFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [exam, setExam] = useState<MockExam | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [result, setResult] = useState<MockExamSubmitResult | null>(null);
  const [pastAttempts, setPastAttempts] = useState<MockExamAttempt[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtRef = useRef<number>(0);

  const loadAttempts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const attempts = await fetchMyMockExamAttempts(token);
      setPastAttempts(attempts.slice(0, 5));
    } catch {
      // attempts list is non-critical
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedProgress;
        if (parsed.seed && parsed.remainingSeconds > 0) {
          setSavedProgress(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    void loadAttempts().finally(() => setIsLoading(false));
  }, [loadAttempts]);

  const startExam = useCallback(
    async (restored?: SavedProgress) => {
      const token = getToken();
      if (!token) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const examData = await fetchMockExam(token);
        setExam(examData);

        if (restored && restored.seed === examData.seed) {
          setAnswers(restored.answers);
          setRemainingSeconds(restored.remainingSeconds);
        } else {
          setAnswers({});
          setCurrentQuestion(0);
          setRemainingSeconds(examData.time_limit_seconds ?? 0);
        }

        startedAtRef.current = Date.now();
        setPhase("taking");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "could not load the exam",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const submitExam = useCallback(async () => {
    const token = getToken();
    if (!token || !exam) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const submitResult = await submitMockExam(
        {
          seed: exam.seed,
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            question_id: Number(questionId),
            option_id: optionId,
          })),
          duration_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        },
        token,
      );
      setResult(submitResult);
      setPhase("results");
      window.localStorage.removeItem(STORAGE_KEY);
      void loadAttempts();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not submit the exam",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, exam, loadAttempts]);

  // countdown timer; auto-submits when time runs out
  useEffect(() => {
    if (phase !== "taking") {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval);
          void submitExam();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, submitExam]);

  // persist progress so an accidental refresh doesn't lose the attempt
  useEffect(() => {
    if (phase !== "taking" || !exam) {
      return;
    }

    const progress: SavedProgress = {
      seed: exam.seed,
      answers,
      remainingSeconds,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [answers, exam, phase, remainingSeconds]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (phase === "intro") {
    return (
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-emerald-700">practice</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            mock exam
          </h1>
          <p className="text-sm text-slate-600">
            a timed practice exam mixing questions from all five ap modules.
          </p>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <div className="grid gap-3 text-sm leading-6 text-slate-700">
            <p>
              <span className="font-semibold text-slate-950">format:</span> 20
              multiple-choice questions — 4 from each of the 5 ap modules, shuffled.
            </p>
            <p>
              <span className="font-semibold text-slate-950">time limit:</span> 40
              minutes. the exam auto-submits when time runs out.
            </p>
            <p>
              <span className="font-semibold text-slate-950">scoring:</span> each
              question is worth the same. skipped questions score zero, so answer
              everything before time is up.
            </p>
            <p>
              <span className="font-semibold text-slate-950">honesty:</span> this is a
              practice run. close your notes and modules before you start.
            </p>
          </div>

          {savedProgress ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              you have an exam in progress with about{" "}
              <span className="font-semibold">{formatClock(savedProgress.remainingSeconds)}</span>{" "}
              left and {Object.keys(savedProgress.answers).length} question(s) answered.
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void startExam(savedProgress)}
                  className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  resume exam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.removeItem(STORAGE_KEY);
                    setSavedProgress(null);
                  }}
                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  discard and start fresh
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void startExam()}
            className="h-12 rounded-md bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "preparing exam..." : "start exam"}
          </button>
        </section>

        {pastAttempts.length > 0 ? (
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">past attempts</h2>
            <div className="mt-4 grid gap-2">
              {pastAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {new Date(attempt.submitted_at).toLocaleString()}
                  </span>
                  <span className="font-semibold text-slate-950">
                    {attempt.score}% ({attempt.correct_count}/{attempt.total_questions})
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  }

  if (phase === "results" && result) {
    const resultsByQuestion = new Map(
      result.results.map((item) => [item.question_id, item]),
    );

    return (
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-emerald-700">practice</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            exam results
          </h1>
        </div>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 text-center">
          <p className="text-6xl font-semibold text-slate-950">{result.score}%</p>
          <p className="text-sm text-slate-600">
            {result.correct_count} of {result.total_questions} correct
          </p>
          <div className="mx-auto flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard"
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold leading-10 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setExam(null);
                setAnswers({});
                setCurrentQuestion(0);
                setPhase("intro");
                void loadAttempts();
              }}
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              take another exam
            </button>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold text-slate-950">answer review</h2>
          {exam?.questions.map((question, index) => {
            const item = resultsByQuestion.get(question.id);
            const correctOption = question.options.find(
              (option) => option.id === item?.correct_option_id,
            );
            const selectedOption = question.options.find(
              (option) => option.id === item?.selected_option_id,
            );

            return (
              <article
                key={question.id}
                className={`rounded-md border p-4 ${
                  item?.is_correct
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p className="text-xs font-semibold text-slate-500">
                  question {index + 1} / {question.module_title}
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {question.question_text}
                </p>
                <div className="mt-3 grid gap-1 text-sm text-slate-700">
                  <p>
                    your answer:{" "}
                    {selectedOption ? selectedOption.option_text : "skipped"}
                  </p>
                  {!item?.is_correct && correctOption ? (
                    <p className="text-red-700">
                      correct answer: {correctOption.option_text}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-slate-500">loading exam...</p>
      </main>
    );
  }

  const question = exam.questions[currentQuestion];
  const isLastQuestion = currentQuestion === exam.questions.length - 1;
  const lowTime = remainingSeconds <= 300;

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">mock exam</p>
          <p className="text-sm text-slate-600">
            question {currentQuestion + 1} of {exam.total_questions} · {answeredCount}{" "}
            answered
          </p>
        </div>
        <p
          className={`rounded-md border px-4 py-2 font-mono text-lg font-semibold ${
            lowTime
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-950"
          }`}
        >
          {formatClock(remainingSeconds)}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{
            width: `${((currentQuestion + 1) / exam.total_questions) * 100}%`,
          }}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold text-slate-500">
          {question.module_title}
        </p>
        <h2 className="text-lg font-semibold leading-7 text-slate-950">
          {question.question_text}
        </h2>
        <div className="grid gap-2">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: option.id,
                  }))
                }
                className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {option.option_text}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((index) => index - 1)}
          className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          previous
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (
                answeredCount < exam.total_questions &&
                !window.confirm(
                  `you have ${exam.total_questions - answeredCount} unanswered question(s). submit anyway?`,
                )
              ) {
                return;
              }
              void submitExam();
            }}
            className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "submitting..." : "submit exam"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentQuestion((index) => index + 1)}
            className="h-10 rounded-md bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            next
          </button>
        )}
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {exam.questions.map((examQuestion, index) => {
          const isAnswered = Boolean(answers[examQuestion.id]);
          const isCurrent = index === currentQuestion;

          return (
            <button
              key={examQuestion.id}
              type="button"
              onClick={() => setCurrentQuestion(index)}
              className={`h-8 rounded-md border text-xs font-semibold transition ${
                isCurrent
                  ? "border-slate-950 bg-slate-950 text-white"
                  : isAnswered
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </main>
  );
}
