import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";

export function usernameToSlug(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function migrateUserIfNeeded(uid: string) {
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  const updates: Record<string, any> = {};

  if (!data.usernameSlug && data.username) {
    updates.usernameSlug = usernameToSlug(
      data.username
    );
  }

  if (!data.lastUsernameChange) {
    updates.lastUsernameChange =
      data.createdAt || serverTimestamp();
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(ref, updates);
  }
}

export async function isUsernameAvailable(
  username: string,
  currentUid?: string
) {
  const slug = usernameToSlug(username);

  const q = query(
    collection(db, "users"),
    where("usernameSlug", "==", slug)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return true;
  }

  const existingUser =
    snapshot.docs[0];

  if (
    currentUid &&
    existingUser.id === currentUid
  ) {
    return true;
  }

  return false;
}

export async function canChangeUsername(
  uid: string
) {
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return {
      allowed: false,
      daysRemaining: 7,
    };
  }

  const data = snap.data();

  if (!data.lastUsernameChange) {
    return {
      allowed: true,
      daysRemaining: 0,
    };
  }

  let lastChange: Date;

  if (
    data.lastUsernameChange instanceof
    Timestamp
  ) {
    lastChange =
      data.lastUsernameChange.toDate();
  } else {
    lastChange = new Date(
      data.lastUsernameChange
    );
  }

  const now = new Date();

  const diff =
    now.getTime() -
    lastChange.getTime();

  const daysPassed =
    diff /
    (1000 * 60 * 60 * 24);

  if (daysPassed >= 7) {
    return {
      allowed: true,
      daysRemaining: 0,
    };
  }

  return {
    allowed: false,
    daysRemaining: Math.ceil(
      7 - daysPassed
    ),
  };
}

export async function updateUsername(
  uid: string,
  username: string
) {
  username = username.trim();

  if (
    username.length < 3 ||
    username.length > 25
  ) {
    throw new Error(
      "Username must be between 3 and 25 characters."
    );
  }

  const available =
    await isUsernameAvailable(
      username,
      uid
    );

  if (!available) {
    throw new Error(
      "Username already taken."
    );
  }

  const cooldown =
    await canChangeUsername(uid);

  if (!cooldown.allowed) {
    throw new Error(
      `You can change your username again in ${cooldown.daysRemaining} day(s).`
    );
  }

  const slug =
    usernameToSlug(username);

  await updateDoc(
    doc(db, "users", uid),
    {
      username,
      usernameSlug: slug,
      lastUsernameChange:
        serverTimestamp(),
    }
  );

  return slug;
}