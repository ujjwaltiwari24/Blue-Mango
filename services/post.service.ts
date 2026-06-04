import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";

export const createPost = async (
  text: string,
  anonymousName: string,
  mood: string,
  category: string
) => {
  await addDoc(collection(db, "posts"), {
    text,
    anonymousName,
    mood,
    category,
    likes: 0,
    repliesCount: 0,
    createdAt: serverTimestamp(),
  });
};

export const getPosts = async () => {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      ...data,

      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : null,
    };
  });
};