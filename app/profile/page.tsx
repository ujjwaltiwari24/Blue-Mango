"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  migrateUserIfNeeded,
  usernameToSlug,
} from "@/services/username.service";

export default function ProfilePage() {
  const [loading, setLoading] =
    useState(true);

  const [username, setUsername] =
    useState("BlueMango User");

  const [slug, setSlug] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [canChangeIn, setCanChangeIn] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await migrateUserIfNeeded(
        user.uid
      );

      const snap =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

      if (snap.exists()) {
        const data =
          snap.data();

        const userUsername =
          data.username ||
          "BlueMango User";

        setUsername(
          userUsername
        );

        setSlug(
          data.usernameSlug ||
            usernameToSlug(
              userUsername
            )
        );

        setEmail(
          data.email || ""
        );

        if (
          data.lastUsernameChange
        ) {
          const last =
            data.lastUsernameChange.toDate();

          const next =
            new Date(
              last.getTime() +
                7 *
                  24 *
                  60 *
                  60 *
                  1000
            );

          const diff =
            next.getTime() -
            Date.now();

          if (diff > 0) {
            const days =
              Math.ceil(
                diff /
                  (1000 *
                    60 *
                    60 *
                    24)
              );

            setCanChangeIn(
              `${days} day(s)`
            );
          } else {
            setCanChangeIn(
              "Now"
            );
          }
        }
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/anonymous-chat/${slug}`
      );

      alert(
        "Anonymous link copied!"
      );
    } catch {
      alert(
        "Failed to copy."
      );
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

      <div className="mx-auto max-w-5xl px-5 py-10">

        {/* Header */}

        <div className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">

              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-3xl font-bold">

                {username
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <h1 className="text-3xl font-black">

                  {username}

                </h1>

                <p className="text-slate-400">

                  Anonymous Community Member

                </p>

                {email && (
                  <p className="mt-1 text-sm text-slate-500">

                    {email}

                  </p>
                )}

              </div>

            </div>

            <Link
              href="/profile/change-username"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-semibold transition hover:opacity-90"
            >
              Change Username
            </Link>

          </div>

        </div>

        {/* Anonymous Link */}

        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold">

                Your Anonymous Link

              </h2>

              <p className="mt-2 break-all text-blue-400">

                {window.location.origin}
                /anonymous-chat/
                {slug}

              </p>

            </div>

            <button
              onClick={copyLink}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 font-medium text-blue-300 transition hover:bg-blue-500/20"
            >
              Copy Link
            </button>

          </div>

        </div>

        {/* Username Status */}

        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

            <h2 className="text-3xl font-bold">

              0

            </h2>

            <p className="text-slate-400">

              Posts

            </p>

          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

            <h2 className="text-3xl font-bold">

              0

            </h2>

            <p className="text-slate-400">

              Likes Received

            </p>

          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

            <h2 className="text-3xl font-bold">

              0

            </h2>

            <p className="text-slate-400">

              Replies

            </p>

          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

            <h2 className="text-3xl font-bold text-blue-400">

              {canChangeIn}

            </h2>

            <p className="text-slate-400">

              Username Change

            </p>

          </div>

        </div>

      </div>

    </main>
  );
}