"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CourseLoader } from "../../components/course-loader";
import { renderContent } from "../../components/markdown-content";
import {
  ApiError,
  completeLesson,
  fetchMyCaseStudyResponse,
  fetchLesson,
  fetchLessonQuiz,
  fetchLessonQuizAttempts,
  fetchMyProgress,
  fetchPracticeCases,
  fetchUnits,
  submitCaseStudyResponse,
  type CaseStudyResponse,
  submitQuiz,
  type Lesson,
  type PracticeCase,
  type ProgressSummary,
  type Quiz,
  type QuizAttemptDetail,
  type QuizSubmitResult,
  type Unit,
  type QuizQuestion,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;
  const loadAssessment = useCallback(
    async (token: string) => {
      const [lesson, units, practiceCases] = await Promise.all([
        fetchLesson(lessonId, token),
        fetchUnits(token),
        fetchPracticeCases(lessonId, token).catch(() => [] as PracticeCase[]),
      ]);

      return { lesson, units, practiceCases };
    },
    [lessonId],
  );

  return (
    <CourseLoader load={loadAssessment}>
      {({
        lesson,
        units,
        practiceCases,
      }: {
        lesson: Lesson;
        units: Unit[];
        practiceCases: PracticeCase[];
      }) => {
        const assessmentPath = findAssessmentPath(units, lesson.id);

        return (
        <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link href="/units" className="font-medium text-slate-700 hover:text-slate-950">
              module {assessmentPath?.unit.order_index ?? ""}
            </Link>{" "}
            / {lesson.title}
          </nav>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <article className="rounded-md border border-slate-200 bg-white p-5 sm:p-7 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <div className="border-b border-slate-100 pb-5">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  {lesson.lesson_type}
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
                  {lesson.title}
                </h1>
                {lesson.points ? (
                  <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {lesson.points} points
                  </span>
                ) : null}
                {lesson.video_url ? (
                  <a
                    href={lesson.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    open video resource
                  </a>
                ) : null}
              </div>

              <div className="mt-6 grid gap-5">{renderContent(lesson.content)}</div>
            </article>

            <div className="grid gap-6">
              <AssessmentWorkPanel lesson={lesson} units={units} />
              <PracticeCasesLink lessonId={lessonId} cases={practiceCases} />
            </div>
          </div>
        </main>
        );
      }}
    </CourseLoader>
  );
}

function flattenAssessments(units: Unit[]) {
  return units.flatMap((unit) =>
    unit.modules
      .filter((module) => module.title.toLowerCase() === "topic assessments")
      .flatMap((module) =>
        module.lessons.map((lesson) => ({
          unit,
          lesson,
        })),
      ),
  );
}

function findAssessmentPath(units: Unit[], lessonId: number) {
  return flattenAssessments(units).find((entry) => entry.lesson.id === lessonId);
}

function AssessmentWorkPanel({ lesson, units }: { lesson: Lesson; units: Unit[] }) {
  const lessonId = lesson.id.toString();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptDetail[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [writtenResponse, setWrittenResponse] = useState<CaseStudyResponse | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [showQuizReview, setShowQuizReview] = useState(false);
  const [showPsetReview, setShowPsetReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [psetError, setPsetError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizError, setQuizError] = useState("");
  const quizFormRef = useRef<HTMLDivElement | null>(null);

  const isComplete = useMemo(
    () =>
      progress?.lesson_progress.some(
        (entry) => entry.lesson_id.toString() === lessonId && entry.completed,
      ) ?? false,
    [lessonId, progress],
  );
  const hasQuizAttempt = useMemo(
    () =>
      Boolean(
        quiz &&
          progress?.quiz_attempts.some((attempt) => attempt.quiz_id === quiz.id),
      ),
    [progress, quiz],
  );
  const latestQuizAttempt = useMemo(
    () => quizAttempts[0] ?? null,
    [quizAttempts],
  );
  const latestQuizScore = useMemo(() => {
    if (latestQuizAttempt) {
      return latestQuizAttempt.score;
    }

    if (result) {
      return result.score;
    }

    return quiz
      ? progress?.quiz_attempts.find((attempt) => attempt.quiz_id === quiz.id)?.score ?? null
      : null;
  }, [latestQuizAttempt, progress, quiz, result]);
  const assessments = useMemo(() => flattenAssessments(units), [units]);
  const currentAssessmentIndex = assessments.findIndex(
    (entry) => entry.lesson.id === lesson.id,
  );
  const nextAssessment = assessments[currentAssessmentIndex + 1]?.lesson;
  const currentModule = assessments[currentAssessmentIndex]?.unit;
  const completionState = isComplete
    ? "complete"
    : hasQuizAttempt || result || writtenResponse
      ? "in progress"
      : "not started";
  const hasResponseChanged = responseText.trim() !== (writtenResponse?.response_text ?? "");
  const activeQuestionIndex =
    quiz && quiz.questions.length
      ? Math.min(currentQuestionIndex, quiz.questions.length - 1)
      : 0;
  const answeredQuestionCount = quiz
    ? quiz.questions.filter((question) => selectedAnswers[question.id] !== undefined).length
    : 0;

  const loadLearningState = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [progressData, quizData, responseData, attemptData] = await Promise.all([
        fetchMyProgress(token),
        fetchLessonQuiz(lessonId, token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) {
            return null;
          }

          throw caughtError;
        }),
        fetchMyCaseStudyResponse(lessonId, token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) {
            return null;
          }

          throw caughtError;
        }),
        fetchLessonQuizAttempts(lessonId, token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) {
            return [];
          }

          throw caughtError;
        }),
      ]);

      setProgress(progressData);
      setQuiz(quizData);
      setQuizAttempts(attemptData);
      setWrittenResponse(responseData);
      setResponseText(responseData?.response_text ?? "");
      setIsEditingResponse(!responseData);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "could not load quiz");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLearningState();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLearningState]);

  async function handleSubmitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (responseText.trim().length < 20) {
      setPsetError("write at least 20 characters for the pset response");
      return;
    }

    setPsetError("");
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await submitCaseStudyResponse(
        lessonId,
        { response_text: responseText.trim() },
        token,
      );
      setWrittenResponse(response);
      setIsEditingResponse(false);
      // assessments without a quiz complete on the written response alone
      if (!quiz || hasQuizAttempt || result) {
        await completeLesson(lessonId, token);
        setProgress(await fetchMyProgress(token));
      }
      setMessage(
        !quiz || hasQuizAttempt || result
          ? "written response submitted. assessment is now complete."
          : "written response submitted. submit the quiz to complete this assessment.",
      );
    } catch (caughtError) {
      setPsetError(
        caughtError instanceof Error ? caughtError.message : "could not submit response",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quiz) {
      return;
    }

    const firstUnansweredIndex = quiz.questions.findIndex(
      (question) => selectedAnswers[question.id] === undefined,
    );

    if (firstUnansweredIndex >= 0) {
      // jump back to the first unanswered question so the fix is obvious
      setCurrentQuestionIndex(firstUnansweredIndex);
      setQuizError("answer every question before submitting.");
      quizFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setQuizError("");

    try {
      const quizResult = await submitQuiz(
        quiz.id,
        {
          answers: quiz.questions.map((question) => ({
            question_id: question.id,
            option_id: selectedAnswers[question.id],
          })),
        },
        token,
      );
      // keep the result so per-question correct/incorrect highlighting stays
      // visible; retaking the quiz clears it
      setResult(quizResult);
      setIsRetakingQuiz(false);
      setShowQuizReview(false);
      if (writtenResponse) {
        await completeLesson(lessonId, token);
      }
      setProgress(await fetchMyProgress(token));
      setQuizAttempts(
        await fetchLessonQuizAttempts(lessonId, token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) {
            return [];
          }

          throw caughtError;
        }),
      );
      setMessage(
        writtenResponse
          ? "quiz submitted. assessment is now complete."
          : "quiz submitted. submit your written response to complete this assessment.",
      );
    } catch (caughtError) {
      setQuizError(caughtError instanceof Error ? caughtError.message : "could not submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
        loading assessment work...
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 sm:p-7">
      <div
        className={`rounded-md border p-4 ${
          isComplete
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className={`text-xs font-semibold uppercase ${
                isComplete ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {completionState}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {isComplete ? "assessment complete" : "submission checklist"}
            </h2>
            {!isComplete ? null : (
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {quiz
                  ? "quiz and written response are both saved."
                  : "your written response is saved."}
              </p>
            )}
          </div>
          <div className="grid min-w-44 gap-2 text-sm">
            <span className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-slate-700">
              quiz
              <strong
                className={`font-semibold ${
                  !quiz
                    ? "text-slate-500"
                    : hasQuizAttempt || result
                      ? "text-emerald-700"
                      : "text-slate-950"
                }`}
              >
                {!quiz ? "n/a" : hasQuizAttempt || result ? "submitted" : "pending"}
              </strong>
            </span>
            <span className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-slate-700">
              written response
              <strong
                className={`font-semibold ${
                  writtenResponse ? "text-emerald-700" : "text-slate-950"
                }`}
              >
                {writtenResponse ? "submitted" : "pending"}
              </strong>
            </span>
          </div>
        </div>
      </div>

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

      <form onSubmit={handleSubmitResponse} className="grid gap-4 border-t border-slate-100 pt-5">
        <div>
          <p className="text-sm font-semibold text-emerald-700">written response</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            written evidence response
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            answer the questions in the case study. cite scenario evidence
            and explain your reasoning like an AP free-response practice answer.
          </p>
        </div>

        {writtenResponse && !isEditingResponse ? (
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  submitted for teacher review
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  your latest written response is saved. view it or revise it
                  before teacher review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPsetReview(!showPsetReview)}
                className="min-h-10 w-fit min-w-36 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold leading-5 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                {showPsetReview ? "hide response" : "view response"}
              </button>
            </div>
            {showPsetReview ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">
                  your submitted response
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-800">
                  {writtenResponse.response_text}
                </p>
                {writtenResponse.feedback ? (
                  <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">teacher feedback</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{writtenResponse.feedback}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsEditingResponse(true);
                  setMessage("");
                  setError("");
                  setPsetError("");
                }}
                className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                revise response
              </button>
            </div>
          </div>
        ) : (
          <>
            {psetError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {psetError}
              </div>
            ) : null}
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={6}
              className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="write your response here... (ctrl+enter to submit)"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              {writtenResponse ? (
                <button
                  type="button"
                  onClick={() => {
                    setResponseText(writtenResponse.response_text);
                    setIsEditingResponse(false);
                    setMessage("");
                    setError("");
                    setPsetError("");
                  }}
                  className="h-10 w-fit rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  cancel
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || (Boolean(writtenResponse) && !hasResponseChanged)}
                className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting
                  ? "submitting..."
                  : writtenResponse
                    ? "submit revision"
                    : "submit response"}
              </button>
            </div>
          </>
        )}
      </form>

      {quiz ? (
        <form onSubmit={handleSubmitQuiz} className="grid gap-5 border-t border-slate-100 pt-5">
          <div>
            <p className="text-sm font-semibold text-emerald-700">quiz</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{quiz.title}</h2>
            {quiz.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{quiz.description}</p>
            ) : null}
          </div>

          {latestQuizScore !== null && !result && !isRetakingQuiz ? (
            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    latest quiz score: {latestQuizScore}%
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    your latest attempt is saved. retake the quiz to submit a new
                    score for this case study.
                  </p>
                </div>
                {latestQuizAttempt ? (
                  <button
                    type="button"
                    onClick={() => setShowQuizReview(!showQuizReview)}
                    className="min-h-10 w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold leading-5 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    {showQuizReview ? "hide response" : "view response"}
                  </button>
                ) : null}
              </div>
              {showQuizReview ? (
                <div className="grid gap-3">
                  {latestQuizAttempt && latestQuizAttempt.answers.length > 0 ? (
                    quiz.questions.map((question) => {
                      const answer = latestQuizAttempt.answers.find(
                        (entry) => entry.question_id === question.id,
                      );

                      return (
                        <QuizQuestionCard
                          key={question.id}
                          question={question}
                          selectedOptionId={answer?.selected_option_id ?? null}
                          correctOptionId={answer?.correct_option_id ?? null}
                          isSubmitted
                        />
                      );
                    })
                  ) : (
                    <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                      answer history was not stored for this older attempt. retake
                      the quiz to save reviewable answers.
                    </p>
                  )}
                </div>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsRetakingQuiz(true);
                    setSelectedAnswers({});
                    setResult(null);
                    setShowQuizReview(false);
                    setCurrentQuestionIndex(0);
                    setMessage("");
                    setError("");
                    setQuizError("");
                  }}
                  className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  retake quiz
                </button>
              </div>
            </div>
          ) : null}

          {!result && (latestQuizScore === null || isRetakingQuiz) && quiz.questions.length ? (
            <div ref={quizFormRef} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  question {activeQuestionIndex + 1} of {quiz.questions.length}
                </p>
                <div className="flex items-center gap-2">
                  {quiz.questions.map((question, index) => {
                    const isAnswered = selectedAnswers[question.id] !== undefined;
                    const isCurrent = index === activeQuestionIndex;

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => {
                          setQuizError("");
                          setCurrentQuestionIndex(index);
                        }}
                        aria-label={`go to question ${index + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          isCurrent
                            ? "bg-slate-950 ring-2 ring-slate-300"
                            : isAnswered
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {answeredQuestionCount}/{quiz.questions.length} answered
                </p>
              </div>

              <div className="min-h-[14rem]">
                <QuizQuestionCard
                  question={quiz.questions[activeQuestionIndex]}
                  selectedOptionId={
                    selectedAnswers[quiz.questions[activeQuestionIndex].id] ?? null
                  }
                  correctOptionId={null}
                  isSubmitted={false}
                  onSelect={(optionId) => {
                    setQuizError("");
                    setSelectedAnswers({
                      ...selectedAnswers,
                      [quiz.questions[activeQuestionIndex].id]: optionId,
                    });
                  }}
                />
              </div>

              {quizError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {quizError}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => {
                    setQuizError("");
                    setCurrentQuestionIndex((index) => Math.max(0, index - 1));
                  }}
                  className="h-10 w-fit rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  back
                </button>
                {activeQuestionIndex >= quiz.questions.length - 1 ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting ? "submitting..." : "submit quiz"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizError("");
                      setCurrentQuestionIndex((index) =>
                        Math.min(quiz.questions.length - 1, index + 1),
                      );
                    }}
                    className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    next
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                score: {result.score}% ({result.correct_count}/{result.total_questions})
              </p>
              <p className="text-sm leading-6 text-emerald-800">
                {writtenResponse
                  ? "quiz submitted. your written response is already saved, so this assessment is now complete."
                  : "quiz submitted. submit your written response above to complete this assessment."}
              </p>
            </div>
          ) : null}

          {result ? (
            <p className="text-sm font-semibold text-slate-950">review your answers</p>
          ) : null}

          {result
            ? quiz.questions.map((question) => {
                const questionResult = result.results.find(
                  (entry) => entry.question_id === question.id,
                );

                return (
                  <QuizQuestionCard
                    key={question.id}
                    question={question}
                    selectedOptionId={selectedAnswers[question.id] ?? null}
                    correctOptionId={questionResult?.correct_option_id ?? null}
                    isSubmitted
                  />
                );
              })
            : null}

          {result ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRetakingQuiz(true);
                  setSelectedAnswers({});
                  setResult(null);
                  setShowQuizReview(false);
                  setCurrentQuestionIndex(0);
                  setMessage("");
                  setError("");
                  setQuizError("");
                }}
                className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                retake quiz
              </button>
            </div>
          ) : null}
        </form>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          no quiz has been added to this assessment yet.
        </div>
      )}

      {isComplete ? (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={currentModule ? `/units/${currentModule.id}` : "/assessments"}
            className="flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            back to module
          </Link>
          {nextAssessment ? (
            <Link
              href={`/lessons/${nextAssessment.id}`}
              className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              next assessment
            </Link>
          ) : (
            <Link
              href="/units"
              className="flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              all modules
            </Link>
          )}
        </div>
      ) : null}
    </section>
  );
}

function QuizQuestionCard({
  question,
  selectedOptionId,
  correctOptionId,
  isSubmitted,
  onSelect,
}: {
  question: QuizQuestion;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  isSubmitted: boolean;
  onSelect?: (optionId: number) => void;
}) {
  return (
    <fieldset className="rounded-md border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-950">
        {question.order_index}. {question.question_text}
      </legend>
      <div className="mt-3 grid gap-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = correctOptionId === option.id;
          const isWrongSelection =
            isSubmitted && isSelected && correctOptionId !== option.id;

          return (
            <label
              key={option.id}
              className={`flex gap-3 rounded-md border px-3 py-2 text-sm ${
                isCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : isWrongSelection
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-slate-200 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                disabled={isSubmitted}
                onChange={() => onSelect?.(option.id)}
              />
              {option.option_text}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PracticeCasesLink({ lessonId, cases }: { lessonId: string; cases: PracticeCase[] }) {
  if (!cases.length) {
    return null;
  }

  return (
    <Link
      href={`/lessons/${lessonId}/practice`}
      className="group grid gap-2 rounded-md border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 sm:p-6"
    >
      <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
        practice
      </span>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">extra case studies</h2>
      <p className="text-sm leading-6 text-slate-600">
        {cases.length === 1 ? "one more case study" : `${cases.length} more case studies`}{" "}
        on this topic for extra reps. it is ungraded, and your draft saves in this browser
        only.
      </p>
      <span className="mt-1 text-sm font-semibold text-emerald-700 transition group-hover:text-emerald-800">
        open practice cases →
      </span>
    </Link>
  );
}
