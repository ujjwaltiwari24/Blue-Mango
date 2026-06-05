import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";

export type AutoDeleteOption =
  | "never"
  | "24h"
  | "48h"
  | "7d";

export interface PostData {
  id: string;
  text: string;
  anonymousName: string;
  mood: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
  liked?: boolean;
  saved?: boolean;
  featured?: boolean;
  hidden?: boolean;
  autoDelete?: AutoDeleteOption;
  authorId?: string;
}

export const createPost = async (
  text: string,
  anonymousName: string,
  mood: string,
  category: string,
  autoDelete: AutoDeleteOption = "never"
) => {
  await addDoc(collection(db, "posts"), {
    text,
    anonymousName,
    mood,
    category,
    autoDelete,
    likes: 0,
    repliesCount: 0,
    hidden: false,
    createdAt: serverTimestamp(),
  });
};

export const getPosts = async (): Promise<PostData[]> => {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => {
    const data = document.data();

    let createdAt = "Just now";

    if (data.createdAt?.toDate) {
      const date = data.createdAt.toDate();

      const diff =
        Date.now() - date.getTime();

      const mins = Math.floor(
        diff / 1000 / 60
      );

      if (mins < 1) {
        createdAt = "Just now";
      } else if (mins < 60) {
        createdAt = `${mins}m ago`;
      } else if (mins < 1440) {
        createdAt = `${Math.floor(
          mins / 60
        )}h ago`;
      } else {
        createdAt = `${Math.floor(
          mins / 1440
        )}d ago`;
      }
    }

    return {
      id: document.id,
      text: data.text || "",
      anonymousName:
        data.anonymousName ||
        "Anonymous",
      mood: data.mood || "Calm",
      category:
        data.category ||
        "Confession",
      likes: data.likes || 0,
      comments:
        data.repliesCount || 0,
      createdAt,
      hidden:
        data.hidden || false,
      autoDelete:
        data.autoDelete ||
        "never",
      liked: false,
      saved: false,
    };
  });
};

export const toggleLike = async (
  postId: string,
  liked: boolean
) => {
  const postRef = doc(
    db,
    "posts",
    postId
  );

  await updateDoc(postRef, {
    likes: increment(
      liked ? -1 : 1
    ),
  });
};

export const updatePost = async (
  postId: string,
  text: string
) => {
  const postRef = doc(
    db,
    "posts",
    postId
  );

  await updateDoc(postRef, {
    text,
  });
};

export const toggleHidePost = async (
  postId: string,
  hidden: boolean
) => {
  const postRef = doc(
    db,
    "posts",
    postId
  );

  await updateDoc(postRef, {
    hidden,
  });
};

export const deletePost = async (
  postId: string
) => {
  await deleteDoc(
    doc(db, "posts", postId)
  );
};