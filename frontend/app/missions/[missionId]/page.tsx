"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronRight,
  faCircleCheck,
  faCircleXmark,
  faCloud,
  faDesktop,
  faEllipsisVertical,
  faExpand,
  faLock,
  faNetworkWired,
  faPlus,
  faServer,
  faShieldHalved,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import {
  addSupportEvent,
  fetchAttempt,
  runAutoCheck,
  saveAttemptDraft,
  startAttempt,
  submitAttempt,
  type AttemptWorkspace,
  type AutoCheck,
  type FirewallRule,
  type LabActivity,
  type MissionQuestion,
  type NetworkNode,
  type NetworkPayload,
  type SupportEvent,
  type SupportSignal,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDueLabel, formatTime } from "@/lib/format";
import { SUPPORT_META, SUPPORT_ORDER } from "@/lib/support";
import { AppShell } from "../../components/app-shell";
import { AiTutorPanel } from "../../components/ai-tutor-panel";
import { AttackSimulationRenderer } from "../../components/attack-simulation-renderer";
import { Card, ProgressBar, UNIT_ACCENTS } from "../../components/ui";

const NODE_ICONS: Record<string, IconDefinition> = {
  internet: faCloud,
  router: faServer,
  host: faDesktop,
  server: faServer,
  segment: faNetworkWired,
};

const NODE_ACCENT: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-violet-100 text-violet-600",
};

/* --------------------------------------------------------------------------- */
/* Tasks + support panels                                                       */
/* --------------------------------------------------------------------------- */

function TasksPanel({ steps }: { steps: AttemptWorkspace["steps"] }) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">Tasks</p>
      <ul className="space-y-0.5">
        {steps.map((step) => {
          const done = step.state === "completed";
          const current = step.state === "current";
          return (
            <li
              key={step.key}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                current ? "bg-primary-light font-semibold text-primary" : "text-body"
              }`}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "border-2 border-primary"
                      : "border-2 border-slate-300"
                }`}
              >
                {done && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
              </span>
              {step.label}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SupportSignals({
  active,
  onSelect,
}: {
  active: SupportSignal;
  onSelect: (signal: SupportSignal) => void;
}) {
  return (
    <Card className="p-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
        Support Signals
      </p>
      <div className="space-y-2">
        {SUPPORT_ORDER.map((signal) => {
          const meta = SUPPORT_META[signal];
          const isActive = signal === active;
          return (
            <button
              key={signal}
              type="button"
              onClick={() => onSelect(signal)}
              aria-pressed={isActive}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? `${meta.activeBg} ${meta.activeText} ${meta.activeBorder}`
                  : "border-slate-200 bg-white text-body hover:bg-slate-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
              {meta.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function SupportTimeline({ events }: { events: SupportEvent[] }) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
        Support Timeline
      </p>
      {events.length === 0 ? (
        <p className="text-xs text-muted">
          No support changes recorded. This attempt is marked Independent.
        </p>
      ) : (
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
                  <p className="text-xs text-muted">{formatTime(event.created_at)}</p>
                  <p className={`text-sm font-medium ${meta.text}`}>{meta.label}</p>
                  {event.note && <p className="text-xs text-muted">{event.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Link
        href="/support"
        className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
      >
        View full timeline
      </Link>
    </Card>
  );
}

/* --------------------------------------------------------------------------- */
/* Network simulator                                                            */
/* --------------------------------------------------------------------------- */

function TopologyNode({
  node,
  left,
  top,
}: {
  node: NetworkNode;
  left: number;
  top: number;
}) {
  const accent = node.accent ? NODE_ACCENT[node.accent] : "bg-slate-100 text-slate-500";
  return (
    <div
      className="absolute w-28 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-sm"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <span className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-lg ${accent}`}>
        <FontAwesomeIcon icon={NODE_ICONS[node.type] ?? faServer} className="text-sm" aria-hidden="true" />
      </span>
      <p className="text-xs font-semibold text-ink">{node.label}</p>
      {node.sub && <p className="text-[10px] text-muted">{node.sub}</p>}
    </div>
  );
}

function TopologyCanvas({ payload }: { payload: NetworkPayload }) {
  const nodes = payload.topology.nodes;
  // Fixed layout positions (percentages) matching the mission scenario.
  const positions: Record<string, { left: number; top: number }> = {
    internet: { left: 50, top: 12 },
    router: { left: 50, top: 44 },
    students: { left: 20, top: 82 },
    staff: { left: 50, top: 82 },
    servers: { left: 80, top: 82 },
  };
  const lines: [string, string][] = payload.topology.edges;

  return (
    <div className="relative h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(#eef2f8_1px,transparent_1px)] [background-size:16px_16px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {lines.map(([from, to]) => {
          const a = positions[from];
          const b = positions[to];
          if (!a || !b) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.left}
              y1={a.top}
              x2={b.left}
              y2={b.top}
              stroke="#c3d0e4"
              strokeWidth="0.6"
            />
          );
        })}
      </svg>
      {nodes.map((node) => {
        const pos = positions[node.id] ?? { left: 50, top: 50 };
        return <TopologyNode key={node.id} node={node} left={pos.left} top={pos.top} />;
      })}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[11px] text-subtle">
        Drag to pan · Scroll to zoom
      </div>
      <button
        type="button"
        aria-label="Fit view"
        className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-subtle"
      >
        <FontAwesomeIcon icon={faExpand} className="text-xs" aria-hidden="true" />
      </button>
    </div>
  );
}

function FirewallTable({
  rules,
  onAddRule,
}: {
  rules: FirewallRule[];
  onAddRule: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Firewall Rules <span className="normal-case text-slate-400">(Top to Bottom)</span>
        </p>
        <button
          type="button"
          onClick={onAddRule}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-light"
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Add Rule
        </button>
      </div>
      <div className="overflow-x-auto cipher-scroll">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-subtle">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-2 py-2 font-semibold">Action</th>
              <th className="px-2 py-2 font-semibold">Source</th>
              <th className="px-2 py-2 font-semibold">Destination</th>
              <th className="px-2 py-2 font-semibold">Service</th>
              <th className="px-3 py-2 font-semibold">Port</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <tr key={rule.order} className="text-body">
                <td className="px-3 py-2 text-muted">{rule.order}</td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      rule.action === "allow"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {rule.action}
                  </span>
                </td>
                <td className="px-2 py-2">{rule.source}</td>
                <td className="px-2 py-2">{rule.destination}</td>
                <td className="px-2 py-2">{rule.service}</td>
                <td className="px-3 py-2">{rule.port}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrafficResults({ payload }: { payload: NetworkPayload }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
        Test Traffic Result
      </p>
      <ul className="space-y-2">
        {payload.traffic_tests.map((test, i) => {
          const allowed = test.actual === "allowed";
          return (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-body">
                <FontAwesomeIcon
                  icon={test.passed ? faCircleCheck : faCircleXmark}
                  className={test.passed ? "text-emerald-500" : "text-rose-500"}
                  aria-hidden="true"
                />
                {test.source} → {test.destination} ({test.service})
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  allowed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {allowed ? "Allowed" : "Blocked"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NotesPanel({
  value,
  onChange,
  onSave,
  saveState,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saveState: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Notes</p>
        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
          {saveState}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        placeholder="Write your explanation here…"
        rows={4}
        className="w-full resize-none rounded-lg border border-slate-200 p-2.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function NetworkSimulator({
  attemptId,
  initial,
  token,
}: {
  attemptId: number;
  initial: NetworkPayload;
  token: string;
}) {
  const [payload, setPayload] = useState<NetworkPayload>(initial);
  const [tab, setTab] = useState<"topology" | "rules">("topology");
  const [saveState, setSaveState] = useState("Saved");

  async function persist(next: NetworkPayload) {
    setPayload(next);
    setSaveState("Saving…");
    try {
      await saveAttemptDraft(attemptId, { evidence_type: "network", payload: next as unknown as Record<string, unknown> }, token);
      setSaveState("Saved");
    } catch {
      setSaveState("Save failed");
    }
  }

  function addRule() {
    const nextOrder = payload.firewall_rules.length + 1;
    const next: NetworkPayload = {
      ...payload,
      firewall_rules: [
        ...payload.firewall_rules,
        { order: nextOrder, action: "deny", source: "Any", destination: "Any", service: "All", port: "All" },
      ],
    };
    void persist(next);
  }

  return (
    <Card className="p-4">
      {/* Tabs */}
      <div className="mb-3 flex items-center gap-1 border-b border-slate-100">
        {([
          ["topology", "Topology", faNetworkWired],
          ["rules", "Firewall Rules", faShieldHalved],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-body"
            }`}
          >
            <FontAwesomeIcon icon={icon} className="text-xs" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tab === "topology" ? (
          <TopologyCanvas payload={payload} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted">
            Firewall rules are evaluated top to bottom. Adjust the table on the right, then run
            traffic tests to verify each segment.
          </div>
        )}
        <FirewallTable rules={payload.firewall_rules} onAddRule={addRule} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TrafficResults payload={payload} />
        <NotesPanel
          value={payload.notes}
          onChange={(v) => setPayload({ ...payload, notes: v })}
          onSave={() => void persist(payload)}
          saveState={saveState}
        />
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------------------- */
/* Generic (non-network) renderer                                               */
/* --------------------------------------------------------------------------- */

function GenericRenderer({
  attemptId,
  mission,
  evidence,
  token,
}: {
  attemptId: number;
  mission: AttemptWorkspace["mission"];
  evidence: AttemptWorkspace["evidence"];
  token: string;
}) {
  const existing = evidence.find((e) => ["written", "case", "reflection"].includes(e.evidence_type));
  const initialText =
    (existing?.payload?.response as string) ??
    (existing?.payload?.explanation as string) ??
    "";
  const [text, setText] = useState(initialText);
  const [saveState, setSaveState] = useState("Saved");
  const caseLog = evidence.find((e) => e.evidence_type === "case")?.payload?.log_excerpt as
    | string
    | undefined;

  async function save() {
    setSaveState("Saving…");
    try {
      await saveAttemptDraft(
        attemptId,
        { evidence_type: "written", payload: { response: text }, progress_percent: 60 },
        token,
      );
      setSaveState("Saved");
    } catch {
      setSaveState("Save failed");
    }
  }

  return (
    <Card className="p-5">
      {mission.context_brief && (
        <div className="mb-4 rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Scenario</p>
          <p className="mt-1 text-sm leading-relaxed text-body">{mission.context_brief}</p>
        </div>
      )}
      {caseLog && (
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Evidence — Log Excerpt
          </p>
          <pre className="overflow-x-auto cipher-scroll rounded-xl bg-navy p-4 font-mono text-xs leading-relaxed text-slate-200">
            {caseLog}
          </pre>
        </div>
      )}
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Your Response
        </p>
        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
          {saveState}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        placeholder="Write your response, citing the evidence you used…"
        rows={10}
        className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </Card>
  );
}

/* --------------------------------------------------------------------------- */
/* Multiple-choice renderer                                                     */
/* --------------------------------------------------------------------------- */

function MCQRenderer({
  attemptId,
  mission,
  questions,
  evidence,
  token,
}: {
  attemptId: number;
  mission: AttemptWorkspace["mission"];
  questions: MissionQuestion[];
  evidence: AttemptWorkspace["evidence"];
  token: string;
}) {
  const saved = evidence.find((e) => e.evidence_type === "mcq")?.payload?.answers as
    | Record<string, number>
    | undefined;
  const [answers, setAnswers] = useState<Record<string, number>>(saved ?? {});
  const [saveState, setSaveState] = useState("Saved");

  async function choose(qid: number, optionIndex: number) {
    const next = { ...answers, [String(qid)]: optionIndex };
    setAnswers(next);
    setSaveState("Saving…");
    const pct = Math.round((Object.keys(next).length / questions.length) * 100);
    try {
      await saveAttemptDraft(
        attemptId,
        { evidence_type: "mcq", payload: { answers: next }, progress_percent: pct },
        token,
      );
      setSaveState("Saved");
    } catch {
      setSaveState("Save failed");
    }
  }

  return (
    <Card className="p-5">
      {mission.context_brief && (
        <div className="mb-4 rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Scenario</p>
          <p className="mt-1 text-sm leading-relaxed text-body">{mission.context_brief}</p>
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Questions <span className="text-slate-400">({Object.keys(answers).length}/{questions.length})</span>
        </p>
        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
          {saveState}
        </span>
      </div>
      <ol className="space-y-5">
        {questions.map((question, qi) => (
          <li key={question.id}>
            <p className="text-sm font-semibold text-ink">
              {qi + 1}. {question.prompt}
            </p>
            <div className="mt-2.5 space-y-2">
              {question.options.map((option, oi) => {
                const selected = answers[String(question.id)] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => void choose(question.id, oi)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                      selected
                        ? "border-primary bg-primary-light font-medium text-primary"
                        : "border-slate-200 text-body hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                        selected ? "border-primary" : "border-slate-300"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* --------------------------------------------------------------------------- */
/* Objective auto-check                                                         */
/* --------------------------------------------------------------------------- */

function AutoCheckCard({
  attemptId,
  initial,
  token,
  locked,
}: {
  attemptId: number;
  initial: AutoCheck;
  token: string;
  locked: boolean;
}) {
  const [auto, setAuto] = useState<AutoCheck>(initial);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await runAutoCheck(attemptId, token);
      setAuto(res.auto_check);
    } catch {
      /* leave previous result in place */
    } finally {
      setRunning(false);
    }
  }

  const checks = auto?.details?.checks ?? [];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Objective Auto-Check
        </p>
        {!locked && (
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-light disabled:opacity-60"
          >
            {running ? "Checking…" : "Check my work"}
          </button>
        )}
      </div>
      {auto ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-ink">
            {auto.details?.label ?? "Auto-check"} —{" "}
            <span className={auto.passed ? "text-emerald-600" : "text-amber-600"}>
              {auto.score}/{auto.max_score} passed
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {checks.map((check, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-body">
                <FontAwesomeIcon
                  icon={check.passed ? faCircleCheck : faCircleXmark}
                  className={check.passed ? "text-emerald-500" : "text-rose-500"}
                  aria-hidden="true"
                />
                {check.name}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">
          Run an objective check to see how your work scores against the answer key. This also
          runs automatically when you submit.
        </p>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------------------- */
/* Workspace shell                                                              */
/* --------------------------------------------------------------------------- */

function Workspace() {
  const params = useParams<{ missionId: string }>();
  const missionId = Number(params.missionId);
  const [data, setData] = useState<AttemptWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [activeSignal, setActiveSignal] = useState<SupportSignal>("independent");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = getToken();
    if (!token || Number.isNaN(missionId)) return;
    startAttempt({ mission_id: missionId }, token)
      .then((ws) => {
        setData(ws);
        setEvents(ws.support.events);
        setActiveSignal(ws.support.active);
      })
      .catch(() => setError("We couldn't open this mission."));
  }, [missionId]);

  async function selectSignal(signal: SupportSignal) {
    if (!data || signal === activeSignal) return;
    const token = getToken();
    if (!token) return;
    setActiveSignal(signal);
    try {
      const event = await addSupportEvent(data.attempt.id, { to_signal: signal }, token);
      setEvents((prev) => [...prev, event]);
    } catch {
      /* keep optimistic state; timeline will resync on reload */
    }
  }

  async function handleSubmit() {
    if (!data) return;
    const token = getToken();
    if (!token) return;
    setSubmitState("loading");
    setSubmitError(null);
    try {
      await submitAttempt(data.attempt.id, token);
      setSubmitState("done");
      const refreshed = await fetchAttempt(data.attempt.id, token);
      setData(refreshed);
    } catch (err) {
      setSubmitState("idle");
      setSubmitError(
        err instanceof Error ? err.message : "We couldn't submit this attempt.",
      );
    }
  }

  // Re-pull the attempt so support signal + timeline reflect a server-side
  // change (e.g. the AI tutor recording an AI support event).
  async function refresh() {
    if (!data) return;
    const token = getToken();
    if (!token) return;
    try {
      const ws = await fetchAttempt(data.attempt.id, token);
      setData(ws);
      setEvents(ws.support.events);
      setActiveSignal(ws.support.active);
    } catch {
      /* keep current state; a manual reload will resync */
    }
  }

  const networkPayload = useMemo(() => {
    const net = data?.evidence.find((e) => e.evidence_type === "network");
    return net ? (net.payload as unknown as NetworkPayload) : null;
  }, [data]);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-10 w-96 animate-pulse rounded bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const { mission, attempt } = data;
  const accent = UNIT_ACCENTS[mission.unit.accent];
  const token = getToken() ?? "";
  const submitted = ["submitted", "auto_checked", "needs_teacher_review", "graded", "returned"].includes(
    attempt.status,
  );
  const mcqQuestions = data.activity?.questions ?? [];
  const isObjective = ["multiple_choice", "network_simulation"].includes(mission.mission_type);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/missions" className="hover:text-primary">
            Missions
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
          <span className="text-body">{mission.title}</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">{mission.title}</h1>
              <span
                className={`inline-flex items-center rounded-full ${accent.softBg} ${accent.softText} px-2.5 py-1 text-xs font-medium`}
              >
                {mission.unit.title.split(" ").slice(-1)[0] === "Networks"
                  ? "Networks"
                  : mission.unit.title}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted">{mission.summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="More actions"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-body"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitState !== "idle" || submitted}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitted ? "Submitted" : submitState === "loading" ? "Submitting…" : "Submit Attempt"}
            </button>
          </div>
        </div>
        {submitError && (
          <p className="mt-2 text-right text-xs font-medium text-rose-600">{submitError}</p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <FontAwesomeIcon icon={faLock} className="text-[10px]" aria-hidden="true" />
            {formatDueLabel(attempt.due_at)}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">Attempt Progress</span>
            <ProgressBar value={attempt.progress_percent} className="w-40" />
            <span className="text-xs font-semibold text-ink">{attempt.progress_percent}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          <TasksPanel steps={data.steps} />
          <SupportSignals active={activeSignal} onSelect={selectSignal} />
          <SupportTimeline events={events} />
        </div>

        <div className="space-y-4">
          {mission.mission_type === "attack_simulation" ? (
            <AttackSimulationRenderer
              attemptId={attempt.id}
              mission={mission}
              activity={data.activity as unknown as LabActivity}
              evidence={data.evidence}
              token={token}
              submitted={submitted}
              onActivityUpdated={refresh}
            />
          ) : mission.mission_type === "multiple_choice" && mcqQuestions.length > 0 ? (
            <MCQRenderer
              attemptId={attempt.id}
              mission={mission}
              questions={mcqQuestions}
              evidence={data.evidence}
              token={token}
            />
          ) : networkPayload ? (
            <NetworkSimulator attemptId={attempt.id} initial={networkPayload} token={token} />
          ) : (
            <GenericRenderer
              attemptId={attempt.id}
              mission={mission}
              evidence={data.evidence}
              token={token}
            />
          )}

          {isObjective && (
            <AutoCheckCard
              attemptId={attempt.id}
              initial={data.auto_check}
              token={token}
              locked={submitted}
            />
          )}

          <AiTutorPanel attemptId={attempt.id} onSupportUsed={refresh} disabled={submitted} />
        </div>
      </div>
    </div>
  );
}

export default function MissionWorkspacePage() {
  return (
    <AppShell active="missions" expectRole="student">
      <Workspace />
    </AppShell>
  );
}
