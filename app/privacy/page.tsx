"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Effective Date: August 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Your privacy is fundamental to our architecture. This document explains how BlueMango collects, uses, and protects your data.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 space-y-8 text-sm text-slate-300 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" /> 1. Information We Collect
            </h2>
            <p>
              We collect minimal personal data required to operate the service securely:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Authentication credentials via Firebase Authentication (email & password or OAuth tokens).</li>
              <li>User-provided profile handle and public username slug.</li>
              <li>Anonymous messages sent and received through user links.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Information We Do NOT Collect</h2>
            <p className="text-slate-400">
              We do not track precise GPS location data, sell user information to third-party advertisers, or share non-public personal information without explicit consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Anonymous Message Protection</h2>
            <p className="text-slate-400">
              Messages sent anonymously to profile links do not reveal sender IP addresses or user accounts to the recipient. However, automated moderation filters screen incoming messages for harassment and illegal content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Data Retention & Deletion</h2>
            <p className="text-slate-400">
              You maintain full ownership of your data. Account deletion requests wipe personal data, posts, and saved records from our Firestore production environment upon request.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Children’s Privacy</h2>
            <p className="text-slate-400">
              BlueMango is intended for individuals aged 13 and older. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}