"use client";

import Link from "next/link";

export default function FeedSidebar() {
  return (
    <div className="sticky top-24 rounded-3xl border border-slate-800 bg-slate-900/60 p-5">

      <h2 className="mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent">
        BlueMango
      </h2>

      <div className="space-y-2">

        <Link
          href="/feed"
          className="block rounded-xl bg-blue-500/10 px-4 py-3 text-blue-300"
        >
          Feed
        </Link>

        <Link
          href="/notifications"
          className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-slate-800"
        >
          Notifications
        </Link>

        <Link
          href="/profile"
          className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-slate-800"
        >
          Profile
        </Link>

      </div>

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4">

        <h3 className="font-semibold">
          Anonymous Community
        </h3>

        <p className="mt-2 text-sm text-blue-100">
          Share thoughts without revealing your identity.
        </p>

      </div>

    </div>
  );
}