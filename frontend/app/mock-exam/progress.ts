// shared helpers for the mock exam pages: per-exam saved progress in
// localStorage, plus small formatting helpers used by the hub and runner.

export const PROGRESS_PREFIX = "cipher-mock-exam-progress:";

export type ExamPhase = "taking-mcq" | "taking-frq";

export type SavedProgress = {
  examKey: string;
  seed: number;
  answers: Record<string, number>;
  frqResponse: string | null;
  remainingSeconds: number;
  savedAt: number;
  phase: ExamPhase;
};

export function storageKeyFor(examKey: string) {
  return `${PROGRESS_PREFIX}${examKey}`;
}

export function readSavedProgress(examKey: string): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(examKey));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed.examKey !== examKey || !parsed.seed) {
      window.localStorage.removeItem(storageKeyFor(examKey));
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(storageKeyFor(examKey));
    return null;
  }
}

export function clearSavedProgress(examKey: string) {
  window.localStorage.removeItem(storageKeyFor(examKey));
}

// the clock keeps running after a student quits: on resume we subtract the
// time spent away from the saved remaining seconds, just like the lockdown app.
export function effectiveRemainingSeconds(progress: SavedProgress): number {
  const elapsed = Math.max(0, Math.round((Date.now() - progress.savedAt) / 1000));
  return progress.remainingSeconds - elapsed;
}

export function formatClock(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} hr ${rest} min` : `${hours} hr`;
  }
  return `${minutes} min`;
}

export const VALID_EXAM_KEYS = ["full", "unit-1", "unit-2", "unit-3", "unit-4", "unit-5"];

export function isExamKey(value: string): value is (typeof VALID_EXAM_KEYS)[number] {
  return VALID_EXAM_KEYS.includes(value);
}

export function examTitle(examKey: string) {
  if (examKey === "full") {
    return "full course exam";
  }
  const unit = examKey.replace("unit-", "");
  return `unit ${unit} exam`;
}

export function attemptLabel(examKind: string, unitId: number | null) {
  return examKind === "full" ? "full course exam" : `unit ${unitId ?? "?"} exam`;
}
