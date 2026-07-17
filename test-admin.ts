import { readFileSync } from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

try {
  const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
  console.log("Config loaded project:", firebaseConfig.projectId);

  const adminApp = initializeApp({
    projectId: firebaseConfig.projectId
  });

  const db = getFirestore(adminApp); // defaults to (default) database

  db.collection("bags").doc("BOLSA-001").set({ id: "BOLSA-001", status: "unassigned", userId: null })
    .then(() => {
      console.log("Admin write success on BOLSA-001 (default)!");
      return db.collection("bags").doc("BOLSA-001").get();
    })
    .then((snap) => {
      console.log("Admin read success (default)! Bag status:", snap.data());
      process.exit(0);
    })
    .catch((err) => {
      console.error("Firebase Admin Error (default):", err);
      process.exit(1);
    });
} catch (e) {
  console.error("Crash (default):", e);
  process.exit(1);
}
