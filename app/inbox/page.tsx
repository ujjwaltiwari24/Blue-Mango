// app/inbox/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import {
  getAnonymousMessages,
  hideMessage,
  deleteMessage,
  reportMessage,
  markAsReplied,
  getUserByUid,
  usernameToSlug,
} from "@/services/anonymous-chat.service";
import { createPost } from "@/services/post.service";
import { logoutUser } from "@/services/auth.service";
import AmbientBackground from "@/components/anonymous-chat/AmbientBackground";
import type { AnonymousMessage, BlueMangUser } from "@/types/anonymous-chat";

// ─── Icons ────────────────────────────────────────────────────────────────
const Ic = {
  sparkle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z" /></svg>,
  inbox:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>,
  reply:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>,
  trash:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  hide:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  flag:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  logout:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  link:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  send:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  x:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  refresh: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  check:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  copy:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  feed:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  lock:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  warn:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(date: Date | null): string {
  if (!date) return "just now";
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div className="bm-shimmer" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="bm-shimmer" style={{ width: 90, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
            <div className="bm-shimmer" style={{ width: 55, height: 8, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div className="bm-shimmer" style={{ width: "100%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
          <div className="bm-shimmer" style={{ width: "82%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
          <div className="bm-shimmer" style={{ width: "55%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.03)" }} />
        </div>
      </div>
      <div style={{ height: 46, borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }} />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "60px 24px" }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
        background: "rgba(251,113,133,0.08)",
        border: "1px solid rgba(251,113,133,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#FB7185",
      }}>
        {Ic.warn()}
      </div>
      <p style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
        Could not load messages
      </p>
      <p style={{
        fontSize: 13, color: "rgba(255,255,255,0.35)",
        lineHeight: 1.6, maxWidth: 320, margin: "0 auto 24px",
        fontFamily: "monospace", background: "rgba(255,255,255,0.03)",
        padding: "10px 14px", borderRadius: 10, textAlign: "left",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: "#fff", border: "none",
          background: "linear-gradient(135deg,#2563EB,#6366F1)",
          cursor: "pointer", boxShadow: "0 4px 18px rgba(37,99,235,0.3)",
        }}
      >
        {Ic.refresh()} Try again
      </button>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────
function EmptyState({ slug }: { slug: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: "center", padding: "60px 24px 80px" }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 22, margin: "0 auto 28px",
        background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(139,92,246,0.08))",
        border: "1px solid rgba(99,102,241,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
        <div style={{
          position: "absolute", inset: -5, borderRadius: 27,
          border: "1px solid rgba(99,102,241,0.1)",
          animation: "bm-pulse-ring 2.5s ease-in-out infinite",
        }} />
      </div>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, marginBottom: 10 }}>
        Your inbox is empty
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto 32px" }}>
        Share your anonymous link and let people send you honest, unfiltered messages.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340, margin: "0 auto 32px", textAlign: "left" }}>
        {[
          { n: "1", text: "Copy your anonymous link above" },
          { n: "2", text: "Share it on Instagram, Twitter, or with friends" },
          { n: "3", text: "Messages appear here instantly" },
        ].map(({ n, text }) => (
          <div key={n} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: "rgba(37,99,235,0.14)",
              border: "1px solid rgba(37,99,235,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#60A5FA",
            }}>{n}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
      {slug && (
        <Link
          href={`/anonymous-chat/${encodeURIComponent(slug)}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "12px 26px", borderRadius: 13, fontSize: 13, fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg,#2563EB,#6366F1)",
            boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
            textDecoration: "none",
          }}
        >
          {Ic.link()} View my anonymous page
        </Link>
      )}
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────
function StatsBar({ total, replied, unreplied }: { total: number; replied: number; unreplied: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
      {[
        { label: "Total",     value: total,     color: "#8B5CF6", bg: "rgba(139,92,246,0.09)",  border: "rgba(139,92,246,0.18)" },
        { label: "Unreplied", value: unreplied, color: "#38BDF8", bg: "rgba(56,189,248,0.09)",  border: "rgba(56,189,248,0.18)" },
        { label: "Replied",   value: replied,   color: "#34D399", bg: "rgba(52,211,153,0.09)",  border: "rgba(52,211,153,0.18)" },
      ].map((s) => (
        <div key={s.label} style={{ padding: "13px 16px", borderRadius: 14, background: s.bg, border: `1px solid ${s.border}`, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", margin: 0, marginTop: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Reply Modal ──────────────────────────────────────────────────────────
function ReplyModal({ message, onClose, onReplied }: {
  message: AnonymousMessage;
  onClose: () => void;
  onReplied: (id: string) => void;
}) {
  const [reply,   setReply]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const MAX = 500;
  const pct  = (reply.length / MAX) * 100;
  const r    = 8;
  const circ = 2 * Math.PI * r;

  const handleReply = useCallback(async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const postText = `Anonymous asked:\n"${message.message}"\n\nMy reply:\n"${trimmed}"`;
      await createPost(postText, "anonymous reply", "Hopeful", "Confession");
      await markAsReplied(message.id);
      onReplied(message.id);
      onClose();
    } catch (err) {
      console.error("Reply failed:", err);
      setError("Could not post reply. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [reply, message, onClose, onReplied]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 12 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ width: "100%", maxWidth: 520, background: "linear-gradient(135deg,#0f1624,#0a0e1a)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818CF8" }}>
              {Ic.reply()}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Reply Publicly</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, marginTop: 2 }}>Posts to your BlueMango feed</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {Ic.x()}
          </button>
        </div>

        {/* Original message */}
        <div style={{ padding: "16px 20px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>Anonymous asked</p>
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", padding: "13px 15px", background: "rgba(255,255,255,0.03)", borderRadius: 11, borderLeft: "2px solid rgba(37,99,235,0.35)" }}>
            &ldquo;{message.message}&rdquo;
          </div>
        </div>

        {/* Reply composer */}
        <div style={{ padding: "4px 20px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>Your reply</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, MAX))}
            placeholder="Write your reply…"
            rows={4}
            autoFocus
            style={{ width: "100%", resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(37,99,235,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          {error && <p style={{ fontSize: 12, color: "#FB7185", marginTop: 6 }}>{error}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.42)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
              Cancel
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="20" height="20" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="10" cy="10" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
                <circle cx="10" cy="10" r={r} fill="none" stroke={pct > 90 ? "#FB7185" : pct > 70 ? "#FBBF24" : "#2563EB"} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round" style={{ transition: "all 0.2s" }} />
              </svg>
              <button
                onClick={handleReply}
                disabled={!reply.trim() || loading}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 11, fontSize: 13, fontWeight: 600, color: "#fff", border: "none", background: "linear-gradient(135deg,#2563EB,#6366F1)", cursor: reply.trim() && !loading ? "pointer" : "not-allowed", opacity: reply.trim() && !loading ? 1 : 0.4, boxShadow: reply.trim() ? "0 4px 16px rgba(37,99,235,0.3)" : "none", transition: "all 0.2s" }}
              >
                {loading ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "bmc-spin 0.8s linear infinite" }} /> : Ic.send()}
                {loading ? "Posting…" : "Post Reply"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────
function MessageCard({ msg, index, onReply, onHide, onDelete, onReport }: {
  msg: AnonymousMessage;
  index: number;
  onReply: (m: AnonymousMessage) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isLong = msg.message.length > 220;
  const displayText = expanded || !isLong ? msg.message : msg.message.slice(0, 220) + "…";

  const handleAction = async (type: "hide" | "delete" | "report") => {
    if (actionLoading) return;
    setActionLoading(type);
    try {
      if (type === "hide")   { await hideMessage(msg.id);   onHide(msg.id);   }
      if (type === "delete") { await deleteMessage(msg.id); onDelete(msg.id); }
      if (type === "report") { await reportMessage(msg.id); onReport(msg.id); }
    } catch (err) {
      console.error(`${type} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const actions = [
    { key: "hide"   as const, icon: Ic.hide(),  label: "Hide",   color: "rgba(255,255,255,0.32)" },
    { key: "delete" as const, icon: Ic.trash(), label: "Delete", color: "#FB7185" },
    { key: "report" as const, icon: Ic.flag(),  label: "Report", color: "#FBBF24" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      style={{ background: "rgba(255,255,255,0.026)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.038)" } as object}
    >
      <div style={{ padding: "18px 20px 14px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,rgba(37,99,235,0.25),rgba(139,92,246,0.25))", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.38)" }}>
              {Ic.lock()}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>Anonymous</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", margin: 0, marginTop: 2 }}>{timeAgo(msg.createdAt)}</p>
            </div>
          </div>
          {msg.replied && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.18)", color: "#34D399", flexShrink: 0 }}>
              {Ic.check()} Replied
            </span>
          )}
        </div>

        {/* Message text */}
        <p style={{ fontFamily: "Georgia,'Times New Roman',serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.78, color: "rgba(255,255,255,0.82)", margin: 0 }}>
          &ldquo;{displayText}&rdquo;
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} style={{ marginLeft: 8, fontSize: 12, fontStyle: "normal", color: "rgba(96,165,250,0.7)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {expanded ? "show less" : "read more"}
            </button>
          )}
        </p>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.08)" }}>
        <button
          onClick={() => onReply(msg)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#93C5FD", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", cursor: "pointer", transition: "all 0.18s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.18)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.1)"; }}
        >
          {Ic.reply()} Reply publicly
        </button>
        <div style={{ flex: 1 }} />
        {actions.map(({ key, icon, label, color }) => (
          <button
            key={key}
            onClick={() => handleAction(key)}
            disabled={!!actionLoading}
            title={label}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 9, fontSize: 11, color: actionLoading === key ? "rgba(255,255,255,0.15)" : color, background: "transparent", border: "none", cursor: actionLoading ? "not-allowed" : "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { if (!actionLoading) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            {actionLoading === key
              ? <div style={{ width: 11, height: 11, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.5)", animation: "bmc-spin 0.8s linear infinite" }} />
              : icon
            }
            <span className="inbox-action-label">{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function InboxPage() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<BlueMangUser | null>(null);
  const [messages,    setMessages]    = useState<AnonymousMessage[]>([]);
  const [profileLink, setProfileLink] = useState("");
  const [linkCopied,  setLinkCopied]  = useState(false);

  // Three distinct loading states so UI is always correct
  const [authLoading, setAuthLoading] = useState(true);   // waiting for firebase auth
  const [msgLoading,  setMsgLoading]  = useState(false);  // fetching messages
  const [fetchError,  setFetchError]  = useState("");     // error string (empty = no error)

  const [replyTarget, setReplyTarget] = useState<AnonymousMessage | null>(null);
  const [scrolled,    setScrolled]    = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filter,      setFilter]      = useState<"all" | "unreplied" | "replied">("all");

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (uid: string) => {
    setMsgLoading(true);
    setFetchError("");
    try {
      console.log("[Inbox] Fetching messages for uid:", uid);
      const msgs = await getAnonymousMessages(uid);
      console.log("[Inbox] Fetched", msgs.length, "messages");
      setMessages(msgs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Inbox] Fetch failed:", err);
      setFetchError(msg);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.push("/login");
        return;
      }

      try {
        const profile = await getUserByUid(fbUser.uid);
        setCurrentUser(profile);

        // Build profile link client-side only
        if (profile && typeof window !== "undefined") {
          const slug = profile.usernameSlug ?? usernameToSlug(profile.username ?? "");
          if (slug) {
            setProfileLink(`${window.location.origin}/anonymous-chat/${encodeURIComponent(slug)}`);
          }
        }

        // Fetch messages now that we have the uid
        await loadMessages(fbUser.uid);
      } catch (err) {
        console.error("[Inbox] Auth/profile error:", err);
        setFetchError("Could not load your profile. Please try again.");
      } finally {
        setAuthLoading(false);
      }
    });
    return unsub;
  }, [router, loadMessages]);

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // ── Refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (!currentUser || refreshing) return;
    setRefreshing(true);
    await loadMessages(currentUser.uid);
    setRefreshing(false);
  }, [currentUser, refreshing, loadMessages]);

  const handleCopyLink = useCallback(() => {
    if (!profileLink) return;
    navigator.clipboard.writeText(profileLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
  }, [profileLink]);

  // ── Message handlers ─────────────────────────────────────────────────────
  const handleHide    = useCallback((id: string) => setMessages(p => p.filter(m => m.id !== id)), []);
  const handleDelete  = useCallback((id: string) => setMessages(p => p.filter(m => m.id !== id)), []);
  const handleReport  = useCallback((id: string) => setMessages(p => p.filter(m => m.id !== id)), []);
  const handleReplied = useCallback((id: string) => setMessages(p => p.map(m => m.id === id ? { ...m, replied: true } : m)), []);

  const handleLogout = useCallback(async () => {
    try { await logoutUser(); } catch {}
    router.push("/login");
  }, [router]);

  // ── Derived values ───────────────────────────────────────────────────────
  const slug           = currentUser?.usernameSlug ?? (currentUser?.username ? usernameToSlug(currentUser.username) : "");
  const repliedCount   = messages.filter(m => m.replied).length;
  const unrepliedCount = messages.filter(m => !m.replied).length;
  const filteredMsgs   = messages.filter(m =>
    filter === "unreplied" ? !m.replied :
    filter === "replied"   ?  m.replied : true
  );

  // Combined loading = auth still resolving OR messages being fetched
  const isLoading = authLoading || msgLoading;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        button,textarea{font-family:inherit}
        a{text-decoration:none;color:inherit}
        @keyframes bmc-spin{to{transform:rotate(360deg)}}
        @keyframes bm-pulse-ring{0%,100%{opacity:0.25;transform:scale(1)}50%{opacity:0.5;transform:scale(1.05)}}
        @keyframes bm-shimmer{0%,100%{opacity:0.35}50%{opacity:0.65}}
        .bm-shimmer{animation:bm-shimmer 1.6s ease-in-out infinite}
        @media(max-width:480px){.inbox-action-label{display:none!important}}
        @media(max-width:400px){.inbox-filter-label{display:none!important}}
      `}</style>

      <AmbientBackground />

      {/* Reply modal */}
      <AnimatePresence>
        {replyTarget && (
          <ReplyModal
            key={replyTarget.id}
            message={replyTarget}
            onClose={() => setReplyTarget(null)}
            onReplied={handleReplied}
          />
        )}
      </AnimatePresence>

      <div style={{ minHeight: "100vh" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled ? "rgba(6,8,16,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}>
          <div style={{ maxWidth: 860, margin: "0 auto", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <Link href="/feed" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#D6A86B,#C06C84)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                {Ic.sparkle()}
              </div>
              <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 600, color: "#fff" }}>BlueMango</span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/feed" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", textDecoration: "none" }}>
                {Ic.feed()} <span className="inbox-action-label">Feed</span>
              </Link>
              <Link href="/anonymous-chat" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", textDecoration: "none" }}>
                {Ic.link()} My link
              </Link>
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,0.38)", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FB7185"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(251,113,133,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                {Ic.logout()} <span className="inbox-action-label">Leave</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6", flexShrink: 0 }}>
                  {Ic.inbox()}
                </div>
                <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>
                  Anonymous Inbox
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", marginLeft: 42 }}>
                {isLoading
                  ? "Loading messages…"
                  : fetchError
                    ? "Failed to load"
                    : messages.length > 0
                      ? `${messages.length} message${messages.length === 1 ? "" : "s"} · ${unrepliedCount} unreplied`
                      : "No messages yet — share your link!"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading || refreshing}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: isLoading || refreshing ? "not-allowed" : "pointer", opacity: isLoading || refreshing ? 0.5 : 1, transition: "all 0.2s", flexShrink: 0 }}
            >
              <span style={{ display: "flex", animation: refreshing ? "bmc-spin 0.7s linear infinite" : "none" }}>
                {Ic.refresh()}
              </span>
              <span className="inbox-action-label">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>

          {/* Profile link banner */}
          {!authLoading && currentUser?.username && profileLink && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, marginBottom: 24, background: "linear-gradient(135deg,rgba(37,99,235,0.07),rgba(99,102,241,0.05))", border: "1px solid rgba(99,102,241,0.18)" }}>
              <span style={{ color: "#6366F1", flexShrink: 0, opacity: 0.8 }}>{Ic.link()}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profileLink}
              </span>
              <button
                onClick={handleCopyLink}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 9, fontSize: 11, fontWeight: 600, color: linkCopied ? "#34D399" : "#93C5FD", background: linkCopied ? "rgba(52,211,153,0.1)" : "rgba(37,99,235,0.14)", border: `1px solid ${linkCopied ? "rgba(52,211,153,0.22)" : "rgba(37,99,235,0.22)"}`, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
              >
                {linkCopied ? Ic.check() : Ic.copy()}
                {linkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {/* ── Main content area: exactly ONE of these renders ── */}

          {isLoading ? (
            /* 1. Loading */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>

          ) : fetchError ? (
            /* 2. Error — show error details, NOT empty state */
            <ErrorState message={fetchError} onRetry={handleRefresh} />

          ) : messages.length === 0 ? (
            /* 3. Truly empty */
            <EmptyState slug={slug} />

          ) : (
            /* 4. Messages exist — show them */
            <>
              <StatsBar total={messages.length} replied={repliedCount} unreplied={unrepliedCount} />

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4 }}>
                {(["all", "unreplied", "replied"] as const).map((f) => {
                  const labels = { all: "All", unreplied: "Unreplied", replied: "Replied" };
                  const counts = { all: messages.length, unreplied: unrepliedCount, replied: repliedCount };
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 9, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.18s", border: "none", color: active ? "#fff" : "rgba(255,255,255,0.38)", background: active ? "rgba(37,99,235,0.22)" : "transparent", boxShadow: active ? "0 0 0 1px rgba(37,99,235,0.3)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <span className="inbox-filter-label">{labels[f]}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)", color: active ? "#fff" : "rgba(255,255,255,0.3)" }}>
                        {counts[f]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredMsgs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  No {filter} messages.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <AnimatePresence mode="popLayout">
                    {filteredMsgs.map((msg, i) => (
                      <MessageCard
                        key={msg.id}
                        msg={msg}
                        index={i}
                        onReply={setReplyTarget}
                        onHide={handleHide}
                        onDelete={handleDelete}
                        onReport={handleReport}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}