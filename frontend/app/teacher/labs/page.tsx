"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faCircleCheck,
  faCircleInfo,
  faRotateLeft,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  assignTeacherLab,
  fetchTeacherLabCatalog,
  fetchTeacherLabSettings,
  fetchTeacherLabSummary,
  fetchTeacherSections,
  resetTeacherLabEvents,
  updateTeacherLabSettings,
  type LabCatalog,
  type LabCatalogCard,
  type LabDisclosureMode,
  type LabSettingsResponse,
  type LabSummary,
  type SectionRow,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "../../components/app-shell";
import { Card, UnitBadge } from "../../components/ui";

/* --------------------------------------------------------------------------- */

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone ?? "text-ink"}`}>{value}</p>
    </Card>
  );
}

function DistributionList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { id: string; label: string; count: number }[];
  emptyText: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card className="p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-body">{item.label}</span>
                <span className="font-semibold text-ink">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AcknowledgementPanel({
  data,
  onEnable,
  onDisable,
  busy,
}: {
  data: LabSettingsResponse;
  onEnable: () => void;
  onDisable: () => void;
  busy: boolean;
}) {
  const enabled = data.settings.enabled;
  return (
    <Card className={`p-5 ${enabled ? "border-emerald-200" : "border-amber-200"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            enabled ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <FontAwesomeIcon icon={enabled ? faCircleCheck : faTriangleExclamation} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-ink">
            {enabled ? "Lab mode is enabled for this section" : "Enable lab mode to assign labs"}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Simulated attack labs require your acknowledgement before they can be assigned or started.
          </p>
          <ul className="mt-3 space-y-1.5">
            {data.acknowledgement.statements.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-body">
                <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-primary" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            {enabled ? (
              <button
                type="button"
                onClick={onDisable}
                disabled={busy}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-body transition hover:bg-slate-50 disabled:opacity-60"
              >
                Disable lab mode
              </button>
            ) : (
              <button
                type="button"
                onClick={onEnable}
                disabled={busy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
                I acknowledge — enable lab mode
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LabRow({
  lab,
  mode,
  onModeChange,
  onAssign,
  onReset,
  resetPending,
  busy,
  sectionEnabled,
}: {
  lab: LabCatalogCard;
  mode: LabDisclosureMode;
  onModeChange: (mode: LabDisclosureMode) => void;
  onAssign: () => void;
  onReset: () => void;
  resetPending: boolean;
  busy: boolean;
  sectionEnabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{lab.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{lab.summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as LabDisclosureMode)}
          disabled={busy || !sectionEnabled}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        >
          <option value="transparent">Transparent</option>
          <option value="surprise">Surprise reveal</option>
        </select>
        <button
          type="button"
          onClick={onAssign}
          disabled={busy || !sectionEnabled}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition disabled:opacity-60 ${
            lab.assigned
              ? "border border-slate-200 text-body hover:bg-slate-50"
              : "bg-primary text-white hover:bg-primary-hover"
          }`}
        >
          {lab.assigned ? "Update assignment" : "Assign to section"}
        </button>
        {lab.assigned && (
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-60 ${
              resetPending
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-slate-200 text-body hover:bg-slate-50"
            }`}
          >
            <FontAwesomeIcon icon={faRotateLeft} aria-hidden="true" />
            {resetPending ? "Confirm reset?" : "Reset events"}
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */

function LabsContent() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [sectionId, setSectionId] = useState<number | undefined>(undefined);
  const [settings, setSettings] = useState<LabSettingsResponse | null>(null);
  const [catalog, setCatalog] = useState<LabCatalog | null>(null);
  const [summary, setSummary] = useState<LabSummary | null>(null);
  const [modes, setModes] = useState<Record<number, LabDisclosureMode>>({});
  const [resetPending, setResetPending] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the teacher's sections once; default to the first one.
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchTeacherSections(token)
      .then((res) => {
        setSections(res.sections);
        if (res.sections.length > 0) {
          setSectionId((prev) => prev ?? res.sections[0].id);
        }
      })
      .catch(() => setError("We couldn't load your sections."));
  }, []);

  const load = useCallback(async (sid: number) => {
    const token = getToken();
    if (!token) return;
    const [s, c, sum] = await Promise.all([
      fetchTeacherLabSettings(sid, token),
      fetchTeacherLabCatalog(token, sid),
      fetchTeacherLabSummary(token, sid),
    ]);
    setSettings(s);
    setCatalog(c);
    setSummary(sum);
    // Seed disclosure selectors from any existing assignment.
    const seed: Record<number, LabDisclosureMode> = {};
    for (const group of c.groups) {
      for (const lab of group.labs) {
        seed[lab.id] = lab.assigned_disclosure_mode ?? lab.default_disclosure_mode;
      }
    }
    setModes(seed);
  }, []);

  useEffect(() => {
    if (sectionId === undefined) return;
    // Loading lab data on section change is external-state synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(sectionId).catch(() => setError("We couldn't load lab data for this section."));
  }, [sectionId, load]);

  async function toggleLabMode(enabled: boolean) {
    const token = getToken();
    if (!token || sectionId === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await updateTeacherLabSettings(sectionId, { enabled }, token);
      await load(sectionId);
    } catch {
      setError("We couldn't update lab mode.");
    } finally {
      setBusy(false);
    }
  }

  async function assign(lab: LabCatalogCard) {
    const token = getToken();
    if (!token || sectionId === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await assignTeacherLab(
        { mission_id: lab.id, section_id: sectionId, disclosure_mode: modes[lab.id] ?? lab.default_disclosure_mode },
        token,
      );
      await load(sectionId);
    } catch {
      setError("We couldn't assign that lab.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(lab: LabCatalogCard) {
    const token = getToken();
    if (!token || sectionId === undefined || lab.assignment_id == null) return;
    // Two-step confirm: first click arms, second click performs the reset.
    if (resetPending !== lab.assignment_id) {
      setResetPending(lab.assignment_id);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await resetTeacherLabEvents(
        { section_id: sectionId, assignment_id: lab.assignment_id, confirm: true },
        token,
      );
      setSummary(res.summary);
      setResetPending(null);
    } catch {
      setError("We couldn't reset that lab's events.");
    } finally {
      setBusy(false);
    }
  }

  const enabled = settings?.settings.enabled ?? false;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted">
        <span>Teacher</span>
        <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
        <span className="text-body">Simulated Labs</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Simulated Attack Labs</h1>
          <p className="mt-1 text-sm text-muted">
            Enable lab mode, assign unit-aligned labs, and review aggregate class trends.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-muted">Section</span>
          <select
            value={sectionId ?? ""}
            onChange={(e) => setSectionId(Number(e.target.value))}
            className="h-10 min-w-[170px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {settings && (
        <AcknowledgementPanel
          data={settings}
          onEnable={() => void toggleLabMode(true)}
          onDisable={() => void toggleLabMode(false)}
          busy={busy}
        />
      )}

      {enabled && summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Lab attempts" value={summary.total_attempts} />
            <StatCard label="Completed" value={summary.completed} tone="text-emerald-600" />
            <StatCard label="Needs review" value={summary.needs_review} tone="text-orange-600" />
            <StatCard
              label="Most missed"
              value={summary.most_missed_indicators[0]?.label ?? "—"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DistributionList
              title="Most commonly missed indicators"
              items={summary.most_missed_indicators}
              emptyText="No missed-indicator data yet."
            />
            <DistributionList
              title="Mitigation choices selected"
              items={summary.mitigation_distribution}
              emptyText="No mitigation selections yet."
            />
          </div>

          <Card className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              Unit lab coverage
            </p>
            {summary.unit_coverage.length === 0 ? (
              <p className="text-xs text-muted">No lab attempts recorded yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {summary.unit_coverage.map((u) => (
                  <li key={u.unit_order} className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-[11px] font-semibold text-subtle">Unit {u.unit_order}</p>
                    <p className="mt-1 text-lg font-bold text-ink">
                      {u.completed}/{u.attempts}
                    </p>
                    <p className="text-[11px] text-muted">completed</p>
                  </li>
                ))}
              </ul>
            )}
            {summary.reset_state.last_reset_at && (
              <p className="mt-3 text-xs text-muted">
                Last reset: {new Date(summary.reset_state.last_reset_at).toLocaleString()}
              </p>
            )}
          </Card>
        </>
      )}

      {/* Catalog */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Lab catalog</h2>
        {!catalog ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          catalog.groups.map((group) => (
            <Card key={group.unit.id} className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <UnitBadge unit={group.unit} />
                <span className="text-sm font-semibold text-ink">{group.unit.title}</span>
              </div>
              <div className="space-y-2.5">
                {group.labs.map((lab) => (
                  <LabRow
                    key={lab.id}
                    lab={lab}
                    mode={modes[lab.id] ?? lab.default_disclosure_mode}
                    onModeChange={(mode) => setModes((prev) => ({ ...prev, [lab.id]: mode }))}
                    onAssign={() => void assign(lab)}
                    onReset={() => void reset(lab)}
                    resetPending={resetPending === lab.assignment_id}
                    busy={busy}
                    sectionEnabled={enabled}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
        <p className="text-xs text-muted">
          Individual submissions appear in your{" "}
          <Link href="/teacher" className="font-medium text-primary hover:underline">
            review queue
          </Link>{" "}
          for grading. Lab events are synthetic and never contain real credentials.
        </p>
      </div>
    </div>
  );
}

export default function TeacherLabsPage() {
  return (
    <AppShell active="labs" expectRole="teacher">
      <LabsContent />
    </AppShell>
  );
}
