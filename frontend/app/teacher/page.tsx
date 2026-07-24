"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChartLine,
  faClipboardList,
  faFileCircleCheck,
  faInbox,
  faUsersRectangle,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { fetchTeacherOverview, type TeacherOverview } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatRelativeDay } from "@/lib/format";
import { AppShell, initials } from "../components/app-shell";
import { Card, UnitBadge } from "../components/ui";

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: IconDefinition;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${iconClass}`}>
          <FontAwesomeIcon icon={icon} className="text-sm" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </Card>
  );
}

function OverviewContent() {
  const [data, setData] = useState<TeacherOverview | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchTeacherOverview(token).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { cards } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Section health, grading workload, and attempts that need your review.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={faUsersRectangle} iconClass="bg-blue-100 text-blue-600" label="Active Sections" value={`${cards.active_sections}`} />
        <StatCard icon={faClipboardList} iconClass="bg-violet-100 text-violet-600" label="Missions Assigned" value={`${cards.missions_assigned}`} />
        <StatCard icon={faInbox} iconClass="bg-orange-100 text-orange-600" label="Awaiting Review" value={`${cards.awaiting_review}`} />
        <StatCard icon={faChartLine} iconClass="bg-emerald-100 text-emerald-600" label="Average Score" value={cards.average_score !== null ? `${cards.average_score}%` : "—"} />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Needs Review</h2>
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
            {data.review_queue.length} in queue
          </span>
        </div>
        {data.review_queue.length === 0 ? (
          <div className="py-10 text-center">
            <FontAwesomeIcon icon={faFileCircleCheck} className="text-2xl text-emerald-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">You&apos;re all caught up.</p>
            <p className="text-sm text-muted">There are no submitted attempts waiting for review.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.review_queue.map((item) => (
              <li key={item.attempt_id}>
                <Link
                  href={`/teacher/attempts/${item.attempt_id}`}
                  className="flex items-center gap-4 py-3 transition hover:bg-slate-50/60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(item.student)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.student}</p>
                    <p className="truncate text-xs text-muted">{item.mission}</p>
                  </div>
                  <UnitBadge unit={item.unit} />
                  <span className="hidden text-xs text-muted sm:block">{item.section}</span>
                  <span className="hidden text-xs text-muted md:block">
                    {formatRelativeDay(item.submitted_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Open Review
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function TeacherOverviewPage() {
  return (
    <AppShell active="overview" expectRole="teacher">
      <OverviewContent />
    </AppShell>
  );
}
