"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBars,
  faBookOpen,
  faBullseye,
  faChartLine,
  faChartPie,
  faClipboardList,
  faClockRotateLeft,
  faFileCircleCheck,
  faFileLines,
  faGear,
  faHouse,
  faLayerGroup,
  faLock,
  faRobot,
  faShieldHalved,
  faTableList,
  faUser,
  faUsers,
  faUsersRectangle,
  faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import type { User, UserRole } from "@/lib/api";
import { clearSession, getStoredUser, getToken } from "@/lib/auth";

type NavItem = { key: string; label: string; icon: IconDefinition; href: string };
type NavGroup = { heading: string | null; items: NavItem[] };

const STUDENT_NAV: NavGroup[] = [
  {
    heading: null,
    items: [{ key: "dashboard", label: "Dashboard", icon: faHouse, href: "/dashboard" }],
  },
  {
    heading: "Practice",
    items: [
      { key: "missions", label: "Missions", icon: faBullseye, href: "/missions" },
      { key: "attempts", label: "My Attempts", icon: faFileLines, href: "/attempts" },
      { key: "support", label: "Support Timeline", icon: faClockRotateLeft, href: "/support" },
      { key: "ai", label: "AI Tutor", icon: faRobot, href: "/ai" },
    ],
  },
  {
    heading: "Course",
    items: [
      { key: "units", label: "Units", icon: faLayerGroup, href: "/units" },
      { key: "resources", label: "Resources", icon: faBookOpen, href: "/resources" },
    ],
  },
  {
    heading: "Account",
    items: [
      { key: "profile", label: "Profile", icon: faUser, href: "/dashboard" },
      { key: "settings", label: "Settings", icon: faGear, href: "/dashboard" },
    ],
  },
];

const TEACHER_NAV: NavGroup[] = [
  {
    heading: null,
    items: [{ key: "overview", label: "Overview", icon: faChartPie, href: "/teacher" }],
  },
  {
    heading: "Assessment",
    items: [
      { key: "sections", label: "Sections", icon: faUsersRectangle, href: "/teacher/sections" },
      { key: "assignments", label: "Assignments", icon: faClipboardList, href: "/teacher" },
      { key: "gradebook", label: "Gradebook", icon: faTableList, href: "/teacher/gradebook" },
      { key: "attempts", label: "Attempts", icon: faFileCircleCheck, href: "/teacher" },
      { key: "students", label: "Students", icon: faUsers, href: "/teacher/sections" },
      { key: "reports", label: "Reports", icon: faChartLine, href: "/teacher" },
    ],
  },
  {
    heading: "Account",
    items: [{ key: "settings", label: "Settings", icon: faGear, href: "/teacher" }],
  },
];

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
        <FontAwesomeIcon icon={faShieldHalved} className="text-lg" aria-hidden="true" />
        <FontAwesomeIcon
          icon={faLock}
          className="absolute text-[9px]"
          aria-hidden="true"
        />
      </span>
      <span className="text-xl font-bold tracking-tight text-white">Cipher</span>
    </Link>
  );
}

function SidebarContent({
  nav,
  active,
  user,
  onLogout,
}: {
  nav: NavGroup[];
  active: string;
  user: User;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="pt-2">
        <Brand />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto cipher-scroll">
        {nav.map((group, gi) => (
          <div key={group.heading ?? `g${gi}`} className="space-y-1">
            {group.heading && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                {group.heading}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-white/65 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="w-4 text-[15px]"
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/90 text-sm font-semibold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs capitalize text-white/45">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  active,
  expectRole,
  children,
}: {
  active: string;
  expectRole?: UserRole | UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (expectRole) {
      const roles = Array.isArray(expectRole) ? expectRole : [expectRole];
      // Admins may view any workspace; otherwise enforce the expected role.
      if (stored.role !== "admin" && !roles.includes(stored.role)) {
        router.replace(stored.role === "student" ? "/dashboard" : "/teacher");
        return;
      }
    }
    // Client-only auth gate: reading localStorage requires an effect, and we
    // must commit the resolved session before rendering the shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(stored);
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!checked || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      </div>
    );
  }

  const nav = user.role === "student" ? STUDENT_NAV : TEACHER_NAV;

  return (
    <div className="min-h-screen bg-page">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar md:block">
        <SidebarContent nav={nav} active={active} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-body"
        >
          <FontAwesomeIcon icon={faBars} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 font-bold text-navy">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white">
            <FontAwesomeIcon icon={faShieldHalved} className="text-xs" aria-hidden="true" />
          </span>
          Cipher
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(user.name)}
        </span>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 w-64 bg-sidebar"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-white/60"
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
            <SidebarContent nav={nav} active={active} user={user} onLogout={handleLogout} />
          </motion.aside>
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="md:ml-64"
      >
        {children}
      </motion.main>
    </div>
  );
}
