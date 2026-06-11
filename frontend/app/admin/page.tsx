"use client";

import { ProtectedPage } from "../components/protected-page";

export default function AdminPage() {
  return (
    <ProtectedPage allowedRole="admin">
      {(user) => (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-emerald-700">admin dashboard</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              content tools
            </h1>
            <p className="text-sm text-slate-600">
              signed in as {user.email}. lesson and quiz editing tools come next.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ["units", "create and organize units"],
              ["lessons", "write and update lesson pages"],
              ["quizzes", "manage checks for understanding"],
            ].map(([title, value]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-5">
                <p className="text-lg font-semibold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
              </div>
            ))}
          </section>
        </main>
      )}
    </ProtectedPage>
  );
}
