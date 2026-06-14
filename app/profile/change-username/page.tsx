"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/firebase";

import {
  usernameToSlug,
  migrateUserIfNeeded,
  isUsernameAvailable,
  canChangeUsername,
  updateUsername,
} from "@/services/username.service";

export default function ChangeUsernamePage() {
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");

  const [slug, setSlug] = useState("");

  const [available, setAvailable] =
    useState<boolean | null>(null);

  const [daysRemaining, setDaysRemaining] =
    useState(0);

  const [canChange, setCanChange] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await migrateUserIfNeeded(user.uid);

      const cooldown =
        await canChangeUsername(user.uid);

      /*
       * FIX:
       * If this is the first time and the service
       * mistakenly returns 7 days, allow one free change.
       */

      if (
        cooldown.daysRemaining === 7 &&
        cooldown.allowed === false
      ) {
        setCanChange(true);
        setDaysRemaining(0);
      } else {
        setCanChange(cooldown.allowed);
        setDaysRemaining(
          cooldown.daysRemaining
        );
      }
    } catch (error) {
      console.error(error);

      /*
       * Fail open.
       * Don't lock users out because of migration issues.
       */
      setCanChange(true);
      setDaysRemaining(0);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAvailability();
  }, [username]);

  const checkAvailability =
    async () => {
      const user =
        auth.currentUser;

      if (!user) return;

      const trimmed =
        username.trim();

      if (
        trimmed.length < 3
      ) {
        setAvailable(null);
        setSlug("");
        return;
      }

      const generatedSlug =
        usernameToSlug(trimmed);

      setSlug(generatedSlug);

      try {
        const result =
          await isUsernameAvailable(
            trimmed,
            user.uid
          );

        setAvailable(result);
      } catch (error) {
        console.error(error);

        setAvailable(null);
      }
    };

  const handleSave =
    async () => {
      const user =
        auth.currentUser;

      if (!user) {
        alert(
          "Please login."
        );

        return;
      }

      try {
        setSaving(true);

        setMessage("");

        const newSlug =
          await updateUsername(
            user.uid,
            username
          );

        setMessage(
          `Username updated successfully! Your new link is ${window.location.origin}/anonymous-chat/${newSlug}`
        );

        /*
         * Start cooldown only after success.
         */

        setCanChange(false);

        setDaysRemaining(7);
      } catch (
        error: any
      ) {
        alert(
          error.message ||
            "Failed to update username."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111F] text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111F] text-white">

      <div className="mx-auto max-w-3xl px-5 py-10">

        <Link
          href="/profile"
          className="text-slate-400 hover:text-white"
        >
          ← Back to Profile
        </Link>

        <div className="mt-6 rounded-[32px] border border-slate-800 bg-slate-900/60 p-8">

          <h1 className="text-4xl font-black">
            Change Username
          </h1>

          <p className="mt-2 text-slate-400">
            Your anonymous identity can only be changed once every 7 days.
          </p>

          <div className="mt-8">

            <label className="text-sm text-slate-400">
              New Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Enter username"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none focus:border-blue-500"
            />

          </div>

          <div className="mt-5 rounded-2xl bg-slate-950 p-4">

            <p className="text-sm text-slate-400">
              Anonymous Link
            </p>

            <p className="mt-1 break-all font-mono text-blue-400">
              {slug
                ? `${window.location.origin}/anonymous-chat/${slug}`
                : "Type a username"}
            </p>

          </div>

          <div className="mt-5">

            {available === true && !message && (
  <p className="text-emerald-400">
    ✓ Username available
  </p>
)}

            {available === false && (
              <p className="text-red-400">
                ✕ Username already taken
              </p>
            )}

          </div>

          {!canChange && (
            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">

              <p className="text-yellow-300">
                You can change your username again in{" "}
                {daysRemaining} day(s).
              </p>

            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">

              <p className="text-emerald-300">
                {message}
              </p>

            </div>
          )}

          <button
            disabled={
              available !== true ||
              saving ||
              !username.trim()
            }
            onClick={
              handleSave
            }
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Username"}
          </button>

        </div>

      </div>

    </main>
  );
}