"use client";

import { useState } from "react";

import { toggleLike } from "@/services/post.service";

type PostCardProps = {
  post: {
    id: string;
    text: string;
    anonymousName: string;
    mood?: string;
    category?: string;
    likes?: number;
    repliesCount?: number;
  };
};

export default function PostCard({
  post,
}: PostCardProps) {
  const [liked, setLiked] =
    useState(false);

  const [likes, setLikes] =
    useState(post.likes || 0);

  const [loading, setLoading] =
    useState(false);

  const handleLike = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await toggleLike(
        post.id,
        liked
      );

      if (liked) {
        setLikes((prev) =>
          Math.max(0, prev - 1)
        );
      } else {
        setLikes((prev) => prev + 1);
      }

      setLiked(!liked);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-900">

      <div className="mb-4 flex items-start justify-between">

        <div>

          <h3 className="font-semibold text-slate-100">
            {post.anonymousName}
          </h3>

          <div className="mt-1 flex gap-2">

            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
              {post.category ||
                "Confession"}
            </span>

            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
              {post.mood ||
                "Calm"}
            </span>

          </div>

        </div>

        <div className="text-xs text-slate-500">
          Anonymous
        </div>

      </div>

      <p className="leading-7 text-slate-300">
        {post.text}
      </p>

      <div className="mt-6 flex gap-4 border-t border-slate-800 pt-4">

        <button
          onClick={handleLike}
          disabled={loading}
          className={`text-sm transition ${
            liked
              ? "text-blue-400"
              : "text-slate-400 hover:text-blue-400"
          }`}
        >
          Like ({likes})
        </button>

        <button className="text-sm text-slate-400 transition hover:text-blue-400">
          Reply (
          {post.repliesCount || 0})
        </button>

        <button className="text-sm text-slate-400 transition hover:text-blue-400">
          Share
        </button>

      </div>

    </div>
  );
}