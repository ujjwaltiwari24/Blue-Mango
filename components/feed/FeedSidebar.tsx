"use client";

import Link from "next/link";

export default function FeedSidebar() {
  return (
    <aside className="sticky top-24 space-y-4">

      {/* User Card */}

      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0F172A]/80 backdrop-blur-xl">

        <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

        <div className="px-5 pb-5">

          <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-[#0F172A] bg-gradient-to-r from-blue-500 to-indigo-500 text-xl font-black text-white">
            B
          </div>

          <h3 className="mt-3 text-lg font-bold text-white">
            BlueMango User
          </h3>

          <p className="text-sm text-slate-400">
            Anonymous Member
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">

            <div className="rounded-xl bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-bold text-white">
                12
              </p>
              <p className="text-[10px] text-slate-500">
                Posts
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-bold text-white">
                94
              </p>
              <p className="text-[10px] text-slate-500">
                Likes
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-bold text-white">
                6
              </p>
              <p className="text-[10px] text-slate-500">
                Replies
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Navigation */}

      <div className="rounded-3xl border border-white/[0.06] bg-[#0F172A]/80 p-4 backdrop-blur-xl">

        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </h4>

        <div className="space-y-2">

          <Link
            href="/feed"
            className="flex items-center justify-between rounded-xl bg-blue-500/10 px-4 py-3 text-blue-300 transition hover:bg-blue-500/15"
          >
            <span>Feed</span>
            <span className="h-2 w-2 rounded-full bg-blue-400" />
          </Link>

          <Link
            href="/notifications"
            className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <span>Notifications</span>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] text-white">
              3
            </span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <span>Profile</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <span>Settings</span>
          </Link>

        </div>

      </div>

      {/* Community Status */}

      <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-5">

        <div className="mb-3 flex items-center gap-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-sm font-medium text-emerald-300">
            Community Live
          </span>

        </div>

        <p className="text-sm text-slate-300">
          2,419 people are currently sharing thoughts anonymously.
        </p>

        <div className="mt-4 flex gap-1">

          {[0.55, 0.82, 0.37, 0.91, 0.48, 0.74, 0.63, 0.88].map(
            (opacity, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full bg-emerald-500"
                style={{ opacity }}
              />
            )
          )}

        </div>

      </div>

      {/* Community Card */}

      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-5">

        <h3 className="font-bold text-white">
          Anonymous Community
        </h3>

        <p className="mt-2 text-sm text-blue-100">
          Share confessions, secrets, stories and emotions without revealing your identity.
        </p>

        <button className="mt-4 w-full rounded-xl bg-white/15 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20">
          Explore Topics
        </button>

      </div>

    </aside>
  );
}