"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChartLine,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faDatabase,
  faFire,
  faLaptop,
  faLifeRing,
  faLock,
  faNetworkWired,
  faPeopleGroup,
  faShieldHalved,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { fetchStudentDashboard, type StudentDashboard } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatMinutes, formatShortDate } from "@/lib/format";
import { AppShell } from "../components/app-shell";
import {
  Card,
  ProgressBar,
  StatusBadge,
  UNIT_ACCENTS,
  statusAction,
} from "../components/ui";

const UNIT_ICONS: Record<number, IconDefinition> = {
  1: faShieldHalved,
  2: faLock,
  3: faNetworkWired,
  4: faLaptop,
  5: faDatabase,
};

const ACCENT_SOLID: Record<string, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-violet-500",
  orange: "bg-amber-500",
  teal: "bg-teal-500",
};

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  sub,
  progress,
}: {
  icon: IconDefinition;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
  progress?: number;
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
      <p className="mt-1 text-xs text-muted">{sub}</p>
      {progress !== undefined && <ProgressBar value={progress} className="mt-3" />}
    </Card>
  );
}

function ProgressChart({ points }: { points: { day: string; value: number }[] }) {
  const width = 320;
  const height = 150;
  const padX = 8;
  const padY = 12;
  const max = 100;
  const stepX = (width - padX * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + (height - padY * 2) * (1 - p.value / max);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0]} ${height - padY} L${coords[0][0]} ${height - padY} Z`;
  const last = coords[coords.length - 1];

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between py-2 text-[10px] text-subtle">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cipherArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b63f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0b63f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.5, 1].map((f) => (
            <line
              key={f}
              x1={padX}
              x2={width - padX}
              y1={padY + (height - padY * 2) * f}
              y2={padY + (height - padY * 2) * f}
              stroke="#eef1f5"
              strokeWidth="1"
            />
          ))}
          <path d={area} fill="url(#cipherArea)" />
          <path d={line} fill="none" stroke="#0b63f6" strokeWidth="2.5" strokeLinecap="round" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#0b63f6" strokeWidth="2" />
          ))}
          <circle cx={last[0]} cy={last[1]} r="5" fill="#0b63f6" />
        </svg>
      </div>
      <div className="ml-9 mt-1 flex justify-between text-[10px] text-subtle">
        {points.map((p) => (
          <span key={p.day}>{p.day}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchStudentDashboard(token)
      .then(setData)
      .catch(() => setError("We couldn't load your dashboard."));
  }, []);

  if (error) {
    return <p className="p-6 text-sm text-rose-600">{error}</p>;
  }
  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const firstName = data.user.name.split(" ")[0];
  const { metrics } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Welcome back, {firstName}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Keep practicing. Every attempt makes you stronger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:bg-slate-50"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-light text-primary">
              <FontAwesomeIcon icon={faPeopleGroup} className="text-sm" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] text-muted">Class Section</span>
              <span className="block text-sm font-semibold text-ink">
                {data.active_section?.name ?? "No section"}
              </span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="text-xs text-subtle" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-body shadow-sm transition hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faBell} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={faFire}
          iconClass="bg-orange-100 text-orange-500"
          label="Current Streak"
          value={`${metrics.streak_days} days`}
          sub="Keep it up!"
        />
        <MetricCard
          icon={faCircleCheck}
          iconClass="bg-emerald-100 text-emerald-600"
          label="Missions Completed"
          value={`${metrics.missions_completed}`}
          sub={`of ${metrics.missions_assigned} assigned`}
          progress={
            metrics.missions_assigned
              ? (metrics.missions_completed / metrics.missions_assigned) * 100
              : 0
          }
        />
        <MetricCard
          icon={faChartLine}
          iconClass="bg-blue-100 text-blue-600"
          label="Average Score"
          value={`${metrics.average_score}%`}
          sub="Across all attempts"
        />
        <MetricCard
          icon={faLifeRing}
          iconClass="bg-violet-100 text-violet-600"
          label="Support Used"
          value={`${metrics.support_used_week}`}
          sub="Times this week"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">AP Cybersecurity Units</h2>
          <Link href="/units" className="text-sm font-medium text-primary hover:underline">
            View all units
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {data.units.map((unit) => {
            const accent = UNIT_ACCENTS[unit.accent];
            return (
              <Link
                key={unit.id}
                href={`/units/${unit.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white ${ACCENT_SOLID[unit.accent]}`}
                  >
                    {unit.order_index}
                  </span>
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent.iconBg}`}>
                    <FontAwesomeIcon
                      icon={UNIT_ICONS[unit.order_index] ?? faShieldHalved}
                      className="text-xs"
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug text-ink">{unit.title}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted">
                  <span>{unit.progress_percent}%</span>
                </div>
                <ProgressBar
                  value={unit.progress_percent}
                  className="mt-1.5"
                  barClassName={accent.bar}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent Assignments</h2>
            <Link href="/missions" className="text-sm font-medium text-primary hover:underline">
              View all missions
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.recent_assignments.length === 0 && (
              <li className="py-8 text-center text-sm text-muted">
                No missions assigned yet. Your teacher&apos;s assignments will appear here.
              </li>
            )}
            {data.recent_assignments.map((mission) => {
              const accent = UNIT_ACCENTS[mission.unit.accent];
              return (
                <li key={mission.id}>
                  <Link
                    href={`/missions/${mission.id}`}
                    className="flex items-center gap-4 py-3.5 transition hover:bg-slate-50/60"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${accent.iconBg}`}>
                      <FontAwesomeIcon
                        icon={UNIT_ICONS[mission.unit.order_index] ?? faShieldHalved}
                        className="text-xs"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{mission.title}</p>
                      <p className="text-xs text-muted">{mission.unit.title}</p>
                    </div>
                    <StatusBadge status={mission.status} />
                    <span className="hidden w-20 text-right text-xs text-muted sm:block">
                      {mission.due_at ? `Due ${formatShortDate(mission.due_at)}` : "—"}
                    </span>
                    <span className="hidden w-24 items-center justify-end text-right text-xs font-semibold text-primary sm:flex">
                      {statusAction(mission.status)}
                      <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[10px]" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Your Progress</h2>
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-body">
              This Week
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-subtle" aria-hidden="true" />
            </span>
          </div>
          <ProgressChart points={data.weekly_progress.points} />
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            <div>
              <p className="text-base font-bold text-ink">
                {formatMinutes(data.weekly_progress.time_practicing_minutes)}
              </p>
              <p className="text-[11px] text-muted">Time Practicing</p>
            </div>
            <div>
              <p className="text-base font-bold text-ink">
                {data.weekly_progress.missions_attempted}
              </p>
              <p className="text-[11px] text-muted">Missions Attempted</p>
            </div>
            <div>
              <p className="text-base font-bold text-ink">{data.weekly_progress.best_score}%</p>
              <p className="text-[11px] text-muted">Best Score</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell active="dashboard" expectRole="student">
      <DashboardContent />
    </AppShell>
  );
}
