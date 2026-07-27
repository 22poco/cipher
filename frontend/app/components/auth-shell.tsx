import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faFlaskVial,
  faLock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { SecurityIllustration } from "./security-illustration";

const FEATURES = [
  { icon: faBookOpen, title: "Learn", copy: "Core concepts and real-world skills" },
  { icon: faFlaskVial, title: "Practice", copy: "Hands-on labs and simulations" },
  { icon: faShieldHalved, title: "Protect", copy: "Build solutions and stay secure" },
];

function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-14 w-12 place-items-center rounded-xl border-2 border-primary text-primary">
        <FontAwesomeIcon icon={faShieldHalved} className="text-3xl" aria-hidden="true" />
        <FontAwesomeIcon icon={faLock} className="absolute text-xs" aria-hidden="true" />
      </span>
      <div>
        <p className="text-4xl font-bold tracking-tight text-navy">Cipher</p>
        <p className="text-base text-muted">Learn. Protect. Secure.</p>
      </div>
    </div>
  );
}

/** The cybersecurity hero column shared by the login and register pages. */
export function AuthHero() {
  return (
    <section className="hidden flex-col justify-between px-12 py-10 lg:flex lg:w-[52%] xl:px-16 xl:py-14">
      <BrandHeader />

      <div className="max-w-[650px]">
        <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight">
          <span className="text-navy">Master Cybersecurity.</span>
          <br />
          <span className="text-primary">Build a Safer Future.</span>
        </h1>
        <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-slate-500">
          Interactive lessons, hands-on labs, and real-world challenges to level
          up your skills.
        </p>
        <div className="mt-4 flex justify-center">
          <SecurityIllustration className="w-full max-w-[600px]" />
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex items-start gap-3">
            <FontAwesomeIcon
              icon={feature.icon}
              className="mt-0.5 text-lg text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-navy">{feature.title}</p>
              <p className="text-sm leading-snug text-muted">{feature.copy}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Accurate multi-colour Google "G" glyph for the social buttons. */
export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.71-1.03 7.62-2.78l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.76H1.7v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.54 14.17a6.9 6.9 0 0 1 0-4.34V6.85H1.7a11.5 11.5 0 0 0 0 10.3l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3A11.5 11.5 0 0 0 12 .5 11.5 11.5 0 0 0 1.7 6.85l3.84 2.98C6.45 6.78 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * Full-page split auth layout: the hero on the left and a white card on the
 * right. `topRight` is the small link in the card's top-right corner; children
 * are the card body (heading, form, social buttons).
 */
export function AuthPageShell({
  topRight,
  children,
}: {
  topRight: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#eaf1fd_0%,transparent_55%),radial-gradient(900px_500px_at_100%_100%,#eef2f9_0%,transparent_50%)] bg-[#f6f8fc]">
      <AuthHero />

      <section className="flex w-full items-stretch p-4 sm:p-6 lg:w-[48%]">
        <div className="relative flex w-full flex-col rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-10">
          <div className="flex items-center justify-between lg:justify-end">
            <span className="flex items-center gap-2 font-bold text-navy lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                <FontAwesomeIcon icon={faShieldHalved} className="text-sm" aria-hidden="true" />
              </span>
              Cipher
            </span>
            {topRight}
          </div>

          <div className="mx-auto flex w-full max-w-[570px] flex-1 flex-col justify-center py-8">
            {children}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted">
            <FontAwesomeIcon icon={faShieldHalved} className="text-subtle" aria-hidden="true" />
            Your progress is secure with us.
          </div>
        </div>
      </section>
    </main>
  );
}
