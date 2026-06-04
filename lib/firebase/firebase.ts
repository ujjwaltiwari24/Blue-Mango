import { initializeApp, getApps, getApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoYqZTHh_rjet97WZlhZe6SuTU4nrxxnI",

  authDomain: "bluemango-4b2c1.firebaseapp.com",

  projectId: "bluemango-4b2c1",

  storageBucket: "bluemango-4b2c1.firebasestorage.app",

  messagingSenderId: "440718406293",

  appId: "1:440718406293:web:849eb9d7d2083a9002e19c",

  measurementId: "G-92B2MR2W3V",
};

const app =
  !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;