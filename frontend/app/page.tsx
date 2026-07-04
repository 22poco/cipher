import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
      <section className="grid content-start gap-8">
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-emerald-700">ap cybersecurity</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            cipher
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            a classroom learning platform for lessons, quizzes, case studies,
            progress tracking, and hands-on cybersecurity practice.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            log in
          </Link>
          <Link
            href="/register"
            className="flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
          >
            create account
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["units", "structured course path"],
            ["quizzes", "scores saved to postgres"],
            ["admin", "teacher content tools"],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-md border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">current status</h2>
        <div className="mt-4 grid gap-3 text-sm">
          {[
            ["backend", "api and postgres connected"],
            ["course pages", "units, modules, lessons"],
            ["admin tools", "create, edit, delete content"],
            ["next focus", "quizzes and progress"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <span className="font-medium text-slate-600">{label}</span>
              <span className="text-right text-slate-950">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
