"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";

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

// topic code used to find the matching sample solution on the graded page;
// practice content ends with its own answer guidance in the teacher material,
// but students only ever see the practice-side sample.
const practiceSampleGuide = (content: string) =>
  content
    .split("## questions")
    .pop()
    ?.trim() ?? "";

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
      }) => {
        if (practiceCases.length === 0) {
          return (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
              no extra case studies for this topic yet.{" "}
              <Link
                href={`/lessons/${lesson.id}`}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                back to the assessment
              </Link>
            </div>
          );
        }

        return <PracticeWorkspace lesson={lesson} practiceCases={practiceCases} />;
      }}
    </CourseLoader>
  );
}

function PracticeWorkspace({
  lesson,
  practiceCases,
}: {
  lesson: Lesson;
  practiceCases: PracticeCase[];
}) {
  const [selectedId, setSelectedId] = useState(practiceCases[0].id);
  const selected =
    practiceCases.find((c) => c.id === selectedId) ?? practiceCases[0];

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link
          href="/extra"
          className="font-medium text-slate-700 hover:text-slate-950"
        >
          extra
        </Link>{" "}
        / {lesson.title}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <PracticeCasePanel
          key={selected.id}
          lessonId={lesson.id}
          practiceCase={selected}
          variants={practiceCases}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
        <SampleSolutionPanel
          lessonId={lesson.id}
          practiceCase={selected}
        />
      </div>
    </main>
  );
}

function PracticeCasePanel({
  lessonId,
  practiceCase,
  variants,
  selectedId,
  onSelect,
}: {
  lessonId: number;
  practiceCase: PracticeCase;
  variants: PracticeCase[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  // practice work is ungraded, so the draft stays in this browser rather than
  // becoming a response a teacher has to review; the key prop on this panel
  // guarantees a fresh instance per case, so state resets without effects
  const [draft, setDraft] = useState(
    () => window.localStorage.getItem(practiceDraftKey(practiceCase.id)) ?? "",
  );
  const [submittedDraft, setSubmittedDraft] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  function saveDraft(text: string) {
    setDraft(text);
    window.localStorage.setItem(practiceDraftKey(practiceCase.id), text);
  }

  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 sm:p-7 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                variant.id === selectedId
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              practice case {variant.variant.toLowerCase()}
            </button>
          ))}
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {draft ? "draft saved" : "ungraded"}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
          {practiceCase.title}
        </h1>
        {practiceCase.points ? (
          <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {practiceCase.points} points
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">{renderContent(practiceCase.content)}</div>

      <div className="mt-6 grid gap-2 border-t border-slate-100 pt-5">
        {submittedDraft !== null && !isEditing ? (
          <div className="grid gap-3">
            <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                response saved in this browser. compare it with the sample
                solution on the right, or revise it.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-10 w-fit rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  revise response
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-7 text-slate-800">
              {submittedDraft}
            </p>
          </div>
        ) : (
          <>
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
            <div className="flex justify-end">
              <button
                type="button"
                disabled={draft.trim().length < 20}
                onClick={() => {
                  saveDraft(draft.trim());
                  setSubmittedDraft(draft.trim());
                  setIsEditing(false);
                }}
                className="h-10 w-fit rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                finish and compare
              </button>
            </div>
            <p className="text-xs text-slate-500">
              nothing is sent to your teacher — this browser only.
            </p>
          </>
        )}
      </div>

      <Link
        href={`/lessons/${lessonId}`}
        className="mt-5 w-fit text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        back to {lessonId ? "the assessment" : ""} →
      </Link>
    </article>
  );
}

function SampleSolutionPanel({
  lessonId,
  practiceCase,
}: {
  lessonId: number;
  practiceCase: PracticeCase;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 sm:p-7">
      <div className="border-b border-slate-100 pb-5">
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          sample solution
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-normal text-slate-950">
          how a strong response reads
        </h2>
        {practiceCase.points ? (
          <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {practiceCase.points} points
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid gap-5">{renderContent(practiceSampleGuide(practiceCase.content))}</div>
      <p className="mt-6 text-xs text-slate-500">
        write your own response first — then compare it line by line with this
        one. want it graded? the graded case study for this topic is{" "}
        <Link
          href={`/lessons/${lessonId}`}
          className="font-semibold text-emerald-700 hover:text-emerald-800"
        >
          here
        </Link>
        .
      </p>
    </article>
  );
}
