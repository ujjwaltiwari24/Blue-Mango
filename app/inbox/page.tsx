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
  sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z" />
    </svg>
  ),
  inbox: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  reply: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  hide: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  flag: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  link: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  send: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  x: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

function timeAgo(date: Date | null): string {
  if (!date) return "just now";
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Reply Modal ──────────────────────────────────────────────────────────
function ReplyModal({
  message,
  onClose,
  onReplied,
}: {
  message: AnonymousMessage;
  onClose: () => void;
  onReplied: (id: string) => void;
}) {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReply = useCallback(async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    const postText = `Anonymous asked:\n"${message.message}"\n\nMy reply:\n"${trimmed}"`;
    try {
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

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              Reply Publicly
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                marginTop: 2,
              }}
            >
              Your reply will be posted to your BlueMango feed.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {Ic.x()}
          </button>
        </div>

        {/* Original message preview */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 8,
            }}
          >
            Anonymous asked
          </p>
          <p
            style={{
              fontFamily: "Georgia,serif",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.65)",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              borderLeft: "2px solid rgba(37,99,235,0.4)",
            }}
          >
            &ldquo;{message.message}&rdquo;
          </p>
        </div>

        {/* Reply composer */}
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 8,
            }}
          >
            Your reply
          </p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 500))}
            placeholder="Write your reply… It will appear on your feed."
            rows={4}
            autoFocus
            style={{
              width: "100%",
              resize: "none",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 12,
              padding: "13px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.85)",
              outline: "none",
              transition: "border 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(37,99,235,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.09)")
            }
          />
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 6,
              textAlign: "right",
            }}
          >
            {500 - reply.length} characters remaining
          </p>

          {error && (
            <p style={{ fontSize: 12, color: "#FB7185", marginTop: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReply}
              disabled={!reply.trim() || loading}
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "12px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                border: "none",
                background: "linear-gradient(135deg,#2563EB,#6366F1)",
                cursor: reply.trim() && !loading ? "pointer" : "not-allowed",
                opacity: reply.trim() && !loading ? 1 : 0.45,
                boxShadow: reply.trim()
                  ? "0 4px 16px rgba(37,99,235,0.3)"
                  : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "bmc-spin 0.8s linear infinite",
                  }}
                />
              ) : (
                Ic.send()
              )}
              {loading ? "Posting…" : "Post Reply"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────
function MessageCard({
  msg,
  index,
  onReply,
  onHide,
  onDelete,
  onReport,
}: {
  msg: AnonymousMessage;
  index: number;
  onReply: (m: AnonymousMessage) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleHide = async () => {
    if (actionLoading) return;
    setActionLoading("hide");
    try {
      await hideMessage(msg.id);
    } catch (err) {
      console.error("Hide failed:", err);
    } finally {
      setActionLoading(null);
    }
    onHide(msg.id);
  };

  const handleDelete = async () => {
    if (actionLoading) return;
    setActionLoading("delete");
    try {
      await deleteMessage(msg.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
    onDelete(msg.id);
  };

  const handleReport = async () => {
    if (actionLoading) return;
    setActionLoading("report");
    try {
      await reportMessage(msg.id);
    } catch (err) {
      console.error("Report failed:", err);
    } finally {
      setActionLoading(null);
    }
    onReport(msg.id);
  };

  const actions = [
    {
      key: "hide",
      icon: Ic.hide(),
      label: "Hide",
      color: "rgba(255,255,255,0.35)",
      handler: handleHide,
    },
    {
      key: "delete",
      icon: Ic.trash(),
      label: "Delete",
      color: "#FB7185",
      handler: handleDelete,
    },
    {
      key: "report",
      icon: Ic.flag(),
      label: "Report",
      color: "#FBBF24",
      handler: handleReport,
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Message body */}
      <div style={{ padding: "18px 18px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(139,92,246,0.3))",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Anonymous
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
                {timeAgo(msg.createdAt)}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            {msg.replied && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34D399",
                }}
              >
                Replied
              </span>
            )}
          </div>
        </div>

        <p
          style={{
            fontFamily: "Georgia,'Times New Roman',serif",
            fontStyle: "italic",
            fontSize: 15,
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          &ldquo;{msg.message}&rdquo;
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <button
          onClick={() => onReply(msg)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            color: "#93C5FD",
            background: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.2)",
            cursor: "pointer",
            transition: "all 0.18s",
          }}
        >
          {Ic.reply()} Reply Publicly
        </button>

        <div style={{ flex: 1 }} />

        {actions.map(({ key, icon, label, color, handler }) => (
          <button
            key={key}
            onClick={handler}
            disabled={actionLoading === key}
            title={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 10px",
              borderRadius: 9,
              fontSize: 11,
              color:
                actionLoading === key ? "rgba(255,255,255,0.2)" : color,
              background: "transparent",
              border: "none",
              cursor: actionLoading === key ? "not-allowed" : "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "transparent")
            }
          >
            {icon}
            <span className="inbox-action-label">{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Inbox Page ───────────────────────────────────────────────────────
export default function InboxPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<BlueMangUser | null>(null);
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTarget, setReplyTarget] = useState<AnonymousMessage | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // Computed client-side to prevent hydration mismatch
  const [profileLink, setProfileLink] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.push("/login");
        return;
      }
      try {
        const profile = await getUserByUid(fbUser.uid);
        setCurrentUser(profile);
        if (profile) {
          const slug =
            profile.usernameSlug ?? usernameToSlug(profile.username ?? "");
          if (slug && typeof window !== "undefined") {
            setProfileLink(
              `${window.location.origin}/anonymous-chat/${encodeURIComponent(slug)}`
            );
          }
        }
        const msgs = await getAnonymousMessages(fbUser.uid);
        setMessages(msgs);
      } catch (err) {
        console.error("Inbox load error:", err);
        setError("Could not load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const msgs = await getAnonymousMessages(currentUser.uid);
      setMessages(msgs);
    } catch (err) {
      console.error("Refresh error:", err);
      setError("Could not refresh messages.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handleHide = useCallback(
    (id: string) => setMessages((p) => p.filter((m) => m.id !== id)),
    []
  );
  const handleDelete = useCallback(
    (id: string) => setMessages((p) => p.filter((m) => m.id !== id)),
    []
  );
  const handleReport = useCallback(
    (id: string) => setMessages((p) => p.filter((m) => m.id !== id)),
    []
  );
  const handleReplied = useCallback(
    (id: string) =>
      setMessages((p) =>
        p.map((m) => (m.id === id ? { ...m, replied: true } : m))
      ),
    []
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {}
    router.push("/login");
  }, [router]);

  const slug =
    currentUser?.usernameSlug ??
    (currentUser?.username ? usernameToSlug(currentUser.username) : "");

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        button,textarea{font-family:inherit;cursor:pointer}
        a{text-decoration:none}
        @keyframes bmc-spin{to{transform:rotate(360deg)}}
        @keyframes bmc-pulse{0%,100%{opacity:0.4}50%{opacity:0.7}}
        @media(max-width:480px){.inbox-action-label{display:none!important}}
      `}</style>

      <AmbientBackground />

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
        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: scrolled ? "rgba(6,8,16,0.9)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid transparent",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
            }}
          >
            <Link
              href="/feed"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#D6A86B,#C06C84)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                {Ic.sparkle()}
              </div>
              <span
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                BlueMango
              </span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* "My link" now navigates to the hub page correctly */}
              <Link
                href="/anonymous-chat"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 13px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  textDecoration: "none",
                }}
              >
                {Ic.link()} My link
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 13px",
                  borderRadius: 20,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {Ic.logout()} Leave
              </button>
            </div>
          </div>
        </header>

        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "36px 16px 60px",
          }}
        >
          {/* Page title row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 28,
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div style={{ color: "#8B5CF6" }}>{Ic.inbox()}</div>
                <h1
                  style={{
                    fontFamily: "Georgia,serif",
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  Anonymous Inbox
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>
                {messages.length > 0
                  ? `${messages.length} message${messages.length === 1 ? "" : "s"} received`
                  : "No messages yet"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {Ic.refresh()} Refresh
            </button>
          </div>

          {/* Share link banner */}
          {currentUser?.username && profileLink && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 16px",
                borderRadius: 14,
                marginBottom: 24,
                background: "rgba(37,99,235,0.07)",
                border: "1px solid rgba(37,99,235,0.18)",
              }}
            >
              <span style={{ color: "#2563EB", flexShrink: 0 }}>
                {Ic.link()}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profileLink}
              </span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(profileLink).catch(() => {})
                }
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#93C5FD",
                  background: "rgba(37,99,235,0.15)",
                  border: "1px solid rgba(37,99,235,0.25)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Copy
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 20,
                background: "rgba(248,113,133,0.08)",
                border: "1px solid rgba(248,113,133,0.2)",
                fontSize: 13,
                color: "#FB7185",
              }}
            >
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 120,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    animation: "bmc-pulse 1.6s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "72px 24px" }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  margin: "0 auto 24px",
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(37,99,235,0.5)",
                }}
              >
                {Ic.inbox()}
              </div>
              <p
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 10,
                }}
              >
                No anonymous messages yet
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.65,
                  maxWidth: 360,
                  margin: "0 auto 28px",
                }}
              >
                Share your anonymous link and let people send you honest,
                anonymous messages.
              </p>
              {slug && (
                <Link
                  href={`/anonymous-chat/${encodeURIComponent(slug)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "11px 22px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    background: "linear-gradient(135deg,#2563EB,#6366F1)",
                    boxShadow: "0 4px 18px rgba(37,99,235,0.3)",
                  }}
                >
                  {Ic.link()} Get my link
                </Link>
              )}
            </motion.div>
          ) : (
            /* Message list */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
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
        </div>
      </div>
    </>
  );
}