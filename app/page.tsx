import Link from "next/link";

import {
  ArrowRight,
  Heart,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[#09090B] text-white">

      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute left-[-120px] top-[-120px] h-[300px] w-[300px] rounded-full bg-indigo-500/20 blur-3xl md:h-[500px] md:w-[500px]" />

        <div className="absolute bottom-[-150px] right-[-120px] h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-3xl md:h-[500px] md:w-[500px]" />

        <div className="absolute left-1/2 top-[35%] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl md:h-[350px] md:w-[350px]" />

      </div>

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-10">

        <div>

          <h1 className="gradient-text text-2xl font-black md:text-3xl">
            BlueMango
          </h1>

          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-xs">
            after midnight
          </p>

        </div>

        <div className="flex items-center gap-2">

          <Link
            href="/login"
            className="glass rounded-full px-4 py-2 text-xs text-zinc-300 transition hover:bg-white/10 md:text-sm"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:scale-105 md:px-5 md:text-sm"
          >
            Register
          </Link>

        </div>

      </header>

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col justify-center px-5 pb-20 pt-8 text-center">

        <div className="mx-auto mb-6 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] tracking-wide text-zinc-300 backdrop-blur-xl md:text-sm">
          anonymous • emotional • safe
        </div>

        <h1 className="mx-auto max-w-6xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-8xl">

          The Social App
          <br />

          <span className="gradient-text">
            Nobody Sees.
          </span>

        </h1>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base md:text-xl">

          Confessions. Hidden feelings.
          Overthinking thoughts.
          Deep late-night conversations.

          <span className="mt-2 block text-zinc-500">
            All anonymous.
          </span>

        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.02]"
          >
            Enter BlueMango
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/feed"
            className="glass rounded-full px-8 py-4 text-sm text-white transition-all duration-300 hover:bg-white/10"
          >
            Explore Feed
          </Link>

        </div>

        {/* Floating Cards */}
        <div className="mx-auto mt-14 flex w-full max-w-md flex-col gap-4">

          <div className="glass rounded-3xl p-5 text-left">

            <p className="mb-3 text-xs text-zinc-500">
              midnight confession
            </p>

            <p className="text-sm leading-relaxed text-zinc-200">
              “I still check their profile
              even after pretending I moved on.”
            </p>

          </div>

          <div className="glass ml-8 rounded-3xl p-5 text-left">

            <p className="mb-3 text-xs text-zinc-500">
              overthinking
            </p>

            <p className="text-sm leading-relaxed text-zinc-200">
              “Why do we feel lonely
              even when notifications never stop?”
            </p>

          </div>

          <div className="glass rounded-3xl p-5 text-left">

            <p className="mb-3 text-xs text-zinc-500">
              hidden feeling
            </p>

            <p className="text-sm leading-relaxed text-zinc-200">
              “Sometimes I just want
              someone to understand my silence.”
            </p>

          </div>

        </div>

      </section>

      {/* Features */}
      <section className="relative z-10 px-5 pb-24">

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4 md:gap-6">

          <div className="glass rounded-3xl p-5">

            <MessageCircle
              className="mb-4 text-indigo-300"
              size={28}
            />

            <h3 className="mb-2 text-lg font-semibold">
              Anonymous Posts
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              Share feelings honestly without pressure.
            </p>

          </div>

          <div className="glass rounded-3xl p-5">

            <Heart
              className="mb-4 text-pink-300"
              size={28}
            />

            <h3 className="mb-2 text-lg font-semibold">
              Emotional Honesty
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              Talk about loneliness and relationships safely.
            </p>

          </div>

          <div className="glass rounded-3xl p-5">

            <Moon
              className="mb-4 text-cyan-300"
              size={28}
            />

            <h3 className="mb-2 text-lg font-semibold">
              Late-Night Energy
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              Built for midnight scrolling and deep thoughts.
            </p>

          </div>

          <div className="glass rounded-3xl p-5">

            <Shield
              className="mb-4 text-green-300"
              size={28}
            />

            <h3 className="mb-2 text-lg font-semibold">
              Safe Space
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              Moderation systems help keep conversations calm.
            </p>

          </div>

        </div>

      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-5 pb-28">

        <div className="glass ambient-border mx-auto max-w-5xl rounded-[36px] p-8 text-center md:p-16">

          <Sparkles
            className="mx-auto mb-5 text-indigo-300"
            size={34}
          />

          <h2 className="text-3xl font-black leading-tight md:text-6xl">

            Some Feelings
            <br />
            Need Darkness.

          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-lg">

            BlueMango gives your hidden thoughts,
            untold confessions, and emotional silence
            a safe place to exist.

          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition hover:scale-105"
          >
            Join BlueMango
            <ArrowRight size={16} />
          </Link>

        </div>

      </section>

    </main>
  );
}