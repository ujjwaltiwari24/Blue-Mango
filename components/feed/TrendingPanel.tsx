export default function TrendingPanel() {
  const tags = [
    "#Confessions",
    "#Relationships",
    "#Crush",
    "#Breakups",
    "#Overthinking",
    "#LifeAdvice",
  ];

  return (
    <div className="sticky top-24 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">

      <h2 className="mb-4 font-bold">
        Trending
      </h2>

      <div className="flex flex-wrap gap-2">

        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-blue-500/10 px-3 py-2 text-sm text-blue-300"
          >
            {tag}
          </span>
        ))}

      </div>

      <div className="mt-8">

        <h3 className="mb-3 font-semibold">
          Community Rules
        </h3>

        <div className="space-y-2 text-sm text-slate-400">

          <p>Be respectful</p>
          <p>No hate speech</p>
          <p>No harassment</p>
          <p>No spam</p>

        </div>

      </div>

    </div>
  );
}