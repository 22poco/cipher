"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { fetchCurrentUser, type User, type UserRole } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";

type ProtectedPageProps = {
  allowedRole?: UserRole;
  children: (user: User) => ReactNode;
};

export function ProtectedPage({ allowedRole, children }: ProtectedPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchCurrentUser(token)
      .then((currentUser) => {
        if (allowedRole && currentUser.role !== allowedRole) {
          setStatus("blocked");
          return;
        }

        setUser(currentUser);
        setStatus("ready");
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [allowedRole, router]);

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </main>
    );
  }

  if (status === "blocked") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This area is only available to {allowedRole} accounts.
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children(user);
}
