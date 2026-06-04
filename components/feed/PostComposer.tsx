"use client";

type Props = {
  text: string;
  setText: (text: string) => void;

  mood: string;
  setMood: (mood: string) => void;

  category: string;
  setCategory: (
    category: string
  ) => void;

  loading: boolean;

  handlePost: () => void;
};

const moods = [
  "Happy",
  "Calm",
  "Lonely",
  "Overthinking",
  "Hopeful",
  "Heartbroken",
];

const categories = [
  "Confession",
  "Relationships",
  "Crushes",
  "Breakups",
  "Secrets",
  "Life Advice",
  "Late Night Thoughts",
];

export default function PostComposer({
  text,
  setText,
  mood,
  setMood,
  category,
  setCategory,
  loading,
  handlePost,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">

      <h2 className="mb-4 text-xl font-bold">
        Share Anonymously
      </h2>

      <div className="mb-4 grid gap-3 md:grid-cols-2">

        <select
          value={mood}
          onChange={(e) =>
            setMood(e.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 p-3"
        >
          {moods.map((item) => (
            <option key={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 p-3"
        >
          {categories.map((item) => (
            <option key={item}>
              {item}
            </option>
          ))}
        </select>

      </div>

      <textarea
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        placeholder="What's something you've never told anyone?"
        className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 p-4 outline-none"
      />

      <div className="mt-4 flex items-center justify-between">

        <span className="text-xs text-slate-500">
          {text.length}/500
        </span>

        <button
          onClick={handlePost}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold transition hover:scale-[1.02]"
        >
          {loading
            ? "Posting..."
            : "Post"}
        </button>

      </div>

    </div>
  );
}