"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faClipboardCheck,
  faEllipsisVertical,
  faFileArrowUp,
  faPeopleGroup,
  faPlus,
  faUserPlus,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { fetchTeacherSections, type TeacherSections } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatShortDate, formatRelativeDay } from "@/lib/format";
import { AppShell } from "../../components/app-shell";
import { Card } from "../../components/ui";

const ACTIVITY_ICONS: Record<string, IconDefinition> = {
  assigned: faClipboardCheck,
  submitted: faFileArrowUp,
  graded: faClipboardCheck,
  joined: faUserPlus,
};

function scoreClass(score: number | null): string {
  if (score === null) return "text-muted";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
}

function SectionsContent() {
  const [data, setData] = useState<TeacherSections | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchTeacherSections(token).then(setData);
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted">
        <span>Teacher</span>
        <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
        <span className="text-body">Sections</span>
      </nav>

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Sections</h1>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          New Section
        </button>
      </header>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Your Sections</h2>
        </div>
        <div className="overflow-x-auto cipher-scroll">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-semibold">Section Name</th>
                <th className="px-3 py-3 font-semibold">Students</th>
                <th className="px-3 py-3 font-semibold">Missions Assigned</th>
                <th className="px-3 py-3 font-semibold">Avg. Score</th>
                <th className="px-3 py-3 font-semibold">Last Active</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data
                ? [0, 1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : data.sections.map((section) => (
                    <tr key={section.id} className="text-body">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-light text-primary">
                            <FontAwesomeIcon icon={faPeopleGroup} className="text-xs" aria-hidden="true" />
                          </span>
                          <span className="font-semibold text-ink">{section.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4">{section.students}</td>
                      <td className="px-3 py-4">{section.missions_assigned}</td>
                      <td className={`px-3 py-4 font-semibold ${scoreClass(section.average_score)}`}>
                        {section.average_score !== null ? `${section.average_score}%` : "—"}
                      </td>
                      <td className="px-3 py-4 text-muted">
                        {section.last_active ? formatShortDate(section.last_active) + ", 2026" : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-light"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            aria-label="More actions"
                            className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-slate-100"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent Activity</h2>
        {data && data.recent_activity.length > 0 ? (
          <ul className="space-y-1">
            {data.recent_activity.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-body">
                  <FontAwesomeIcon icon={ACTIVITY_ICONS[item.type] ?? faClipboardCheck} className="text-xs" aria-hidden="true" />
                </span>
                <span className="flex-1 text-body">{item.text}</span>
                <span className="text-xs text-muted">{formatRelativeDay(item.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted">No recent activity yet.</p>
        )}
      </Card>
    </div>
  );
}

export default function TeacherSectionsPage() {
  return (
    <AppShell active="sections" expectRole="teacher">
      <SectionsContent />
    </AppShell>
  );
}
