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
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase/firebase";

const googleProvider = new GoogleAuthProvider();

export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const result =
    await createUserWithEmailAndPassword(
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
    username,
    email,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
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

  return result.user;
};

export const googleLogin = async () => {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  const user = result.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      username:
        user.displayName || "User",
      email: user.email,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    },
    { merge: true }
  );

  return user;
};

export const logoutUser = async () => {
  await signOut(auth);
};