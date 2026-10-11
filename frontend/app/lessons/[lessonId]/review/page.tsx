"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { CourseLoader } from "../../../components/course-loader";
import {
  ApiError,
  fetchLesson,
  fetchLessonQuiz,
  fetchLessonQuizAttempts,
  fetchMyCaseStudyResponse,
  type Lesson,
  type Quiz,
  type QuizAttemptDetail,
} from "@/lib/api";

export default function AssessmentReviewPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const loadReview = useCallback(
    async (token: string) => {
      const [lesson, quiz, response, attempts] = await Promise.all([
        fetchLesson(lessonId, token),
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

      return { lesson, quiz, response, attempts };
    },
    [lessonId],
  );

  return (
    <CourseLoader load={loadReview}>
      {({
        lesson,
        quiz,
        response,
        attempts,
      }: {
        lesson: Lesson;
        quiz: Quiz | null;
        response: CaseStudyResponseLike | null;
        attempts: QuizAttemptDetail[];
      }) => (
        <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link
              href={`/lessons/${lesson.id}`}
              className="font-medium text-slate-700 hover:text-slate-950"
            >
              {lesson.title}
            </Link>{" "}
            / review
          </nav>

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">review</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              {lesson.title}
            </h1>
          </div>

          {response ? (
            <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-950">written response</h2>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="h-10 w-fit rounded-md border border-slate-300 px-4 text-sm font-semibold leading-10 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  revise response
                </Link>
              </div>
              <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-800">
                {response.response_text}
              </p>
              {response.feedback ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    teacher feedback
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{response.feedback}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {quiz && attempts[0] ? (
            <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{quiz.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    latest score: {attempts[0].score}%
                  </p>
                </div>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="h-10 w-fit rounded-md border border-slate-300 px-4 text-sm font-semibold leading-10 text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  retake quiz
                </Link>
              </div>
              <div className="grid gap-3">
                {attempts[0].answers.length > 0
                  ? attempts[0].answers.map((answer, index) => (
                      <AnswerCard key={answer.id} answer={answer} index={index} />
                    ))
                  : (
                    <p className="text-sm text-slate-500">
                      answer history was not stored for this attempt.
                    </p>
                  )}
              </div>
            </section>
          ) : null}
        </main>
      )}
    </CourseLoader>
  );
}

type CaseStudyResponseLike = {
  response_text: string;
  feedback: string | null;
};

function AnswerCard({
  answer,
  index,
}: {
  answer: {
    question_text: string;
    selected_option_text: string;
    correct_option_text: string | null;
    is_correct: boolean;
  };
  index: number;
}) {
  return (
    <div
      className={`rounded-md border p-4 text-sm ${
        answer.is_correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <p className="font-semibold text-slate-950">
        {index + 1}. {answer.question_text}
      </p>
      <p className="mt-2 text-slate-700">your answer: {answer.selected_option_text}</p>
      {!answer.is_correct && answer.correct_option_text ? (
        <p className="mt-1 text-emerald-800">
          correct answer: {answer.correct_option_text}
        </p>
      ) : null}
    </div>
  );
}
