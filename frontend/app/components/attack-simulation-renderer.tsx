"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
  faDatabase,
  faDoorOpen,
  faFlag,
  faKey,
  faLock,
  faNetworkWired,
  faShieldHalved,
  faTriangleExclamation,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import {
  saveAttemptDraft,
  submitLabEvent,
  type AttemptWorkspace,
  type EvidenceEntry,
  type LabActivity,
  type LabEventSubmit,
} from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Card } from "./ui";

const LAB_ICONS: Record<string, IconDefinition> = {
  credential_trap: faKey,
  physical_tailgating: faDoorOpen,
  network_anomaly: faNetworkWired,
  device_input_capture: faShieldHalved,
  app_data_access: faDatabase,
};

type Props = {
  attemptId: number;
  mission: AttemptWorkspace["mission"];
  activity: LabActivity;
  evidence: EvidenceEntry[];
  token: string;
  submitted: boolean;
  onActivityUpdated?: () => void;
};

/* --------------------------------------------------------------------------- */
/* Small building blocks                                                        */
/* --------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
      {children}
    </p>
  );
}

function SafetyNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900">
      <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5 text-blue-500" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function ScenarioPanel({ activity }: { activity: LabActivity }) {
  const scenario = activity.scenario ?? {};
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <SectionLabel>Scenario</SectionLabel>
      {scenario.title && <p className="text-sm font-semibold text-ink">{scenario.title}</p>}
      {scenario.brief && <p className="mt-1 text-sm leading-relaxed text-body">{scenario.brief}</p>}
      {scenario.task && (
        <p className="mt-2 rounded-lg bg-white p-2.5 text-sm leading-relaxed text-body">
          <span className="font-semibold text-ink">Your task: </span>
          {scenario.task}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/* Interaction (varies by lab type)                                             */
/* --------------------------------------------------------------------------- */

type EventSender = (payload: LabEventSubmit) => Promise<void>;

function CredentialForm({
  activity,
  onEvent,
  disabled,
}: {
  activity: LabActivity;
  onEvent: EventSender;
  disabled: boolean;
}) {
  const identity = activity.dummy_identity;
  const isInput = activity.lab_type === "device_input_capture";
  const dummyEvent = isInput ? "dummy_input_submitted" : "dummy_credential_submitted";
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const scenario = activity.scenario ?? {};

  const realEmail = getStoredUser()?.email?.toLowerCase() ?? "";

  async function attempt() {
    setWarning(null);
    const typed = passcode.trim();
    const typedUser = username.trim().toLowerCase();
    // All comparisons are local: the raw typed value is never sent to the server.
    const looksReal =
      (realEmail && (typedUser === realEmail || typed.toLowerCase() === realEmail)) ||
      (typed !== "" && identity?.passcode !== undefined && typed !== identity.passcode);
    if (looksReal) {
      setWarning(
        "That doesn't match the lab account. Never enter a real password — use only the generated lab credentials shown above.",
      );
      await onEvent({ event_type: "real_credential_warning_shown" });
      return;
    }
    await onEvent({
      event_type: dummyEvent,
      dummy_identity_id: identity?.id ?? null,
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <SectionLabel>{isInput ? "Shared Workstation" : "Portal Login"}</SectionLabel>
      {!isInput && Boolean(scenario.portal_domain) && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200">
          <FontAwesomeIcon icon={faLock} className="text-slate-400" aria-hidden="true" />
          https://{String(scenario.portal_domain)}/login
        </div>
      )}
      {identity && (
        <div className="mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <p className="font-semibold">Use this lab account only</p>
          <p className="mt-0.5 font-mono">
            {identity.username} · {identity.passcode}
          </p>
        </div>
      )}
      <div className="space-y-2.5">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={disabled}
          placeholder="Username"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          disabled={disabled}
          type="password"
          placeholder={isInput ? "Lab passcode" : "Password"}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
      </div>
      {warning && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden="true" />
          {warning}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void attempt()}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {isInput ? "Submit lab text" : "Log in"}
        </button>
        {!isInput ? (
          <>
            <button
              type="button"
              onClick={() => void onEvent({ event_type: "notice_reported" })}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-body transition hover:bg-slate-50 disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faFlag} aria-hidden="true" /> Report message
            </button>
            <button
              type="button"
              onClick={() => void onEvent({ event_type: "domain_verified" })}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-body transition hover:bg-slate-50 disabled:opacity-60"
            >
              Verify domain
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void onEvent({ event_type: "device_reported" })}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-body transition hover:bg-slate-50 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faFlag} aria-hidden="true" /> Report device
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewList({
  activity,
  onEvent,
  disabled,
}: {
  activity: LabActivity;
  onEvent: EventSender;
  disabled: boolean;
}) {
  const scenario = activity.scenario ?? {};
  const items = (scenario.events ?? scenario.flows ?? []) as { id: string; text: string }[];
  const isNetwork = activity.lab_type === "network_anomaly";
  const reviewEvent = isNetwork ? "board_reviewed" : "sequence_reviewed";

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <SectionLabel>{isNetwork ? "Network Activity Board" : "Entry Sequence"}</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-body"
          >
            <FontAwesomeIcon
              icon={isNetwork ? faNetworkWired : faDoorOpen}
              className="text-slate-400"
              aria-hidden="true"
            />
            {item.text}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => void onEvent({ event_type: reviewEvent })}
        disabled={disabled}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        Complete review
      </button>
    </div>
  );
}

function RecordsExplorer({
  activity,
  onEvent,
  disabled,
}: {
  activity: LabActivity;
  onEvent: EventSender;
  disabled: boolean;
}) {
  const scenario = activity.scenario ?? {};
  const records = (scenario.records ?? []) as { id: string; text: string }[];
  const [openedOwn, setOpenedOwn] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <SectionLabel>Student Records Lookup</SectionLabel>
      <ul className="space-y-2">
        {records.map((record, i) => {
          const isOwn = i === 0;
          return (
            <li
              key={record.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-body"
            >
              <span className="font-mono">{record.text}</span>
              <button
                type="button"
                disabled={disabled || (!isOwn && !openedOwn)}
                onClick={() => {
                  if (isOwn) {
                    setOpenedOwn(true);
                    void onEvent({ event_type: "records_opened" });
                  } else {
                    void onEvent({ event_type: "unauthorized_record_viewed" });
                  }
                }}
                className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition disabled:opacity-40 ${
                  isOwn
                    ? "border border-slate-200 text-body hover:bg-white"
                    : "border border-rose-200 text-rose-700 hover:bg-rose-50"
                }`}
              >
                {isOwn ? "Open" : "Try this id"}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => void onEvent({ event_type: "access_reported" })}
        disabled={disabled}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-body transition hover:bg-slate-50 disabled:opacity-60"
      >
        <FontAwesomeIcon icon={faFlag} aria-hidden="true" /> Report &amp; stop
      </button>
    </div>
  );
}

function InteractionPanel({
  activity,
  onEvent,
  disabled,
}: {
  activity: LabActivity;
  onEvent: EventSender;
  disabled: boolean;
}) {
  switch (activity.lab_type) {
    case "credential_trap":
    case "device_input_capture":
      return <CredentialForm activity={activity} onEvent={onEvent} disabled={disabled} />;
    case "physical_tailgating":
    case "network_anomaly":
      return <ReviewList activity={activity} onEvent={onEvent} disabled={disabled} />;
    case "app_data_access":
      return <RecordsExplorer activity={activity} onEvent={onEvent} disabled={disabled} />;
    default:
      return null;
  }
}

/* --------------------------------------------------------------------------- */
/* Debrief                                                                      */
/* --------------------------------------------------------------------------- */

function DebriefPanel({
  activity,
  noticed,
  onToggleNoticed,
  disabled,
}: {
  activity: LabActivity;
  noticed: string[];
  onToggleNoticed: (id: string) => void;
  disabled: boolean;
}) {
  const debrief = activity.debrief;
  const indicators = activity.indicators ?? [];
  if (!debrief) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleInfo} className="text-violet-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-violet-900">What happened</p>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-violet-900">{debrief.summary}</p>
        <p className="mt-2 text-sm font-medium text-violet-900">Impact: {debrief.impact}</p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-emerald-900">What was NOT collected</p>
        </div>
        <ul className="mt-1.5 space-y-1">
          {debrief.not_collected.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
              <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5 text-emerald-500" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <SectionLabel>Attack Path</SectionLabel>
        <ol className="space-y-3">
          {debrief.timeline.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {i < debrief.timeline.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-ink">{step.label}</p>
                <p className="text-xs text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <SectionLabel>Indicators — check the ones you noticed</SectionLabel>
        <div className="space-y-2">
          {indicators.map((indicator) => {
            const checked = noticed.includes(indicator.id);
            return (
              <button
                key={indicator.id}
                type="button"
                onClick={() => onToggleNoticed(indicator.id)}
                disabled={disabled}
                className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                  checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border-2 text-[9px] ${
                    checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                  }`}
                >
                  {checked && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{indicator.title}</span>
                  <span className="block text-xs text-muted">{indicator.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/* Analysis                                                                     */
/* --------------------------------------------------------------------------- */

function AnalysisPanel({
  activity,
  chosen,
  onToggleChoice,
  responses,
  onChangeResponse,
  onSave,
  saveState,
  disabled,
}: {
  activity: LabActivity;
  chosen: string[];
  onToggleChoice: (id: string) => void;
  responses: Record<string, string>;
  onChangeResponse: (id: string, value: string) => void;
  onSave: () => void;
  saveState: string;
  disabled: boolean;
}) {
  const choices = activity.mitigation_choices ?? [];
  const prompts = activity.analysis_prompts ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <SectionLabel>Choose mitigations</SectionLabel>
        <div className="space-y-2">
          {choices.map((choice) => {
            const checked = chosen.includes(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onToggleChoice(choice.id)}
                disabled={disabled}
                className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                  checked ? "border-primary bg-primary-light" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border-2 text-[9px] ${
                    checked ? "border-primary bg-primary text-white" : "border-slate-300"
                  }`}
                >
                  {checked && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${checked ? "text-primary" : "text-ink"}`}>
                    {choice.label}
                  </span>
                  <span className="block text-xs text-muted">{choice.rationale}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>Your analysis</SectionLabel>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600">
            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            {saveState}
          </span>
        </div>
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <label key={prompt.id} className="block">
              <span className="text-sm font-medium text-body">
                {prompt.prompt}
                {prompt.required && <span className="ml-1 text-rose-500">*</span>}
              </span>
              <textarea
                value={responses[prompt.id] ?? ""}
                onChange={(e) => onChangeResponse(prompt.id, e.target.value)}
                onBlur={onSave}
                disabled={disabled}
                rows={3}
                placeholder="Write your answer, citing the evidence you used…"
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 p-2.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          Save analysis
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/* Renderer                                                                     */
/* --------------------------------------------------------------------------- */

export function AttackSimulationRenderer({
  attemptId,
  activity: initialActivity,
  evidence,
  token,
  submitted,
  onActivityUpdated,
}: Props) {
  const [activity, setActivity] = useState<LabActivity>(initialActivity);

  const savedAnalysis = useMemo(() => {
    const found = evidence.find((e) => e.evidence_type === "lab_analysis")?.payload as
      | { mitigation_choice_ids?: string[]; responses?: Record<string, string>; noticed_indicator_ids?: string[] }
      | undefined;
    return found ?? {};
  }, [evidence]);

  const [chosen, setChosen] = useState<string[]>(savedAnalysis.mitigation_choice_ids ?? []);
  const [noticed, setNoticed] = useState<string[]>(savedAnalysis.noticed_indicator_ids ?? []);
  const [responses, setResponses] = useState<Record<string, string>>(savedAnalysis.responses ?? {});
  const [saveState, setSaveState] = useState("Saved");
  const [eventError, setEventError] = useState<string | null>(null);

  const disabled = submitted;
  const unlocked = activity.debrief_unlocked;

  async function sendEvent(payload: LabEventSubmit) {
    setEventError(null);
    try {
      const res = await submitLabEvent(attemptId, { lab_type: activity.lab_type, ...payload }, token);
      setActivity(res.activity);
      onActivityUpdated?.();
    } catch {
      setEventError("We couldn't record that action. Please try again.");
    }
  }

  async function saveAnalysis() {
    setSaveState("Saving…");
    try {
      await saveAttemptDraft(
        attemptId,
        {
          evidence_type: "lab_analysis",
          payload: {
            mitigation_choice_ids: chosen,
            noticed_indicator_ids: noticed,
            responses,
          },
          progress_percent: 90,
        },
        token,
      );
      setSaveState("Saved");
      onActivityUpdated?.();
    } catch {
      setSaveState("Save failed");
    }
  }

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const labIcon = LAB_ICONS[activity.lab_type ?? ""] ?? faShieldHalved;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
          <FontAwesomeIcon icon={labIcon} aria-hidden="true" />
          Simulated Attack Lab
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            activity.disclosure_mode === "transparent"
              ? "bg-blue-50 text-blue-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {activity.disclosure_mode === "transparent" ? "Transparent mode" : "Surprise mode"}
        </span>
      </div>

      <div className="space-y-4">
        {activity.transparency_notice && <SafetyNotice text={activity.transparency_notice} />}
        <ScenarioPanel activity={activity} />

        {!unlocked && (
          <InteractionPanel activity={activity} onEvent={sendEvent} disabled={disabled} />
        )}

        {eventError && (
          <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">{eventError}</p>
        )}

        {unlocked && (
          <>
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-3 text-sm text-white">
              <FontAwesomeIcon icon={faCircleXmark} className="text-amber-400" aria-hidden="true" />
              The simulated event ran. Review the debrief below, then complete your analysis.
            </div>
            <DebriefPanel
              activity={activity}
              noticed={noticed}
              onToggleNoticed={(id) => toggle(noticed, setNoticed, id)}
              disabled={disabled}
            />
            <AnalysisPanel
              activity={activity}
              chosen={chosen}
              onToggleChoice={(id) => toggle(chosen, setChosen, id)}
              responses={responses}
              onChangeResponse={(id, value) =>
                setResponses((prev) => ({ ...prev, [id]: value }))
              }
              onSave={() => void saveAnalysis()}
              saveState={saveState}
              disabled={disabled}
            />
          </>
        )}
      </div>
    </Card>
  );
}
