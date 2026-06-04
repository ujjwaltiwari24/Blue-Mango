"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  loginUser,
  googleLogin,
} from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      await loginUser(
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

  const handleGoogle = async () => {
    try {
      setLoading(true);

      await googleLogin();

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

        {/* Login Card */}

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">

          <h2 className="mb-2 text-3xl font-bold">
            Welcome Back
          </h2>

          <p className="mb-8 text-zinc-400">
            Continue your anonymous journey.
          </p>

          <div className="space-y-4">

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
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all focus:border-blue-500/50 focus:bg-black/40"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition-all hover:scale-[1.02]"
            >
              {loading
                ? "Signing In..."
                : "Login"}
            </button>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 font-medium transition-all hover:bg-white/10"
            >
              Continue with Google
            </button>

          </div>

          {/* Benefits */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">

            <h3 className="mb-3 text-sm font-semibold">
              Welcome back to BlueMango
            </h3>

            <div className="space-y-2 text-sm text-zinc-400">

              <p>
                Anonymous conversations
              </p>

              <p>
                Deep emotional discussions
              </p>

              <p>
                Share thoughts safely
              </p>

              <p>
                Connect through honesty
              </p>

            </div>

          </div>

          {/* Register Link */}

          <div className="mt-8 text-center">

            <p className="text-sm text-zinc-400">
              Don't have an account?
            </p>

            <Link
              href="/register"
              className="mt-2 inline-block font-semibold text-white"
            >
              Create Account
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}