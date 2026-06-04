"use client";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-white">

      <div className="mx-auto max-w-5xl px-5 py-10">

        <div className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-8">

          <div className="flex items-center gap-5">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-3xl font-bold">
              B
            </div>

            <div>

              <h1 className="text-3xl font-black">
                BlueMango User
              </h1>

              <p className="text-slate-400">
                Anonymous Community Member
              </p>

            </div>

          </div>

        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">

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

        </div>

      </div>

    </main>
  );
}