import Link from "next/link";
import { FiCheckCircle, FiEdit3, FiLock, FiSearch } from "react-icons/fi";
const features =[
  { icon: FiEdit3, label: "Write rich notes" },
  { icon: FiSearch, label: "Find ideas fast" },
  { icon: FiLock, label: "Private account" },
];
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#10172B] px-5 py-8 text-white sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <FiEdit3 size={22} />
            </span>
            <span className="text-lg font-semibold">Notes</span>
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-700 bg-[#16213E] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-white">
            Sign in
          </Link>
        </header>
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_360px]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              <FiCheckCircle />
              Save every thought in one place
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
              Your notes, organized and ready when you need them.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Capture ideas, edit them cleanly, and come back to the right note without digging through clutter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black transition hover:bg-cyan-300">
                Sign up
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#16213E] px-6 py-3 font-semibold text-white transition hover:border-cyan-400 hover:bg-[#1B2A50]">
                Sign in
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-slate-800 bg-[#111A31] p-5 shadow-2xl">
            <div className="space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0D1528] p-4 text-sm text-slate-300">
                    <Icon className="shrink-0 text-cyan-300" />
                    <span>{feature.label}</span>
                  </div>
                );
              })}
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                <p className="text-sm font-medium text-cyan-100">Next step</p>
                <p className="mt-2 text-sm leading-6 text-cyan-100/80">
                  Sign in or create an account to start writing.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
