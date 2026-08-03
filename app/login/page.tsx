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
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

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

      {/* Background */}

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

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl">

          <h2 className="mb-2 text-3xl font-bold">
            Welcome Back
          </h2>

          <p className="mb-8 text-zinc-400">
            Continue your anonymous journey.
          </p>

          <div className="space-y-4">

            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleLogin()
              }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
            />

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleLogin()
              }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
            />

            <div className="text-right">
              <button
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing In..."
                : "Login"}
            </button>

            {/* Divider */}

            <div className="flex items-center gap-3 py-2">

              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-widest text-zinc-500">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />

            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 font-medium transition-all duration-300 hover:bg-white/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.5-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5C9.6 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.2 6.8l6.2 5.2C39.2 36.4 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
                />
              </svg>

              Continue with Google

            </button>

          </div>

          {/* Benefits */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">

            <h3 className="mb-3 text-sm font-semibold">
              Welcome back to BlueMango
            </h3>

            <div className="space-y-2 text-sm text-zinc-400">

              <p>Anonymous conversations</p>

              <p>Deep emotional discussions</p>

              <p>Share thoughts without judgment</p>

              <p>Connect through honesty</p>

            </div>

          </div>

          {/* Register */}

          <div className="mt-8 text-center">

            <p className="text-sm text-zinc-400">
              Don't have an account?
            </p>

            <Link
              href="/register"
              className="mt-2 inline-block font-semibold text-white transition hover:text-blue-400"
            >
              Create Account
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}