import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
  process.exit(0);
}
run();
