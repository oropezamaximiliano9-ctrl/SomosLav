import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import localConfig from "./firebase-applet-config.json" assert { type: "json" };
const app = initializeApp(localConfig);
const db = getFirestore(app, localConfig.firestoreDatabaseId);

async function test() {
  console.log("Fetching locations...");
  try {
    const snap = await getDocs(collection(db, "locations"));
    console.log("Locations:", snap.docs.map(d => d.data()));
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
setTimeout(() => { console.log('Timeout'); process.exit(1) }, 5000);
test();
