"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ProtectedPage } from "../components/protected-page";
import {
  ApiError,
  createLesson,
  createModule,
  createQuiz,
  createQuizQuestion,
  createUnit,
  deleteLesson,
  deleteModule,
  deleteQuiz,
  deleteQuizQuestion,
  deleteUnit,
  fetchAdminReviewDashboard,
  fetchAdminLessonQuiz,
  fetchUnits,
  fetchLesson,
  updateQuiz,
  updateQuizOption,
  updateQuizQuestion,
  updateLesson,
  updateModule,
  updateAdminPsetReview,
  updateUnit,
  type AdminGradebookRow,
  type AdminPsetResponse,
  type AdminQuizAttempt,
  type AdminReviewDashboard,
  type CourseModule,
  type LessonPayload,
  type LessonSummary,
  type LessonType,
  type ModulePayload,
  type QuizAdmin,
  type QuizAttemptAnswer,
  type QuizAdminQuestion,
  type Unit,
  type UnitPayload,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

const lessonTypes: LessonType[] = ["reading", "video", "case_study", "code_activity"];

type EditTarget =
  | { type: "unit"; id: number }
  | { type: "module"; id: number }
  | { type: "lesson"; id: number }
  | null;

type UnitFormState = {
  title: string;
  description: string;
  order_index: string;
};

type ModuleFormState = UnitFormState & {
  unit_id: string;
};

type LessonFormState = {
  module_id: string;
  title: string;
  content: string;
  video_url: string;
  lesson_type: LessonType;
  order_index: string;
};

type QuizFormState = {
  lesson_id: string;
  title: string;
  description: string;
};

type QuizQuestionFormState = {
  question_text: string;
  order_index: string;
  options: [string, string, string, string];
  correct_index: string;
};

const emptyUnitForm: UnitFormState = {
  title: "",
  description: "",
  order_index: "1",
};

const emptyModuleForm: ModuleFormState = {
  unit_id: "",
  title: "",
  description: "",
  order_index: "1",
};

const emptyLessonForm: LessonFormState = {
  module_id: "",
  title: "",
  content: "",
  video_url: "",
  lesson_type: "reading",
  order_index: "1",
};

const emptyQuizForm: QuizFormState = {
  lesson_id: "",
  title: "",
  description: "",
};

const emptyQuizQuestionForm: QuizQuestionFormState = {
  question_text: "",
  order_index: "1",
  options: ["", "", "", ""],
  correct_index: "0",
};

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function unitPayload(form: UnitFormState): UnitPayload {
  return {
    title: form.title.trim(),
    description: toNullableText(form.description),
    order_index: Number(form.order_index),
  };
}

function modulePayload(form: ModuleFormState): ModulePayload {
  return {
    unit_id: Number(form.unit_id),
    title: form.title.trim(),
    description: toNullableText(form.description),
    order_index: Number(form.order_index),
  };
}

function lessonPayload(form: LessonFormState): LessonPayload {
  return {
    module_id: Number(form.module_id),
    title: form.title.trim(),
    content: toNullableText(form.content),
    video_url: toNullableText(form.video_url),
    lesson_type: form.lesson_type,
    order_index: Number(form.order_index),
  };
}

function quizPayload(form: QuizFormState) {
  return {
    lesson_id: Number(form.lesson_id),
    title: form.title.trim(),
    description: toNullableText(form.description),
  };
}

export default function AdminPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {(user) => <AdminDashboard email={user.email} />}
    </ProtectedPage>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [reviewDashboard, setReviewDashboard] = useState<AdminReviewDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);
  const [quizForm, setQuizForm] = useState<QuizFormState>(emptyQuizForm);
  const [questionForm, setQuestionForm] =
    useState<QuizQuestionFormState>(emptyQuizQuestionForm);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAdmin | null>(null);
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);

  const modules = useMemo(
    () => units.flatMap((unit) => unit.modules.map((module) => ({ ...module, unit }))),
    [units],
  );
  const lessons = useMemo(
    () =>
      units.flatMap((unit) =>
        unit.modules.flatMap((module) =>
          module.lessons.map((lesson) => ({ ...lesson, module, unit })),
        ),
      ),
    [units],
  );

  const loadAdminData = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [unitData, reviewData] = await Promise.all([
        fetchUnits(token),
        fetchAdminReviewDashboard(token),
      ]);
      setUnits(unitData);
      setReviewDashboard(reviewData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not load admin data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAdminData]);

  const loadSelectedQuiz = useCallback(async () => {
    const token = getToken();

    if (!token || !quizForm.lesson_id) {
      setSelectedQuiz(null);
      return;
    }

    try {
      const quiz = await fetchAdminLessonQuiz(Number(quizForm.lesson_id), token);
      setSelectedQuiz(quiz);
      setQuizForm({
        lesson_id: quiz.lesson_id.toString(),
        title: quiz.title,
        description: quiz.description ?? "",
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        setSelectedQuiz(null);
        return;
      }

      showError(caughtError);
    }
  }, [quizForm.lesson_id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSelectedQuiz();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadSelectedQuiz]);

  function showResult(text: string) {
    setMessage(text);
    setError("");
  }

  function showError(caughtError: unknown) {
    setMessage("");

    if (caughtError instanceof ApiError || caughtError instanceof Error) {
      setError(caughtError.message);
      return;
    }

    setError("something went wrong");
  }

  function resetForms() {
    setEditTarget(null);
    setUnitForm(emptyUnitForm);
    setModuleForm({
      ...emptyModuleForm,
      unit_id: units[0]?.id.toString() ?? "",
    });
    setLessonForm({
      ...emptyLessonForm,
      module_id: modules[0]?.id.toString() ?? "",
    });
  }

  function resetQuizQuestionForm() {
    setEditQuestionId(null);
    setQuestionForm(emptyQuizQuestionForm);
  }

  async function refreshReviewDashboard() {
    const token = getToken();

    if (!token) {
      return;
    }

    setReviewDashboard(await fetchAdminReviewDashboard(token));
  }

  async function togglePsetReview(response: AdminPsetResponse, feedback?: string | null) {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      await updateAdminPsetReview(response.id, { reviewed: !response.reviewed, feedback }, token);
      await refreshReviewDashboard();
      showResult(response.reviewed ? "pset marked pending" : "pset marked reviewed");
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      if (editTarget?.type === "unit") {
        await updateUnit(editTarget.id, unitPayload(unitForm), token);
        showResult("ap module updated");
      } else {
        await createUnit(unitPayload(unitForm), token);
        showResult("ap module created");
      }

      resetForms();
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      if (editTarget?.type === "module") {
        await updateModule(editTarget.id, modulePayload(moduleForm), token);
        showResult("assessment set updated");
      } else {
        await createModule(modulePayload(moduleForm), token);
        showResult("assessment set created");
      }

      resetForms();
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      if (editTarget?.type === "lesson") {
        await updateLesson(editTarget.id, lessonPayload(lessonForm), token);
        showResult("case study updated");
      } else {
        await createLesson(lessonPayload(lessonForm), token);
        showResult("case study created");
      }

      resetForms();
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      if (selectedQuiz) {
        const quiz = await updateQuiz(selectedQuiz.id, quizPayload(quizForm), token);
        setSelectedQuiz(quiz);
        showResult("quiz updated");
      } else {
        const quiz = await createQuiz(quizPayload(quizForm), token);
        setSelectedQuiz(quiz);
        showResult("quiz created");
      }
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitQuizQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token || !selectedQuiz) {
      return;
    }

    setIsSaving(true);

    try {
      if (editQuestionId) {
        const question = selectedQuiz.questions.find((item) => item.id === editQuestionId);

        if (!question) {
          return;
        }

        await updateQuizQuestion(
          question.id,
          {
            question_text: questionForm.question_text.trim(),
            question_type: "multiple_choice",
            order_index: Number(questionForm.order_index),
          },
          token,
        );

        await Promise.all(
          question.options.slice(0, 4).map((option, index) =>
            updateQuizOption(
              option.id,
              {
                option_text: questionForm.options[index].trim(),
                is_correct: questionForm.correct_index === index.toString(),
              },
              token,
            ),
          ),
        );
        showResult("quiz question updated");
      } else {
        await createQuizQuestion(
          {
            quiz_id: selectedQuiz.id,
            question_text: questionForm.question_text.trim(),
            question_type: "multiple_choice",
            order_index: Number(questionForm.order_index),
            options: questionForm.options.map((option, index) => ({
              option_text: option.trim(),
              is_correct: questionForm.correct_index === index.toString(),
            })),
          },
          token,
        );
        showResult("quiz question created");
      }

      resetQuizQuestionForm();
      await loadSelectedQuiz();
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeUnit(unit: Unit) {
    if (!confirm(`delete ap module "${unit.title}" and all of its assessment sets and case studies?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteUnit(unit.id, token);
      showResult("module deleted");
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeModule(module: CourseModule) {
    if (!confirm(`delete assessment set "${module.title}" and all of its case studies?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteModule(module.id, token);
      showResult("assessment set deleted");
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeLesson(lesson: LessonSummary) {
    if (!confirm(`delete case study "${lesson.title}"?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteLesson(lesson.id, token);
      showResult("case study deleted");
      await loadAdminData();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeQuiz() {
    if (!selectedQuiz || !confirm(`delete quiz "${selectedQuiz.title}"?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteQuiz(selectedQuiz.id, token);
      setSelectedQuiz(null);
      setQuizForm({ ...emptyQuizForm, lesson_id: quizForm.lesson_id });
      resetQuizQuestionForm();
      showResult("quiz deleted");
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeQuizQuestion(question: QuizAdminQuestion) {
    if (!confirm(`delete question "${question.question_text}"?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteQuizQuestion(question.id, token);
      resetQuizQuestionForm();
      showResult("quiz question deleted");
      await loadSelectedQuiz();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  function editUnit(unit: Unit) {
    setEditTarget({ type: "unit", id: unit.id });
    setUnitForm({
      title: unit.title,
      description: unit.description ?? "",
      order_index: unit.order_index.toString(),
    });
  }

  function editModule(module: CourseModule) {
    setEditTarget({ type: "module", id: module.id });
    setModuleForm({
      unit_id: module.unit_id.toString(),
      title: module.title,
      description: module.description ?? "",
      order_index: module.order_index.toString(),
    });
  }

  async function editLesson(lesson: LessonSummary) {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const fullLesson = await fetchLesson(lesson.id.toString(), token);

      setEditTarget({ type: "lesson", id: lesson.id });
      setLessonForm({
        module_id: fullLesson.module_id.toString(),
        title: fullLesson.title,
        content: fullLesson.content ?? "",
        video_url: fullLesson.video_url ?? "",
        lesson_type: fullLesson.lesson_type as LessonType,
        order_index: fullLesson.order_index.toString(),
      });
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  function editQuizQuestion(question: QuizAdminQuestion) {
    const options = question.options.slice(0, 3);
    const correctIndex = Math.max(
      options.findIndex((option) => option.is_correct),
      0,
    );

    setEditQuestionId(question.id);
    setQuestionForm({
      question_text: question.question_text,
      order_index: question.order_index.toString(),
      options: [
        options[0]?.option_text ?? "",
        options[1]?.option_text ?? "",
        options[2]?.option_text ?? "",
        options[3]?.option_text ?? "",
      ],
      correct_index: correctIndex.toString(),
    });
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">admin dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          assessment admin
        </h1>
        <p className="text-sm text-slate-600">
          signed in as {email}. review student work and manage assessment structure here.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["ap modules", units.length],
          ["assessment sets", modules.length],
          ["case studies", lessons.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

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

      {reviewDashboard ? (
        <AdminReviewPanel
          dashboard={reviewDashboard}
          isSaving={isSaving}
          onTogglePsetReview={(response) => void togglePsetReview(response)}
        />
      ) : (
        <section className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
          loading review queue...
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <form
          onSubmit={submitUnit}
          className="min-w-0 rounded-md border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editTarget?.type === "unit" ? "edit ap module" : "create ap module"}
          </h2>
          <div className="mt-4 grid gap-3">
            <TextField
              label="title"
              value={unitForm.title}
              onChange={(value) => setUnitForm({ ...unitForm, title: value })}
              required
            />
            <TextArea
              label="description"
              value={unitForm.description}
              onChange={(value) => setUnitForm({ ...unitForm, description: value })}
            />
            <TextField
              label="order"
              type="number"
              value={unitForm.order_index}
              onChange={(value) => setUnitForm({ ...unitForm, order_index: value })}
              required
            />
          </div>
          <FormActions
            isSaving={isSaving}
            onCancel={resetForms}
            showCancel={editTarget?.type === "unit"}
          />
        </form>

        <form
          onSubmit={submitModule}
          className="min-w-0 rounded-md border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editTarget?.type === "module" ? "edit assessment set" : "create assessment set"}
          </h2>
          <div className="mt-4 grid gap-3">
            <SelectField
              label="ap module"
              value={moduleForm.unit_id}
              onChange={(value) => setModuleForm({ ...moduleForm, unit_id: value })}
              required
            >
              <option value="">select ap module</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </SelectField>
            <TextField
              label="title"
              value={moduleForm.title}
              onChange={(value) => setModuleForm({ ...moduleForm, title: value })}
              required
            />
            <TextArea
              label="description"
              value={moduleForm.description}
              onChange={(value) => setModuleForm({ ...moduleForm, description: value })}
            />
            <TextField
              label="order"
              type="number"
              value={moduleForm.order_index}
              onChange={(value) => setModuleForm({ ...moduleForm, order_index: value })}
              required
            />
          </div>
          <FormActions
            isSaving={isSaving}
            onCancel={resetForms}
            showCancel={editTarget?.type === "module"}
          />
        </form>

        <form
          onSubmit={submitLesson}
          className="min-w-0 rounded-md border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editTarget?.type === "lesson" ? "edit case study" : "create case study"}
          </h2>
          <div className="mt-4 grid gap-3">
            <SelectField
              label="assessment set"
              value={lessonForm.module_id}
              onChange={(value) => setLessonForm({ ...lessonForm, module_id: value })}
              required
            >
              <option value="">select assessment set</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.unit.title} / {module.title}
                </option>
              ))}
            </SelectField>
            <TextField
              label="title"
              value={lessonForm.title}
              onChange={(value) => setLessonForm({ ...lessonForm, title: value })}
              required
            />
            <SelectField
              label="type"
              value={lessonForm.lesson_type}
              onChange={(value) =>
                setLessonForm({ ...lessonForm, lesson_type: value as LessonType })
              }
              required
            >
              {lessonTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectField>
            <TextField
              label="video url"
              value={lessonForm.video_url}
              onChange={(value) => setLessonForm({ ...lessonForm, video_url: value })}
            />
            <TextField
              label="order"
              type="number"
              value={lessonForm.order_index}
              onChange={(value) => setLessonForm({ ...lessonForm, order_index: value })}
              required
            />
            <TextArea
              label="content"
              value={lessonForm.content}
              onChange={(value) => setLessonForm({ ...lessonForm, content: value })}
              rows={8}
            />
            {lessonForm.content.trim() ? (
              <LessonPreview content={lessonForm.content} />
            ) : null}
          </div>
          <FormActions
            isSaving={isSaving}
            onCancel={resetForms}
            showCancel={editTarget?.type === "lesson"}
          />
        </form>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">current structure</h2>
            <p className="mt-1 text-sm text-slate-600">
              changes here appear on student assessment pages after refresh.
            </p>
          </div>
          <Link
            href="/units"
            className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            view student pages
          </Link>
        </div>

        <div className="mt-5 grid gap-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">loading course structure...</p>
          ) : units.length === 0 ? (
            <p className="text-sm text-slate-500">no course content yet.</p>
          ) : (
            units.map((unit) => (
              <CourseStructureItem
                key={unit.id}
                unit={unit}
                onEditUnit={editUnit}
                onDeleteUnit={removeUnit}
                onEditModule={editModule}
                onDeleteModule={removeModule}
                onEditLesson={(lesson) => void editLesson(lesson)}
                onDeleteLesson={removeLesson}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">quiz management</h2>
            <p className="mt-1 text-sm text-slate-600">
              add or edit multiple-choice checks for case studies.
            </p>
          </div>
          {selectedQuiz ? (
            <button
              type="button"
              onClick={() => void removeQuiz()}
              className="w-fit rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-500"
            >
              delete quiz
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form onSubmit={submitQuiz} className="grid min-w-0 gap-3">
            <SelectField
              label="case study"
              value={quizForm.lesson_id}
              onChange={(value) =>
                setQuizForm({ ...emptyQuizForm, lesson_id: value })
              }
              required
            >
              <option value="">select case study</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.unit.title} / {lesson.module.title} / {lesson.title}
                </option>
              ))}
            </SelectField>
            <TextField
              label="quiz title"
              value={quizForm.title}
              onChange={(value) => setQuizForm({ ...quizForm, title: value })}
              required
            />
            <TextArea
              label="instructions"
              value={quizForm.description}
              onChange={(value) => setQuizForm({ ...quizForm, description: value })}
              rows={3}
            />
            <FormActions
              isSaving={isSaving}
              onCancel={() => setQuizForm({ ...emptyQuizForm, lesson_id: quizForm.lesson_id })}
              showCancel={Boolean(selectedQuiz)}
            />
          </form>

          <form onSubmit={submitQuizQuestion} className="grid min-w-0 gap-3">
            <h3 className="text-base font-semibold text-slate-950">
              {editQuestionId ? "edit question" : "add question"}
            </h3>
            <TextField
              label="question"
              value={questionForm.question_text}
              onChange={(value) =>
                setQuestionForm({ ...questionForm, question_text: value })
              }
              required
            />
            <TextField
              label="order"
              type="number"
              value={questionForm.order_index}
              onChange={(value) =>
                setQuestionForm({ ...questionForm, order_index: value })
              }
              required
            />
            {questionForm.options.map((option, index) => (
              <label
                key={index}
                className="grid min-w-0 gap-2 text-sm font-medium text-slate-700"
              >
                option {index + 1}
                <div className="flex min-w-0 gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={questionForm.correct_index === index.toString()}
                    onChange={() =>
                      setQuestionForm({
                        ...questionForm,
                        correct_index: index.toString(),
                      })
                    }
                  />
                  <input
                    value={option}
                    onChange={(event) => {
                      const nextOptions = [...questionForm.options] as [
                        string,
                        string,
                        string,
                        string,
                      ];
                      nextOptions[index] = event.target.value;
                      setQuestionForm({ ...questionForm, options: nextOptions });
                    }}
                    required
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </label>
            ))}
            <FormActions
              isSaving={isSaving || !selectedQuiz}
              onCancel={resetQuizQuestionForm}
              showCancel={Boolean(editQuestionId)}
            />
          </form>
        </div>

        <div className="mt-5 grid gap-3">
          {!quizForm.lesson_id ? (
            <p className="text-sm text-slate-500">
              select a case study to create or edit its quiz.
            </p>
          ) : selectedQuiz ? (
            selectedQuiz.questions.length > 0 ? (
              selectedQuiz.questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        question {question.order_index}
                      </p>
                      <p className="font-semibold text-slate-950">
                        {question.question_text}
                      </p>
                    </div>
                    <ActionButtons
                      onEdit={() => editQuizQuestion(question)}
                      onDelete={() => void removeQuizQuestion(question)}
                    />
                  </div>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option) => (
                      <p
                        key={option.id}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          option.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {option.option_text}
                        {option.is_correct ? " (correct)" : ""}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">this quiz has no questions yet.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">this case study does not have a quiz yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminReviewPanel({
  dashboard,
  isSaving,
  onTogglePsetReview,
}: {
  dashboard: AdminReviewDashboard;
  isSaving: boolean;
  onTogglePsetReview: (response: AdminPsetResponse) => void;
}) {
  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">review queue</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            review pset responses, quiz attempts, and student progress from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">
            {dashboard.total_students} students
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1">
            {dashboard.pending_psets} pending psets
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
            {dashboard.reviewed_psets} reviewed
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-4 xl:col-span-2">
          <h3 className="font-semibold text-slate-950">gradebook foundation</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">student</th>
                  <th className="py-2 pr-3">lessons</th>
                  <th className="py-2 pr-3">latest quiz</th>
                  <th className="py-2 pr-3">avg quiz</th>
                  <th className="py-2 pr-3">psets</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.gradebook.length > 0 ? (
                  dashboard.gradebook.map((row) => (
                    <GradebookRow key={row.student_id} row={row} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-slate-500">
                      no student accounts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-950">pset review</h3>
          <div className="mt-4 grid max-h-[34rem] gap-3 overflow-auto pr-1">
            {dashboard.pset_responses.length > 0 ? (
              dashboard.pset_responses.map((response) => (
                <PsetReviewCard
                  key={response.id}
                  response={response}
                  isSaving={isSaving}
                  onToggleReview={onTogglePsetReview}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">no pset responses submitted yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-950">quiz attempt review</h3>
        <div className="mt-4 grid gap-3">
          {dashboard.quiz_attempts.length > 0 ? (
            dashboard.quiz_attempts.slice(0, 12).map((attempt) => (
              <QuizAttemptReview key={attempt.id} attempt={attempt} />
            ))
          ) : (
            <p className="text-sm text-slate-500">no quiz attempts submitted yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function GradebookRow({ row }: { row: AdminGradebookRow }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-3">
        <p className="font-semibold text-slate-950">{row.student_name}</p>
        <p className="mt-1 text-xs text-slate-500">{row.student_email}</p>
      </td>
      <td className="py-3 pr-3 text-slate-700">
        {row.completed_lessons}/{row.total_assessments}
      </td>
      <td className="py-3 pr-3 text-slate-700">
        {row.latest_quiz_score === null ? "none" : `${row.latest_quiz_score}%`}
      </td>
      <td className="py-3 pr-3 text-slate-700">
        {row.average_quiz_score === null ? "none" : `${row.average_quiz_score}%`}
      </td>
      <td className="py-3 pr-3 text-slate-700">
        {row.pset_submissions} submitted, {row.pending_psets} pending
      </td>
    </tr>
  );
}

function PsetReviewCard({
  response,
  isSaving,
  onToggleReview,
}: {
  response: AdminPsetResponse;
  isSaving: boolean;
  onToggleReview: (response: AdminPsetResponse, feedback?: string | null) => void;
}) {
  return (
    <article
      className={`rounded-md border p-3 ${
        response.reviewed
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-700">
            module {response.module_order_index}: {response.module_title}
          </p>
          <h4 className="mt-1 font-semibold text-slate-950">
            {response.assessment_title}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {response.student_name} / {response.student_email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            submitted {formatDate(response.submitted_at)}
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onToggleReview(response)}
          className={`h-9 w-fit rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
            response.reviewed
              ? "border border-slate-300 bg-white text-slate-700 hover:border-slate-950"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          {response.reviewed ? "mark pending" : "mark reviewed"}
        </button>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          view response
        </summary>
        <p className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
          {response.response_text}
        </p>
        {response.feedback ? (
          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-700">feedback</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{response.feedback}</p>
          </div>
        ) : null}
      </details>
      {!response.reviewed ? (
        <FeedbackInput
          onSave={(feedback) => onToggleReview(response, feedback)}
          isSaving={isSaving}
        />
      ) : null}
    </article>
  );
}

function QuizAttemptReview({ attempt }: { attempt: AdminQuizAttempt }) {
  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer">
        <span className="font-semibold text-slate-950">
          {attempt.student_name} scored {attempt.score}% on {attempt.assessment_title}
        </span>
        <span className="ml-2 text-xs text-slate-500">
          module {attempt.module_order_index} / {formatDate(attempt.submitted_at)}
        </span>
      </summary>
      <div className="mt-3 grid gap-2">
        {attempt.answers.length > 0 ? (
          attempt.answers.map((answer, index) => (
            <QuizAnswerReview key={answer.id} answer={answer} index={index} />
          ))
        ) : (
          <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
            this older attempt does not have stored answer history.
          </p>
        )}
      </div>
    </details>
  );
}

function QuizAnswerReview({
  answer,
  index,
}: {
  answer: QuizAttemptAnswer;
  index: number;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        answer.is_correct ? "border-emerald-200 bg-white" : "border-red-200 bg-red-50"
      }`}
    >
      <p className="font-semibold text-slate-950">
        {index + 1}. {answer.question_text}
      </p>
      <p className="mt-2 text-slate-700">student answer: {answer.selected_option_text}</p>
      {!answer.is_correct && answer.correct_option_text ? (
        <p className="mt-1 text-red-700">correct answer: {answer.correct_option_text}</p>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  required = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      >
        {children}
      </select>
    </label>
  );
}

function LessonPreview({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">preview</p>
      <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
        {lines.map((line, index) => {
          if (line.startsWith("### ")) {
            return (
              <p key={`${line}-${index}`} className="font-semibold text-slate-950">
                {line.replace("### ", "")}
              </p>
            );
          }

          if (line.startsWith("## ")) {
            return (
              <p key={`${line}-${index}`} className="text-base font-semibold text-slate-950">
                {line.replace("## ", "")}
              </p>
            );
          }

          if (line.startsWith("# ")) {
            return (
              <p key={`${line}-${index}`} className="text-lg font-semibold text-slate-950">
                {line.replace("# ", "")}
              </p>
            );
          }

          if (line.startsWith("- ")) {
            return <p key={`${line}-${index}`}>- {line.replace("- ", "")}</p>;
          }

          return <p key={`${line}-${index}`}>{line}</p>;
        })}
      </div>
    </div>
  );
}

function FormActions({
  isSaving,
  onCancel,
  showCancel,
}: {
  isSaving: boolean;
  onCancel: () => void;
  showCancel: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button
        type="submit"
        disabled={isSaving}
        className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSaving ? "saving..." : "save"}
      </button>
      {showCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
        >
          cancel
        </button>
      ) : null}
    </div>
  );
}

function CourseStructureItem({
  unit,
  onEditUnit,
  onDeleteUnit,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
}: {
  unit: Unit;
  onEditUnit: (unit: Unit) => void;
  onDeleteUnit: (unit: Unit) => void;
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (module: CourseModule) => void;
  onEditLesson: (lesson: LessonSummary) => void;
  onDeleteLesson: (lesson: LessonSummary) => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            ap module {unit.order_index}
          </p>
          <h3 className="text-lg font-semibold text-slate-950">{unit.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{unit.description}</p>
        </div>
        <ActionButtons onEdit={() => onEditUnit(unit)} onDelete={() => onDeleteUnit(unit)} />
      </div>

      <div className="mt-4 grid gap-3">
        {unit.modules.map((module) => (
          <div key={module.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  module {module.order_index}
                </p>
                <p className="font-semibold text-slate-950">{module.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
              </div>
              <ActionButtons
                onEdit={() => onEditModule(module)}
                onDelete={() => onDeleteModule(module)}
              />
            </div>

            <div className="mt-3 grid gap-2">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-950">{lesson.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      case study {lesson.order_index} / {lesson.lesson_type}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                    >
                      view
                    </Link>
                    <ActionButtons
                      compact
                      onEdit={() => onEditLesson(lesson)}
                      onDelete={() => onDeleteLesson(lesson)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActionButtons({
  onEdit,
  onDelete,
  compact = false,
}: {
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEdit}
        className={`rounded-md border border-slate-300 font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={`rounded-md border border-red-200 font-semibold text-red-700 transition hover:border-red-500 ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        delete
      </button>
    </div>
  );
}

function FeedbackInput({
  onSave,
  isSaving,
}: {
  onSave: (feedback: string) => void;
  isSaving: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="mt-3 h-9 w-fit rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
      >
        add feedback
      </button>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <textarea
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        rows={3}
        placeholder="write feedback for the student..."
        className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isSaving || !feedback.trim()}
          onClick={() => {
            onSave(feedback.trim());
            setIsExpanded(false);
            setFeedback("");
          }}
          className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          save feedback & review
        </button>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setFeedback("");
          }}
          className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
