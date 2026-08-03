"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { migrateUserIfNeeded, usernameToSlug } from "@/services/username.service";
import {
  UserCheck,
  Crown,
  Calendar,
  Clock,
  Edit3,
  Copy,
  ExternalLink,
  Inbox,
  Bookmark,
  Bell,
  CheckCircle2,
  Share2,
  MessageSquare,
  Heart,
  MessageCircle,
  Eye,
  Shield,
  Palette,
  AlertTriangle,
  LogOut,
  FileText,
  BookOpen,
  Info,
  Mail,
  Zap,
  Lock,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface UserProfileData {
  username: string;
  usernameSlug: string;
  email: string;
  bio?: string;
  photoURL?: string;
  createdAt?: any;
  status?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  lastUsernameChange?: any;
}

interface Confession {
  id: string;
  content: string;
  createdAt: any;
  likeCount: number;
  replyCount: number;
  authorId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<UserProfileData>({
    username: "BlueMango User",
    usernameSlug: "",
    email: "",
    bio: "",
    createdAt: null,
    status: "Active",
    isVerified: false,
    isPremium: false,
  });

  const [canChangeIn, setCanChangeIn] = useState("Available Now");
  const [canChangeDays, setCanChangeDays] = useState<number | null>(0);

  const [stats, setStats] = useState({
    posts: 0,
    likesReceived: 0,
    replies: 0,
    anonMessages: 0,
    savedPosts: 0,
    profileViews: 0,
  });

  // Real-time Confessions Feed
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loadingConfessions, setLoadingConfessions] = useState(true);

  // Modals state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newConfessionText, setNewConfessionText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingConfession, setEditingConfession] = useState<Confession | null>(null);
  const [editText, setEditText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingConfessionId, setDeletingConfessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        router.push("/login");
        return;
      }

      setUser(currentUser);
      await fetchUserProfile(currentUser);
      subscribeToRealtimeData(currentUser);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserProfile = async (currentUser: User) => {
    try {
      await migrateUserIfNeeded(currentUser.uid);

      const userDocRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        const userUsername = data.username || currentUser.displayName || "BlueMango User";
        const userSlug = data.usernameSlug || usernameToSlug(userUsername);
        const userEmail = data.email || currentUser.email || "";

        setProfile({
          username: userUsername,
          usernameSlug: userSlug,
          email: userEmail,
          bio: data.bio || "",
          photoURL: data.photoURL || currentUser.photoURL || "",
          createdAt: data.createdAt || currentUser.metadata?.creationTime,
          status: data.status || "Active",
          isVerified: data.isVerified ?? false,
          isPremium: data.isPremium ?? false,
          lastUsernameChange: data.lastUsernameChange,
        });

        if (data.lastUsernameChange) {
          const last = data.lastUsernameChange.toDate
            ? data.lastUsernameChange.toDate()
            : new Date(data.lastUsernameChange);
          const next = new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000);
          const diff = next.getTime() - Date.now();

          if (diff > 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setCanChangeIn(`${days} Day(s)`);
            setCanChangeDays(days);
          } else {
            setCanChangeIn("Now");
            setCanChangeDays(0);
          }
        } else {
          setCanChangeIn("Now");
          setCanChangeDays(0);
        }
      }
    } catch (error) {
      console.error("Error loading profile from Firestore:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Subscriptions for Firestore Data
  const subscribeToRealtimeData = (currentUser: User) => {
    // 1. Subscribe to Posts/Confessions
    const postsQ = query(
      collection(db, "posts"),
      where("authorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubPosts = onSnapshot(postsQ, (snapshot) => {
      let totalLikes = 0;
      let totalReplies = 0;
      const list: Confession[] = [];

      snapshot.forEach((docSnap) => {
        const pData = docSnap.data();
        const likes = pData.likeCount || pData.likes?.length || 0;
        const replies = pData.replyCount || 0;

        totalLikes += likes;
        totalReplies += replies;

        list.push({
          id: docSnap.id,
          content: pData.content || "",
          createdAt: pData.createdAt,
          likeCount: likes,
          replyCount: replies,
          authorId: pData.authorId,
        });
      });

      setConfessions(list);
      setLoadingConfessions(false);

      setStats((prev) => ({
        ...prev,
        posts: snapshot.size,
        likesReceived: totalLikes,
        replies: totalReplies,
      }));
    }, (err) => console.warn("Posts subscription error:", err));

    // 2. Subscribe to Anonymous Messages
    const msgsQ = query(
      collection(db, "anonymousMessages"),
      where("recipientId", "==", currentUser.uid)
    );
    const unsubMsgs = onSnapshot(msgsQ, (snapshot) => {
      setStats((prev) => ({ ...prev, anonMessages: snapshot.size }));
    }, (err) => console.warn("Messages subscription error:", err));

    // 3. Subscribe to Saved Posts Subcollection
    const savedQ = collection(db, "users", currentUser.uid, "savedPosts");
    const unsubSaved = onSnapshot(savedQ, (snapshot) => {
      setStats((prev) => ({ ...prev, savedPosts: snapshot.size }));
    }, (err) => console.warn("Saved posts subscription error:", err));

    // 4. Subscribe to Profile Document for dynamic counters
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const uData = snap.data();
        setStats((prev) => ({
          ...prev,
          profileViews: uData.profileViews || 0,
        }));
      }
    });

    return () => {
      unsubPosts();
      unsubMsgs();
      unsubSaved();
      unsubUser();
    };
  };

  // Create Confession Operation
  const handleCreateConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfessionText.trim() || !user) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorUsername: profile.username,
        authorSlug: profile.usernameSlug,
        content: newConfessionText.trim(),
        likeCount: 0,
        replyCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewConfessionText("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to post confession:", err);
      alert("Failed to publish confession. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Confession Operation
  const handleUpdateConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfession || !editText.trim()) return;

    setIsUpdating(true);
    try {
      const docRef = doc(db, "posts", editingConfession.id);
      await updateDoc(docRef, {
        content: editText.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingConfession(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update confession:", err);
      alert("Failed to update confession.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Confession Operation
  const handleDeleteConfession = async () => {
    if (!deletingConfessionId) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", deletingConfessionId));
      setDeletingConfessionId(null);
    } catch (err) {
      console.error("Failed to delete confession:", err);
      alert("Failed to delete confession.");
    } finally {
      setIsDeleting(false);
    }
  };

  const originUrl = typeof window !== "undefined" ? window.location.origin : "";
  const anonLink = `${originUrl}/anonymous-chat/${profile.usernameSlug || "user"}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(anonLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy link.");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Send ${profile.username} an anonymous message!`,
          url: anonLink,
        });
      } catch {
        // User dismissed share drawer
      }
    } else {
      copyLink();
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "Recently";
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111F] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111F] text-white relative overflow-hidden pb-24">
      {/* Background Radial Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
        
        {/* ================= HEADER HERO CARD ================= */}
        <section className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.username}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-blue-500/30 shadow-lg shadow-blue-500/20"
                  />
                ) : (
                  <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-3xl sm:text-4xl font-bold shadow-lg shadow-blue-500/20 text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {profile.isPremium && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md"
                    title="Premium Member"
                  >
                    <Crown className="h-4 w-4 fill-slate-950" />
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.username}</h1>
                  {profile.isVerified && (
                    <span title="Verified Account">
                      <CheckCircle2 className="h-5 w-5 text-blue-400 fill-blue-500/20" />
                    </span>
                  )}
                </div>

                <p className="text-slate-400 font-medium text-sm">
                  @{profile.usernameSlug || "user"}
                </p>

                {profile.email && (
                  <p className="text-xs text-slate-500 font-mono">{profile.email}</p>
                )}

                {profile.bio && (
                  <p className="text-xs text-slate-300 pt-1 max-w-md">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                    <UserCheck className="h-3.5 w-3.5 text-blue-400" /> Anonymous Member
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Joined {formatDate(profile.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> {profile.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
              <div className="w-full md:w-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-3 px-4 flex items-center justify-between md:justify-end gap-3">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Username Change
                  </p>
                  <p className={`text-xs font-semibold ${canChangeDays === 0 ? "text-emerald-400" : "text-blue-400"}`}>
                    {canChangeIn === "Now" ? "Available Now" : `Available in ${canChangeIn}`}
                  </p>
                </div>
                <Clock className="h-4 w-4 text-blue-400" />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 font-semibold text-white transition hover:opacity-90 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Confession</span>
                </button>

                <Link
                  href="/profile/change-username"
                  className="inline-flex items-center justify-center p-3 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  title="Change Username"
                >
                  <Edit3 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ANONYMOUS LINK CARD ================= */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" />
                <span>Your Public Anonymous Link</span>
              </div>
              <p className="break-all text-blue-400 font-mono text-xs sm:text-sm">
                {anonLink}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-2.5 font-medium text-blue-300 transition hover:bg-blue-500/20 text-xs sm:text-sm"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied Link!" : "Copy Link"}</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-800/80 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-slate-800 text-xs sm:text-sm"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              <Link
                href={`/anonymous-chat/${profile.usernameSlug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-800/80 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-slate-800 text-xs sm:text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Link</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= ACCOUNT STATS GRID ================= */}
        <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Confessions", value: stats.posts, icon: MessageSquare, color: "text-blue-400" },
            { label: "Likes Received", value: stats.likesReceived, icon: Heart, color: "text-rose-400" },
            { label: "Replies", value: stats.replies, icon: MessageCircle, color: "text-indigo-400" },
            { label: "Anon Messages", value: stats.anonMessages, icon: Inbox, color: "text-cyan-400" },
            { label: "Saved Posts", value: stats.savedPosts, icon: Bookmark, color: "text-amber-400" },
            { label: "Profile Views", value: stats.profileViews, icon: Eye, color: "text-emerald-400" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{item.value}</h2>
              </div>
            );
          })}
        </section>

        {/* ================= CONFESSIONS MANAGEMENT FEED ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                My Posted Confessions ({confessions.length})
              </h3>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add New
            </button>
          </div>

          {loadingConfessions ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : confessions.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">You haven't posted any confessions yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Post First Confession
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {confessions.map((confession) => (
                <div
                  key={confession.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between gap-4 hover:border-slate-700 transition"
                >
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    "{confession.content}"
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="h-3.5 w-3.5 fill-rose-400/20" /> {confession.likeCount}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400">
                        <MessageCircle className="h-3.5 w-3.5" /> {confession.replyCount}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDate(confession.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingConfession(confession);
                          setEditText(confession.content);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition"
                        title="Edit Confession"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingConfessionId(confession.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Confession"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= QUICK ACTIONS ================= */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Quick Actions
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                title: "Post New Confession",
                desc: "Share your secrets anonymously",
                icon: Plus,
                onClick: () => setShowCreateModal(true),
              },
              {
                title: "Copy Anonymous Link",
                desc: "Share on Instagram or WhatsApp",
                icon: Copy,
                onClick: copyLink,
              },
              {
                title: "Open Inbox",
                desc: "View secret incoming messages",
                icon: Inbox,
                href: "/inbox",
              },
              {
                title: "My Public Chat",
                desc: "Preview your anonymous page",
                icon: ExternalLink,
                href: `/anonymous-chat/${profile.usernameSlug}`,
              },
              {
                title: "Saved Posts",
                desc: "Browse bookmarked posts",
                icon: Bookmark,
                href: "/saved",
              },
              {
                title: "Notifications",
                desc: "View recent interactions",
                icon: Bell,
                href: "/notifications",
              },
            ].map((action, idx) => {
              const Icon = action.icon;
              const cardContent = (
                <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-blue-500/40 hover:bg-slate-900/80 h-full flex flex-col justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4">
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                  </div>
                </div>
              );

              if (action.onClick) {
                return (
                  <button key={idx} onClick={action.onClick} className="text-left w-full h-full">
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link key={idx} href={action.href || "#"} className="h-full">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= ACCOUNT SETTINGS ================= */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Account Settings
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Change Username",
                desc: "Allowed once every 7 days",
                icon: Edit3,
                href: "/profile/change-username",
                enabled: true,
              },
              {
                title: "Notification Preferences",
                desc: "Configure push & email alerts",
                icon: Bell,
                enabled: false,
              },
              {
                title: "Appearance & Theme",
                desc: "Customize glow intensity & colors",
                icon: Palette,
                enabled: false,
              },
              {
                title: "Privacy & Security",
                desc: "Manage password & active sessions",
                icon: Shield,
                enabled: false,
              },
            ].map((setting, idx) => {
              const Icon = setting.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-3xl border p-5 flex items-center justify-between backdrop-blur-md transition ${
                    setting.enabled
                      ? "border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer"
                      : "border-slate-800/40 bg-slate-900/30 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{setting.title}</h4>
                        {!setting.enabled && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{setting.desc}</p>
                    </div>
                  </div>

                  {setting.enabled ? (
                    <Link href={setting.href || "#"} className="text-slate-400 hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  ) : (
                    <Lock className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= HELP & SUPPORT ================= */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Help & Resources
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {[
              { label: "About Us", icon: Info, href: "/about" },
              { label: "Contact Support", icon: Mail, href: "/contact" },
              { label: "Privacy Policy", icon: Shield, href: "/privacy" },
              { label: "Terms of Service", icon: FileText, href: "/terms" },
              { label: "Community Rules", icon: BookOpen, href: "/community-guidelines" },
            ].map((nav, idx) => {
              const Icon = nav.icon;
              return (
                <Link
                  key={idx}
                  href={nav.href}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col items-center text-center justify-center gap-2 hover:border-slate-700 hover:bg-slate-800/50 transition"
                >
                  <Icon className="h-5 w-5 text-blue-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    {nav.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= DANGER ZONE & LOGOUT ================= */}
        <section className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Danger Zone</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Sign Out of Account</h4>
              <p className="text-xs text-slate-400">
                You will need to sign in again to access your private inbox and feed settings.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-sm font-semibold transition active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ================= CREATE CONFESSION MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-400" /> New Confession
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConfession} className="space-y-4">
              <textarea
                value={newConfessionText}
                onChange={(e) => setNewConfessionText(e.target.value)}
                placeholder="What's on your mind? Confess anonymously..."
                className="w-full h-32 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                required
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newConfessionText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white disabled:opacity-50 transition"
                >
                  {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Post Confession</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CONFESSION MODAL ================= */}
      {editingConfession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-400" /> Edit Confession
              </h3>
              <button
                onClick={() => setEditingConfession(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateConfession} className="space-y-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-32 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                required
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingConfession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white disabled:opacity-50 transition"
                >
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingConfessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Confession?</h3>
              <p className="text-xs text-slate-400">
                This action cannot be undone. It will permanently remove this confession from the feed.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingConfessionId(null)}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800 bg-slate-800/50 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfession}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGOUT WARNING MODAL ================= */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Confirm Sign Out</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to log out? You will need your credentials to regain access to your account and private inbox.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800 bg-slate-800/50 hover:bg-slate-800"
              >
                Keep Logged In
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {isLoggingOut && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}