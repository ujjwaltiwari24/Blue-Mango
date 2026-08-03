"use client";

import Link from "next/link";
import { ArrowLeft, Shield, EyeOff, Sparkles, Heart, Compass, CheckCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-slate-100 relative overflow-hidden pb-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        {/* Navigation back */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-blue-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="h-3.5 w-3.5" /> Our Story & Values
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            About BlueMango
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            A next-generation anonymous social network engineered for authentic, raw, and safe expression without societal bias.
          </p>
        </div>

        {/* Mission Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Compass className="h-6 w-6 text-blue-400" />
            Our Core Mission
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            In modern social media, online identities are heavily curated around status, aesthetics, and social approval. BlueMango was founded on a simple principle: people share their most genuine thoughts when identity pressure is removed.
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            We provide a sleek, fast, and secure ecosystem where creators, thinkers, and communities interact candidly while maintaining strict privacy boundaries.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Absolute Anonymity",
              desc: "Your identity remains protected. We never expose your email or user credentials to public peers.",
              icon: EyeOff,
            },
            {
              title: "Safety First",
              desc: "Anonymity is a platform for honesty, not abuse. Strict algorithmic & community moderation protects users.",
              icon: Shield,
            },
            {
              title: "Authentic Connection",
              desc: "Constructive feedback and secret messages without superficial clout dynamics.",
              icon: Heart,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Roadmap */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">Product Roadmap</h2>
          <div className="space-y-4">
            {[
              "Encrypted Anonymous Direct Messages",
              "Custom Profile Themes & Aesthetics",
              "Audio Anonymous Droplets",
              "Community Voice Rooms & Live QA",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}