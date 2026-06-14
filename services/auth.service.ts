import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { usernameToSlug } from "@/services/username.service";
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
  usernameSlug: usernameToSlug(username),
  email,
  createdAt: serverTimestamp(),
  lastActive: serverTimestamp(),
  lastUsernameChange: serverTimestamp(),
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

const username =
  user.displayName || "User";

await setDoc(
  doc(db, "users", user.uid),
  {
    uid: user.uid,
    username,
    usernameSlug:
      usernameToSlug(username),
    email: user.email,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    lastUsernameChange:
      serverTimestamp(),
  },
  { merge: true }
);

  return user;
};

export const logoutUser = async () => {
  await signOut(auth);
};