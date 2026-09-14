"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CourseLoader } from "../../components/course-loader";
import {
  ApiError,
  completeLesson,
  fetchMyCaseStudyResponse,
  fetchLesson,
  fetchLessonQuiz,
  fetchLessonQuizAttempts,
  fetchMyProgress,
  fetchUnits,
  submitCaseStudyResponse,
  type CaseStudyResponse,
  submitQuiz,
  type Lesson,
  type ProgressSummary,
  type Quiz,
  type QuizAttemptDetail,
  type QuizSubmitResult,
  type Unit,
  type QuizQuestion,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

function renderContent(content: string | null) {
  if (!content) {
    return <p className="text-sm text-slate-600">assessment content is not ready yet.</p>;
  }

  return content.split("\n\n").map((paragraph) => {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      return null;
    }

    if (
      [
        "scenario/context",
        "evidence",
        "why this matters",
        "pset response",
      ].includes(trimmed.toLowerCase())
    ) {
      return (
        <h2 key={trimmed} className="pt-2 text-lg font-semibold text-slate-950">
          {trimmed}
        </h2>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <ul key={trimmed} className="list-disc space-y-2 pl-5 text-slate-700">
          {trimmed.split("\n").map((item) => (
            <li key={item}>{item.replace("- ", "")}</li>
          ))}
        </ul>
      );
    }

    if (/^\d+\./.test(trimmed)) {
      return (
        <ol key={trimmed} className="list-decimal space-y-2 pl-5 text-slate-700">
          {trimmed.split("\n").map((item) => (
            <li key={item}>{item.replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={trimmed} className="leading-7 text-slate-700">
        {trimmed}
      </p>
    );
  });
}

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;
  const loadAssessment = useCallback(
    async (token: string) => {
      const [lesson, units] = await Promise.all([
        fetchLesson(lessonId, token),
        fetchUnits(token),
      ]);

      return { lesson, units };
    },
    [lessonId],
  );

  return (
    <CourseLoader load={loadAssessment}>
      {({ lesson, units }: { lesson: Lesson; units: Unit[] }) => {
        const assessmentPath = findAssessmentPath(units, lesson.id);

        return (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link href="/units" className="font-medium text-slate-700 hover:text-slate-950">
              module {assessmentPath?.unit.order_index ?? ""}
            </Link>{" "}
            / {lesson.title}
          </nav>

          <article className="rounded-md border border-slate-200 bg-white p-5 sm:p-7">
            <div className="border-b border-slate-100 pb-5">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {lesson.lesson_type}
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
                {lesson.title}
              </h1>
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

          <AssessmentWorkPanel lesson={lesson} units={units} />
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
      setError("write at least 20 characters for the pset response");
      return;
    }

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
      if (hasQuizAttempt || result) {
        await completeLesson(lessonId, token);
        setProgress(await fetchMyProgress(token));
      }
      setMessage(
        hasQuizAttempt || result
          ? "pset response submitted. assessment is now complete."
          : "pset response submitted. submit the quiz to complete this assessment.",
      );
    } catch (caughtError) {
      setError(
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

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      setError("answer every question before submitting");
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

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
      setResult(quizResult);
      setIsRetakingQuiz(false);
      setShowQuizReview(true);
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
      setSelectedAnswers({});
      setResult(null);
      setMessage(
        writtenResponse
          ? "quiz submitted. assessment is now complete."
          : "quiz submitted. submit the pset response to complete this assessment.",
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "could not submit quiz");
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
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isComplete
                ? "your quiz attempt and written response are saved."
                : "submit both required parts to complete this case study."}
            </p>
          </div>
          <div className="grid min-w-44 gap-2 text-sm">
            <span className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-slate-700">
              quiz
              <strong className="font-semibold text-slate-950">
                {hasQuizAttempt || result ? "submitted" : "pending"}
              </strong>
            </span>
            <span className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-slate-700">
              pset
              <strong className="font-semibold text-slate-950">
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
              <button
                type="button"
                onClick={() => {
                  setIsRetakingQuiz(true);
                  setSelectedAnswers({});
                  setResult(null);
                  setShowQuizReview(false);
                  setMessage("");
                  setError("");
                }}
                className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                retake quiz
              </button>
            </div>
          ) : null}

          {(latestQuizScore === null || result || isRetakingQuiz) ? quiz.questions.map((question) => {
            const questionResult = result?.results.find(
              (entry) => entry.question_id === question.id,
            );

            return (
              <QuizQuestionCard
                key={question.id}
                question={question}
                selectedOptionId={selectedAnswers[question.id] ?? null}
                correctOptionId={questionResult?.correct_option_id ?? null}
                isSubmitted={Boolean(result)}
                onSelect={(optionId) =>
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [question.id]: optionId,
                  })
                }
              />
            );
          }) : null}

          {result ? (
            <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                score: {result.score}% ({result.correct_count}/{result.total_questions})
              </p>
            </div>
          ) : latestQuizScore === null || isRetakingQuiz ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "submitting..." : "submit quiz"}
            </button>
          ) : null}
        </form>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          no quiz has been added to this assessment yet.
        </div>
      )}

      <form onSubmit={handleSubmitResponse} className="grid gap-4 border-t border-slate-100 pt-5">
        <div>
          <p className="text-sm font-semibold text-emerald-700">pset response</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            written evidence response
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            answer the pset prompt from the assessment above. cite scenario evidence
            and explain your reasoning like an AP free-response practice answer.
          </p>
        </div>

        {writtenResponse && !isEditingResponse ? (
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  submitted for admin review
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
            <button
              type="button"
              onClick={() => {
                setIsEditingResponse(true);
                setMessage("");
                setError("");
              }}
              className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              revise response
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="write your response here..."
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
