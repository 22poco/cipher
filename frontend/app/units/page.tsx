"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faDatabase,
  faLaptop,
  faLock,
  faNetworkWired,
  faShieldHalved,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { fetchMissions, type MissionGroup } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "../components/app-shell";
import { Card, ProgressBar, UNIT_ACCENTS } from "../components/ui";

const UNIT_ICONS: Record<number, IconDefinition> = {
  1: faShieldHalved,
  2: faLock,
  3: faNetworkWired,
  4: faLaptop,
  5: faDatabase,
};

const COMPLETED = ["submitted", "auto_checked", "needs_teacher_review", "graded", "returned"];

function unitProgress(group: MissionGroup) {
  const total = group.missions.length;
  const completed = group.missions.filter((m) => COMPLETED.includes(m.status)).length;
  return { total, completed, percent: total ? Math.round((100 * completed) / total) : 0 };
}

function UnitsContent() {
  const [groups, setGroups] = useState<MissionGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchMissions(token)
      .then((res) => setGroups(res.groups))
      .catch(() => setError("We couldn't load the units."));
  }, []);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!groups) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">AP Cybersecurity Units</h1>
        <p className="mt-1 text-sm text-muted">
          Five units, each a set of hands-on missions. Open a unit to practice its missions.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const accent = UNIT_ACCENTS[group.unit.accent];
          const { total, completed, percent } = unitProgress(group);
          return (
            <Link key={group.unit.id} href={`/units/${group.unit.id}`}>
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl text-base font-bold text-white ${accent.bar}`}
                  >
                    {group.unit.order_index}
                  </span>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${accent.iconBg}`}>
                    <FontAwesomeIcon
                      icon={UNIT_ICONS[group.unit.order_index] ?? faShieldHalved}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold text-ink">{group.unit.title}</h2>
                <p className="mt-1 text-xs text-muted">
                  {completed} of {total} missions completed
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={percent} className="flex-1" barClassName={accent.bar} />
                  <span className="text-xs font-semibold text-ink">{percent}%</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Open unit
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" aria-hidden="true" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <AppShell active="units" expectRole="student">
      <UnitsContent />
    </AppShell>
  );
}
