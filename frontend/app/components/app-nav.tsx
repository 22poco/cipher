"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { clearSession, getStoredUser, subscribeToSessionChange } from "@/lib/auth";

const publicLinks = [{ href: "/", label: "home" }];
const getServerUser = () => null;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeToSessionChange,
    getStoredUser,
    getServerUser,
  );

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-normal text-slate-950">
          cipher
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {[
            ...publicLinks,
            ...(user ? [{ href: "/assessments", label: "assessments" }] : []),
            ...(user ? [{ href: "/units", label: "modules" }] : []),
            ...(user ? [{ href: "/dashboard", label: "dashboard" }] : []),
            ...(user?.role === "admin" ? [{ href: "/admin", label: "admin" }] : []),
          ].map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 font-medium transition ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-700"
              >
                register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
