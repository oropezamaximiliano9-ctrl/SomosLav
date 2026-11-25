import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
