import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from "fs";

const localConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

const firebaseConfig = {
  projectId: localConfig.projectId,
  appId: localConfig.appId,
  apiKey: localConfig.apiKey,
  authDomain: localConfig.authDomain,
  firestoreDatabaseId: localConfig.firestoreDatabaseId,
  storageBucket: localConfig.storageBucket,
  messagingSenderId: localConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAnon() {
  try {
    console.log("Trying anonymous login...");
    const userCredential = await signInAnonymously(auth);
    console.log("Success! UID:", userCredential.user.uid);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testAnon();
