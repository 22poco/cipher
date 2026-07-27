"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import { fetchMissions, type MissionGroup } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "../../components/app-shell";
import { MissionCard } from "../../components/mission-card";
import { Card, ProgressBar, UNIT_ACCENTS } from "../../components/ui";

const COMPLETED = ["submitted", "auto_checked", "needs_teacher_review", "graded", "returned"];

function UnitDetailContent() {
  const params = useParams<{ unitId: string }>();
  const unitId = Number(params.unitId);
  const [groups, setGroups] = useState<MissionGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchMissions(token)
      .then((res) => setGroups(res.groups))
      .catch(() => setError("We couldn't load this unit."));
  }, []);

  const group = useMemo(
    () => groups?.find((g) => g.unit.id === unitId) ?? null,
    [groups, unitId],
  );

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!groups) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <p className="text-sm font-semibold text-ink">Unit not found</p>
          <p className="mt-1 text-sm text-muted">This unit has no missions yet.</p>
          <Link
            href="/units"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Back to units
          </Link>
        </Card>
      </div>
    );
  }

  const accent = UNIT_ACCENTS[group.unit.accent];
  const total = group.missions.length;
  const completed = group.missions.filter((m) => COMPLETED.includes(m.status)).length;
  const percent = total ? Math.round((100 * completed) / total) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted">
        <Link href="/units" className="hover:text-primary">
          Units
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
        <span className="text-body">Unit {group.unit.order_index}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white ${accent.bar}`}
          >
            {group.unit.order_index}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink">{group.unit.title}</h1>
            <p className="text-sm text-muted">
              {completed} of {total} missions completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:w-56">
          <ProgressBar value={percent} className="flex-1" barClassName={accent.bar} />
          <span className="text-sm font-semibold text-ink">{percent}%</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}

export default function UnitDetailPage() {
  return (
    <AppShell active="units" expectRole="student">
      <UnitDetailContent />
    </AppShell>
  );
}
