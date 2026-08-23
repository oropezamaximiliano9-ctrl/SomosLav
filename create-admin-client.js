import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createAdmin() {
  try {
    const email = "admin@lavanderia.com";
    const password = "adminpassword123";
    
    console.log(`Creating user ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`User created with UID: ${user.uid}`);
    
    console.log("Setting admin role in Firestore...");
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    console.log("Admin role set successfully!");
    console.log("Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
