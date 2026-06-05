"use client";
import { Cormorant_Garamond, Sora } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
});

const sora = Sora({
  subsets: ["latin"],
});
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  type FC,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Plus,
  Search,
  Bell,
  LogOut,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  Frown,
  Smile,
  Meh,
  CloudLightning,
  Star,
  Moon,
  Send,
  Lock,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Shield,
  CheckCircle,
} from "lucide-react";

// ─── stub imports (replace with your real paths) ──────────────────────────
import {
  createPost,
  getPosts,
  toggleLike,
} from "@/services/post.service";

// ──────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS  (CSS custom properties via Tailwind arbitrary values)
// ──────────────────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Cormorant Garamond', 'Garamond', Georgia, serif";
const FONT_BODY    = "'Sora', 'DM Sans', system-ui, sans-serif";

// ──────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ──────────────────────────────────────────────────────────────────────────

const ANON_NAMES = [
  "velvet fog",    "paper crane",  "hollow tide",
  "still water",  "grey static",  "lost signal",
  "dust mirror",  "neon silence", "pale ember",
  "dusk chorus",
];

const MOODS = [
  { label: "Heartbroken",  icon: Frown,          color: "rose"    },
  { label: "Nostalgic",    icon: Moon,            color: "violet"  },
  { label: "Grateful",     icon: Smile,           color: "emerald" },
  { label: "Anxious",      icon: CloudLightning,  color: "amber"   },
  { label: "Numb",         icon: Meh,             color: "slate"   },
  { label: "Hopeful",      icon: Star,            color: "sky"     },
  { label: "Obsessed",     icon: Zap,             color: "pink"    },
];

const CATEGORIES = [
  "All",
  "Confession",
  "Relationship",
  "Self",
  "Family",
  "Work",
  "Regret",
  "Secret",
  "Hope",
];

const TRENDING = [
  { tag: "3am thoughts",     count: "2.4k" },
  { tag: "unsent letters",   count: "1.8k" },
  { tag: "things I pretend", count: "1.2k" },
  { tag: "never told anyone",count: "987"  },
  { tag: "exes",             count: "741"  },
];

const SAMPLE_POSTS = [
  {
    id: "p1",
    text: "I still keep a voice note from 2019 of someone who doesn't remember me anymore. I listen to it when I miss who I used to be.",
    anonymousName: "hollow tide",
    mood: "Nostalgic",
    category: "Regret",
    likes: 1847,
    comments: 94,
    createdAt: "3h ago",
    liked: false,
    saved: false,
    featured: true,
  },
  {
    id: "p2",
    text: "I told my therapist I was fine. Then I drove home and sat in my parking lot for 45 minutes because I didn't know what to do with silence.",
    anonymousName: "grey static",
    mood: "Numb",
    category: "Self",
    likes: 3291,
    comments: 201,
    createdAt: "5h ago",
    liked: true,
    saved: false,
    featured: false,
  },
  {
    id: "p3",
    text: "My biggest secret is that I'm actually doing okay. And I feel guilty about it when everyone around me is falling apart.",
    anonymousName: "velvet fog",
    mood: "Anxious",
    category: "Confession",
    likes: 912,
    comments: 58,
    createdAt: "8h ago",
    liked: false,
    saved: true,
    featured: false,
  },
  {
    id: "p4",
    text: "I gave them a second chance. And a third. And a fourth. I think I just wanted to believe people can change more than I wanted to protect myself.",
    anonymousName: "still water",
    mood: "Heartbroken",
    category: "Relationship",
    likes: 2103,
    comments: 137,
    createdAt: "12h ago",
    liked: false,
    saved: false,
    featured: false,
  },
  {
    id: "p5",
    text: "I rehearse conversations in my head for hours. Then when I finally have them, I go completely blank and just say \"yeah, totally.\"",
    anonymousName: "dust mirror",
    mood: "Anxious",
    category: "Self",
    likes: 687,
    comments: 45,
    createdAt: "1d ago",
    liked: true,
    saved: false,
    featured: false,
  },
];

// ──────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function randomName() {
  return ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
}

const MOOD_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Heartbroken: { bg: "bg-rose-950/60",    text: "text-rose-300",    border: "border-rose-800/40",   dot: "bg-rose-400"    },
  Nostalgic:   { bg: "bg-violet-950/60",  text: "text-violet-300",  border: "border-violet-800/40", dot: "bg-violet-400"  },
  Grateful:    { bg: "bg-emerald-950/60", text: "text-emerald-300", border: "border-emerald-800/40",dot: "bg-emerald-400" },
  Anxious:     { bg: "bg-amber-950/60",   text: "text-amber-300",   border: "border-amber-800/40",  dot: "bg-amber-400"   },
  Numb:        { bg: "bg-slate-800/60",   text: "text-slate-400",   border: "border-slate-700/40",  dot: "bg-slate-500"   },
  Hopeful:     { bg: "bg-sky-950/60",     text: "text-sky-300",     border: "border-sky-800/40",    dot: "bg-sky-400"     },
  Obsessed:    { bg: "bg-pink-950/60",    text: "text-pink-300",    border: "border-pink-800/40",   dot: "bg-pink-400"    },
};

// ──────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────────────────────────────

// ── Ambient canvas ────────────────────────────────────────────────────────
const AmbientBg: FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {/* deep void base */}
    <div className="absolute inset-0 bg-[#060810]" />
    {/* top-left warm glow */}
    <div
      className="absolute -top-40 -left-40 h-[350px] w-[350px] rounded-full opacity-[0.07]"
      style={{ background: "radial-gradient(circle, #c4a882 0%, transparent 70%)" }}
    />
    {/* mid-right cool glow */}
    <div
      className="absolute top-1/3 -right-60 h-[300px] w-[300px] rounded-full opacity-[0.055]"
      style={{ background: "radial-gradient(circle, #7c6bbf 0%, transparent 70%)" }}
    />
    {/* bottom rose pulse */}
    <div
      className="absolute -bottom-40 left-1/3 h-[250px] w-[250px] rounded-full opacity-[0.045]"
      style={{ background: "radial-gradient(circle, #b5607a 0%, transparent 70%)" }}
    />
    {/* noise grain */}
    
  </div>
);

// ── Top bar ───────────────────────────────────────────────────────────────
interface TopBarProps { onLogout: () => void }

const TopBar: FC<TopBarProps> = ({ onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.05] bg-[#060810]/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.03)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        {/* wordmark */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/90 to-rose-500/90">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#060810] bg-emerald-400" />
          </div>
          <div>
            <p
              className="text-[18px] sm:text-[22px] font-bold leading-none tracking-tight text-white"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              BlueMango
            </p>
            <p className="text-[10px] tracking-[2px] text-white/25 uppercase">anonymous confessions</p>
          </div>
        </div>

        {/* search */}
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Search whispers…"
            className="h-9 w-56 rounded-full border border-white/[0.07] bg-white/[0.04] pl-8 pr-4 text-[13px] text-white/70 placeholder:text-white/25 outline-none transition focus:border-white/20 focus:bg-white/[0.07] focus:w-72"
          />
        </div>

        {/* actions */}
        <div className="flex items-center gap-2">
          <button className="relative rounded-full p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-white/50 transition hover:border-white/[0.15] hover:text-white/80"
          >
            <LogOut size={12} />
            Leave
          </button>
        </div>
      </div>
    </header>
  );
};

// ── MoodBadge ─────────────────────────────────────────────────────────────
interface MoodBadgeProps { mood: string; small?: boolean }

const MoodBadge: FC<MoodBadgeProps> = ({ mood, small }) => {
  const s = MOOD_STYLES[mood] ?? MOOD_STYLES["Numb"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${s.bg} ${s.border} ${s.text} ${
        small ? "text-[10px]" : "text-[11px]"
      } font-medium`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {mood}
    </span>
  );
};

// ── FeaturedCard ──────────────────────────────────────────────────────────
interface Post {
  id: string; text: string; anonymousName: string; mood: string;
  category: string; likes: number; comments: number; createdAt: string;
  liked: boolean; saved: boolean; featured?: boolean;
}

interface FeaturedCardProps { post: Post; onLike: (id: string) => void }

const FeaturedCard: FC<FeaturedCardProps> = ({ post, onLike }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#1a1218]/90 via-[#110e1a]/90 to-[#0a0d18]/90 p-8"
  >
    {/* bg accent */}
    <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20"
         style={{ background: "radial-gradient(circle, #9b7fde 0%, transparent 70%)" }} />
    <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-15"
         style={{ background: "radial-gradient(circle, #c47a82 0%, transparent 70%)" }} />

    <div className="relative">
      {/* label */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-400">
          <Flame size={10} />
          Most resonated today
        </div>
        <MoodBadge mood={post.mood} small />
      </div>

      {/* quote */}
      <p
        className="mb-6 text-[22px] font-normal leading-[1.55] text-white/90"
        style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}
      >
        "{post.text}"
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500/40 to-rose-500/40 ring-1 ring-white/10" />
          <span className="text-[12px] text-white/40">{post.anonymousName} · {post.createdAt}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-[13px] transition ${
              post.liked ? "text-rose-400" : "text-white/40 hover:text-rose-400"
            }`}
          >
            <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />
            {fmtCount(post.likes)}
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-white/40 transition hover:text-white/70">
            <MessageCircle size={14} />
            {fmtCount(post.comments)}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// ── Composer ──────────────────────────────────────────────────────────────
interface ComposerProps {
  text: string; setText: (v: string) => void;
  mood: string; setMood: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  loading: boolean; onPost: () => void;
}

const Composer: FC<ComposerProps> = ({
  text, setText, mood, setMood, category, setCategory, loading, onPost,
}) => {
  const [focused, setFocused] = useState(false);
  const [showMoods, setShowMoods] = useState(false);
  const maxLen = 400;
  const pct = (text.length / maxLen) * 100;
  const circumference = 2 * Math.PI * 10;

  return (
    <motion.div
      layout
      className={`relative rounded-2xl border transition-all duration-300 ${
        focused
          ? "border-white/[0.12] bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_40px_rgba(0,0,0,0.5)]"
          : "border-white/[0.06] bg-white/[0.025]"
      }`}
    >
      {/* anon identity */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.05] px-5 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-rose-500/30 ring-1 ring-white/10">
          <Lock size={11} className="text-white/50" />
        </div>
        <span className="text-[12px] text-white/30">posting as</span>
        <span className="text-[12px] font-medium text-white/60 tracking-wide">anonymous</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400/70">
          <Shield size={10} />
          end-to-end protected
        </span>
      </div>

      {/* textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLen))}
        onFocus={() => { setFocused(true); setShowMoods(true); }}
        onBlur={() => setFocused(false)}
        placeholder="What are you carrying that you've never said out loud?"
        rows={focused || text ? 4 : 2}
        className="w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-white/80 placeholder:text-white/20 outline-none"
        style={{ fontFamily: FONT_BODY }}
      />

      {/* mood + controls */}
      <AnimatePresence>
        {showMoods && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* mood pills */}
            <div className="flex flex-wrap gap-2 border-t border-white/[0.05] px-5 py-3">
              {MOODS.map((m) => {
                const Icon = m.icon;
                const active = mood === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                      active
                        ? (MOOD_STYLES[m.label]?.bg ?? "") + " " + (MOOD_STYLES[m.label]?.text ?? "") + " " + (MOOD_STYLES[m.label]?.border ?? "")
                        : "border-white/[0.06] text-white/35 hover:border-white/15 hover:text-white/60"
                    }`}
                  >
                    <Icon size={10} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* category + post */}
            <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3">
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/50 outline-none focus:border-white/20"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c} style={{ background: "#0d0d1a" }}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* progress ring */}
                <svg width="24" height="24" className="-rotate-90">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle
                    cx="12" cy="12" r="10" fill="none"
                    stroke={pct > 85 ? "#f87171" : pct > 65 ? "#fbbf24" : "#6366f1"}
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - pct / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                </svg>

                <button
                  onClick={onPost}
                  disabled={!text.trim() || loading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Confess
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Category filter bar ───────────────────────────────────────────────────
interface CategoryBarProps {
  active: string;
  onChange: (c: string) => void;
}

const CategoryBar: FC<CategoryBarProps> = ({ active, onChange }) => (
  <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
    <Filter size={13} className="shrink-0 text-white/30" />
    {CATEGORIES.map((c) => (
      <button
        key={c}
        onClick={() => onChange(c)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
          active === c
            ? "bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30"
            : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
        }`}
      >
        {c}
      </button>
    ))}
  </div>
);

// ── PostCard ──────────────────────────────────────────────────────────────
interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  index: number;
}

const PostCard: FC<PostCardProps> = ({ post, onLike, onSave, index }) => {
  const [showFull, setShowFull] = useState(false);
  const long = post.text.length > 180;
  const displayed = showFull || !long ? post.text : post.text.slice(0, 180) + "…";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      {/* subtle top accent */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />

      {/* header */}
      <div className="mb-3.5 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* avatar */}
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-violet-600/40 to-rose-500/30 ring-1 ring-white/[0.07]">
            <Lock size={12} className="absolute inset-0 m-auto text-white/40" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/70">{post.anonymousName}</p>
            <p className="text-[11px] text-white/25">{post.createdAt}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MoodBadge mood={post.mood} small />
          <span className="hidden rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/25 sm:inline">
            {post.category}
          </span>
          <button className="rounded-lg p-1 text-white/20 transition hover:bg-white/[0.06] hover:text-white/50">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* body */}
      <p
        className="mb-4 text-[15px] leading-[1.7] text-white/75"
        style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}
      >
        {displayed}
        {long && (
          <button
            onClick={() => setShowFull((v) => !v)}
            className="ml-1.5 text-[13px] text-violet-400/70 not-italic hover:text-violet-300 transition"
          >
            {showFull ? "show less" : "read more"}
          </button>
        )}
      </p>

      {/* actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all ${
            post.liked
              ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
              : "text-white/35 hover:bg-rose-500/10 hover:text-rose-400"
          }`}
        >
          <Heart size={13} className={post.liked ? "fill-rose-400" : ""} />
          {fmtCount(post.likes)}
        </button>

        <button className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-white/35 transition hover:bg-white/[0.05] hover:text-white/60">
          <MessageCircle size={13} />
          {fmtCount(post.comments)}
        </button>

        <button className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-white/35 transition hover:bg-white/[0.05] hover:text-white/60">
          <Share2 size={13} />
        </button>

        <button
          onClick={() => onSave(post.id)}
          className={`ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-all ${
            post.saved
              ? "text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20"
              : "text-white/25 hover:text-amber-400 hover:bg-amber-500/10"
          }`}
        >
          <Bookmark size={13} className={post.saved ? "fill-amber-400" : ""} />
        </button>
      </div>
    </motion.article>
  );
};

// ── Left sidebar ──────────────────────────────────────────────────────────
const LeftSidebar: FC = () => (
  <nav className="space-y-1">
    {[
      { icon: Flame,      label: "Feed",       active: true  },
      { icon: TrendingUp, label: "Trending",   active: false },
      { icon: Bookmark,   label: "Saved",      active: false },
      { icon: Users,      label: "Following",  active: false },
      { icon: Star,       label: "Featured",   active: false },
    ].map(({ icon: Icon, label, active }) => (
      <button
        key={label}
        className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
          active
            ? "bg-violet-600/15 text-violet-300 ring-1 ring-violet-500/20"
            : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
        }`}
      >
        <Icon size={15} />
        {label}
        {active && <span className="ml-auto text-[10px] text-violet-400/60">∙</span>}
      </button>
    ))}

    <div className="!mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/20">Live now</p>
      <p className="text-[24px] font-bold text-white">2,419</p>
      <p className="mb-3 text-[12px] text-white/35">anonymous souls online</p>
      <div className="flex gap-1">
  {[0.55, 0.82, 0.37, 0.91, 0.48, 0.74, 0.63, 0.88].map(
    (opacity, i) => (
      <div
        key={i}
        className="h-1.5 flex-1 rounded-full bg-emerald-500"
        style={{ opacity }}
      />
    )
  )}
</div>
    </div>
  </nav>
);

// ── Right sidebar ─────────────────────────────────────────────────────────
const RightSidebar: FC = () => (
  <div className="space-y-5">
    {/* trending tags */}
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={13} className="text-amber-400" />
        <p className="text-[11px] uppercase tracking-widest text-white/25">Trending</p>
      </div>
      <div className="space-y-2.5">
        {TRENDING.map((t, i) => (
          <button
            key={t.tag}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-white/20">#{i + 1}</span>
              <span className="text-[13px] text-white/65">#{t.tag}</span>
            </div>
            <span className="text-[11px] text-white/30">{t.count}</span>
          </button>
        ))}
      </div>
    </div>

    {/* community promise */}
    <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Shield size={13} className="text-emerald-400" />
        <p className="text-[12px] font-medium text-emerald-400">Our Promise</p>
      </div>
      <ul className="space-y-2">
        {[
          "No accounts required to read",
          "Zero analytics on you",
          "Posts auto-delete in 48h",
          "No ads, ever",
        ].map((line) => (
          <li key={line} className="flex items-center gap-2 text-[12px] text-white/40">
            <CheckCircle size={11} className="shrink-0 text-emerald-500/60" />
            {line}
          </li>
        ))}
      </ul>
    </div>

    {/* share cta */}
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(181,86,120,0.1))" }}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
           style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
      <p className="mb-1 text-[14px] font-semibold text-white/80" style={{ fontFamily: FONT_DISPLAY }}>
        Got a secret?
      </p>
      <p className="mb-4 text-[12px] leading-relaxed text-white/35">
        The right words find the right people.
      </p>
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600/30 py-2.5 text-[13px] font-medium text-violet-300 ring-1 ring-violet-500/20 transition hover:bg-violet-600/40">
        <Plus size={14} />
        Share anonymously
      </button>
    </div>
  </div>
);

// ── Stat pill ─────────────────────────────────────────────────────────────
interface StatProps { value: string; label: string; icon: ReactNode; accent: string }

const StatPill: FC<StatProps> = ({ value, label, icon, accent }) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-[18px] font-bold leading-tight text-white">{value}</p>
      <p className="text-[11px] text-white/30">{label}</p>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router = useRouter();

  const [text, setText]         = useState("");
  const [mood, setMood]         = useState("Nostalgic");
  const [category, setCategory] = useState("Confession");
  const [activeFilter, setActiveFilter] = useState("All");
  const [posts, setPosts]       = useState<Post[]>(SAMPLE_POSTS);
  const [loading, setLoading]   = useState(false);

  // load real posts on mount
  useEffect(() => {
    getPosts()
      .then((data) => {
        if (Array.isArray(data) && data.length) setPosts(data as Post[]);
      })
      .catch(() => {/* silently fall back to SAMPLE_POSTS */});
  }, []);

  const handlePost = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await createPost(text, randomName(), mood, category);
      const fresh = await getPosts();
      if (Array.isArray(fresh) && fresh.length) setPosts(fresh as Post[]);
      else setPosts((prev) => [
        {
          id: `local-${Date.now()}`,
          text,
          anonymousName: randomName(),
          mood,
          category,
          likes: 0,
          comments: 0,
          createdAt: "just now",
          liked: false,
          saved: false,
        },
        ...prev,
      ]);
      setText("");
    } catch {
      alert("Could not post — please try again.");
    } finally {
      setLoading(false);
    }
  }, [text, mood, category]);

  const handleLike = useCallback(
  async (id: string) => {
    const targetPost = posts.find(
      (p) => p.id === id
    );

    if (!targetPost) return;

    try {
      await toggleLike(
        id,
        targetPost.liked || false
      );

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: !p.liked,
                likes:
                  p.likes +
                  (p.liked ? -1 : 1),
              }
            : p
        )
      );
    } catch (error) {
      console.error(error);
    }
  },
  [posts]
); [];

  const handleSave = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    );
  }, []);

  const handleLogout = useCallback(async () => {
    try { await logoutUser(); } catch {}
    router.push("/login");
  }, [router]);

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const filteredPosts = posts.filter(
    (p) => !p.featured && (activeFilter === "All" || p.category === activeFilter)
  );

  return (
    <>

      <AmbientBg />

      <div className="min-h-screen text-white" style={{ fontFamily: FONT_BODY }}>
        <TopBar onLogout={handleLogout} />

<div className="mx-auto max-w-7xl px-3 sm:px-5 py-6 sm:py-8">
          {/* stats row */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill
              value={String(posts.length)}
              label="Confessions shared"
              icon={<MessageCircle size={16} className="text-violet-300" />}
              accent="bg-violet-500/15"
            />
            <StatPill
              value="2,419"
              label="Online right now"
              icon={<Users size={16} className="text-emerald-300" />}
              accent="bg-emerald-500/15"
            />
            <StatPill
              value="12"
              label="Trending topics"
              icon={<TrendingUp size={16} className="text-amber-300" />}
              accent="bg-amber-500/15"
            />
            <StatPill
              value="100%"
              label="Truly anonymous"
              icon={<Lock size={16} className="text-rose-300" />}
              accent="bg-rose-500/15"
            />
          </div>

          {/* three-column layout */}
          <div className="grid gap-8 lg:grid-cols-[220px_1fr_260px]">

            {/* ── left sidebar ── */}
            <aside className="hidden lg:block">
              <LeftSidebar />
            </aside>

            {/* ── main feed ── */}
            <section className="min-w-0">
              {/* featured */}
              {featured && (
                <FeaturedCard post={featured} onLike={handleLike} />
              )}

              {/* composer */}
              <div className="mb-6">
                <Composer
                  text={text}
                  setText={setText}
                  mood={mood}
                  setMood={setMood}
                  category={category}
                  setCategory={setCategory}
                  loading={loading}
                  onPost={handlePost}
                />
              </div>

              {/* filter bar */}
              <CategoryBar active={activeFilter} onChange={setActiveFilter} />

              {/* feed section label */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-medium uppercase tracking-widest text-white/25">
                  Recent
                </h2>
                <button className="flex items-center gap-1.5 text-[12px] text-white/30 transition hover:text-white/60">
                  <RefreshCw size={11} />
                  Refresh
                </button>
              </div>

              {/* posts */}
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="py-20 text-center text-white/30">
                    <Moon size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-[14px]">Nothing here yet in this category.</p>
                    <p className="mt-1 text-[12px] text-white/20">Be the first to confess.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                      index={i}
                    />
                  ))
                )}
              </div>

              {filteredPosts.length > 0 && (
                <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] py-3 text-[13px] text-white/30 transition hover:border-white/10 hover:text-white/50">
                  Load older confessions
                  <ChevronRight size={14} />
                </button>
              )}
            </section>

            {/* ── right sidebar ── */}
            <aside className="hidden lg:block">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}