import type { SupportSignal } from "./api";

// The stored system categories (Independent / AI / Teacher / Others) are shown
// with the student-friendly wording from the mockup. This is the single source
// of truth mapping signal -> label + colour treatment.
export type SupportMeta = {
  signal: SupportSignal;
  label: string; // student-friendly wording (mockup)
  system: string; // stored category
  dot: string;
  text: string;
  chipBg: string;
  chipBorder: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
};

export const SUPPORT_META: Record<SupportSignal, SupportMeta> = {
  independent: {
    signal: "independent",
    label: "I'm Confident",
    system: "Independent",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
    chipBorder: "border-emerald-200",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-300",
  },
  ai: {
    signal: "ai",
    label: "I'm Struggling",
    system: "AI",
    dot: "bg-amber-500",
    text: "text-amber-700",
    chipBg: "bg-amber-50",
    chipBorder: "border-amber-200",
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    activeBorder: "border-amber-300",
  },
  teacher: {
    signal: "teacher",
    label: "I'm Stuck",
    system: "Teacher",
    dot: "bg-rose-500",
    text: "text-rose-700",
    chipBg: "bg-rose-50",
    chipBorder: "border-rose-200",
    activeBg: "bg-rose-50",
    activeText: "text-rose-700",
    activeBorder: "border-rose-300",
  },
  others: {
    signal: "others",
    label: "Off Task",
    system: "Others",
    dot: "bg-slate-400",
    text: "text-slate-600",
    chipBg: "bg-slate-50",
    chipBorder: "border-slate-200",
    activeBg: "bg-slate-100",
    activeText: "text-slate-700",
    activeBorder: "border-slate-300",
  },
};

export const SUPPORT_ORDER: SupportSignal[] = ["independent", "ai", "teacher", "others"];
