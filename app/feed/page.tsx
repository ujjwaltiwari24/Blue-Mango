"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { createPost, getPosts, toggleLike } from "@/services/post.service";
import { logoutUser } from "@/services/auth.service";
import { getUserByUid, usernameToSlug } from "@/services/anonymous-chat.service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import type { BlueMangUser } from "@/types/anonymous-chat";

// ─── Types ────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  text: string;
  anonymousName: string;
  mood: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: unknown;
  liked: boolean;
  saved: boolean;
  featured?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────
const ANON_NAMES = [
  "velvet fog", "paper crane", "hollow tide", "still water",
  "grey static", "lost signal", "dust mirror", "neon silence",
  "pale ember", "dusk chorus", "silver mist", "amber echo",
];

const MOODS = [
  { label: "Heartbroken", emoji: "💔", color: "#FB7185", bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.22)" },
  { label: "Nostalgic",   emoji: "🌙", color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.22)" },
  { label: "Grateful",    emoji: "✨", color: "#34D399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.22)"  },
  { label: "Anxious",     emoji: "⚡", color: "#FBBF24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.22)"  },
  { label: "Numb",        emoji: "🌫️", color: "#94A3B8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.22)" },
  { label: "Hopeful",     emoji: "🌤️", color: "#38BDF8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.22)"  },
  { label: "Obsessed",    emoji: "🔥", color: "#F472B6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.22)" },
];

const CATEGORIES = ["All", "Confession", "Relationship", "Self", "Family", "Work", "Regret", "Secret", "Hope"];

const MOOD_MAP: Record<string, typeof MOODS[0]> = Object.fromEntries(
  MOODS.map((m) => [m.label, m])
);
const getMood = (label: string) =>
  MOOD_MAP[label] ?? { label, emoji: "💭", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.22)" };

const SAMPLE: Post[] = [
  { id: "p1", text: "I still keep a voice note from 2019 of someone who doesn't remember me anymore. I listen to it when I miss who I used to be.", anonymousName: "hollow tide", mood: "Nostalgic", category: "Regret", likes: 1847, comments: 94, createdAt: "3h ago", liked: false, saved: false, featured: true },
  { id: "p2", text: "I told my therapist I was fine. Then I drove home and sat in my parking lot for 45 minutes because I didn't know what to do with silence.", anonymousName: "grey static", mood: "Numb", category: "Self", likes: 3291, comments: 201, createdAt: "5h ago", liked: true, saved: false, featured: false },
  { id: "p3", text: "My biggest secret is that I'm actually doing okay. And I feel guilty about it when everyone around me is falling apart.", anonymousName: "velvet fog", mood: "Anxious", category: "Confession", likes: 912, comments: 58, createdAt: "8h ago", liked: false, saved: true, featured: false },
  { id: "p4", text: "I gave them a second chance. And a third. And a fourth. I just wanted to believe people can change more than I wanted to protect myself.", anonymousName: "still water", mood: "Heartbroken", category: "Relationship", likes: 2103, comments: 137, createdAt: "12h ago", liked: false, saved: false, featured: false },
  { id: "p5", text: "I rehearse conversations in my head for hours. Then when I finally have them, I go completely blank and just say \"yeah, totally.\"", anonymousName: "dust mirror", mood: "Anxious", category: "Self", likes: 687, comments: 45, createdAt: "1d ago", liked: true, saved: false, featured: false },
];

const TRENDING = [
  { tag: "3am thoughts", count: "2.4k" },
  { tag: "unsent letters", count: "1.8k" },
  { tag: "things I pretend", count: "1.2k" },
  { tag: "never told anyone", count: "987" },
  { tag: "exes", count: "741" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function timeAgo(raw: unknown): string {
  if (!raw) return "just now";
  if (typeof raw === "string" && !raw.includes("T") && !raw.includes("Z")) return raw;
  let d: Date | null = null;
  if (typeof raw === "string") d = new Date(raw);
  else if (raw instanceof Date) d = raw;
  else if (typeof raw === "object" && (raw as Record<string, unknown>)?.toDate) {
    d = (raw as { toDate: () => Date }).toDate();
  }
  if (!d || isNaN(d.getTime())) return "just now";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function randomAnon() {
  return ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
}

// ─── Icons ────────────────────────────────────────────────────────────────
const Icon = {
  heart:    (f?: boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill={f ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  chat:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  share:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  bookmark: (f?: boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill={f ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
  send:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  lock:     () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  shield:   () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  bell:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  user:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  logout:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  trend:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  filter:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  refresh:  () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  more:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
  home:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  sparkle:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z" /></svg>,
  check:    () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  plus:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  chevron:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  moon:     () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  link:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  inbox:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>,
  copy:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  anon:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
};

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Anonymous Chat Banner (new) ────────────────────────────────────────────
function AnonymousChatBanner({ user }: { user: BlueMangUser | null }) {
  const [profileLink, setProfileLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.username || typeof window === "undefined") return;
    const slug = user.usernameSlug ?? usernameToSlug(user.username);
    if (slug) {
      setProfileLink(`${window.location.origin}/anonymous-chat/${encodeURIComponent(slug)}`);
    }
  }, [user]);

  const handleCopy = useCallback(() => {
    if (!profileLink) return;
    navigator.clipboard.writeText(profileLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileLink]);

  if (!user?.username) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        marginBottom: 20,
        padding: "14px 18px",
        background: "linear-gradient(135deg, rgba(37,99,235,0.09) 0%, rgba(139,92,246,0.07) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      {/* decorative orb */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 100, height: 100, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(139,92,246,0.25))",
        border: "1px solid rgba(99,102,241,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#818CF8",
      }}>
        {Icon.anon()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, marginBottom: 2 }}>
          Anonymous Inbox
        </p>
        <p style={{
          fontSize: 11, color: "rgba(255,255,255,0.4)",
          margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {profileLink || "Loading your link…"}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          title="Copy your anonymous link"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 13px", borderRadius: 9, fontSize: 11, fontWeight: 600,
            color: copied ? "#34D399" : "#93C5FD",
            background: copied ? "rgba(52,211,153,0.1)" : "rgba(37,99,235,0.15)",
            border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "rgba(99,102,241,0.25)"}`,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          {copied ? Icon.check() : Icon.copy()}
          {copied ? "Copied!" : "Copy link"}
        </button>

        <Link
          href="/anonymous-chat"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 13px", borderRadius: 9, fontSize: 11, fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, rgba(37,99,235,0.4), rgba(99,102,241,0.4))",
            border: "1px solid rgba(99,102,241,0.3)",
            textDecoration: "none", transition: "all 0.2s",
          }}
        >
          {Icon.inbox()} Inbox
        </Link>
      </div>
    </motion.div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({
  onLogout,
  user,
}: {
  onLogout: () => void;
  user: BlueMangUser | null;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const slug = user ? (user.usernameSlug ?? usernameToSlug(user.username ?? "")) : "";
  const initial = (user?.displayName ?? user?.username ?? "?")[0].toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: scrolled ? "rgba(6,8,16,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        height: 62, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 18px",
      }}>
        {/* Logo */}
        <Link href="/feed" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#D6A86B,#C06C84)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", position: "relative",
          }}>
            {Icon.sparkle()}
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 9, height: 9, borderRadius: "50%",
              background: "#10B981", border: "2px solid #060810",
            }} />
          </div>
          <div className="bm-logo-full">
            <p style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 600, color: "#fff", lineHeight: 1, margin: 0 }}>BlueMango</p>
            <p style={{ fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: 0 }}>anonymous confessions</p>
          </div>
          <p style={{ fontFamily: "Georgia,serif", fontSize: 19, fontWeight: 600, color: "#fff" }} className="bm-logo-short">BlueMango</p>
        </Link>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Anonymous chat quick link */}
          <Link
            href="/anonymous-chat"
            title="Anonymous Inbox"
            style={{
              position: "relative",
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            {Icon.inbox()}
            <span className="bm-hide-xs">Inbox</span>
            {/* Unread dot — cosmetic, replace with real count from Firestore */}
            <span style={{
              position: "absolute", top: 4, right: 4,
              width: 6, height: 6, borderRadius: "50%",
              background: "#C06C84", border: "1.5px solid #060810",
            }} />
          </Link>

          <Link href="/notifications" style={{
            padding: 8, borderRadius: "50%",
            color: "rgba(255,255,255,0.4)", display: "flex",
            transition: "all 0.2s", textDecoration: "none",
          }}>
            {Icon.bell()}
          </Link>

          {/* Avatar with initials linking to profile */}
          <Link href="/profile" style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,rgba(37,99,235,0.4),rgba(139,92,246,0.4))",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            textDecoration: "none", flexShrink: 0,
          }}>
            {initial}
          </Link>

          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)", fontSize: 12,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(251,113,133,0.35)"; (e.currentTarget as HTMLElement).style.color = "#FB7185"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            {Icon.logout()}
            <span className="bm-hide-xs">Leave</span>
          </button>
        </div>
      </div>

      <style>{`
        .bm-logo-full{display:none}
        .bm-logo-short{display:block}
        @media(min-width:480px){.bm-logo-full{display:block!important}.bm-logo-short{display:none!important}}
        @media(max-width:360px){.bm-hide-xs{display:none!important}}
      `}</style>
    </header>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────
function StatsRow({ postCount }: { postCount: number }) {
  const stats = [
    { icon: "✦", value: String(postCount), label: "Confessions", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.15)" },
    { icon: "●", value: "2,419",           label: "Online now",  color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.15)" },
    { icon: "↑", value: "12",              label: "Trending",    color: "#D6A86B", bg: "rgba(214,168,107,0.1)", border: "rgba(214,168,107,0.15)" },
    { icon: "◎", value: "100%",            label: "Anonymous",   color: "#C06C84", bg: "rgba(192,108,132,0.1)", border: "rgba(192,108,132,0.15)" },
  ];
  return (
    <div className="bm-stats-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2,1fr)", marginBottom: 20 }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 15px", borderRadius: 14,
          border: `1px solid ${s.border}`,
          background: s.bg,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: s.color, fontWeight: 700,
          }}>
            {s.icon}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 2, letterSpacing: "0.3px" }}>{s.label}</p>
          </div>
        </div>
      ))}
      <style>{`@media(min-width:640px){.bm-stats-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
    </div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────
function FeaturedCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const m = getMood(post.mood);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "relative", overflow: "hidden",
        borderRadius: 20, marginBottom: 16,
        padding: "22px 24px",
        background: "linear-gradient(135deg,#0d1628 0%,#0a0e1f 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div style={{
        position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -30, width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(192,108,132,0.18) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
            color: "#D6A86B", background: "rgba(214,168,107,0.12)",
            border: "1px solid rgba(214,168,107,0.22)",
            letterSpacing: "0.3px",
          }}>
            🔥 Most resonated today
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 500,
            color: m.color, background: m.bg, border: `1px solid ${m.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, display: "inline-block" }} />
            {post.mood}
          </span>
        </div>

        <p style={{
          fontFamily: "Georgia,'Times New Roman',serif",
          fontSize: "clamp(16px,3.5vw,20px)", fontStyle: "italic",
          lineHeight: 1.7, color: "rgba(255,255,255,0.92)",
          marginBottom: 18,
        }}>
          &ldquo;{post.text}&rdquo;
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", letterSpacing: "0.3px" }}>
            {post.anonymousName} · {timeAgo(post.createdAt)}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => onLike(post.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                color: post.liked ? "#C06C84" : "rgba(255,255,255,0.35)",
                background: "none", border: "none", cursor: "pointer", transition: "color 0.2s",
              }}
            >
              {Icon.heart(post.liked)} {fmt(post.likes)}
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              {Icon.chat()} {fmt(post.comments)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Composer ──────────────────────────────────────────────────────────────
function Composer({
  text, setText, mood, setMood, category, setCategory, loading, onPost,
}: {
  text: string; setText: (v: string) => void;
  mood: string; setMood: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  loading: boolean; onPost: () => void;
}) {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const max = 400;
  const pct = (text.length / max) * 100;
  const r = 9;
  const circ = 2 * Math.PI * r;
  const m = getMood(mood);

  return (
    <div style={{
      borderRadius: 18,
      border: open ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.07)",
      background: open ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)",
      transition: "all 0.25s ease",
      marginBottom: 16,
      boxShadow: open ? "0 8px 40px rgba(0,0,0,0.45)" : "none",
    }}>
      {/* anon identity bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,rgba(37,99,235,0.35),rgba(139,92,246,0.35))",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
        }}>
          {Icon.lock()}
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>posting as</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>anonymous</span>
        {open && (
          <span style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "rgba(52,211,153,0.65)",
          }}>
            {Icon.shield()} <span className="bm-hide-xs">protected</span>
          </span>
        )}
      </div>

      {/* textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, max))}
        onFocus={() => setOpen(true)}
        onBlur={() => { if (!text.trim()) setOpen(false); }}
        placeholder="What are you carrying that you've never said out loud?"
        rows={open || text ? 4 : 2}
        style={{
          width: "100%", resize: "none", background: "transparent",
          border: "none", outline: "none", padding: "14px 16px",
          fontSize: 14, lineHeight: 1.75,
          color: "rgba(255,255,255,0.85)", fontFamily: "inherit",
          transition: "all 0.2s", boxSizing: "border-box",
        }}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            {/* mood pills */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6,
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              {MOODS.map((mo) => (
                <button
                  key={mo.label}
                  onClick={() => setMood(mo.label)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s",
                    color: mood === mo.label ? mo.color : "rgba(255,255,255,0.32)",
                    background: mood === mo.label ? mo.bg : "transparent",
                    border: `1px solid ${mood === mo.label ? mo.border : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{mo.emoji}</span> {mo.label}
                </button>
              ))}
            </div>

            {/* toolbar */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: 10,
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: "7px 11px", borderRadius: 10, fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  background: "#0B1120",
                  border: "1px solid rgba(255,255,255,0.09)",
                  outline: "none", cursor: "pointer",
                }}
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* progress ring */}
                <svg width="22" height="22" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
                  <circle
                    cx="11" cy="11" r={r} fill="none"
                    stroke={pct > 85 ? "#FB7185" : pct > 65 ? "#FBBF24" : "#2563EB"}
                    strokeWidth="2"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct / 100)}
                    strokeLinecap="round"
                    style={{ transition: "all 0.2s" }}
                  />
                </svg>

                <button
                  onClick={onPost}
                  disabled={!text.trim() || loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                    color: "#fff",
                    cursor: text.trim() && !loading ? "pointer" : "not-allowed",
                    opacity: text.trim() && !loading ? 1 : 0.4,
                    background: "linear-gradient(135deg,#2563EB,#6366F1,#8B5CF6)",
                    border: "none", transition: "all 0.2s",
                    boxShadow: text.trim() ? "0 4px 18px rgba(37,99,235,0.35)" : "none",
                  }}
                >
                  {loading
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "bm-spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    : Icon.send()
                  }
                  Confess
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes bm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Category Bar ──────────────────────────────────────────────────────────
function CategoryBar({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        overflowX: "auto", paddingBottom: 2, marginBottom: 16,
        scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
      } as React.CSSProperties}
    >
      <span style={{ color: "rgba(255,255,255,0.22)", flexShrink: 0, marginRight: 2 }}>{Icon.filter()}</span>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500,
            cursor: "pointer", transition: "all 0.18s", border: "none",
            color: active === c ? "#93C5FD" : "rgba(255,255,255,0.3)",
            background: active === c ? "rgba(37,99,235,0.18)" : "transparent",
            boxShadow: active === c ? "0 0 0 1px rgba(37,99,235,0.3)" : "none",
          }}
        >
          {c}
        </button>
      ))}
      <style>{`.bm-cat-scroll::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────
function PostCard({
  post, onLike, onSave, index,
}: {
  post: Post;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const m = getMood(post.mood);
  const long = post.text.length > 220;
  const body = expanded || !long ? post.text : post.text.slice(0, 220) + "…";
  const t = timeAgo(post.createdAt);
  const commentCount = typeof post.comments === "number" ? post.comments : 0;

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`).catch(() => {});
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [post.id]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      style={{
        borderRadius: 18, padding: "17px",
        border: "1px solid rgba(255,255,255,0.065)",
        background: "rgba(255,255,255,0.024)",
        transition: "border-color 0.22s ease, background 0.22s ease",
      }}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.042)" }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,rgba(37,99,235,0.4),rgba(139,92,246,0.3))",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.38)",
          }}>
            {Icon.lock()}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)", margin: 0, letterSpacing: "0.2px" }}>{post.anonymousName}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0, marginTop: 1 }}>{t}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 500,
            color: m.color, background: m.bg, border: `1px solid ${m.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, display: "inline-block" }} />
            {post.mood}
          </span>
          <span
            className="bm-cat-badge"
            style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 10,
              color: "rgba(255,255,255,0.22)",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              display: "none",
            }}
          >
            {post.category}
          </span>
          <button
            title="More options"
            style={{
              padding: 4, borderRadius: 7, border: "none",
              background: "transparent", color: "rgba(255,255,255,0.2)",
              cursor: "pointer", display: "flex", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
          >
            {Icon.more()}
          </button>
        </div>
      </div>

      {/* body */}
      <p style={{
        fontFamily: "Georgia,'Times New Roman',serif",
        fontSize: 15, fontStyle: "italic", lineHeight: 1.8,
        color: "rgba(255,255,255,0.78)", margin: 0, marginBottom: 14,
      }}>
        &ldquo;{body}&rdquo;
        {long && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginLeft: 8, fontSize: 12, fontStyle: "normal",
              color: "rgba(96,165,250,0.7)", background: "none",
              border: "none", cursor: "pointer", transition: "color 0.15s",
              fontFamily: "inherit", padding: 0,
            }}
          >
            {expanded ? "show less" : "read more"}
          </button>
        )}
      </p>

      {/* actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          onClick={() => onLike(post.id)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 500,
            border: "none", cursor: "pointer", transition: "all 0.18s",
            color: post.liked ? "#C06C84" : "rgba(255,255,255,0.3)",
            background: post.liked ? "rgba(192,108,132,0.1)" : "transparent",
            boxShadow: post.liked ? "0 0 0 1px rgba(192,108,132,0.2)" : "none",
          }}
        >
          {Icon.heart(post.liked)} {fmt(post.likes)}
        </button>

        <button
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 10, fontSize: 12,
            border: "none", cursor: "pointer", transition: "all 0.18s",
            color: "rgba(255,255,255,0.28)", background: "transparent",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"; }}
        >
          {Icon.chat()} {fmt(commentCount)}
        </button>

        <button
          onClick={handleShare}
          title="Copy link"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 10, fontSize: 12,
            border: "none", cursor: "pointer", transition: "all 0.18s",
            color: shareCopied ? "#34D399" : "rgba(255,255,255,0.28)",
            background: shareCopied ? "rgba(52,211,153,0.08)" : "transparent",
          }}
          onMouseEnter={e => { if (!shareCopied) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; } }}
          onMouseLeave={e => { if (!shareCopied) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"; } }}
        >
          {shareCopied ? Icon.check() : Icon.share()}
        </button>

        <button
          onClick={() => onSave(post.id)}
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 10, fontSize: 12,
            border: "none", cursor: "pointer", transition: "all 0.18s",
            color: post.saved ? "#D6A86B" : "rgba(255,255,255,0.22)",
            background: post.saved ? "rgba(214,168,107,0.1)" : "transparent",
            boxShadow: post.saved ? "0 0 0 1px rgba(214,168,107,0.2)" : "none",
          }}
        >
          {Icon.bookmark(post.saved)}
        </button>
      </div>

      <style>{`@media(min-width:480px){.bm-cat-badge{display:inline-flex!important}}`}</style>
    </motion.article>
  );
}

// ── Left Sidebar ──────────────────────────────────────────────────────────
function LeftSidebar({ user }: { user: BlueMangUser | null }) {
  const NAV = [
    { label: "Feed",      href: "/feed",      active: true  },
    { label: "Trending",  href: "/trending",  active: false },
    { label: "Saved",     href: "/saved",     active: false },
    { label: "Following", href: "/following", active: false },
  ];

  const [profileLink, setProfileLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.username || typeof window === "undefined") return;
    const slug = user.usernameSlug ?? usernameToSlug(user.username);
    if (slug) setProfileLink(`${window.location.origin}/anonymous-chat/${encodeURIComponent(slug)}`);
  }, [user]);

  const handleCopy = () => {
    if (!profileLink) return;
    navigator.clipboard.writeText(profileLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {NAV.map(({ label, href, active }) => (
        <Link
          key={label}
          href={href}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 500,
            transition: "all 0.18s", textDecoration: "none",
            color: active ? "#93C5FD" : "rgba(255,255,255,0.42)",
            background: active ? "rgba(37,99,235,0.14)" : "transparent",
            boxShadow: active ? "0 0 0 1px rgba(37,99,235,0.22)" : "none",
          }}
        >
          {label}
          {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />}
        </Link>
      ))}

      {/* Live now */}
      <div style={{
        marginTop: 14, padding: 16, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.2)", margin: 0, marginBottom: 4 }}>Live now</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>2,419</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, marginBottom: 12 }}>anonymous souls online</p>
        <div style={{ display: "flex", gap: 3 }}>
          {[0.55, 0.82, 0.37, 0.91, 0.48, 0.74, 0.63, 0.88].map((o, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: "#10B981", opacity: o }} />
          ))}
        </div>
      </div>

      {/* Anonymous Chat Card (new) */}
      <div style={{
        marginTop: 10, padding: 16, borderRadius: 16,
        border: "1px solid rgba(99,102,241,0.18)",
        background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(139,92,246,0.05))",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)",
          pointerEvents: "none",
        }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: 0, marginBottom: 4 }}>
          Anonymous Chat
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0, marginBottom: 12, lineHeight: 1.55 }}>
          Let anyone send you honest anonymous messages.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 9, fontSize: 11, fontWeight: 500,
              color: copied ? "#34D399" : "#93C5FD",
              background: copied ? "rgba(52,211,153,0.1)" : "rgba(37,99,235,0.12)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.2)" : "rgba(37,99,235,0.22)"}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <Link
            href="/inbox"
            style={{
              flex: 1, padding: "7px 0", borderRadius: 9, fontSize: 11, fontWeight: 500,
              color: "#fff",
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.25)",
              cursor: "pointer", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              transition: "all 0.2s",
            }}
          >
            {Icon.inbox()} Inbox
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────
function RightSidebar({ user }: { user: BlueMangUser | null }) {
  const slug = user ? (user.usernameSlug ?? usernameToSlug(user.username ?? "")) : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* trending */}
      <div style={{
        padding: 16, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <span style={{ color: "#D6A86B" }}>{Icon.trend()}</span>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.25)", margin: 0 }}>Trending</p>
        </div>
        {TRENDING.map((t, i) => (
          <button
            key={t.tag}
            style={{
              display: "flex", width: "100%", alignItems: "center",
              justifyContent: "space-between", padding: "9px 10px",
              borderRadius: 10, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              background: "transparent", border: "none", color: "inherit",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", minWidth: 16 }}>#{i + 1}</span>
              <span style={{ color: "rgba(255,255,255,0.62)" }}>#{t.tag}</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Anonymous chat CTA (replaces old generic CTA) */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: 18, borderRadius: 16,
        background: "linear-gradient(135deg,rgba(37,99,235,0.1),rgba(139,92,246,0.08))",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>
        <div style={{
          position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,0.22),transparent)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "rgba(99,102,241,0.18)",
            border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#818CF8",
          }}>
            {Icon.anon()}
          </div>
          <p style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>
            Receive secrets
          </p>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, marginBottom: 14, lineHeight: 1.55 }}>
          Share your anonymous link. Anyone can message you — without revealing who they are.
        </p>
        <Link
          href={slug ? `/anonymous-chat/${encodeURIComponent(slug)}` : "/anonymous-chat"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "10px 0", borderRadius: 11, fontSize: 12, fontWeight: 500,
            color: "#93C5FD",
            background: "rgba(37,99,235,0.15)",
            border: "1px solid rgba(37,99,235,0.25)",
            textDecoration: "none", transition: "all 0.18s",
            width: "100%",
          }}
        >
          {Icon.link()} My anonymous page
        </Link>
        <Link
          href="/inbox"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "9px 0", borderRadius: 11, fontSize: 11, fontWeight: 500,
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none", transition: "all 0.18s",
            width: "100%", marginTop: 8,
          }}
        >
          {Icon.inbox()} View inbox
        </Link>
      </div>

      {/* promise */}
      <div style={{
        padding: 16, borderRadius: 16,
        border: "1px solid rgba(16,185,129,0.12)",
        background: "rgba(16,185,129,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <span style={{ color: "#34D399" }}>{Icon.shield()}</span>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#34D399", margin: 0 }}>Our Promise</p>
        </div>
        {["No accounts required to read", "Zero analytics on you", "Posts auto-delete in 48h", "No ads, ever"].map((l) => (
          <div key={l} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "rgba(52,211,153,0.6)", marginTop: 1, flexShrink: 0 }}>{Icon.check()}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.36)", lineHeight: 1.5 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────
function MobileNav() {
  const NAV_ITEMS = [
    { href: "/feed",          icon: Icon.home(),   label: "Feed"    },
    { href: "/anonymous-chat",icon: Icon.anon(),   label: "Anon"    },
    { href: "/inbox",         icon: Icon.inbox(),  label: "Inbox"   },
    { href: "/profile",       icon: Icon.user(),   label: "Profile" },
  ];

  return (
    <nav
      className="bm-mobile-nav"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(6,8,16,0.94)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div style={{
        maxWidth: 500, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "4px 8px",
      }}>
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "8px 0",
              borderRadius: 12, color: "rgba(255,255,255,0.3)",
              fontSize: 10, fontWeight: 500, textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {icon} {label}
          </Link>
        ))}
      </div>
      <style>{`@media(min-width:768px){.bm-mobile-nav{display:none!important}}`}</style>
    </nav>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
            zIndex: 200,
            padding: "11px 20px", borderRadius: 12,
            background: "rgba(17,24,39,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            fontSize: 13, color: "#fff",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function FeedPage() {
  const router = useRouter();

  const [posts,        setPosts]        = useState<Post[]>(SAMPLE);
  const [text,         setText]         = useState("");
  const [mood,         setMood]         = useState("Nostalgic");
  const [category,     setCategory]     = useState("Confession");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading,      setLoading]      = useState(false);
  const [currentUser,  setCurrentUser]  = useState<BlueMangUser | null>(null);
  const [toast,        setToast]        = useState({ visible: false, message: "" });

  // Load auth user + profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { router.push("/login"); return; }
      try {
        const profile = await getUserByUid(fbUser.uid);
        setCurrentUser(profile);
      } catch (err) {
        console.error("Could not load user profile:", err);
      }
    });
    return unsub;
  }, [router]);

  // Load posts
  useEffect(() => {
    getPosts()
      .then((data) => { if (Array.isArray(data) && data.length) setPosts(data as Post[]); })
      .catch(() => {});
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  }, []);

  const handlePost = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await createPost(
  text,
  currentUser?.username || "anonymous",
  mood,
  category
);
      const fresh = await getPosts();
      if (Array.isArray(fresh) && fresh.length) {
        setPosts(fresh as Post[]);
      } else {
        setPosts((prev) => [
  {
    id: `local-${Date.now()}`,
    text,
    anonymousName: currentUser?.username || "anonymous",
    mood,
    category,
    likes: 0,
    comments: 0,
    createdAt: new Date(),
    liked: false,
    saved: false,
  },
  ...prev,
]);
      }
      setText("");
      showToast("✦ Confession posted anonymously");
    } catch {
      showToast("Could not post. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [text, mood, category, showToast]);

  const handleLike = useCallback(async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    // Optimistic update
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
    ));
    try {
      await toggleLike(id, target.liked || false);
    } catch (err) {
      // Revert on failure
      console.error("Like toggle failed:", err);
      setPosts((prev) => prev.map((p) =>
        p.id === id ? { ...p, liked: target.liked, likes: target.likes } : p
      ));
    }
  }, [posts]);

  const handleSave = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
    const post = posts.find((p) => p.id === id);
    showToast(post?.saved ? "Removed from saved" : "Saved ✓");
  }, [posts, showToast]);

  const handleLogout = useCallback(async () => {
    try { await logoutUser(); } catch {}
    router.push("/login");
  }, [router]);

  const featured      = posts.find((p) => p.featured) ?? posts[0];
  const filteredPosts = posts.filter(
    (p) => !p.featured && (activeFilter === "All" || p.category === activeFilter)
  );

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        input,textarea,select,button{font-family:inherit}
        button{cursor:pointer}
        a{text-decoration:none;color:inherit}
      `}</style>

      {/* ── Background ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: -1, overflow: "hidden",
        background: "#060810", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", top: -150, left: -150,
          width: 550, height: 550, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "25%", right: -180,
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(139,92,246,0.09) 0%,transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -150, left: "30%",
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(192,108,132,0.08) 0%,transparent 70%)",
        }} />
      </div>

      {/* ── App shell ── */}
      <div className="bm-page" style={{ minHeight: "100vh", paddingBottom: 80 }}>
        <Header onLogout={handleLogout} user={currentUser} />

        <div className="bm-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 14px" }}>
          {/* Anonymous chat banner — mobile/tablet prominent placement */}
          <div className="bm-anon-banner">
            <AnonymousChatBanner user={currentUser} />
          </div>

          <StatsRow postCount={posts.length} />

          {/* Three-col layout */}
          <div className="bm-grid" style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>

            {/* Left sidebar */}
            <div className="bm-left-sidebar" style={{ display: "none" }}>
              <LeftSidebar user={currentUser} />
            </div>

            {/* Main feed */}
            <main style={{ minWidth: 0 }}>
              {featured && <FeaturedCard post={featured} onLike={handleLike} />}

              <Composer
                text={text} setText={setText}
                mood={mood} setMood={setMood}
                category={category} setCategory={setCategory}
                loading={loading} onPost={handlePost}
              />

              <CategoryBar active={activeFilter} onChange={setActiveFilter} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.18)" }}>
                  Recent whispers
                </p>
                <button
                  onClick={async () => {
                    try {
                      const f = await getPosts();
                      if (Array.isArray(f) && f.length) setPosts(f as Post[]);
                    } catch {}
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                    color: "rgba(255,255,255,0.22)", background: "none", border: "none",
                    cursor: "pointer", transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  {Icon.refresh()} Refresh
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredPosts.length === 0 ? (
                  <div style={{ padding: "64px 0", textAlign: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.12)", marginBottom: 14 }}>{Icon.moon()}</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>Nothing here yet in this category.</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", marginTop: 6 }}>Be the first to confess.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                      index={i}
                    />
                  ))
                )}
              </div>

              {filteredPosts.length > 0 && (
                <button
                  style={{
                    marginTop: 16, width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "13px 0",
                    borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.26)",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.26)"; }}
                >
                  Load older confessions {Icon.chevron()}
                </button>
              )}
            </main>

            {/* Right sidebar */}
            <div className="bm-right-sidebar" style={{ display: "none" }}>
              <RightSidebar user={currentUser} />
            </div>
          </div>
        </div>

        <MobileNav />
        <Toast message={toast.message} visible={toast.visible} />
      </div>

      {/* ── Responsive layout ── */}
      <style>{`
        @media(min-width:768px){.bm-page{padding-bottom:0!important}}
        @media(min-width:1024px){
          .bm-grid{grid-template-columns:220px 1fr 260px!important}
          .bm-left-sidebar{display:block!important}
          .bm-right-sidebar{display:block!important}
          .bm-anon-banner{display:none!important}
        }
        @media(min-width:480px){.bm-container{padding:24px 20px!important}}
        @media(min-width:768px){.bm-container{padding:32px 24px!important}}
      `}</style>
    </>
  );
}