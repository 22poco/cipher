"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import { fetchMissions, type MissionGroup, type SkillCode } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "../components/app-shell";
import { MissionCard } from "../components/mission-card";
import { Card, UNIT_ACCENTS } from "../components/ui";

const SKILLS: { code: SkillCode; title: string }[] = [
  { code: "analyze_risk", title: "Analyze Risk" },
  { code: "mitigate_risk", title: "Mitigate Risk" },
  { code: "detect_attacks", title: "Detect Attacks" },
  { code: "collaborate", title: "Collaborate" },
];

function MissionsContent() {
  const [groups, setGroups] = useState<MissionGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<number | null>(null);
  const [skillFilter, setSkillFilter] = useState<SkillCode | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchMissions(token).then((res) => setGroups(res.groups));
  }, []);

  const units = useMemo(
    () => (groups ?? []).map((g) => g.unit),
    [groups],
  );

  const filtered = useMemo(() => {
    if (!groups) return [];
    return groups
      .filter((g) => unitFilter === null || g.unit.id === unitFilter)
      .map((g) => ({
        ...g,
        missions: g.missions.filter((m) => {
          const matchesSearch =
            !search || m.title.toLowerCase().includes(search.toLowerCase());
          const matchesSkill =
            !skillFilter || m.skills.some((s) => s.code === skillFilter);
          return matchesSearch && matchesSkill;
        }),
      }))
      .filter((g) => g.missions.length > 0);
  }, [groups, search, unitFilter, skillFilter]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Missions</h1>
        <p className="mt-1 text-sm text-muted">
          Practice AP Cybersecurity skills through real-world scenarios.
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="All Units" active={unitFilter === null} onClick={() => setUnitFilter(null)} />
          {units.map((unit) => (
            <FilterChip
              key={unit.id}
              label={`Unit ${unit.order_index}`}
              active={unitFilter === unit.id}
              onClick={() => setUnitFilter(unit.id)}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
          {SKILLS.map((skill) => (
            <FilterChip
              key={skill.code}
              label={skill.title}
              active={skillFilter === skill.code}
              onClick={() =>
                setSkillFilter((current) => (current === skill.code ? null : skill.code))
              }
            />
          ))}
        </div>
      </div>

      {!groups ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm font-medium text-ink">No missions match your filters.</p>
          <p className="mt-1 text-sm text-muted">Try clearing a filter to see more missions.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.map((group) => (
            <section key={group.unit.id}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold text-white ${UNIT_ACCENTS[group.unit.accent].bar}`}
                >
                  {group.unit.order_index}
                </span>
                {group.unit.title}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.missions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-slate-200 bg-white text-body hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function MissionsPage() {
  return (
    <AppShell active="missions" expectRole="student">
      <MissionsContent />
    </AppShell>
  );
}
