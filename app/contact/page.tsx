"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Bug, HelpCircle, Briefcase, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-slate-100 relative overflow-hidden pb-20">
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-blue-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Contact & Support
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Have questions, feedback, or need help with your account? Reach out directly to the BlueMango team.
          </p>
        </div>

        {/* Grid Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "General Support",
              desc: "Questions about your account or anonymous link.",
              email: "support@bluemango.app",
              icon: Mail,
            },
            {
              title: "Bug Reports",
              desc: "Found an issue? Send us technical details.",
              email: "bugs@bluemango.app",
              icon: Bug,
            },
            {
              title: "Feature Requests",
              desc: "Ideas for improving the platform experience.",
              email: "ideas@bluemango.app",
              icon: HelpCircle,
            },
            {
              title: "Business Enquiries",
              desc: "Partnerships, press, or legal inquiries.",
              email: "business@bluemango.app",
              icon: Briefcase,
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                </div>
                <a
                  href={`mailto:${card.email}`}
                  className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 hover:underline"
                >
                  <Send className="h-3.5 w-3.5" /> {card.email}
                </a>
              </div>
            );
          })}
        </div>

        {/* Response Info */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
          Average response time: <span className="text-slate-200 font-semibold">24 - 48 hours</span> (Monday – Friday).
        </div>
      </div>
    </main>
  );
}