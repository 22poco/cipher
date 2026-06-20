"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { CourseLoader } from "../../components/course-loader";
import { fetchLesson, type Lesson } from "@/lib/api";

function renderContent(content: string | null) {
  if (!content) {
    return <p className="text-sm text-slate-600">lesson content is not ready yet.</p>;
  }

  return content.split("\n\n").map((paragraph) => {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      return null;
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
            <Link href="/units" className="font-medium text-slate-700 hover:text-slate-950">
              units
            </Link>{" "}
            / lesson {lesson.order_index}
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
        </main>
      )}
    </CourseLoader>
  );
}
