import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faFileLines,
  faListCheck,
  faMagnifyingGlassChart,
  faNetworkWired,
  faTerminal,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import type { MissionCard as MissionCardType, MissionType } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import {
  Card,
  MISSION_TYPE_LABEL,
  SkillChip,
  StatusBadge,
  UnitBadge,
  UNIT_ACCENTS,
  statusAction,
} from "./ui";

export const MISSION_TYPE_ICONS: Record<MissionType, IconDefinition> = {
  multiple_choice: faListCheck,
  written_response: faFileLines,
  case_investigation: faMagnifyingGlassChart,
  bash_simulation: faTerminal,
  network_simulation: faNetworkWired,
};

export function MissionCard({ mission }: { mission: MissionCardType }) {
  const accent = UNIT_ACCENTS[mission.unit.accent];
  return (
    <Card className="flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <UnitBadge unit={mission.unit} />
        <StatusBadge status={mission.status} />
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-ink">{mission.title}</h3>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
        <FontAwesomeIcon
          icon={MISSION_TYPE_ICONS[mission.mission_type]}
          className={accent.text}
          aria-hidden="true"
        />
        {MISSION_TYPE_LABEL[mission.mission_type]}
        <span aria-hidden="true">·</span>
        {mission.difficulty}
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{mission.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mission.skills.map((skill) => (
          <SkillChip key={skill.code} title={skill.title} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} aria-hidden="true" />
            {mission.estimated_minutes} min
          </span>
          {mission.due_at && <span>Due {formatShortDate(mission.due_at)}</span>}
        </span>
        <Link
          href={`/missions/${mission.id}`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {statusAction(mission.status)}
        </Link>
      </div>
    </Card>
  );
}
