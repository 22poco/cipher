"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ProtectedPage } from "../components/protected-page";
import {
  ApiError,
  createLesson,
  createModule,
  createUnit,
  deleteLesson,
  deleteModule,
  deleteUnit,
  fetchUnits,
  fetchLesson,
  updateLesson,
  updateModule,
  updateUnit,
  type CourseModule,
  type LessonPayload,
  type LessonSummary,
  type LessonType,
  type ModulePayload,
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

export default function AdminPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {(user) => <AdminDashboard email={user.email} />}
    </ProtectedPage>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);

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

  const loadUnits = useCallback(async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setUnits(await fetchUnits(token));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "could not load course data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUnits();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadUnits]);

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
        showResult("unit updated");
      } else {
        await createUnit(unitPayload(unitForm), token);
        showResult("unit created");
      }

      resetForms();
      await loadUnits();
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
        showResult("module updated");
      } else {
        await createModule(modulePayload(moduleForm), token);
        showResult("module created");
      }

      resetForms();
      await loadUnits();
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
        showResult("lesson updated");
      } else {
        await createLesson(lessonPayload(lessonForm), token);
        showResult("lesson created");
      }

      resetForms();
      await loadUnits();
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeUnit(unit: Unit) {
    if (!confirm(`delete unit "${unit.title}" and all of its modules and lessons?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteUnit(unit.id, token);
      showResult("unit deleted");
      await loadUnits();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeModule(module: CourseModule) {
    if (!confirm(`delete module "${module.title}" and all of its lessons?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteModule(module.id, token);
      showResult("module deleted");
      await loadUnits();
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function removeLesson(lesson: LessonSummary) {
    if (!confirm(`delete lesson "${lesson.title}"?`)) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      await deleteLesson(lesson.id, token);
      showResult("lesson deleted");
      await loadUnits();
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

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-emerald-700">admin dashboard</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          course management
        </h1>
        <p className="text-sm text-slate-600">
          signed in as {email}. create, edit, and delete course structure here.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["units", units.length],
          ["modules", modules.length],
          ["lessons", lessons.length],
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

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <form
          onSubmit={submitUnit}
          className="min-w-0 rounded-md border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-950">
            {editTarget?.type === "unit" ? "edit unit" : "create unit"}
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
            {editTarget?.type === "module" ? "edit module" : "create module"}
          </h2>
          <div className="mt-4 grid gap-3">
            <SelectField
              label="unit"
              value={moduleForm.unit_id}
              onChange={(value) => setModuleForm({ ...moduleForm, unit_id: value })}
              required
            >
              <option value="">select unit</option>
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
            {editTarget?.type === "lesson" ? "edit lesson" : "create lesson"}
          </h2>
          <div className="mt-4 grid gap-3">
            <SelectField
              label="module"
              value={lessonForm.module_id}
              onChange={(value) => setLessonForm({ ...lessonForm, module_id: value })}
              required
            >
              <option value="">select module</option>
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
              changes here appear on student course pages after refresh.
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
    </main>
  );
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
          <p className="text-xs font-medium text-slate-500">unit {unit.order_index}</p>
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
                      lesson {lesson.order_index} / {lesson.lesson_type}
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
