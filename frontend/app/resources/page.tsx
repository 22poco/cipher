"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faFolderOpen,
  faNetworkWired,
  faRobot,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";

import { AppShell } from "../components/app-shell";
import { Card } from "../components/ui";

const AP_UNITS = [
  { n: 1, title: "Introduction to Security", desc: "Security thinking, social engineering, authentication." },
  { n: 2, title: "Securing Physical Spaces", desc: "Physical access control, facility hardening, environmental risk." },
  { n: 3, title: "Securing Networks", desc: "Segmentation, firewalls, and monitoring network traffic." },
  { n: 4, title: "Securing Devices", desc: "Endpoint hardening, permissions, logs, and device policy." },
  { n: 5, title: "Securing Applications & Data", desc: "Access control, cryptography, and data-attack detection." },
];

const BASH_COMMANDS: { cmd: string; what: string }[] = [
  { cmd: "ls -la", what: "List files with permissions, owner, and hidden entries" },
  { cmd: "pwd", what: "Print the current directory path" },
  { cmd: "cd <dir>", what: "Change into a directory" },
  { cmd: "cat <file>", what: "Print a file's contents" },
  { cmd: "chmod 640 <file>", what: "Set permissions (owner rw, group r, others none)" },
  { cmd: "chown user:group <file>", what: "Change a file's owner and group" },
  { cmd: "stat <file>", what: "Show detailed file metadata, including the exact mode" },
  { cmd: "grep <pattern> <file>", what: "Search a file for lines matching a pattern" },
];

const PERMISSION_BITS = [
  { sym: "4", what: "read (r)" },
  { sym: "2", what: "write (w)" },
  { sym: "1", what: "execute (x)" },
];

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: typeof faBookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
          <FontAwesomeIcon icon={icon} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function ResourcesContent() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Resources</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          References you can use while you practice — the AP framework, a safe-shell cheat sheet, how
          the network simulator scores you, and the rules for using the AI tutor.
        </p>
      </header>

      <SectionCard icon={faBookOpen} title="AP Cybersecurity units">
        <div className="grid gap-3 sm:grid-cols-2">
          {AP_UNITS.map((unit) => (
            <Link
              key={unit.n}
              href={`/units/${unit.n}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-primary hover:bg-slate-50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
                {unit.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{unit.title}</p>
                <p className="text-xs text-muted">{unit.desc}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          The four CED skills — Analyze Risk, Mitigate Risk, Detect Attacks, and Collaborate — are
          assessed across every unit&apos;s missions.
        </p>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={faTerminal} title="Safe Bash command sheet">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {BASH_COMMANDS.map((row) => (
                  <tr key={row.cmd}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-primary">
                      {row.cmd}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{row.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-subtle">
            Permission bits
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PERMISSION_BITS.map((bit) => (
              <span
                key={bit.sym}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-body"
              >
                <span className="font-mono font-bold text-ink">{bit.sym}</span>
                {bit.what}
              </span>
            ))}
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-body">
              Add them: <span className="ml-1 font-mono font-bold text-ink">6</span> = rw-
            </span>
          </div>
        </SectionCard>

        <SectionCard icon={faNetworkWired} title="Network simulator guide">
          <ul className="space-y-2.5 text-sm text-body">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Firewall rules are evaluated <strong>top to bottom</strong> — the first rule that
              matches a packet decides whether it&apos;s allowed or denied.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Put specific <em>allow</em> rules above broad <em>deny</em> rules, then finish with a
              default <em>deny any/any</em>.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Use <strong>Test Traffic</strong> to check each segment. The auto-check re-runs your
              rules against the required flows and scores how many behave as expected.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Segment by role: students, staff, and servers should each be isolated except for the
              services they genuinely need.
            </li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard icon={faRobot} title="Using the AI tutor">
        <p className="text-sm text-muted">
          The tutor is formative and assessment-safe: it guides with questions and hints but never
          writes your submission or reveals answers. Using it is encouraged and logged with your
          attempt.
        </p>
        <Link
          href="/ai"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Read the full AI-use policy
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" aria-hidden="true" />
        </Link>
      </SectionCard>

      <SectionCard icon={faFolderOpen} title="Teacher-provided resources">
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted">
          Your teacher hasn&apos;t shared any class resources yet. Files and links they post will
          appear here.
        </div>
      </SectionCard>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <AppShell active="resources" expectRole="student">
      <ResourcesContent />
    </AppShell>
  );
}
