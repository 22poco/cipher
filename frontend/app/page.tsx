"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser, getToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "student" ? "/dashboard" : "/teacher");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
    </div>
  );
}
