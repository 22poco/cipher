"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CourseLoader } from "../../../components/course-loader";
import { renderContent } from "../../../components/markdown-content";
import {
  fetchLesson,
  fetchPracticeCases,
  type Lesson,
  type PracticeCase,
} from "@/lib/api";

const practiceDraftKey = (practiceCaseId: number) =>
  `cipher_practice_draft_${practiceCaseId}`;

export default function PracticeCasesPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const loadAssessment = useCallback(
    async (token: string) => {
      const [lesson, practiceCases] = await Promise.all([
        fetchLesson(lessonId, token),
        fetchPracticeCases(lessonId, token).catch(() => [] as PracticeCase[]),
      ]);

      return { lesson, practiceCases };
    },
    [lessonId],
  );

  return (
    <CourseLoader load={loadAssessment}>
      {({
        lesson,
        practiceCases,
      }: {
        lesson: Lesson;
        practiceCases: PracticeCase[];
      }) => (
        <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6">
          <nav className="text-sm text-slate-500">
            <Link
              href={`/lessons/${lesson.id}`}
              className="font-medium text-slate-700 hover:text-slate-950"
            >
              {lesson.title}
            </Link>{" "}
            / extra case studies
          </nav>

          <header className="rounded-md border border-slate-200 bg-white p-5 sm:p-7">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              practice
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
              extra case studies
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              more case studies on the same topic, for as many reps as you want. none of
              this is graded and nothing here reaches your teacher, so use it to drill the
              skill before or after the graded assessment. your draft saves in this browser
              only.
            </p>
          </header>

          {practiceCases.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
              no extra case studies for this topic yet.{" "}
              <Link
                href={`/lessons/${lesson.id}`}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                back to the assessment
              </Link>
            </div>
          ) : (
            practiceCases.map((practiceCase) => (
              <PracticeCaseCard key={practiceCase.id} practiceCase={practiceCase} />
            ))
          )}
        </main>
      )}
    </CourseLoader>
  );
}

function PracticeCaseCard({ practiceCase }: { practiceCase: PracticeCase }) {
  const [draft, setDraft] = useState("");

  // practice work is ungraded, so the draft stays in this browser rather than
  // becoming a response a teacher has to review
  useEffect(() => {
    setDraft(window.localStorage.getItem(practiceDraftKey(practiceCase.id)) ?? "");
  }, [practiceCase.id]);

  function saveDraft(text: string) {
    setDraft(text);
    window.localStorage.setItem(practiceDraftKey(practiceCase.id), text);
  }

  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 sm:p-7">
      <div className="border-b border-slate-100 pb-5">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          practice case {practiceCase.variant.toLowerCase()}
          {draft ? " · draft saved" : ""}
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
          {practiceCase.title}
        </h2>
        {practiceCase.points ? (
          <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {practiceCase.points} points
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">{renderContent(practiceCase.content)}</div>

      <div className="mt-6 grid gap-2 border-t border-slate-100 pt-5">
        <label
          htmlFor={`practice-response-${practiceCase.id}`}
          className="text-sm font-semibold text-slate-950"
        >
          practice response
        </label>
        <textarea
          id={`practice-response-${practiceCase.id}`}
          value={draft}
          onChange={(event) => saveDraft(event.target.value)}
          rows={8}
          className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="answer the questions in this case study. this draft stays in this browser."
        />
        <p className="text-xs text-slate-500">
          draft only, with no submission step — nothing is sent to your teacher. ask them
          for feedback on practice work if you want it graded.
        </p>
      </div>
    </article>
  );
}
