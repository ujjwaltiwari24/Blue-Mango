"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, AlertCircle, HeartHandshake, ShieldAlert } from "lucide-react";

export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-slate-100 relative overflow-hidden pb-20">
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-blue-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BookOpen className="h-3.5 w-3.5" /> Community Standards
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Community Guidelines
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Anonymous doesn’t mean abusive. Our guidelines ensure a safe, vibrant platform for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-3">
            <HeartHandshake className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Respect Others</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Constructive critique is welcome, but personal attacks, doxxing, and targeted degradation will lead to permanent account bans.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-3">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Zero Hate Speech</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discriminatory threats or derogatory slurs based on race, religion, gender, or sexual orientation are strictly forbidden.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Reporting System & Moderation
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            If you receive abusive messages, click the flag icon next to the message in your inbox. Reported items are instantly routed to automated AI filters and community moderators for swift resolution.
          </p>
        </div>
      </div>
    </main>
  );
}