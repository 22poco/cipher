"use client";

import { useSyncExternalStore } from "react";

import { AppNav } from "./app-nav";

function subscribeToLockdown(onChange: () => void) {
  window.addEventListener("exam-lockdown-change", onChange);
  return () => window.removeEventListener("exam-lockdown-change", onChange);
}

function getLockdownSnapshot() {
  return document.documentElement.getAttribute("data-exam-lockdown") === "on";
}

function getServerSnapshot() {
  return false;
}

// the app-wide top nav is hidden while a mock exam is in lockdown mode.
// the exam runner flips this attribute so the exam screen is the only
// chrome on the page — like the real ap lockdown app.
export function ExamChrome() {
  const lockdown = useSyncExternalStore(
    subscribeToLockdown,
    getLockdownSnapshot,
    getServerSnapshot,
  );

  if (lockdown) {
    return null;
  }

  return <AppNav />;
}
