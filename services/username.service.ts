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
import { generateRandomUsername } from "@/services/random-username";

export function usernameToSlug(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 25);
}

/*
|--------------------------------------------------------------------------
| Migrate Existing Users
|--------------------------------------------------------------------------
*/

export async function migrateUserIfNeeded(
  uid: string
) {
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  const updates: Record<string, any> = {};

  /*
   * Old users don't have usernameSlug.
   * Give them a random anonymous username.
   */

  if (!data.usernameSlug) {
    updates.usernameSlug =
      generateRandomUsername();
  }

  /*
   * Allow first username change.
   */

  if (
    data.lastUsernameChange === undefined
  ) {
    updates.lastUsernameChange = null;
  }

  if (
    Object.keys(updates).length > 0
  ) {
    await updateDoc(ref, updates);
  }
}

/*
|--------------------------------------------------------------------------
| Username Availability
|--------------------------------------------------------------------------
*/

export async function isUsernameAvailable(
  username: string,
  currentUid?: string
): Promise<boolean> {

  const slug =
    usernameToSlug(username);

  const q = query(
    collection(db, "users"),
    where(
      "usernameSlug",
      "==",
      slug
    )
  );

  const snap =
    await getDocs(q);

  if (snap.empty) {
    return true;
  }

  return snap.docs.every(
    (doc) =>
      doc.id === currentUid
  );
}
/*
|--------------------------------------------------------------------------
| Username Cooldown
|--------------------------------------------------------------------------
*/

export async function canChangeUsername(
  uid: string
): Promise<{
  allowed: boolean;
  daysRemaining: number;
}> {

  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return {
      allowed: false,
      daysRemaining: 7,
    };
  }

  const data = snap.data();

  /*
   * User has never changed username.
   */

  if (
    data.lastUsernameChange === null ||
    data.lastUsernameChange === undefined
  ) {
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

/*
|--------------------------------------------------------------------------
| Reserved Usernames
|--------------------------------------------------------------------------
*/

const RESERVED_USERNAMES = [
  "admin",
  "support",
  "login",
  "logout",
  "register",
  "feed",
  "profile",
  "settings",
  "notifications",
  "anonymous-chat",
  "home",
  "about",
  "privacy",
  "terms",
  "help",
  "contact",
  "api",
  "root",
  "system",
];
/*
|--------------------------------------------------------------------------
| Update Username
|--------------------------------------------------------------------------
*/

export async function updateUsername(
  uid: string,
  username: string
): Promise<string> {

  username = username.trim();

  if (username.length < 3) {
    throw new Error(
      "Username must contain at least 3 characters."
    );
  }

  if (username.length > 25) {
    throw new Error(
      "Username cannot exceed 25 characters."
    );
  }

  const slug = usernameToSlug(username);

  if (slug.length < 3) {
    throw new Error(
      "Please choose a valid username."
    );
  }

  if (
    RESERVED_USERNAMES.includes(slug)
  ) {
    throw new Error(
      "This username is reserved."
    );
  }

  const available =
    await isUsernameAvailable(
      slug,
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

  /*
   * IMPORTANT
   * Keep display name untouched.
   * Only update usernameSlug.
   */

  await updateDoc(
    doc(db, "users", uid),
    {
      usernameSlug: slug,
      lastUsernameChange:
        serverTimestamp(),
    }
  );

  return slug;
}