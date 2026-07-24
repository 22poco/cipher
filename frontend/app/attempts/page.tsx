"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faFileLines } from "@fortawesome/free-solid-svg-icons";

import { fetchMyAttempts, type AttemptListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { SUPPORT_META } from "@/lib/support";
import { AppShell } from "../components/app-shell";
import { Card, ProgressBar, StatusBadge, UnitBadge, statusAction } from "../components/ui";

type Bucket = { key: string; title: string; hint: string; statuses: AttemptListItem["status"][] };

const BUCKETS: Bucket[] = [
  {
    key: "active",
    title: "In Progress",
    hint: "Pick up where you left off.",
    statuses: ["assigned", "started", "draft_saved"],
  },
  {
    key: "review",
    title: "Submitted · Awaiting Review",
    hint: "Your teacher is reviewing these.",
    statuses: ["submitted", "auto_checked", "needs_teacher_review"],
  },
  {
    key: "done",
    title: "Returned & Graded",
    hint: "Feedback is ready.",
    statuses: ["graded", "returned"],
  },
];

function SupportChip({ signal }: { signal: AttemptListItem["active_support_signal"] }) {
  const meta = SUPPORT_META[signal];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chipBg} ${meta.chipBorder} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function AttemptRow({ attempt }: { attempt: AttemptListItem }) {
  const completed = attempt.status === "graded" || attempt.status === "returned";
  const inner = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{attempt.mission_title}</p>
          <UnitBadge unit={attempt.unit} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={attempt.status} />
          <SupportChip signal={attempt.active_support_signal} />
          {attempt.due_at && !completed && (
            <span className="text-xs text-muted">Due {formatShortDate(attempt.due_at)}</span>
          )}
        </div>
      </div>

      {completed ? (
        <div className="text-right">
          <p className="text-2xl font-bold text-ink">
            {attempt.final_score != null ? `${Math.round(attempt.final_score)}%` : "—"}
          </p>
          <p className="text-[11px] text-muted">Final score</p>
        </div>
      ) : (
        <div className="flex w-40 items-center gap-3">
          <ProgressBar value={attempt.progress_percent} className="flex-1" />
          <span className="text-xs font-semibold text-ink">{attempt.progress_percent}%</span>
        </div>
      )}

      {!completed && (
        <span className="flex items-center text-xs font-semibold text-primary">
          {statusAction(attempt.status)}
          <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[10px]" aria-hidden="true" />
        </span>
      )}
    </div>
  );

  // Completed attempts show feedback inline; reopening a returned mission would
  // start a fresh attempt, so only active/in-review rows link to the workspace.
  if (completed) {
    return <Card className="transition hover:shadow-md">{inner}</Card>;
  }
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/missions/${attempt.mission_id}`}>{inner}</Link>
    </Card>
  );
}

function AttemptsContent() {
  const [attempts, setAttempts] = useState<AttemptListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchMyAttempts(token)
      .then((res) => setAttempts(res.attempts))
      .catch(() => setError("We couldn't load your attempts."));
  }, []);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!attempts) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">My Attempts</h1>
        <p className="mt-1 text-sm text-muted">
          Every mission you&apos;ve worked on, grouped by where it is in the practice cycle.
        </p>
      </header>

      {attempts.length === 0 ? (
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary">
            <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink">No attempts yet</p>
          <p className="mt-1 text-sm text-muted">
            Start a mission and it will show up here.
          </p>
          <Link
            href="/missions"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Browse missions
          </Link>
        </Card>
      ) : (
        BUCKETS.map((bucket) => {
          const rows = attempts.filter((a) => bucket.statuses.includes(a.status));
          if (rows.length === 0) return null;
          return (
            <section key={bucket.key}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-ink">{bucket.title}</h2>
                <span className="text-xs text-muted">{bucket.hint}</span>
              </div>
              <div className="space-y-3">
                {rows.map((attempt) => (
                  <AttemptRow key={attempt.attempt_id} attempt={attempt} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export default function AttemptsPage() {
  return (
    <AppShell active="attempts" expectRole="student">
      <AttemptsContent />
    </AppShell>
  );
}
