// services/anonymous-chat.service.ts

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type {
  AnonymousMessage,
  AnonymousMessageInput,
  BlueMangUser,
  ValidationResult,
} from "@/types/anonymous-chat";

// ─── Slug helper ───────────────────────────────────────────────────────────
export function usernameToSlug(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Validation ────────────────────────────────────────────────────────────
const PHONE_REGEX =
  /(\+?\d[\s\-.]?){7,15}|\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/i;
const URL_REGEX =
  /(https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9\-]+\.(com|net|org|io|co|in|me|app|dev|xyz|link|ly|gl|to|cc)[^\s]*/i;

export function validateMessage(message: string): ValidationResult {
  const trimmed = message.trim();
  if (!trimmed) return { valid: false, error: "Message cannot be empty." };
  if (trimmed.length > 500) return { valid: false, error: "Message cannot exceed 500 characters." };
  if (URL_REGEX.test(trimmed)) return { valid: false, error: "Links are not allowed." };
  if (PHONE_REGEX.test(trimmed)) return { valid: false, error: "Sharing personal contact information is not allowed." };
  return { valid: true };
}

// ─── Map a Firestore document → BlueMangUser ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserDoc(docId: string, data: Record<string, any>): BlueMangUser {
  const username = (data.username as string) ?? (data.name as string) ?? "";
  return {
    uid:          docId,
    username,
    usernameSlug: (data.usernameSlug as string) ?? usernameToSlug(username),
    displayName:  (data.displayName as string) ?? (data.name as string) ?? null,
    photoURL:     (data.photoURL as string) ?? null,
    email:        (data.email as string) ?? null,
    createdAt:    data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
  };
}

// ─── getUserByUid ──────────────────────────────────────────────────────────
//
// Strategy (in order):
//  1. Direct doc lookup: users/{uid}            — works when doc ID = Auth UID
//  2. Query by "uid" field                      — covers docs with auto-generated IDs
//  3. Query by "email" field via Firebase Auth  — last resort fallback
//
export async function getUserByUid(uid: string): Promise<BlueMangUser | null> {
  // 1. Direct document lookup (most common pattern)
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      console.log("[getUserByUid] Found by doc ID");
      return mapUserDoc(snap.id, snap.data() as Record<string, unknown>);
    }
  } catch (err) {
    console.warn("[getUserByUid] Direct doc lookup failed:", err);
  }

  // 2. Query by uid field (some apps store uid as a field, not as the doc ID)
  try {
    const snap = await getDocs(
      query(collection(db, "users"), where("uid", "==", uid))
    );
    if (!snap.empty) {
      console.log("[getUserByUid] Found by uid field");
      const d = snap.docs[0];
      return mapUserDoc(d.id, d.data() as Record<string, unknown>);
    }
  } catch (err) {
    console.warn("[getUserByUid] uid-field query failed:", err);
  }

  console.warn("[getUserByUid] No user document found for uid:", uid);
  return null;
}

// ─── getUserByUsername ─────────────────────────────────────────────────────
export async function getUserByUsername(usernameParam: string): Promise<BlueMangUser | null> {
  const decoded = decodeURIComponent(usernameParam).trim();
  const slug    = usernameToSlug(decoded);

  // 1. usernameSlug field
  let snap = await getDocs(query(collection(db, "users"), where("usernameSlug", "==", slug)));
  if (!snap.empty) return mapUserDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);

  // 2. Exact username
  snap = await getDocs(query(collection(db, "users"), where("username", "==", decoded)));
  if (!snap.empty) return mapUserDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);

  // 3. Lowercase username
  snap = await getDocs(query(collection(db, "users"), where("username", "==", decoded.toLowerCase())));
  if (!snap.empty) return mapUserDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);

  // 4. Name field (some apps use "name" not "username")
  snap = await getDocs(query(collection(db, "users"), where("name", "==", decoded)));
  if (!snap.empty) return mapUserDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);

  return null;
}

// ─── getAnonymousMessages ──────────────────────────────────────────────────
//
// Uses ONLY a single-field where clause → no composite index needed.
// hidden filtering + date sorting happen client-side.
//
export async function getAnonymousMessages(receiverUid: string): Promise<AnonymousMessage[]> {
  console.log("[getAnonymousMessages] querying for receiverUid:", receiverUid);

  const snap = await getDocs(
    query(collection(db, "anonymousMessages"), where("receiverUid", "==", receiverUid))
  );

  console.log("[getAnonymousMessages] raw docs returned:", snap.size);

  const all = snap.docs.map((d) => {
    const data = d.data();
    return {
      id:               d.id,
      receiverUid:      (data.receiverUid      as string)  ?? "",
      receiverUsername: (data.receiverUsername  as string)  ?? "",
      message:          (data.message           as string)  ?? "",
      createdAt:        data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      replied:          (data.replied  as boolean) ?? false,
      hidden:           (data.hidden   as boolean) ?? false,
      reported:         (data.reported as boolean) ?? false,
    };
  });

  const visible = all
    .filter((m) => !m.hidden)
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  console.log("[getAnonymousMessages] visible (not hidden):", visible.length);
  return visible;
}

// ─── sendAnonymousMessage ──────────────────────────────────────────────────
export async function sendAnonymousMessage(input: AnonymousMessageInput): Promise<string> {
  const validation = validateMessage(input.message);
  if (!validation.valid) throw new Error(validation.error);

  const ref = await addDoc(collection(db, "anonymousMessages"), {
    receiverUid:          input.receiverUid,
    receiverUsername:     input.receiverUsername.toLowerCase(),
    receiverUsernameSlug: usernameToSlug(input.receiverUsername),
    message:              input.message.trim(),
    createdAt:            serverTimestamp(),
    replied:              false,
    hidden:               false,
    reported:             false,
  });

  return ref.id;
}

// ─── Message actions ───────────────────────────────────────────────────────
export async function markAsReplied(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), { replied: true });
}
export async function hideMessage(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), { hidden: true });
}
export async function deleteMessage(messageId: string): Promise<void> {
  await deleteDoc(doc(db, "anonymousMessages", messageId));
}
export async function reportMessage(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), { reported: true, hidden: true });
}