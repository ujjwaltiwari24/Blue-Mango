// app/anonymous-chat/[username]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getUserByUsername,
  sendAnonymousMessage,
  validateMessage,
  usernameToSlug,
} from "@/services/anonymous-chat.service";
import AmbientBackground from "@/components/anonymous-chat/AmbientBackground";
import type { BlueMangUser } from "@/types/anonymous-chat";

// ─── Icons ────────────────────────────────────────────────────────────────
const Ic = {
  sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9L12 2z" />
    </svg>
  ),
  send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  shield: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  lock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

type PageState = "loading" | "not-found" | "ready" | "sent";

export default function AnonymousChatProfilePage() {
  const params = useParams();
  // params.username is the slug from the URL segment
  const rawParam = Array.isArray(params?.username)
    ? params.username[0]
    : (params?.username ?? "");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [profileUser, setProfileUser] = useState<BlueMangUser | null>(null);
  const [message, setMessage] = useState("");
  const [charError, setCharError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const MAX_CHARS = 500;

  useEffect(() => {
    if (!rawParam) {
      setPageState("not-found");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await getUserByUsername(rawParam);
        if (cancelled) return;
        if (!user) {
          setPageState("not-found");
        } else {
          setProfileUser(user);
          setPageState("ready");
        }
      } catch (err) {
        console.error("Profile lookup error:", err);
        if (!cancelled) setPageState("not-found");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawParam]);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length > MAX_CHARS) return;
      setMessage(val);
      // Real-time validation feedback
      const result = validateMessage(val);
      setCharError(result.valid || val.length === 0 ? "" : (result.error ?? ""));
    },
    []
  );

  const handleSend = useCallback(async () => {
    if (!profileUser) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    const validation = validateMessage(trimmed);
    if (!validation.valid) {
      setCharError(validation.error ?? "Invalid message.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await sendAnonymousMessage({
        receiverUid: profileUser.uid,
        receiverUsername: profileUser.username,
        message: trimmed,
      });
      setMessage("");
      setCharError("");
      setPageState("sent");
    } catch (err: unknown) {
      console.error("Send error:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Could not send message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [message, profileUser]);

  const handleSendAnother = useCallback(() => {
    setMessage("");
    setCharError("");
    setSubmitError("");
    setPageState("ready");
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === "loading") {
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
              Finding profile…
            </p>
          </div>
          <style>{`@keyframes bmc-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (pageState === "not-found") {
    return (
      <>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif}
        `}</style>
        <AmbientBackground />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", maxWidth: 400 }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                margin: "0 auto 24px",
                background: "rgba(251,113,133,0.08)",
                border: "1px solid rgba(251,113,133,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(251,113,133,0.5)",
              }}
            >
              {Ic.warning()}
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
              Profile not found
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.65,
              }}
            >
              This link may be invalid or the user may no longer exist. Double-check the URL and try again.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Sent ──────────────────────────────────────────────────────────────────
  if (pageState === "sent") {
    return (
      <>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif}
        `}</style>
        <AmbientBackground />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              textAlign: "center",
              maxWidth: 440,
              width: "100%",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "48px 32px",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                margin: "0 auto 24px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34D399",
              }}
            >
              {Ic.check()}
            </div>
            <p
              style={{
                fontFamily: "Georgia,serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 10,
              }}
            >
              Message sent!
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.65,
                marginBottom: 32,
              }}
            >
              Your anonymous message has been delivered to{" "}
              <strong style={{ color: "rgba(255,255,255,0.65)" }}>
                {profileUser?.displayName ?? profileUser?.username}
              </strong>
              . They may choose to reply publicly on their feed.
            </p>
            <button
              onClick={handleSendAnother}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg,#2563EB,#6366F1)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                transition: "all 0.2s",
              }}
            >
              Send another
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Ready: message composer ────────────────────────────────────────────────
  const displayName = profileUser?.displayName ?? profileUser?.username ?? "Someone";
  const initials = displayName[0].toUpperCase();
  const remaining = MAX_CHARS - message.length;
  const isValid = message.trim().length > 0 && !charError;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060810;color:#fff;font-family:'Sora','DM Sans',system-ui,sans-serif;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        button,textarea{font-family:inherit}
        @keyframes bmc-spin{to{transform:rotate(360deg)}}
      `}</style>

      <AmbientBackground />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 64px",
        }}
      >
        {/* Header branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
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
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            BlueMango
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ width: "100%", maxWidth: 500 }}
        >
          {/* Profile card */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                margin: "0 auto 16px",
                background:
                  "linear-gradient(135deg,rgba(37,99,235,0.5),rgba(139,92,246,0.5))",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Georgia,serif",
              }}
            >
              {initials}
            </div>
            <h1
              style={{
                fontFamily: "Georgia,serif",
                fontSize: "clamp(22px,5vw,30px)",
                fontWeight: 700,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {displayName}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              @{profileUser?.username}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 12,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.2)",
                fontSize: 11,
                color: "#93C5FD",
              }}
            >
              {Ic.shield()} Anonymous · Safe · No sign-up needed
            </div>
          </div>

          {/* Composer */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {/* Anon bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,rgba(37,99,235,0.35),rgba(139,92,246,0.35))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}
              >
                {Ic.lock()}
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                sending as
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                anonymous
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={handleMessageChange}
              placeholder={`Say something to ${displayName}…`}
              rows={5}
              style={{
                width: "100%",
                resize: "none",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "16px",
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.82)",
                fontFamily: "inherit",
              }}
            />

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color:
                    remaining < 50
                      ? remaining < 20
                        ? "#FB7185"
                        : "#FBBF24"
                      : "rgba(255,255,255,0.25)",
                }}
              >
                {remaining} left
              </span>
              <button
                onClick={handleSend}
                disabled={!isValid || submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 20px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  border: "none",
                  background: "linear-gradient(135deg,#2563EB,#6366F1)",
                  cursor: isValid && !submitting ? "pointer" : "not-allowed",
                  opacity: isValid && !submitting ? 1 : 0.4,
                  boxShadow: isValid
                    ? "0 4px 16px rgba(37,99,235,0.3)"
                    : "none",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? (
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
                {submitting ? "Sending…" : "Send anonymously"}
              </button>
            </div>
          </div>

          {/* Validation / submission errors */}
          {(charError || submitError) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(251,113,133,0.08)",
                border: "1px solid rgba(251,113,133,0.2)",
                fontSize: 12,
                color: "#FB7185",
              }}
            >
              {Ic.warning()} {charError || submitError}
            </div>
          )}

          {/* Privacy note */}
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 20,
              lineHeight: 1.6,
            }}
          >
            {Ic.shield()} Your identity is never revealed. No account needed.
          </p>
        </motion.div>
      </div>
    </>
  );
}