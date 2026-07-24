"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleInfo,
  faRobot,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  fetchAiSession,
  fetchAttemptReview,
  gradeAttempt,
  type AiSession,
  type AttemptReview,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDateTime, formatTime } from "@/lib/format";
import { SUPPORT_META } from "@/lib/support";
import { AppShell, initials } from "../../../components/app-shell";
import { Card, StatusBadge, UnitBadge } from "../../../components/ui";

const TABS = [
  "Student Evidence",
  "Support Timeline",
  "Auto-Check Results",
  "AI Feedback",
  "Rubric",
] as const;
type Tab = (typeof TABS)[number];

const LOG_KEYWORDS: { match: string; className: string }[] = [
  { match: "USER LOGIN", className: "text-emerald-400" },
  { match: "USER LOGOUT", className: "text-slate-400" },
  { match: "FILE ACCESS", className: "text-amber-400" },
  { match: "COMMAND", className: "text-sky-400" },
  { match: "OUTBOUND", className: "text-rose-400" },
  { match: "PROCESS", className: "text-violet-400" },
];

function LogLine({ line }: { line: string }) {
  const keyword = LOG_KEYWORDS.find((k) => line.includes(k.match));
  if (!keyword) return <div className="text-slate-300">{line}</div>;
  const [before, after] = line.split(keyword.match);
  return (
    <div className="text-slate-500">
      {before}
      <span className={`font-semibold ${keyword.className}`}>{keyword.match}</span>
      <span className="text-slate-300">{after}</span>
    </div>
  );
}

function ReviewContent() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const attemptId = Number(params.attemptId);
  const [data, setData] = useState<AttemptReview | null>(null);
  const [aiSession, setAiSession] = useState<AiSession | null>(null);
  const [tab, setTab] = useState<Tab>("Student Evidence");
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [awarded, setAwarded] = useState<Record<number, number>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token || Number.isNaN(attemptId)) return;
    fetchAttemptReview(attemptId, token)
      .then((res) => {
        setData(res);
        setScore(res.grade?.final_score != null ? String(res.grade.final_score) : "");
        setComment(res.grade?.comment ?? "");
        const seed: Record<number, number> = {};
        res.grade?.criterion_scores.forEach((cs) => {
          seed[cs.criterion_id] = cs.points_awarded;
        });
        setAwarded(seed);
      })
      .catch(() => setError("We couldn't load this attempt."));
    fetchAiSession(attemptId, token)
      .then(setAiSession)
      .catch(() => setAiSession({ session: null, messages: [] }));
  }, [attemptId]);

  const logLines = useMemo(() => {
    const evidence = data?.evidence.find((e) => e.evidence_type === "case");
    const log = evidence?.payload?.log_excerpt as string | undefined;
    return log ? log.split("\n") : null;
  }, [data]);

  const writtenResponse = useMemo(() => {
    const evidence = data?.evidence.find((e) =>
      ["written", "case", "reflection"].includes(e.evidence_type),
    );
    return (
      (evidence?.payload?.explanation as string) ??
      (evidence?.payload?.response as string) ??
      null
    );
  }, [data]);

  async function handleFinalize() {
    if (!data) return;
    const token = getToken();
    if (!token) return;
    setSaveState("saving");
    try {
      const res = await gradeAttempt(
        data.attempt.id,
        {
          final_score: Number(score) || 0,
          comment,
          finalize: true,
          criterion_scores: Object.entries(awarded).map(([id, points]) => ({
            criterion_id: Number(id),
            points_awarded: points,
          })),
        },
        token,
      );
      setSaveState("saved");
      setData({ ...data, attempt: { ...data.attempt, status: res.status }, grade: res.grade });
    } catch {
      setSaveState("idle");
    }
  }

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-muted">
          <span>Teacher</span>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
          <span>Attempts</span>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" aria-hidden="true" />
          <span className="text-body">Attempt #{data.attempt.id}</span>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-body transition hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-body transition hover:bg-slate-50"
          >
            Next
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Attempt header */}
      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(data.student.name)}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{data.student.name}</p>
            <p className="text-xs text-muted">{data.section?.name ?? "—"}</p>
          </div>
        </div>
        <div className="sm:text-center">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink">{data.mission.title}</p>
            <UnitBadge unit={data.mission.unit} />
          </div>
          <p className="text-xs text-muted">Submitted {formatDateTime(data.attempt.submitted_at)}</p>
        </div>
        <StatusBadge status={data.attempt.status} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Evidence + tabs */}
        <Card className="p-5">
          <div className="mb-4 flex gap-1 overflow-x-auto cipher-scroll border-b border-slate-100">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-body"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Student Evidence" && (
            <div className="space-y-4">
              {logLines && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                    Log File Excerpt
                  </p>
                  <pre className="overflow-x-auto cipher-scroll rounded-xl bg-navy p-4 font-mono text-xs leading-relaxed">
                    {logLines.map((line, i) => (
                      <LogLine key={i} line={line} />
                    ))}
                  </pre>
                </div>
              )}
              {writtenResponse && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                    Student Explanation
                  </p>
                  <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-body">
                    {writtenResponse}
                  </p>
                </div>
              )}
              {!logLines && !writtenResponse && (
                <p className="py-8 text-center text-sm text-muted">No evidence submitted.</p>
              )}
            </div>
          )}

          {tab === "Support Timeline" && (
            <ol className="space-y-3">
              {data.support_events.map((event, i) => {
                const meta = SUPPORT_META[event.to_signal];
                return (
                  <li key={event.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                      {i < data.support_events.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div>
                      <p className="text-xs text-muted">{formatTime(event.created_at)}</p>
                      <p className={`text-sm font-medium ${meta.text}`}>
                        {meta.label} <span className="text-muted">({meta.system})</span>
                      </p>
                      {event.note && <p className="text-xs text-muted">{event.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {tab === "Auto-Check Results" &&
            (data.auto_check ? (
              <div>
                <p className="mb-3 text-sm font-medium text-ink">
                  {data.auto_check.details.label ?? "Auto-check"} —{" "}
                  <span className="text-emerald-600">
                    {data.auto_check.score}/{data.auto_check.max_score} passed
                  </span>
                </p>
                <ul className="space-y-2">
                  {(data.auto_check.details.checks ?? []).map((check, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-body">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className={check.passed ? "text-emerald-500" : "text-slate-300"}
                        aria-hidden="true"
                      />
                      {check.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted">
                No auto-check ran for this mission type.
              </p>
            ))}

          {tab === "AI Feedback" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-primary-light p-4 text-sm text-primary">
                <FontAwesomeIcon icon={faCircleInfo} className="mr-2" aria-hidden="true" />
                AI tutor interactions are formative only and stored separately from final evidence.
              </div>
              {aiSession && aiSession.messages.length > 0 ? (
                <div className="space-y-2.5">
                  {aiSession.messages.map((message, i) => {
                    if (message.role === "student") {
                      return (
                        <div key={i} className="flex justify-end">
                          <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">
                            {message.content}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex gap-2.5">
                        <span
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                            message.refused
                              ? "bg-amber-100 text-amber-600"
                              : "bg-primary-light text-primary"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={message.refused ? faTriangleExclamation : faRobot}
                            className="text-xs"
                            aria-hidden="true"
                          />
                        </span>
                        <p
                          className={`max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm ${
                            message.refused ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-body"
                          }`}
                        >
                          {message.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted">
                  This attempt has no recorded AI tutor session.
                </p>
              )}
            </div>
          )}

          {tab === "Rubric" &&
            (data.rubric ? (
              <ul className="space-y-3">
                {data.rubric.criteria.map((c) => (
                  <li key={c.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{c.title}</p>
                      <span className="text-xs font-medium text-muted">{c.points} pts · {c.skill_title}</span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-muted">{c.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted">No rubric attached.</p>
            ))}
        </Card>

        {/* Grade panel */}
        <Card className="h-fit p-5">
          <h2 className="text-base font-semibold text-ink">Your Grade</h2>

          <label className="mt-4 block text-sm font-medium text-body">
            Score (0–100)
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-lg font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              Skill Alignment
            </p>
            <ul className="space-y-2.5">
              {(data.rubric?.criteria ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-body">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" aria-hidden="true" />
                    {c.skill_title}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                    <input
                      type="number"
                      min={0}
                      max={c.points}
                      value={awarded[c.id] ?? ""}
                      onChange={(e) =>
                        setAwarded((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                      }
                      className="h-8 w-12 rounded-md border border-slate-200 px-1.5 text-center text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="text-muted">/ {c.points}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <label className="mt-5 block text-sm font-medium text-body">
            Comments <span className="font-normal text-muted">(visible to student)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 p-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            onClick={handleFinalize}
            disabled={saveState === "saving"}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved & Finalized ✓"
                : "Save & Finalize"}
          </button>
        </Card>
      </div>
    </div>
  );
}

export default function TeacherAttemptReviewPage() {
  return (
    <AppShell active="attempts" expectRole="teacher">
      <ReviewContent />
    </AppShell>
  );
}
