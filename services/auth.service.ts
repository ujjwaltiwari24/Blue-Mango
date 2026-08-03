import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase/firebase";
import { generateRandomUsername } from "@/services/random-username";

const googleProvider = new GoogleAuthProvider();

export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = result.user;

  await updateProfile(user, {
    displayName: username,
  });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,

    // Display name
    username,

    // Random anonymous username
    usernameSlug: generateRandomUsername(),

    email,

    createdAt: serverTimestamp(),

    lastActive: serverTimestamp(),

    // User hasn't changed username yet
    lastUsernameChange: null,
  });

  return user;
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  // Only update activity
  await updateDoc(
    doc(db, "users", result.user.uid),
    {
      lastActive: serverTimestamp(),
    }
  );

  return result.user;
};

export const googleLogin = async () => {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  const user = result.user;

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First login only

    await setDoc(ref, {
      uid: user.uid,

      username:
        user.displayName ?? "User",

      usernameSlug:
        generateRandomUsername(),

      email: user.email,

      createdAt: serverTimestamp(),

      lastActive: serverTimestamp(),

      lastUsernameChange: null,
    });
  } else {
    // Existing user → NEVER overwrite usernameSlug

    await updateDoc(ref, {
      lastActive: serverTimestamp(),
    });
  }

  return user;
};

export const logoutUser = async () => {
  await signOut(auth);
};