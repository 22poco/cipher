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
  fetchMyProgress,
  submitCaseStudyResponse,
  type CaseStudyResponse,
  submitQuiz,
  type Lesson,
  type ProgressSummary,
  type Quiz,
  type QuizSubmitResult,
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
  const loadLesson = useCallback(
    (token: string) => fetchLesson(lessonId, token),
    [lessonId],
  );

  return (
    <CourseLoader load={loadLesson}>
      {(lesson: Lesson) => (
        <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link href="/assessments" className="font-medium text-slate-700 hover:text-slate-950">
              assessments
            </Link>{" "}
            / assessment {lesson.order_index}
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

          <AssessmentWorkPanel lessonId={lesson.id.toString()} />
        </main>
      )}
    </CourseLoader>
  );
}

function AssessmentWorkPanel({ lessonId }: { lessonId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [writtenResponse, setWrittenResponse] = useState<CaseStudyResponse | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
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

  const loadLearningState = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [progressData, quizData, responseData] = await Promise.all([
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
      ]);

      setProgress(progressData);
      setQuiz(quizData);
      setWrittenResponse(responseData);
      setResponseText(responseData?.response_text ?? "");
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

  async function handleCompleteLesson() {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      await completeLesson(lessonId, token);
      setProgress(await fetchMyProgress(token));
      setMessage("assessment marked complete");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not update progress",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
      setMessage("pset response submitted");
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
      setProgress(await fetchMyProgress(token));
      setMessage("quiz submitted");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">progress</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {isComplete ? "assessment complete" : "mark this assessment complete"}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleCompleteLesson}
          disabled={isSubmitting || isComplete}
          className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isComplete ? "completed" : "complete assessment"}
        </button>
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

          {quiz.questions.map((question) => {
            const questionResult = result?.results.find(
              (entry) => entry.question_id === question.id,
            );

            return (
              <fieldset key={question.id} className="rounded-md border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-950">
                  {question.order_index}. {question.question_text}
                </legend>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => {
                    const isSelected = selectedAnswers[question.id] === option.id;
                    const isCorrect = questionResult?.correct_option_id === option.id;
                    const isWrongSelection =
                      questionResult &&
                      isSelected &&
                      questionResult.correct_option_id !== option.id;

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
                          disabled={Boolean(result)}
                          onChange={() =>
                            setSelectedAnswers({
                              ...selectedAnswers,
                              [question.id]: option.id,
                            })
                          }
                        />
                        {option.option_text}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {result ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                score: {result.score}% ({result.correct_count}/{result.total_questions})
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "submitting..." : "submit quiz"}
            </button>
          )}
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

        <textarea
          value={responseText}
          onChange={(event) => setResponseText(event.target.value)}
          rows={6}
          className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="write your response here..."
        />

        {writtenResponse ? (
          <p className="text-sm text-slate-600">
            submitted. you can revise and resubmit this response.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "submitting..." : writtenResponse ? "update response" : "submit response"}
        </button>
      </form>
    </section>
  );
}
