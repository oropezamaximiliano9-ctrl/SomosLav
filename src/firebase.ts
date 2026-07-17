import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import localConfig from "../firebase-applet-config.json";

// Try loading from environment variables first (Vercel), fallback to localConfig
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
};

console.log("[Firebase Init] Config resolved (project/db):", firebaseConfig.projectId, firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log("[Firebase Init] Firestore instance initialized.");
