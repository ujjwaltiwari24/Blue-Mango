"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerUser } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);

      await registerUser(
        username,
        email,
        password
      );

      router.push("/feed");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-5 text-white">

      {/* Background Effects */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed8,transparent_60%)]" />

      <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="absolute bottom-[-100px] right-[-100px] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 text-center">

          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400 backdrop-blur-xl">
            Anonymous Social Platform
          </div>

          <h1 className="text-5xl font-black tracking-tight">
            BlueMango
          </h1>

          <p className="mt-4 text-zinc-400">
            Confessions, deep thoughts and
            honest conversations.
          </p>

        </div>

        {/* Register Card */}

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">

          <h2 className="mb-2 text-3xl font-bold">
            Create Account
          </h2>

          <p className="mb-8 text-zinc-400">
            Join the anonymous community.
          </p>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Choose a username"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all focus:border-blue-500/50 focus:bg-black/40"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all focus:border-blue-500/50 focus:bg-black/40"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Create password"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all focus:border-blue-500/50 focus:bg-black/40"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition-all hover:scale-[1.02]"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </div>

          {/* Benefits */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">

            <h3 className="mb-3 text-sm font-semibold">
              Why join BlueMango?
            </h3>

            <div className="space-y-2 text-sm text-zinc-400">

              <p>
                Anonymous posting
              </p>

              <p>
                Deep conversations
              </p>

              <p>
                Emotional discussions
              </p>

              <p>
                Safe community environment
              </p>

            </div>

          </div>

          {/* Login Link */}

          <div className="mt-8 text-center">

            <p className="text-sm text-zinc-400">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block font-semibold text-white"
            >
              Login
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}