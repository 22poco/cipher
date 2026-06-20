"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import type { ApiError } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";

type CourseLoaderProps<T> = {
  load: (token: string) => Promise<T>;
  children: (data: T) => ReactNode;
};

export function CourseLoader<T>({ load, children }: CourseLoaderProps<T>) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    load(token)
      .then(setData)
      .catch((caughtError: ApiError | Error) => {
        if ("status" in caughtError && caughtError.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }

        setError(caughtError.message || "could not load course content");
      });
  }, [load, router]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-slate-500">loading course content...</p>
      </main>
    );
  }

  return children(data);
}
