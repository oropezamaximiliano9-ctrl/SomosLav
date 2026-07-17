import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function run() {
  const email = "server@somos.internal";
  const password = "ServerSecurePassword99*!#";

  try {
    console.log("Attempting sign-in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully. UID:", userCredential.user.uid);
  } catch (error: any) {
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      console.log("User not found or invalid. Attempting registration...");
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registered successfully. UID:", userCredential.user.uid);
      } catch (regError: any) {
        console.error("Failed to register:", regError);
        process.exit(1);
      }
    } else {
      console.error("Sign-in failed with error:", error);
      process.exit(1);
    }
  }

  // Now try writing to the bags collection
  try {
    await setDoc(doc(db, "bags", "BOLSA-001"), { id: "BOLSA-001", status: "unassigned", userId: null }, { merge: true });
    console.log("Write with client SDK + auth succeeded!");
    const snap = await getDoc(doc(db, "bags", "BOLSA-001"));
    console.log("Read with client SDK + auth succeeded! Data:", snap.data());
    process.exit(0);
  } catch (dbError: any) {
    console.error("DB write/read failed even after sign-in:", dbError);
    process.exit(1);
  }
}

run();
