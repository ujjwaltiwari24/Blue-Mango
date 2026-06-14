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
 * e.g. "Ujjwal Tiwari" → "ujjwal-tiwari"
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

function _mapUser(d: { id: string; data: () => Record<string, unknown> }): BlueMangUser {
  const data = d.data();
  return {
    uid: d.id,
    username: (data.username as string) ?? "",
    usernameSlug:
      (data.usernameSlug as string) ??
      usernameToSlug((data.username as string) ?? ""),
    displayName:
      (data.displayName as string) ?? (data.name as string) ?? null,
    photoURL: (data.photoURL as string) ?? null,
    email: (data.email as string) ?? null,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : null,
  };
}

/**
 * Look up a user by their username slug from the URL.
 * Four-tier fallback for backward compatibility.
 */
export async function getUserByUsername(
  usernameParam: string
): Promise<BlueMangUser | null> {
  const decoded = decodeURIComponent(usernameParam).trim();
  const slug = usernameToSlug(decoded);

  // 1. Try usernameSlug field (new users)
  let snap = await getDocs(
    query(collection(db, "users"), where("usernameSlug", "==", slug))
  );
  if (!snap.empty) return _mapUser(snap.docs[0] as Parameters<typeof _mapUser>[0]);

  // 2. Exact username match (legacy)
  snap = await getDocs(
    query(collection(db, "users"), where("username", "==", decoded))
  );
  if (!snap.empty) return _mapUser(snap.docs[0] as Parameters<typeof _mapUser>[0]);

  // 3. Lowercase username match (legacy fallback)
  snap = await getDocs(
    query(
      collection(db, "users"),
      where("username", "==", decoded.toLowerCase())
    )
  );
  if (!snap.empty) return _mapUser(snap.docs[0] as Parameters<typeof _mapUser>[0]);

  // 4. No-spaces slug (covers "ujjwaltiwari" → slug "ujjwaltiwari")
  const noSpace = decoded.replace(/\s+/g, "").toLowerCase();
  if (noSpace !== decoded.toLowerCase()) {
    snap = await getDocs(
      query(collection(db, "users"), where("username", "==", noSpace))
    );
    if (!snap.empty) return _mapUser(snap.docs[0] as Parameters<typeof _mapUser>[0]);
  }

  return null;
}

export async function getUserByUid(uid: string): Promise<BlueMangUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    username: (data.username as string) ?? "",
    usernameSlug:
      (data.usernameSlug as string) ??
      usernameToSlug((data.username as string) ?? ""),
    displayName:
      (data.displayName as string) ?? (data.name as string) ?? null,
    photoURL: (data.photoURL as string) ?? null,
    email: (data.email as string) ?? null,
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

/**
 * FIXED: Previously used a compound query:
 *   where(receiverUid) + where(hidden==false) + orderBy(createdAt)
 * This requires a Firestore composite index which may not exist yet.
 *
 * Solution: Query ONLY by receiverUid (single-field index, always works),
 * then filter hidden==false and sort client-side. This works immediately
 * without any index configuration.
 */
export async function getAnonymousMessages(
  receiverUid: string
): Promise<AnonymousMessage[]> {
  // Simple single-field query — no composite index needed
  const q = query(
    collection(db, "anonymousMessages"),
    where("receiverUid", "==", receiverUid)
  );

  const snap = await getDocs(q);

  const messages: AnonymousMessage[] = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        receiverUid: data.receiverUid as string,
        receiverUsername: data.receiverUsername as string,
        message: data.message as string,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : null,
        replied: (data.replied as boolean) ?? false,
        hidden: (data.hidden as boolean) ?? false,
        reported: (data.reported as boolean) ?? false,
      };
    })
    // Filter hidden messages client-side
    .filter((m) => !m.hidden)
    // Sort newest first client-side
    .sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });

  return messages;
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