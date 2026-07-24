import type { ReactNode } from "react";
import type { AttemptStatus, MissionType, UnitRef } from "@/lib/api";

/* Cards --------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

/* Progress bar -------------------------------------------------------------- */

export function ProgressBar({
  value,
  className = "",
  barClassName = "bg-primary",
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className={`h-full rounded-full ${barClassName}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* Unit accents -------------------------------------------------------------- */

type AccentClasses = {
  text: string;
  softBg: string;
  softText: string;
  bar: string;
  iconBg: string;
};

export const UNIT_ACCENTS: Record<UnitRef["accent"], AccentClasses> = {
  green: {
    text: "text-emerald-600",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  blue: {
    text: "text-blue-600",
    softBg: "bg-blue-50",
    softText: "text-blue-700",
    bar: "bg-blue-500",
    iconBg: "bg-blue-100 text-blue-600",
  },
  purple: {
    text: "text-violet-600",
    softBg: "bg-violet-50",
    softText: "text-violet-700",
    bar: "bg-violet-500",
    iconBg: "bg-violet-100 text-violet-600",
  },
  orange: {
    text: "text-amber-600",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    bar: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-600",
  },
  teal: {
    text: "text-teal-600",
    softBg: "bg-teal-50",
    softText: "text-teal-700",
    bar: "bg-teal-500",
    iconBg: "bg-teal-100 text-teal-600",
  },
};

export function UnitBadge({ unit }: { unit: UnitRef }) {
  const accent = UNIT_ACCENTS[unit.accent];
  return (
    <span
      className={`inline-flex items-center rounded-full ${accent.softBg} ${accent.softText} px-2.5 py-1 text-xs font-medium`}
    >
      {unit.title}
    </span>
  );
}

/* Attempt status ------------------------------------------------------------ */

const STATUS_META: Record<AttemptStatus, { label: string; bg: string; text: string; dot: string }> = {
  not_started: { label: "Not Started", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  assigned: { label: "Not Started", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  started: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  draft_saved: { label: "Draft Saved", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  submitted: { label: "Submitted", bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  auto_checked: { label: "Auto-Checked", bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  needs_teacher_review: { label: "Needs Review", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  graded: { label: "Graded", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  returned: { label: "Returned", bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
};

export function StatusBadge({ status }: { status: AttemptStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.not_started;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${meta.bg} ${meta.text} px-2.5 py-1 text-xs font-medium`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function statusAction(status: AttemptStatus): string {
  switch (status) {
    case "started":
    case "draft_saved":
      return "Continue";
    case "submitted":
    case "auto_checked":
    case "needs_teacher_review":
      return "View Submission";
    case "graded":
    case "returned":
      return "View Feedback";
    default:
      return "Start";
  }
}

/* Mission types ------------------------------------------------------------- */

export const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  multiple_choice: "Multiple Choice",
  written_response: "Written Response",
  case_investigation: "Case Investigation",
  bash_simulation: "Safe Bash Simulation",
  network_simulation: "Interactive Network Simulation",
};

/* Skill chips --------------------------------------------------------------- */

export function SkillChip({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
      {title}
    </span>
  );
}
