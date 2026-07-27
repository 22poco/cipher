"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight, faFileExport } from "@fortawesome/free-solid-svg-icons";

import { fetchGradebook, type Gradebook, type SkillCode } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell, initials } from "../../components/app-shell";
import { Card } from "../../components/ui";

function cellClass(score: number | null): string {
  if (score === null) return "bg-slate-50 text-slate-400";
  if (score >= 90) return "bg-emerald-100 text-emerald-800";
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

const LEGEND = [
  { label: "90–100%", dot: "bg-emerald-500" },
  { label: "80–89%", dot: "bg-emerald-300" },
  { label: "70–79%", dot: "bg-amber-400" },
  { label: "Below 70%", dot: "bg-rose-400" },
];

function Selector({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-muted">{label}</span>
      <span className="flex h-10 min-w-[150px] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-ink">
        {value}
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-subtle" aria-hidden="true" />
      </span>
    </label>
  );
}

function GradebookContent() {
  const [data, setData] = useState<Gradebook | null>(null);
  const [sectionId, setSectionId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchGradebook(token, sectionId).then(setData);
  }, [sectionId]);

  const activeSection = data?.sections.find((s) => s.id === data.active_section_id);
  const skillCodes: SkillCode[] = data
    ? data.skills.map((s) => s.code)
    : ["analyze_risk", "mitigate_risk", "detect_attacks", "collaborate"];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted">
        <span>Teacher</span>
        <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
        <span className="text-body">Gradebook</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Gradebook</h1>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-body shadow-sm transition hover:bg-slate-50"
        >
          <FontAwesomeIcon icon={faFileExport} aria-hidden="true" />
          Export
        </button>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        {/* Section selector (functional) */}
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-muted">Section</span>
          <select
            value={data?.active_section_id ?? ""}
            onChange={(e) => setSectionId(Number(e.target.value))}
            className="h-10 min-w-[170px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {(data?.sections ?? []).map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
        <Selector label="Unit" value="All Units" />
        <Selector label="Skill" value="All Skills" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto cipher-scroll">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-subtle">
                <th className="sticky left-0 z-10 bg-white px-5 py-3 font-semibold">Student</th>
                {(data?.skills ?? []).map((skill) => (
                  <th key={skill.code} className="px-3 py-3 text-center font-semibold">
                    {skill.title}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold">Avg. Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data
                ? [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : data.students.map((row) => (
                    <tr key={row.student_id}>
                      <td className="sticky left-0 z-10 bg-white px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials(row.student)}
                          </span>
                          <span className="font-medium text-ink">{row.student}</span>
                        </div>
                      </td>
                      {skillCodes.map((code) => {
                        const score = row.skills[code];
                        return (
                          <td key={code} className="px-2 py-2 text-center">
                            <span
                              className={`inline-flex h-9 w-14 items-center justify-center rounded-lg text-sm font-semibold ${cellClass(score)}`}
                            >
                              {score !== null ? `${score}%` : "—"}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-center">
                        <span className="text-sm font-bold text-ink">
                          {row.average !== null ? `${row.average}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 px-5 py-3">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </Card>

      {activeSection && (
        <p className="text-xs text-muted">
          Showing skill scores for <span className="font-medium text-body">{activeSection.name}</span>.
          Every cell shows a numeric value; colour is a secondary cue only.
        </p>
      )}
    </div>
  );
}

export default function TeacherGradebookPage() {
  return (
    <AppShell active="gradebook" expectRole="teacher">
      <GradebookContent />
    </AppShell>
  );
}
