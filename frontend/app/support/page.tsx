"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faLightbulb } from "@fortawesome/free-solid-svg-icons";

import { fetchSupportSummary, type SupportSummary } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatRelativeDay } from "@/lib/format";
import { SUPPORT_META, SUPPORT_ORDER } from "@/lib/support";
import { AppShell } from "../components/app-shell";
import { Card, UnitBadge } from "../components/ui";

function SummaryCard({
  signal,
  count,
}: {
  signal: SupportSummary["threads"][number]["events"][number]["to_signal"];
  count: number;
}) {
  const meta = SUPPORT_META[signal];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden="true" />
        <p className="text-sm font-medium text-body">{meta.label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold text-ink">{count}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {meta.system} signal · {count === 1 ? "1 time" : `${count} times`}
      </p>
    </Card>
  );
}

function Timeline({ events }: { events: SupportSummary["threads"][number]["events"] }) {
  return (
    <ol className="space-y-3">
      {events.map((event, i) => {
        const meta = SUPPORT_META[event.to_signal];
        return (
          <li key={event.id} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
              {i < events.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-1">
              <p className="text-xs text-muted">{formatRelativeDay(event.created_at)}</p>
              <p className={`text-sm font-medium ${meta.text}`}>
                {meta.label} <span className="text-muted">({meta.system})</span>
              </p>
              {event.note && <p className="text-xs text-muted">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SupportContent() {
  const [data, setData] = useState<SupportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchSupportSummary(token)
      .then(setData)
      .catch(() => setError("We couldn't load your support timeline."));
  }, []);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Support Timeline</h1>
        <p className="mt-1 text-sm text-muted">
          Knowing when you needed help — and asking for it — is a graded skill. Here&apos;s how you
          used support across your missions.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUPPORT_ORDER.map((signal) => (
          <SummaryCard key={signal} signal={signal} count={data.counts[signal] ?? 0} />
        ))}
      </div>

      <Card className="flex items-start gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500">
          <FontAwesomeIcon icon={faLightbulb} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Reflect on your support use</p>
          <p className="mt-0.5 text-sm text-muted">
            You changed your support signal {data.total_changes}{" "}
            {data.total_changes === 1 ? "time" : "times"} across{" "}
            {data.attempts_with_support}{" "}
            {data.attempts_with_support === 1 ? "mission" : "missions"}. Did you reach for the AI
            tutor or your teacher at the right moment — or push through when a hint would have
            helped? Naming that is part of the Collaborate skill.
          </p>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">By mission</h2>
        {data.threads.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted">
            No support changes recorded yet. When you switch between Independent, AI, Teacher, or
            Off-Task while working, it will appear here.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.threads.map((thread) => (
              <Card key={thread.attempt_id} className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{thread.mission_title}</p>
                    <UnitBadge unit={thread.unit} />
                  </div>
                  <Link
                    href={`/missions/${thread.mission_id}`}
                    className="flex items-center text-xs font-medium text-primary hover:underline"
                  >
                    Open
                    <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[10px]" aria-hidden="true" />
                  </Link>
                </div>
                <Timeline events={thread.events} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function SupportPage() {
  return (
    <AppShell active="support" expectRole="student">
      <SupportContent />
    </AppShell>
  );
}
