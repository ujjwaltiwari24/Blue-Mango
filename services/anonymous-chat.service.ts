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
  orderBy,
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

// ─── Slug helpers ──────────────────────────────────────────────────────────

/**
 * Converts a display username into a URL-safe slug.
 * e.g. "Apni Duniya" → "apni-duniya"
 * Stored alongside username in Firestore for lookup.
 */
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

  if (!trimmed) {
    return { valid: false, error: "Message cannot be empty." };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: "Message cannot exceed 500 characters." };
  }

  if (URL_REGEX.test(trimmed)) {
    return { valid: false, error: "Links are not allowed." };
  }

  if (PHONE_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Sharing personal contact information is not allowed.",
    };
  }

  return { valid: true };
}

// ─── User lookup ───────────────────────────────────────────────────────────

/**
 * Look up a user by their username slug from the URL.
 * Strategy (most to least specific):
 *  1. Exact match on `usernameSlug` field
 *  2. Exact match on `username` field (case-sensitive, for legacy users)
 *  3. Case-insensitive match on `username` field (lowercase fallback)
 */
export async function getUserByUsername(
  usernameParam: string
): Promise<BlueMangUser | null> {
  // The URL param may be a slug ("apni-duniya") or a raw encoded username
  const decoded = decodeURIComponent(usernameParam).trim();
  const slug = usernameToSlug(decoded);

  // ── 1. Try slug field (new users) ──────────────────────────────────────
  let snap = await getDocs(
    query(collection(db, "users"), where("usernameSlug", "==", slug))
  );
  if (!snap.empty) return _mapUser(snap.docs[0]);

  // ── 2. Try exact username match (legacy: username without spaces) ──────
  snap = await getDocs(
    query(collection(db, "users"), where("username", "==", decoded))
  );
  if (!snap.empty) return _mapUser(snap.docs[0]);

  // ── 3. Try lowercase username (legacy fallback) ────────────────────────
  snap = await getDocs(
    query(
      collection(db, "users"),
      where("username", "==", decoded.toLowerCase())
    )
  );
  if (!snap.empty) return _mapUser(snap.docs[0]);

  // ── 4. Try slug as lowercase username (spaces-to-nothing approach) ─────
  //    Covers users whose username was stored without spaces e.g. "apniduniya"
  const noSpace = decoded.replace(/\s+/g, "").toLowerCase();
  if (noSpace !== decoded.toLowerCase()) {
    snap = await getDocs(
      query(collection(db, "users"), where("username", "==", noSpace))
    );
    if (!snap.empty) return _mapUser(snap.docs[0]);
  }

  return null;
}

function _mapUser(d: ReturnType<typeof Object.create>): BlueMangUser {
  const data = d.data();
  return {
    uid: d.id,
    username: data.username ?? "",
    usernameSlug: data.usernameSlug ?? usernameToSlug(data.username ?? ""),
    displayName: data.displayName ?? data.name ?? null,
    photoURL: data.photoURL ?? null,
    email: data.email ?? null,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : null,
  };
}

export async function getUserByUid(uid: string): Promise<BlueMangUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    username: data.username ?? "",
    usernameSlug:
      data.usernameSlug ?? usernameToSlug(data.username ?? ""),
    displayName: data.displayName ?? data.name ?? null,
    photoURL: data.photoURL ?? null,
    email: data.email ?? null,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : null,
  };
}

// ─── Send message ──────────────────────────────────────────────────────────

export async function sendAnonymousMessage(
  input: AnonymousMessageInput
): Promise<string> {
  const validation = validateMessage(input.message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ref = await addDoc(collection(db, "anonymousMessages"), {
    receiverUid: input.receiverUid,
    receiverUsername: input.receiverUsername.toLowerCase(),
    receiverUsernameSlug: usernameToSlug(input.receiverUsername),
    message: input.message.trim(),
    createdAt: serverTimestamp(),
    replied: false,
    hidden: false,
    reported: false,
  });

  return ref.id;
}

// ─── Inbox queries ─────────────────────────────────────────────────────────

export async function getAnonymousMessages(
  receiverUid: string
): Promise<AnonymousMessage[]> {
  const q = query(
    collection(db, "anonymousMessages"),
    where("receiverUid", "==", receiverUid),
    where("hidden", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      receiverUid: data.receiverUid,
      receiverUsername: data.receiverUsername,
      message: data.message,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : null,
      replied: data.replied ?? false,
      hidden: data.hidden ?? false,
      reported: data.reported ?? false,
    };
  });
}

// ─── Message actions ───────────────────────────────────────────────────────

export async function markAsReplied(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), {
    replied: true,
  });
}

export async function hideMessage(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), {
    hidden: true,
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  await deleteDoc(doc(db, "anonymousMessages", messageId));
}

export async function reportMessage(messageId: string): Promise<void> {
  await updateDoc(doc(db, "anonymousMessages", messageId), {
    reported: true,
    hidden: true,
  });
}