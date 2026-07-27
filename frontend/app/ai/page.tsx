"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircleCheck,
  faCircleXmark,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";

import { fetchMyAttempts, type AttemptListItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "../components/app-shell";
import { Card, UnitBadge } from "../components/ui";

const ACTIVE_STATUSES: AttemptListItem["status"][] = ["assigned", "started", "draft_saved"];

const DOES = [
  "Asks questions that help you reason through the evidence",
  "Points you toward the rubric skill a step maps to",
  "Checks your reasoning and nudges you when you're off track",
];

const DOESNT = [
  "Write or draft your submission for you",
  "Reveal the correct multiple-choice answer",
  "Do the analysis you're being assessed on",
];

function AiContent() {
  const [attempts, setAttempts] = useState<AttemptListItem[] | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchMyAttempts(token)
      .then((res) => setAttempts(res.attempts))
      .catch(() => setAttempts([]));
  }, []);

  const active = (attempts ?? []).filter((a) => ACTIVE_STATUSES.includes(a.status));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white">
          <FontAwesomeIcon icon={faRobot} className="text-xl" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">AI Tutor</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The tutor is a formative helper built into every mission workspace. It coaches you with
            questions and hints while you work — and because Cipher missions are assessments, it
            never hands you the answer. Every conversation is logged with your attempt so your
            teacher can see how you used it.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-emerald-700">What it does</p>
          <ul className="mt-3 space-y-2.5">
            {DOES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-body">
                <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-rose-700">What it won&apos;t do</p>
          <ul className="mt-3 space-y-2.5">
            {DOESNT.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-body">
                <FontAwesomeIcon icon={faCircleXmark} className="mt-0.5 text-rose-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Open a mission to chat with the tutor</h2>
        {attempts === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-ink">No missions in progress</p>
            <p className="mt-1 text-sm text-muted">
              The tutor attaches to an active attempt. Start a mission to use it.
            </p>
            <Link
              href="/missions"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Browse missions
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((attempt) => (
              <Link key={attempt.attempt_id} href={`/missions/${attempt.mission_id}`}>
                <Card className="flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {attempt.mission_title}
                      </p>
                      <UnitBadge unit={attempt.unit} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {attempt.progress_percent}% complete · resume and ask the tutor
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-3 text-primary" aria-hidden="true" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Card className="border-amber-200 bg-amber-50/60 p-5">
        <p className="text-sm font-semibold text-amber-900">Academic-honesty policy</p>
        <p className="mt-1 text-sm text-amber-800">
          Using the tutor is encouraged and never counts against you — asking for help at the right
          moment is the Collaborate skill in action. What matters is that the evidence you submit is
          your own work. Pasting tutor text as your answer, or trying to coax the answer out of it,
          defeats the point and is visible to your teacher.
        </p>
      </Card>
    </div>
  );
}

export default function AiTutorPage() {
  return (
    <AppShell active="ai" expectRole="student">
      <AiContent />
    </AppShell>
  );
}
