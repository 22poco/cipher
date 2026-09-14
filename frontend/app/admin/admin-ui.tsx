"use client";

import type { ReactNode } from "react";

export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function TextField({
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

export function TextArea({
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

export function SelectField({
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

export function FormActions({
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

export function ActionButtons({
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

export function LessonPreview({ content }: { content: string }) {
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
