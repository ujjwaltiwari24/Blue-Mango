"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileText className="h-3.5 w-3.5" /> Terms of Service
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Please read these terms carefully before accessing or using the BlueMango platform.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 space-y-8 text-sm text-slate-300 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-slate-400">
              By accessing or creating an account on BlueMango, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. User Conduct & Prohibited Content</h2>
            <p className="text-slate-400">
              Anonymity is a feature, not a license for abuse. You agree not to engage in:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Severe harassment, cyberbullying, or hate speech targeting individuals or protected groups.</li>
              <li>Posting or distributing illegal material.</li>
              <li>Spamming, automated bot submission, or commercial solicitation via anonymous notes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Suspension & Termination</h2>
            <p className="text-slate-400">
              BlueMango reserves the right to suspend or terminate accounts that repeatedly violate community guidelines or security protocols without prior notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Limitation of Liability</h2>
            <p className="text-slate-400">
              BlueMango provides the platform on an "as-is" basis and makes no warranties regarding uninterrupted uptime or user-generated content accuracy.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}