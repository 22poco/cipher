"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProtectedPage } from "../../components/protected-page";
import {
  fetchMockExamFrq,
  fetchMockExamPaper,
  startMockExam,
  submitMockExam,
  type MockExamFrq,
  type MockExamPaper,
  type MockExamSubmitResult,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  clearSavedProgress,
  effectiveRemainingSeconds,
  examTitle,
  formatClock,
  isExamKey,
  readSavedProgress,
  storageKeyFor,
  type SavedProgress,
} from "../progress";

type Phase = "intro" | "taking-mcq" | "taking-frq" | "submitting" | "results";

type RunnerState = {
  phase: Phase;
  paper: MockExamPaper | null;
  frq: MockExamFrq | null;
  answers: Record<number, number>;
  frqResponse: string;
  currentQuestion: number;
  remainingSeconds: number;
  savedResume: SavedProgress | null;
  result: MockExamSubmitResult | null;
  error: string;
};

const initialState: RunnerState = {
  phase: "intro",
  paper: null,
  frq: null,
  answers: {},
  frqResponse: "",
  currentQuestion: 0,
  remainingSeconds: 0,
  savedResume: null,
  result: null,
  error: "",
};

export default function MockExamRunnerPage() {
  return (
    <ProtectedPage>
      {() => <MockExamRunner />}
    </ProtectedPage>
  );
}

function MockExamRunner() {
  const params = useParams<{ examKey: string }>();
  const router = useRouter();
  const examKey = params?.examKey ?? "";

  if (!isExamKey(examKey)) {
    return (
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-950">exam not found</h1>
        <p className="text-sm text-slate-600">
          that exam key does not exist. head back to the exam hub to pick one.
        </p>
        <Link
          href="/mock-exam"
          className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold leading-10 text-white transition hover:bg-slate-800"
        >
          back to exams
        </Link>
      </main>
    );
  }

  return <Runner key={examKey} examKey={examKey} onExit={() => router.push("/mock-exam")} />;
}

function Runner({
  examKey,
  onExit,
}: {
  examKey: string;
  onExit: () => void;
}) {
  const [state, setState] = useState<RunnerState>(initialState);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtRef = useRef(0);
  const submitRef = useRef<() => Promise<void>>(async () => {});

  // ref synced in an effect below so timers and shortcuts read fresh state
  const stateRef = useRef(state);

  const patch = useCallback((updates: Partial<RunnerState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  // on first load: look for saved progress for this exam and load the frq
  // sources (needed before the frq phase can render).
  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    const saved = readSavedProgress(examKey);
    let cancelled = false;

    (async () => {
      try {
        const frq = await fetchMockExamFrq(token);
        if (!cancelled) {
          patch({ frq, savedResume: saved });
        }
      } catch {
        // frq sources are fetched again at phase start if this failed
        if (!cancelled) {
          patch({ savedResume: saved });
        }
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examKey, patch]);

  const persist = useCallback(
    (snapshot: RunnerState) => {
      if (!snapshot.paper) {
        return;
      }
      const progress: SavedProgress = {
        examKey,
        seed: snapshot.paper.seed,
        answers: Object.fromEntries(
          Object.entries(snapshot.answers).map(([id, optionId]) => [id, optionId]),
        ),
        frqResponse: snapshot.frqResponse.trim() ? snapshot.frqResponse : null,
        remainingSeconds: snapshot.remainingSeconds,
        savedAt: Date.now(),
        phase: snapshot.phase === "taking-frq" ? "taking-frq" : "taking-mcq",
      };
      window.localStorage.setItem(storageKeyFor(examKey), JSON.stringify(progress));
      window.dispatchEvent(new Event("cipher-mock-exam-progress-change"));
    },
    [examKey],
  );

  const submitExam = useCallback(async () => {
    const token = getToken();
    const snapshot = stateRef.current;
    if (!token || !snapshot.paper) {
      return;
    }

    setIsSubmitting(true);
    patch({ error: "" });

    try {
      const submitResult = await submitMockExam(
        examKey,
        {
          seed: snapshot.paper.seed,
          answers: Object.entries(snapshot.answers).map(([questionId, optionId]) => ({
            question_id: Number(questionId),
            option_id: optionId,
          })),
          duration_seconds: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
          frq_response: snapshot.frqResponse.trim() ? snapshot.frqResponse.trim() : null,
        },
        token,
      );
      clearSavedProgress(examKey);
      window.dispatchEvent(new Event("cipher-mock-exam-progress-change"));
      patch({ phase: "results", result: submitResult });
    } catch (caughtError) {
      patch({
        error:
          caughtError instanceof Error ? caughtError.message : "could not submit the exam",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [examKey, patch]);

  // keep refs in sync via effects so timers and shortcuts read fresh state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    submitRef.current = submitExam;
  }, [submitExam]);

  const beginWithPaper = useCallback(
    (paper: MockExamPaper, resume: SavedProgress | null) => {
      const resumeMatches = resume && resume.seed === paper.seed;
      const restoredAnswers = resumeMatches
        ? Object.fromEntries(
            Object.entries(resume.answers).map(([id, optionId]) => [Number(id), optionId]),
          )
        : {};
      const remaining = resumeMatches
        ? Math.max(1, effectiveRemainingSeconds(resume))
        : (paper.time_limit_seconds ?? 0);

      startedAtRef.current = Date.now();
      patch({
        paper,
        answers: restoredAnswers,
        frqResponse: resumeMatches && resume.frqResponse ? resume.frqResponse : "",
        currentQuestion: 0,
        remainingSeconds: remaining,
        phase: resumeMatches && resume.phase === "taking-frq" ? "taking-frq" : "taking-mcq",
        result: null,
        error: "",
      });

      const initialSnapshot: RunnerState = {
        phase: resumeMatches && resume.phase === "taking-frq" ? "taking-frq" : "taking-mcq",
        paper,
        frq: null,
        answers: restoredAnswers,
        frqResponse: resumeMatches && resume.frqResponse ? resume.frqResponse : "",
        currentQuestion: 0,
        remainingSeconds: remaining,
        savedResume: null,
        result: null,
        error: "",
      };
      persist(initialSnapshot);
    },
    [patch, persist],
  );

  const startExam = useCallback(
    async (resume: SavedProgress | null) => {
      const token = getToken();
      if (!token) {
        return;
      }

      setIsPreparing(true);
      patch({ error: "" });

      try {
        let paper: MockExamPaper;
        if (resume) {
          // resume rebuilds the exact same paper from its seed; if that fails
          // (bank changed server-side) fall back to a fresh paper.
          try {
            paper = await fetchMockExamPaper(examKey, resume.seed, token);
          } catch {
            paper = await startMockExam(examKey, token);
          }
        } else {
          paper = await startMockExam(examKey, token);
        }

        const frq = stateRef.current.frq ?? (await fetchMockExamFrq(token));
        patch({ frq });
        beginWithPaper(paper, resume);
      } catch (caughtError) {
        patch({
          error:
            caughtError instanceof Error ? caughtError.message : "could not load the exam",
        });
      } finally {
        setIsPreparing(false);
      }
    },
    [beginWithPaper, examKey, patch],
  );

  // master countdown: runs through both phases and auto-submits at zero.
  const active = state.phase === "taking-mcq" || state.phase === "taking-frq";
  useEffect(() => {
    if (!active) {
      return;
    }

    const interval = window.setInterval(() => {
      setState((current) => {
        if (current.phase !== "taking-mcq" && current.phase !== "taking-frq") {
          return current;
        }
        if (current.remainingSeconds <= 1) {
          window.clearInterval(interval);
          void submitRef.current();
          return { ...current, remainingSeconds: 0 };
        }
        return { ...current, remainingSeconds: current.remainingSeconds - 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [active]);

  // persist the in-flight attempt (answers, frq draft, remaining time)
  useEffect(() => {
    if (!active || !state.paper) {
      return;
    }
    persist(state);
  }, [active, state, persist]);

  // lockdown: hide the app top bar while taking the exam
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.setAttribute("data-exam-lockdown", "on");
    } else {
      root.removeAttribute("data-exam-lockdown");
    }
    window.dispatchEvent(new Event("exam-lockdown-change"));
    return () => {
      root.removeAttribute("data-exam-lockdown");
      window.dispatchEvent(new Event("exam-lockdown-change"));
    };
  }, [active]);

  // warn before leaving mid-exam: the timer keeps running regardless
  useEffect(() => {
    if (!active) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);

  // keyboard navigation between mcq questions
  useEffect(() => {
    if (state.phase !== "taking-mcq" || !state.paper) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        setState((current) => {
          if (!current.paper || current.phase !== "taking-mcq") {
            return current;
          }
          const max = current.paper.questions.length - 1;
          const next =
            event.key === "ArrowRight"
              ? Math.min(max, current.currentQuestion + 1)
              : Math.max(0, current.currentQuestion - 1);
          return { ...current, currentQuestion: next };
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, state.paper]);

  const quitExam = useCallback(() => {
    // quitting keeps the attempt: progress stays saved and the timer keeps
    // running while the student is away, exactly like the lockdown app.
    persist(stateRef.current);
    onExit();
  }, [onExit, persist]);

  if (state.phase === "intro") {
    return (
      <IntroScreen
        examKey={examKey}
        savedResume={state.savedResume}
        isPreparing={isPreparing}
        error={state.error}
        onStart={(resume) => void startExam(resume)}
        onDiscard={() => {
          clearSavedProgress(examKey);
          window.dispatchEvent(new Event("cipher-mock-exam-progress-change"));
          patch({ savedResume: null });
        }}
      />
    );
  }

  if (state.phase === "results" && state.result && state.paper) {
    return (
      <ResultsScreen
        examKey={examKey}
        result={state.result}
        paper={state.paper}
        onRetake={() => {
          clearSavedProgress(examKey);
          setState({ ...initialState, frq: state.frq });
          window.dispatchEvent(new Event("cipher-mock-exam-progress-change"));
        }}
        onExit={onExit}
      />
    );
  }

  if (!state.paper) {
    return (
      <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-16 sm:px-6">
        <p className="text-sm text-slate-500">loading exam...</p>
      </main>
    );
  }

  const isFrq = state.phase === "taking-frq";
  const mcqTotal = state.paper.questions.length;
  const answeredCount = Object.keys(state.answers).length;
  const lowTime = state.remainingSeconds <= 300;
  const question = state.paper.questions[state.currentQuestion];

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {examTitle(examKey)}
          </p>
          <p className="text-sm text-slate-600">
            {isFrq
              ? `section ii — free response · ${answeredCount}/${mcqTotal} mcq answered`
              : `section i — multiple choice · question ${state.currentQuestion + 1} of ${mcqTotal} · ${answeredCount} answered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={`rounded-md border px-4 py-2 font-mono text-lg font-semibold tabular-nums ${
              lowTime
                ? "animate-pulse border-red-300 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-950"
            }`}
          >
            {formatClock(state.remainingSeconds)}
          </p>
          <button
            type="button"
            onClick={quitExam}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            quit
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold">
        <span
          className={`rounded-full px-3 py-1 ${
            !isFrq ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          1 · multiple choice
        </span>
        <span className="h-px flex-1 bg-slate-200" />
        <span
          className={`rounded-full px-3 py-1 ${
            isFrq ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          2 · device security analysis frq
        </span>
      </div>

      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {!isFrq && question ? (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{
                width: `${((state.currentQuestion + 1) / mcqTotal) * 100}%`,
              }}
            />
          </div>

          <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              question {state.currentQuestion + 1}
            </p>
            <h2 className="text-lg font-semibold leading-7 text-slate-950">
              {question.question_text}
            </h2>
            <div className="grid gap-2">
              {question.options.map((option, index) => {
                const isSelected = state.answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        answers: { ...current.answers, [question.id]: option.id },
                      }))
                    }
                    className={`flex items-start gap-3 rounded-md border px-4 py-3 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      {"ABCD"[index] ?? "?"}
                    </span>
                    <span>{option.option_text}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={state.currentQuestion === 0}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  currentQuestion: Math.max(0, current.currentQuestion - 1),
                }))
              }
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              previous
            </button>

            {state.currentQuestion === mcqTotal - 1 ? (
              <button
                type="button"
                onClick={() => {
                  const unanswered = mcqTotal - answeredCount;
                  if (
                    unanswered > 0 &&
                    !window.confirm(
                      `you have ${unanswered} unanswered question(s). continue to the free-response section anyway? you can come back before submitting.`,
                    )
                  ) {
                    return;
                  }
                  void (async () => {
                    const token = getToken();
                    if (token && !state.frq) {
                      try {
                        const frq = await fetchMockExamFrq(token);
                        patch({ frq });
                      } catch {
                        // fall back to whatever we already have
                      }
                    }
                    patch({ phase: "taking-frq" });
                  })();
                }}
                className="h-10 rounded-md bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                continue to frq &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    currentQuestion: Math.min(mcqTotal - 1, current.currentQuestion + 1),
                  }))
                }
                className="h-10 rounded-md bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                next
              </button>
            )}
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(20,minmax(0,1fr))]">
            {state.paper.questions.map((examQuestion, index) => {
              const isAnswered = Boolean(state.answers[examQuestion.id]);
              const isCurrent = index === state.currentQuestion;
              return (
                <button
                  key={examQuestion.id}
                  type="button"
                  onClick={() =>
                    setState((current) => ({ ...current, currentQuestion: index }))
                  }
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

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (
                !window.confirm(
                  "submit the exam now? you have not started the free-response section yet.",
                )
              ) {
                return;
              }
              void submitRef.current();
            }}
            className="justify-self-start text-xs font-semibold text-slate-500 underline transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "submitting..." : "submit without the frq"}
          </button>
        </>
      ) : (
        <FrqPhase
          frq={state.frq}
          response={state.frqResponse}
          onResponseChange={(frqResponse) => patch({ frqResponse })}
          onBackToMcq={() => patch({ phase: "taking-mcq" })}
          onSubmit={() => {
            if (
              !window.confirm(
                "submit the exam? your teacher will grade the frq against the 14-point rubric.",
              )
            ) {
              return;
            }
            void submitRef.current();
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  );
}

function IntroScreen({
  examKey,
  savedResume,
  isPreparing,
  error,
  onStart,
  onDiscard,
}: {
  examKey: string;
  savedResume: SavedProgress | null;
  isPreparing: boolean;
  error: string;
  onStart: (resume: SavedProgress | null) => void;
  onDiscard: () => void;
}) {
  const stillRunning =
    savedResume && effectiveRemainingSeconds(savedResume) > 0
      ? effectiveRemainingSeconds(savedResume) <= 90
      : false;

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">practice</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          {examTitle(examKey)}
        </h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-slate-950">before you start:</span> close
          your notes and modules. the exam runs in lockdown mode — the site navigation
          disappears and the clock starts as soon as you continue.
        </p>
        <p>
          <span className="font-semibold text-slate-950">quitting:</span> you can quit
          mid-exam, but the timer keeps ticking and your progress is saved for when you
          return. skipping questions scores zero.
        </p>
        {savedResume ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
            attempt in progress — about{" "}
            <span className="font-semibold">
              {formatClock(effectiveRemainingSeconds(savedResume))}
            </span>{" "}
            left ({Object.keys(savedResume.answers).length} answered). the timer kept
            running while you were away.
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPreparing}
                onClick={() => onStart(savedResume)}
                className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPreparing ? "loading..." : "resume exam"}
              </button>
              <button
                type="button"
                disabled={isPreparing}
                onClick={onDiscard}
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                discard and start fresh
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        disabled={isPreparing}
        onClick={() => onStart(null)}
        className={`h-12 rounded-md px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
          stillRunning
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {isPreparing
          ? "preparing exam..."
          : stillRunning
            ? "start a new attempt (old attempt is still counting down)"
            : "start exam"}
      </button>
    </main>
  );
}

function FrqPhase({
  frq,
  response,
  onResponseChange,
  onBackToMcq,
  onSubmit,
  isSubmitting,
}: {
  frq: MockExamFrq | null;
  response: string;
  onResponseChange: (value: string) => void;
  onBackToMcq: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  if (!frq) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
        loading free-response sources...
      </section>
    );
  }

  return (
    <>
      <section className="rounded-md border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {frq.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{frq.prompt}</p>

        <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            sources ({frq.sources.length}) — open each one as you analyze
          </summary>
          <div className="mt-3 grid gap-3">
            {frq.sources.map((source) => (
              <details
                key={source.label}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {source.label}: {source.title}
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
                  {source.body}
                </pre>
              </details>
            ))}
          </div>
        </details>

        <div className="mt-4 grid gap-2">
          {frq.parts.map((part) => (
            <div
              key={part.label}
              className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
            >
              <span className="font-semibold uppercase text-slate-950">
                {part.label}:
              </span>{" "}
              <span className="whitespace-pre-line">{part.prompt}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-6">
        <label
          htmlFor="frq-response"
          className="text-sm font-semibold text-slate-950"
        >
          your response — label each part (a i, a ii, b i, ...) exactly like the question
        </label>
        <textarea
          id="frq-response"
          value={response}
          onChange={(event) => onResponseChange(event.target.value)}
          rows={16}
          placeholder={"a i. ...\na ii. ...\nb i. ...\n..."}
          className="w-full rounded-md border border-slate-300 p-3 font-mono text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="text-xs text-slate-500">
          {response.trim() ? response.trim().split(/\s+/).length : 0} words · the frq is
          worth 30% of the exam score once graded.
        </p>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBackToMcq}
          className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
        >
          &larr; back to multiple choice
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "submitting..." : "submit exam"}
        </button>
      </div>
    </>
  );
}

function ResultsScreen({
  examKey,
  result,
  paper,
  onRetake,
  onExit,
}: {
  examKey: string;
  result: MockExamSubmitResult;
  paper: MockExamPaper;
  onRetake: () => void;
  onExit: () => void;
}) {
  const resultsByQuestion = useMemo(
    () => new Map(result.results.map((item) => [item.question_id, item])),
    [result.results],
  );

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">practice</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          {examTitle(examKey)} — results
        </h1>
      </div>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 text-center">
        <p className="text-6xl font-semibold text-slate-950">{result.score}%</p>
        <p className="text-sm text-slate-600">
          {result.correct_count} of {result.total_questions} multiple-choice correct ·
          counts 70% toward your final score
        </p>
        <p className="mx-auto max-w-md text-sm text-slate-600">
          your frq response was saved for teacher grading — it is worth the other 30%.
          you will see the combined score on your dashboard once it is reviewed.
        </p>
        <div className="mx-auto flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            back to exams
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            take a new attempt
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-slate-950">mcq answer review</h2>
        {paper.questions.map((question, index) => {
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
                question {index + 1}
              </p>
              <p className="mt-1 font-semibold text-slate-950">
                {question.question_text}
              </p>
              <div className="mt-3 grid gap-1 text-sm text-slate-700">
                <p>
                  your answer: {selectedOption ? selectedOption.option_text : "skipped"}
                </p>
                {!item?.is_correct && correctOption ? (
                  <p className="text-red-700">correct answer: {correctOption.option_text}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
