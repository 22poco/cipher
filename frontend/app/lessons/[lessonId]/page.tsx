"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { CourseLoader } from "../../components/course-loader";
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

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${index}`} className="font-semibold text-slate-950">
          {match[1]}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i-${index}`} className="italic">
          {match[2] ?? match[3]}
        </em>,
      );
    }
    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function splitTopLevel(text: string, regex: RegExp): string[] {
  const parts: string[] = [];
  let last = 0;
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(match[0]);
    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

const HEADING_SIZES: Record<string, string> = {
  h2: "mt-2 text-xl font-semibold text-slate-950",
  h3: "mt-2 text-lg font-semibold text-slate-950",
  h4: "text-base font-semibold text-slate-900",
};

function MarkdownBlock({ block, blockKey }: { block: string; blockKey: string }) {
  const lines = block.split("\n");
  const first = lines[0].trim();

  if (first.startsWith("```")) {
    const body = lines
      .slice(1)
      .join("\n")
      .replace(/```\s*$/, "");
    return (
      <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{body.replace(/\s+$/, "")}</code>
      </pre>
    );
  }

  if (/^\|.*\|/.test(first)) {
    const rows = lines.filter((line) => /^\s*\|/.test(line));
    const cells = rows.map((row) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

    if (
      cells.length >= 2 &&
      cells[1].every((cell) => /^:?-{2,}:?$/.test(cell) || cell === "")
    ) {
      const [head, , ...body] = cells;

      return (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                {head.map((cell, index) => (
                  <th key={`${blockKey}-h-${index}`} className="px-3 py-2 font-semibold">
                    {renderInline(cell, `${blockKey}-h-${index}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`${blockKey}-r-${rowIndex}`} className="border-t border-slate-100">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${blockKey}-r-${rowIndex}-c-${cellIndex}`}
                      className="px-3 py-2 align-top text-slate-700"
                    >
                      {renderInline(cell, `${blockKey}-r-${rowIndex}-c-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  if (/^#{2,4} /.test(first)) {
    const level = first.match(/^#+/)![0].length;
    const tag = (['h2', 'h3', 'h4'][level - 2] ?? 'h4') as 'h2' | 'h3' | 'h4';
    const Tag = tag;

    return (
      <Tag className={HEADING_SIZES[tag]}>
        {renderInline(first.replace(/^#+ /, ''), `${blockKey}-hdg`)}
      </Tag>
    );
  }

  if (lines.some((line) => /^[-*] /.test(line.trim()))) {
    const items = lines.filter((line) => /^[-*] /.test(line.trim()));

    return (
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        {items.map((item, index) => (
          <li key={`${blockKey}-li-${index}`}>
            {renderInline(item.trim().replace(/^[-*] /, ''), `${blockKey}-li-${index}`)}
          </li>
        ))}
      </ul>
    );
  }

  if (/^\d+\. /.test(first)) {
    const items = lines.filter((line) => /^\d+\. /.test(line.trim()));

    return (
      <ol className="list-decimal space-y-2 pl-5 text-slate-700">
        {items.map((item, index) => (
          <li key={`${blockKey}-ol-${index}`}>
            {renderInline(item.trim().replace(/^\d+\. /, ''), `${blockKey}-ol-${index}`)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="leading-7 text-slate-700">{renderInline(block.trim(), `${blockKey}-p`)}</p>
  );
}

function renderContent(content: string | null) {
  if (!content) {
    return <p className="text-sm text-slate-600">assessment content is not ready yet.</p>;
  }

  return splitTopLevel(content, /```[\s\S]*?(?:```|$)/g)
    .flatMap((piece, pieceIndex) =>
      piece.includes("```")
        ? [{ text: piece, key: `c-${pieceIndex}` }]
        : piece
            .split(/\n{2,}/)
            .map((part, partIndex) => ({
              text: part,
              key: `t-${pieceIndex}-${partIndex}`,
            })),
    )
    .filter((entry) => entry.text.trim())
    .map((entry) => <MarkdownBlock key={entry.key} block={entry.text} blockKey={entry.key} />);
}

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

          <AssessmentWorkPanel lesson={lesson} units={units} />
          <PracticeCasesSection cases={practiceCases} />
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
                ? quiz
                  ? "quiz and written response are both saved."
                  : "your written response is saved."
                : quiz
                  ? "complete both parts below: the written response and the quiz attempt."
                  : "submit your written response below to complete this case study."}
            </p>
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
            answer the questions in the case study above. cite scenario evidence
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
                    setMessage("");
                    setError("");
                  }}
                  className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  retake quiz
                </button>
              </div>
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
              <p className="text-sm leading-6 text-emerald-800">
                {writtenResponse
                  ? "quiz submitted. your written response is already saved, so this assessment is now complete."
                  : "quiz submitted. submit your written response above to complete this assessment."}
              </p>
            </div>
          ) : null}

          {result ? (
            <div className="flex justify-end">
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

const practiceDraftKey = (practiceCaseId: number) =>
  `cipher_practice_draft_${practiceCaseId}`;

function PracticeCasesSection({ cases }: { cases: PracticeCase[] }) {
  const [openCaseIds, setOpenCaseIds] = useState<number[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  // practice work is ungraded, so drafts stay in this browser rather than
  // becoming a response a teacher has to review
  useEffect(() => {
    const saved: Record<number, string> = {};

    for (const practiceCase of cases) {
      const draft = window.localStorage.getItem(practiceDraftKey(practiceCase.id));

      if (draft) {
        saved[practiceCase.id] = draft;
      }
    }

    setDrafts(saved);
  }, [cases]);

  if (!cases.length) {
    return null;
  }

  const toggleCase = (practiceCaseId: number) => {
    setOpenCaseIds((current) =>
      current.includes(practiceCaseId)
        ? current.filter((id) => id !== practiceCaseId)
        : [...current, practiceCaseId],
    );
  };

  const saveDraft = (practiceCaseId: number, text: string) => {
    setDrafts((current) => ({ ...current, [practiceCaseId]: text }));
    window.localStorage.setItem(practiceDraftKey(practiceCaseId), text);
  };

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 sm:p-7">
      <div className="border-b border-slate-100 pb-5">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          practice
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
          more case studies for this topic
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          extra case studies on the same topic, for as many reps as you want. these are not
          graded and nothing here is sent to your teacher, so use them to drill the skill
          before or after the graded assessment. your draft is saved in this browser only.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        {cases.map((practiceCase) => {
          const isOpen = openCaseIds.includes(practiceCase.id);

          return (
            <div key={practiceCase.id} className="rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => toggleCase(practiceCase.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    practice case {practiceCase.variant.toLowerCase()}
                    {drafts[practiceCase.id] ? " · draft saved" : ""}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-950">
                    {practiceCase.title}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {practiceCase.points ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {practiceCase.points} points
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold text-slate-500">
                    {isOpen ? "hide" : "open"}
                  </span>
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-100 px-4 py-4">
                  <div className="grid gap-5">{renderContent(practiceCase.content)}</div>

                  <div className="mt-5 grid gap-2">
                    <label
                      htmlFor={`practice-response-${practiceCase.id}`}
                      className="text-sm font-semibold text-slate-950"
                    >
                      practice response
                    </label>
                    <textarea
                      id={`practice-response-${practiceCase.id}`}
                      value={drafts[practiceCase.id] ?? ""}
                      onChange={(event) => saveDraft(practiceCase.id, event.target.value)}
                      rows={8}
                      className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      placeholder="answer the questions in this case study. this draft stays in this browser."
                    />
                    <p className="text-xs text-slate-500">
                      draft only, with no submission step. ask your teacher for feedback on
                      practice work if you want it graded.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
