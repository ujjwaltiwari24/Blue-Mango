// app/anonymous-chat/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { getUserByUid, usernameToSlug } from "@/services/anonymous-chat.service";
import { logoutUser } from "@/services/auth.service";
import AmbientBackground from "@/components/anonymous-chat/AmbientBackground";
import type { BlueMangUser } from "@/types/anonymous-chat";

// ─── Inline SVG icons ─────────────────────────────────────────────────────
const Ic = {
  sparkle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z" />
    </svg>
  ),
  copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  inbox: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  shield: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  user: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ─── Safe profile link builder ─────────────────────────────────────────────
/**
 * Builds the shareable anonymous chat URL using the slug.
 * Safe on both server and client (guards against window being undefined).
 */
function buildProfileLink(user: BlueMangUser | null): string {
  if (typeof window === "undefined") return "";
  if (!user?.username) return "";
  const slug = user.usernameSlug ?? usernameToSlug(user.username);
  if (!slug) return "";
  return `${window.location.origin}/anonymous-chat/${encodeURIComponent(slug)}`;
}

export default function AnonymousChatHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<BlueMangUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // profileLink is derived client-side only to avoid hydration mismatch
  const [profileLink, setProfileLink] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        router.push("/login");
        return;
      }
      try {
        const profile = await getUserByUid(fbUser.uid);
        setUser(profile);
        if (profile) {
          setProfileLink(buildProfileLink(profile));
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
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

  const handleCopy = useCallback(() => {
    if (!profileLink) return;
    navigator.clipboard.writeText(profileLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profileLink]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {}
    router.push("/login");
  }, [router]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <AmbientBackground />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.08)",
                borderTopColor: "#2563EB",
                animation: "bmc-spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              Loading your space…
            </p>
          </div>
          <style>{`@keyframes bmc-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    );
  }

  const slug = user ? (user.usernameSlug ?? usernameToSlug(user.username ?? "")) : "";

  const howItWorks = [
    {
      step: "01",
      title: "Share your link",
      desc: "Copy your unique link and share it anywhere — social media, bio, or with friends.",
    },
    {
      step: "02",
      title: "Receive messages",
      desc: "Anyone with your link can send you an anonymous message. Senders stay completely anonymous.",
    },
    {
      step: "03",
      title: "Reply publicly",
      desc: "Choose to reply publicly. Your reply becomes a post on your BlueMango feed.",
    },
  ];

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        button,input,textarea{font-family:inherit}
        a{text-decoration:none}
        @keyframes bmc-spin{to{transform:rotate(360deg)}}
        @keyframes bmc-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <AmbientBackground />

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
              maxWidth: 960,
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
                gap: 10,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
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
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                BlueMango
              </span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/inbox"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
              >
                {Ic.inbox()} Inbox
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {Ic.logout()} Leave
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px" }}>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: 52 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 20,
                marginBottom: 20,
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.25)",
                fontSize: 11,
                color: "#93C5FD",
                fontWeight: 500,
                letterSpacing: "0.5px",
              }}
            >
              {Ic.shield()} Anonymous · Safe · No login required to send
            </div>
            <h1
              style={{
                fontFamily: "Georgia,'Times New Roman',serif",
                fontSize: "clamp(32px,6vw,52px)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#fff",
                marginBottom: 16,
                letterSpacing: "-0.5px",
              }}
            >
              Chat With Me
              <span
                style={{
                  display: "block",
                  background:
                    "linear-gradient(90deg,#2563EB,#8B5CF6,#C06C84)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Anonymously
              </span>
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Share your link. Let people send you honest, anonymous messages.
              Reply publicly to start a conversation.
            </p>
          </motion.div>

          {/* Profile card + link */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              background:
                "linear-gradient(135deg,rgba(37,99,235,0.08),rgba(139,92,246,0.06))",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 24,
              padding: "32px 28px",
              marginBottom: 32,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle,rgba(37,99,235,0.15),transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Avatar + name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  flexShrink: 0,
                  background:
                    "linear-gradient(135deg,rgba(37,99,235,0.5),rgba(139,92,246,0.5))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "Georgia,serif",
                }}
              >
                {(
                  user?.displayName ??
                  user?.username ??
                  "U"
                )[0].toUpperCase()}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 3,
                  }}
                >
                  {user?.displayName ?? user?.username ?? "Your Profile"}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  @{user?.username}
                </p>
              </div>
            </div>

            {/* Link section */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 10,
              }}
            >
              Your anonymous link
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "rgba(37,99,235,0.6)", flexShrink: 0 }}>
                {Ic.link()}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profileLink || "Loading…"}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "none",
                  color: copied ? "#10B981" : "#fff",
                  background: copied
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(37,99,235,0.3)",
                  flexShrink: 0,
                }}
              >
                {copied ? Ic.check() : Ic.copy()}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Preview link — uses slug for navigation */}
            {slug && (
              <Link
                href={`/anonymous-chat/${encodeURIComponent(slug)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Preview your page →
              </Link>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <Link
              href="/inbox"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "20px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ color: "#8B5CF6" }}>{Ic.inbox()}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                View Inbox
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5,
                }}
              >
                See all anonymous messages you received.
              </p>
            </Link>
            <div
              onClick={handleCopy}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "20px",
                borderRadius: 18,
                background: "rgba(37,99,235,0.06)",
                border: "1px solid rgba(37,99,235,0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ color: "#2563EB" }}>{Ic.copy()}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                Share Link
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5,
                }}
              >
                Copy and share to receive messages.
              </p>
            </div>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 20,
              }}
            >
              How it works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {howItWorks.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: "18px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#2563EB",
                      background: "rgba(37,99,235,0.12)",
                      border: "1px solid rgba(37,99,235,0.2)",
                      borderRadius: 8,
                      padding: "4px 8px",
                      fontFamily: "Georgia,serif",
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}