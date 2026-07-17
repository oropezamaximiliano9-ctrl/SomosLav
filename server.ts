import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  getDocs, collection, query, where, orderBy, limit
} from "firebase/firestore";

dotenv.config();

// ES Module Path Resolution
let __filename = "";
let __dirname = "";
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch (e) {
  __filename = "";
  __dirname = process.cwd();
}

// Initialize Firebase SDK using configured applet values
let db: any;
try {
  const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
  console.log("Configuring Firestore server-side database integration...");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.error("CRITICAL: Failed to initialize Firestore SDK connection", err);
}

// Bootstrap and seed default parameters in Firestore if empty
async function bootstrapDb() {
  if (!db) {
    console.warn("Bootstrap skipped: Database not initialized.");
    return;
  }
  console.log("Checking and seeding default reference parameters in Firestore...");
  try {
    // 1. Seed or preserve default system settings
    const initSetting = async (key: string, value: string) => {
      const docRef = doc(db, "settings", key);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { key, value });
      }
    };
    await initSetting("coverageAreas", "palmas");
    await initSetting("expressEnabled", "true");
    await initSetting("expressDailyLimit", "50");

    // 2. Seed or preserve branch locations
    const initLocation = async (id: string, name: string, address: string, latitude: number, longitude: number) => {
      const docRef = doc(db, "locations", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { id, name, address, isActive: 1, latitude, longitude });
      }
    };
    await initLocation("loc_1", "Ubicación Palmas", "Paseo de las Palmas 209, Coatzacoalcos, Veracruz", 18.1404, -94.4632);

    // 3. Seed or preserve initial trackable QR Bags
    const initBag = async (bagId: string) => {
      const docRef = doc(db, "bags", bagId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { id: bagId, status: "unassigned", userId: null });
      }
    };
    for (const bagId of ["CESTO-001", "CESTO-002", "CESTO-003", "CESTO-004"]) {
      await initBag(bagId);
    }

    // 4. Seed initial mock customers & orders if "users" is empty (indicates a blank environment)
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.empty) {
      console.log("Empty user base detected! Seeding initial mock customers (Sofía, Sebastián, Valeria) and orders...");

      // Seed Users
      const usersToInsert = [
        {
          id: "USR-sofia",
          name: "Sofía Mendoza",
          phone: "9211029384",
          deliveryPreference: "Estándar (48 h)",
          addressColonia: "Previsión",
          addressCalle: "Avenida Venustiano Carranza",
          addressNumero: "504",
          preferredTime: "Tarde (1:00 PM – 3:00 PM)",
          addressReferences: "Frente al parque Juárez",
          credits: 50.0,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "USR-sebas",
          name: "Sebastián Ortega",
          phone: "9214455667",
          deliveryPreference: "Express (24 h)",
          addressColonia: "Palmas",
          addressCalle: "Paseo de las Palmas",
          addressNumero: "112",
          preferredTime: "Mañana (8:00 AM – 10:00 AM)",
          addressReferences: "Portón blanco",
          credits: 0.0,
          createdAt: new Date().toISOString()
        },
        {
          id: "USR-valeria",
          name: "Valeria Ruiz",
          phone: "9219988776",
          deliveryPreference: "Estándar (48 h)",
          addressColonia: "Centro",
          addressCalle: "Zaragoza",
          addressNumero: "318",
          preferredTime: "Noche (7:00 PM – 9:00 PM)",
          addressReferences: "Entre Allende y Guerrero",
          credits: 120.0,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const u of usersToInsert) {
        await setDoc(doc(db, "users", u.id), u);
      }

      // Link bags to their seeded owners
      await updateDoc(doc(db, "bags", "CESTO-002"), { status: "assigned", userId: "USR-sofia" });
      await updateDoc(doc(db, "bags", "CESTO-003"), { status: "assigned", userId: "USR-sebas" });
      await updateDoc(doc(db, "bags", "CESTO-004"), { status: "assigned", userId: "USR-valeria" });

      // Seed corresponding orders
      const ordersToSeed = [
        {
          id: "1",
          bagId: "CESTO-002",
          userId: "USR-sofia",
          status: "processing",
          deliveryType: "Estándar (48 h)",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          bagId: "CESTO-003",
          userId: "USR-sebas",
          status: "pending",
          deliveryType: "Express (24 h)",
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          bagId: "CESTO-004",
          userId: "USR-valeria",
          status: "completed",
          deliveryType: "Estándar (48 h)",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "4",
          bagId: "CESTO-002",
          userId: "USR-sofia",
          status: "completed",
          deliveryType: "Estándar (48 h)",
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "5",
          bagId: "CESTO-003",
          userId: "USR-sebas",
          status: "completed",
          deliveryType: "Express (24 h)",
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const ord of ordersToSeed) {
        await setDoc(doc(db, "orders", ord.id), ord);
      }
      console.log("Firestore database bootstrapped & seeded successfully!");
    } else {
      console.log("Bootstrap verified: Users already exist in Firestore database.");
    }
  } catch (err) {
    console.error("Firestore database boot-seeding failed:", err);
  }
}
bootstrapDb();

// Express Server Routing
const app = express();
app.use(express.json());

// -- GOOGLE MAPS SECURE PROXIES (CORS-SAFE, SERVER-SIDE) --
app.get("/api/maps/reverse-geocode", async (req, res) => {
  const { lat, lng, address } = req.query;
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

  if (address) {
    // Forward geocoding of a typed address string
    if (!apiKey) {
      // Nominatim forward geocoding fallback
      try {
        const queryStr = `${address}, Coatzacoalcos, Veracruz`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`,
          {
            headers: {
              "User-Agent": "SomosLaundryApp/1.0 (oropezamaximiliano9@gmail.com)"
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const latitude = parseFloat(data[0].lat);
            const longitude = parseFloat(data[0].lon);
            return res.json({ lat: latitude, lng: longitude, source: "nominatim" });
          }
        }
      } catch (e) {
        console.error("OSM forward geocode error:", e);
      }
      // Fixed fallback coordinates
      return res.json({ lat: 18.1404, lng: -94.4632, source: "mock" });
    }

    try {
      const queryStr = `${address}, Coatzacoalcos, Veracruz`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${apiKey}&language=es`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Google Geocode failed: ${response.statusText}`);
      const data = await response.json();
      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        throw new Error(`Google Geocode status: ${data.status}`);
      }
      const loc = data.results[0].geometry.location;
      return res.json({ lat: loc.lat, lng: loc.lng, source: "google" });
    } catch (err: any) {
      console.error("Google forward geocode error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Reverse geocoding of coordinates (lat, lng)
  if (!lat || !lng) {
    return res.status(400).json({ error: "Faltan parámetros de consulta (lat/lng o address)." });
  }

  if (!apiKey) {
    // Robust Nominatim fallback
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "SomosLaundryApp/1.0 (oropezamaximiliano9@gmail.com)"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        let colonia = "Centro";
        let calle = "";
        let numero = "";

        if (data.address) {
          const addr = data.address;
          colonia = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "Centro";
          calle = addr.road || "";
          numero = addr.house_number || "";
        }
        return res.json({
          calle,
          numero,
          colonia,
          source: "nominatim"
        });
      }
    } catch (e) {
      console.error("OSM Fallback error:", e);
    }
    return res.json({
      calle: "Paseo de las Palmas",
      numero: "209",
      colonia: "Palmas",
      source: "mock"
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Geocoding failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Google Geocoding status: ${data.status}`);
    }

    const firstResult = data.results[0];
    const components = firstResult.address_components || [];

    let street_number = "";
    let route = "";
    let sublocality = "";
    let neighborhood = "";

    for (const comp of components) {
      const types = comp.types || [];
      if (types.includes("street_number")) {
        street_number = comp.long_name;
      } else if (types.includes("route")) {
        route = comp.long_name;
      } else if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
        sublocality = comp.long_name;
      } else if (types.includes("neighborhood")) {
        neighborhood = comp.long_name;
      }
    }

    const colonia = sublocality || neighborhood || "Centro";
    const calle = route || "";
    const numero = street_number || "";

    res.json({
      calle,
      numero,
      colonia,
      source: "google"
    });
  } catch (err: any) {
    console.error("Google Geocoding error:", err);
    res.json({
      calle: "",
      numero: "",
      colonia: "Centro",
      error: err.message,
      source: "fallback"
    });
  }
});

app.get("/api/maps/distance-matrix", async (req, res) => {
  let { lat, lng, address } = req.query;

  const ORIGEN_LAVANDERIA = { lat: 18.1372216, lng: -94.4771462 };
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

  let finalLat = lat ? parseFloat(lat as string) : null;
  let finalLng = lng ? parseFloat(lng as string) : null;

  // If address is provided instead of lat/lng, forward geocode it first!
  if (address && (!finalLat || !finalLng)) {
    try {
      const queryStr = `${address}, Coatzacoalcos, Veracruz`;
      if (apiKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${apiKey}&language=es`;
        const geocodeRes = await fetch(url);
        const geocodeData = await geocodeRes.json();
        if (geocodeData.status === "OK" && geocodeData.results?.[0]) {
          const loc = geocodeData.results[0].geometry.location;
          finalLat = loc.lat;
          finalLng = loc.lng;
        }
      } else {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`;
        const geocodeRes = await fetch(url, {
          headers: { "User-Agent": "SomosLaundryApp/1.0 (oropezamaximiliano9@gmail.com)" }
        });
        const geocodeData = await geocodeRes.json();
        if (Array.isArray(geocodeData) && geocodeData.length > 0) {
          finalLat = parseFloat(geocodeData[0].lat);
          finalLng = parseFloat(geocodeData[0].lon);
        }
      }
    } catch (e) {
      console.error("Geocoding address inside distance matrix failed:", e);
    }
  }

  if (finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) {
    return res.status(400).json({ error: "No se pudieron obtener coordenadas para calcular la distancia." });
  }

  if (!apiKey) {
    // Haversine formula distance with a custom driving estimate
    const R = 6371; // Earth's radius in km
    const dLat = (finalLat - ORIGEN_LAVANDERIA.lat) * Math.PI / 180;
    const dLon = (finalLng - ORIGEN_LAVANDERIA.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(ORIGEN_LAVANDERIA.lat * Math.PI / 180) * Math.cos(finalLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInKm = R * c;

    // Estimate driving time (average 28km/h) + factor grid
    let estimatedTime = (distanceInKm / 28) * 60 * 1.4;
    if (distanceInKm < 0.8) {
      estimatedTime = Math.max(1, (distanceInKm / 20) * 60 * 1.25);
    }
    const durationMinutes = Math.max(1, Math.round(estimatedTime));

    return res.json({
      durationMinutes,
      distanceKm: parseFloat(distanceInKm.toFixed(2)),
      source: "haversine_fallback"
    });
  }

  try {
    const originStr = `${ORIGEN_LAVANDERIA.lat},${ORIGEN_LAVANDERIA.lng}`;
    const destStr = `${finalLat},${finalLng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destStr}&mode=driving&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status !== "OK" || !data.rows || data.rows.length === 0) {
      throw new Error(`Distance Matrix status: ${data.status}`);
    }

    const row = data.rows[0];
    if (!row.elements || row.elements.length === 0) {
      throw new Error("No elements found in Distance Matrix response.");
    }

    const element = row.elements[0];
    if (element.status !== "OK") {
      throw new Error(`Distance Matrix element status: ${element.status}`);
    }

    const durationSeconds = element.duration.value;
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const distanceMeters = element.distance.value;

    res.json({
      durationMinutes,
      distanceKm: parseFloat((distanceMeters / 1000).toFixed(2)),
      source: "google"
    });
  } catch (err: any) {
    console.error("Google Distance Matrix error:", err);
    // Haversine fallback on error
    const R = 6371;
    const dLat = (finalLat - ORIGEN_LAVANDERIA.lat) * Math.PI / 180;
    const dLon = (finalLng - ORIGEN_LAVANDERIA.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(ORIGEN_LAVANDERIA.lat * Math.PI / 180) * Math.cos(finalLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInKm = R * c;
    let estimatedTime = (distanceInKm / 28) * 60 * 1.4;
    const durationMinutes = Math.max(1, Math.round(estimatedTime));

    res.json({
      durationMinutes,
      distanceKm: parseFloat(distanceInKm.toFixed(2)),
      source: "haversine_error_fallback",
      error: err.message
    });
  }
});

const PORT = 3000;

// -- API ROUTES FOR LAUNDRY PROCESSES --

// Simulation Reset Handler (cleans simulation clients & orders safely)
app.post("/api/simulation/reset", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const userIdsToDelete: string[] = [];

    // 1. Locate user registered with temporary or demo simulator phone
    const tempUserQuery = query(collection(db, "users"), where("phone", "==", "9212393938"));
    const tempUserSnap = await getDocs(tempUserQuery);
    if (!tempUserSnap.empty) {
      tempUserSnap.forEach((docSnap) => {
        userIdsToDelete.push(docSnap.id);
      });
    }

    // 2. Locate owner linked to simulator BAG (CESTO-001)
    const bag001Snap = await getDoc(doc(db, "bags", "CESTO-001"));
    if (bag001Snap.exists()) {
      const bagData = bag001Snap.data();
      if (bagData && bagData.userId && !userIdsToDelete.includes(bagData.userId)) {
        userIdsToDelete.push(bagData.userId);
      }
    }

    // 3. Clear orders, reset bags status, and delete users
    const ordersSnap = await getDocs(collection(db, "orders"));
    for (const docSnap of ordersSnap.docs) {
      const data = docSnap.data();
      if (data.bagId === "CESTO-001" || (data.userId && userIdsToDelete.includes(data.userId))) {
        await deleteDoc(doc(db, "orders", docSnap.id));
      }
    }

    // Reset bags with CESTO-001 or matching userId
    const bagsSnap = await getDocs(collection(db, "bags"));
    for (const docSnap of bagsSnap.docs) {
      const bData = docSnap.data();
      if (docSnap.id === "CESTO-001" || (bData.userId && userIdsToDelete.includes(bData.userId))) {
        await updateDoc(doc(db, "bags", docSnap.id), { status: "unassigned", userId: null });
      }
    }

    // Delete temporary simulator users
    for (const uid of userIdsToDelete) {
      await deleteDoc(doc(db, "users", uid));
    }

    res.json({ success: true, message: "Simulation reset completed successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reset simulation", details: err.message });
  }
});

// Fetch all QR Bags mapped with their assigned owners
app.get("/api/bags", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const bagsSnap = await getDocs(collection(db, "bags"));
    const bagsList: any[] = [];
    bagsSnap.forEach((snap) => {
      bagsList.push(snap.data());
    });

    // Sort bags alphabetically by id
    bagsList.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

    const result = [];
    for (const b of bagsList) {
      let userName = "";
      if (b.userId) {
        const userSnap = await getDoc(doc(db, "users", b.userId));
        if (userSnap.exists()) {
          userName = userSnap.data()?.name || "";
        }
      }
      result.push({
        id: b.id,
        status: b.status,
        userId: b.userId,
        userName
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch bags", details: err.message });
  }
});

// Dynamic Bag Creation (generates next CESTO-XXX sequential id)
app.post("/api/bags", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const bagsSnap = await getDocs(collection(db, "bags"));
    let nextNum = bagsSnap.size + 1;
    let bagId = `CESTO-${nextNum.toString().padStart(3, "0")}`;

    while (true) {
      const checkSnap = await getDoc(doc(db, "bags", bagId));
      if (!checkSnap.exists()) {
        break;
      }
      nextNum++;
      bagId = `CESTO-${nextNum.toString().padStart(3, "0")}`;
    }

    await setDoc(doc(db, "bags", bagId), { id: bagId, status: "unassigned", userId: null });
    res.json({ success: true, bagId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create bag.", details: err.message });
  }
});

// Get individual bag status and current active non-completed orders
app.get("/api/bags/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const { id } = req.params;
    const bagSnap = await getDoc(doc(db, "bags", id));

    if (!bagSnap.exists()) {
      return res.status(404).json({ error: "Bag not found in database." });
    }

    const bag = bagSnap.data() as any;

    if (bag.status === "assigned" && bag.userId) {
      const userSnap = await getDoc(doc(db, "users", bag.userId));
      const user = userSnap.exists() ? userSnap.data() : null;

      // Find active non-completed orders tied to this bag
      const ordersSnap = await getDocs(collection(db, "orders"));
      let activeOrder: any = null;
      let latestCreatedAt = 0;
      ordersSnap.forEach((oSnap) => {
        const data = oSnap.data();
        if (data.bagId === id && data.status !== "completed") {
          const creationTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          if (creationTime > latestCreatedAt) {
            latestCreatedAt = creationTime;
            activeOrder = data;
          }
        }
      });

      return res.json({ ...bag, user, activeOrder });
    }

    res.json(bag);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch bag status.", details: err.message });
  }
});

// Preregister customer details before pairing with a QR bag
app.post("/api/preregister", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
    const usersSnap = await getDocs(usersQuery);
    let userId;

    if (!usersSnap.empty) {
      const docSnap = usersSnap.docs[0];
      userId = docSnap.id;
      const existingUser = docSnap.data();

      const pref = req.body.deliveryPreference !== undefined ? req.body.deliveryPreference : (existingUser.deliveryPreference || "");
      const col = req.body.addressColonia !== undefined ? req.body.addressColonia : (existingUser.addressColonia || null);
      const calle = req.body.addressCalle !== undefined ? req.body.addressCalle : (existingUser.addressCalle || null);
      const num = req.body.addressNumero !== undefined ? req.body.addressNumero : (existingUser.addressNumero || null);
      const prefTime = req.body.preferredTime !== undefined ? req.body.preferredTime : (existingUser.preferredTime || "");
      const refs = req.body.addressReferences !== undefined ? req.body.addressReferences : (existingUser.addressReferences || "");

      await updateDoc(doc(db, "users", userId), {
        name,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        addressNumero: num,
        preferredTime: prefTime,
        addressReferences: refs
      });
    } else {
      userId = "USR-" + Math.random().toString(36).substr(2, 9);
      const pref = req.body.deliveryPreference !== undefined ? req.body.deliveryPreference : "";
      const prefTime = req.body.preferredTime || "";
      const refs = req.body.addressReferences || "";

      await setDoc(doc(db, "users", userId), {
        id: userId,
        name,
        phone,
        deliveryPreference: pref,
        addressColonia: req.body.addressColonia || null,
        addressCalle: req.body.addressCalle || null,
        addressNumero: req.body.addressNumero || null,
        preferredTime: prefTime,
        addressReferences: refs,
        credits: 0.0,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, userId, message: "Preregistration successful." });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed.", details: err.message });
  }
});

// Search customer record using their phone number
app.get("/api/users/phone/:phone", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const { phone } = req.params;
    const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
    const usersSnap = await getDocs(usersQuery);

    if (usersSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(usersSnap.docs[0].data());
  } catch (err: any) {
    res.status(500).json({ error: "Failed to search user by phone", details: err.message });
  }
});

// Onboarding: Register a customer and lock the assignment to a QR Bag
app.post("/api/users", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { bagId, name, phone } = req.body;

  if (!bagId || !name || !phone) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const bagSnap = await getDoc(doc(db, "bags", bagId));
    if (!bagSnap.exists()) {
      return res.status(404).json({ error: "Bag not found." });
    }
    const bag = bagSnap.data();
    if (bag.status === "assigned") {
      return res.status(400).json({ error: "Bag is already assigned." });
    }

    // Lookup user with matching phone
    const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
    const usersSnap = await getDocs(usersQuery);
    let userId;

    if (!usersSnap.empty) {
      const docSnap = usersSnap.docs[0];
      userId = docSnap.id;
      const existingUser = docSnap.data();

      const pref = req.body.deliveryPreference !== undefined ? req.body.deliveryPreference : (existingUser.deliveryPreference || "");
      const col = req.body.addressColonia !== undefined ? req.body.addressColonia : (existingUser.addressColonia || null);
      const calle = req.body.addressCalle !== undefined ? req.body.addressCalle : (existingUser.addressCalle || null);
      const num = req.body.addressNumero !== undefined ? req.body.addressNumero : (existingUser.addressNumero || null);
      const prefTime = req.body.preferredTime !== undefined ? req.body.preferredTime : (existingUser.preferredTime || "");
      const refs = req.body.addressReferences !== undefined ? req.body.addressReferences : (existingUser.addressReferences || "");

      await updateDoc(doc(db, "users", userId), {
        name,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        addressNumero: num,
        preferredTime: prefTime,
        addressReferences: refs
      });
    } else {
      userId = "USR-" + Math.random().toString(36).substr(2, 9);
      const pref = req.body.deliveryPreference !== undefined ? req.body.deliveryPreference : "";
      const prefTime = req.body.preferredTime || "";
      const refs = req.body.addressReferences || "";

      await setDoc(doc(db, "users", userId), {
        id: userId,
        name,
        phone,
        deliveryPreference: pref,
        addressColonia: req.body.addressColonia || null,
        addressCalle: req.body.addressCalle || null,
        addressNumero: req.body.addressNumero || null,
        preferredTime: prefTime,
        addressReferences: refs,
        credits: 0.0,
        createdAt: new Date().toISOString()
      });
    }

    // Save linked properties to the Bag
    await updateDoc(doc(db, "bags", bagId), { status: "assigned", userId });

    res.json({ success: true, userId, message: "Registration successful. Bag assigned." });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed.", details: err.message });
  }
});

// Drop-Off: Acknowledge/receive bag and generate a laundry Service Order sequential ID
app.post("/api/orders", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { bagId, deliveryType } = req.body;

  if (!bagId) {
    return res.status(400).json({ error: "Missing bagId." });
  }

  try {
    const bagSnap = await getDoc(doc(db, "bags", bagId));
    if (!bagSnap.exists() || bagSnap.data()?.status !== "assigned") {
      return res.status(400).json({ error: "Bag is not assigned or not found." });
    }

    const bag = bagSnap.data();
    const userSnap = await getDoc(doc(db, "users", bag.userId));
    if (!userSnap.exists()) {
      return res.status(400).json({ error: "Owner reference not found." });
    }

    const user = userSnap.data() as any;

    // If preference defaults are passed explicitly, save them to the customer doc
    if (req.body.deliveryPreference !== undefined || req.body.preferredTime !== undefined) {
      const pref = req.body.deliveryPreference || user.deliveryPreference || "Estándar (48 h)";
      const prefTime = req.body.preferredTime || user.preferredTime || "Mañana (8:00 AM – 10:00 AM)";
      await updateDoc(doc(db, "users", user.id), { deliveryPreference: pref, preferredTime: prefTime });
      user.deliveryPreference = pref;
      user.preferredTime = prefTime;
    }

    // Determine sequence number starting from 1
    const ordersSnap = await getDocs(collection(db, "orders"));
    let nextIdVal = 1;
    ordersSnap.forEach((oSnap) => {
      const dIdVal = parseInt(oSnap.id, 10);
      if (!isNaN(dIdVal) && dIdVal >= nextIdVal) {
        nextIdVal = dIdVal + 1;
      }
    });

    const orderId = nextIdVal.toString();
    const finalDeliveryType = deliveryType || user.deliveryPreference || "Estándar (48 h)";

    // Archive/complete any past uncompleted orders tied to this bag
    for (const oSnap of ordersSnap.docs) {
      const data = oSnap.data();
      if (data.bagId === bagId && data.status !== "completed") {
        await updateDoc(doc(db, "orders", oSnap.id), { status: "completed" });
      }
    }

    // Create the order document
    const newOrder = {
      id: orderId,
      bagId,
      userId: user.id,
      status: "pending",
      deliveryType: finalDeliveryType,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "orders", orderId), newOrder);

    res.json({ success: true, orderId, user, message: "Order created and reception confirmed." });
  } catch (err: any) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed.", details: err.message });
  }
});

// Fetch all orders mapped dynamically with customer names & addresses
app.get("/api/orders", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    const ordersList: any[] = [];
    ordersSnap.forEach((oSnap) => {
      ordersList.push(oSnap.data());
    });

    // Sort by createdAt DESC
    ordersList.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const result = [];
    for (const ord of ordersList) {
      let userName = "Usuario no encontrado";
      let userPhone = "";
      let deliveryPreference = "";
      let addressCalle = "";
      let addressColonia = "";
      let preferredTime = "";

      if (ord.userId) {
        const uSnap = await getDoc(doc(db, "users", ord.userId));
        if (uSnap.exists()) {
          const u = uSnap.data();
          userName = u.name || "";
          userPhone = u.phone || "";
          deliveryPreference = u.deliveryPreference || "";
          addressCalle = u.addressCalle || "";
          addressColonia = u.addressColonia || "";
          preferredTime = u.preferredTime || "";
        }
      }

      result.push({
        id: ord.id,
        bagId: ord.bagId,
        status: ord.status,
        createdAt: ord.createdAt,
        deliveryType: ord.deliveryType,
        userName,
        userPhone,
        deliveryPreference,
        addressCalle,
        addressColonia,
        preferredTime
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
});

// Update laundry order process milestones ('pending', 'processing', 'completed')
app.put("/api/orders/:id/status", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "processing", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status state" });
  }

  try {
    const orderRef = doc(db, "orders", id);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return res.status(404).json({ error: "Order not found" });
    }

    await updateDoc(orderRef, { status });
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err: any) {
    console.error("Failed to update order status:", err);
    res.status(500).json({ error: err.message || "Failed to update order status" });
  }
});

// Get customer panel database with calculated metrics
app.get("/api/customers", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const usersList: any[] = [];
    usersSnap.forEach((snap) => {
      usersList.push(snap.data());
    });

    // Sort by name ASC
    usersList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const ordersSnap = await getDocs(collection(db, "orders"));
    const result = usersList.map((u) => {
      let orderCount = 0;
      let activeOrderCount = 0;
      ordersSnap.forEach((oSnap) => {
        const o = oSnap.data();
        if (o.userId === u.id) {
          orderCount++;
          if (o.status !== "completed") {
            activeOrderCount++;
          }
        }
      });

      return {
        ...u,
        orderCount,
        activeOrderCount
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
});

// Get historical orders for a specific customer
app.get("/api/customers/:id/orders", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id } = req.params;
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    const customerOrdersList: any[] = [];
    ordersSnap.forEach((oSnap) => {
      const o = oSnap.data();
      if (o.userId === id) {
        customerOrdersList.push(o);
      }
    });

    // Sort by createdAt DESC
    customerOrdersList.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(customerOrdersList);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch customer orders", details: err.message });
  }
});

// Update client metadata & balance credits
app.put("/api/customers/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id } = req.params;
  const { name, phone, deliveryPreference, addressColonia, addressCalle, addressNumero, preferredTime, addressReferences, credits } = req.body;

  try {
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Customer not found." });
    }

    await updateDoc(userRef, {
      name,
      phone,
      deliveryPreference: deliveryPreference || "Estándar (48 h)",
      addressColonia: addressColonia || null,
      addressCalle: addressCalle || null,
      addressNumero: addressNumero || null,
      preferredTime: preferredTime || "",
      addressReferences: addressReferences || "",
      credits: credits !== undefined ? Number(credits) : 0
    });

    res.json({ success: true, message: "Customer details updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update customer details", details: err.message });
  }
});

// Fetch system configurations (enabled express limits & regions)
app.get("/api/settings", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const settingsSnap = await getDocs(collection(db, "settings"));
    const settingsMap: Record<string, string> = {};
    settingsSnap.forEach((snap) => {
      const data = snap.data();
      if (data.key) {
        settingsMap[data.key] = data.value;
      }
    });
    res.json(settingsMap);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch settings", details: err.message });
  }
});

// Bulk update system configurations
app.post("/api/settings", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const settings = req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Invalid settings data" });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await setDoc(doc(db, "settings", key), { key, value: String(value) });
    }
    res.json({ success: true, message: "Settings updated" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update settings", details: err.message });
  }
});

// Read list of active geolocated branch locations
app.get("/api/locations", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  try {
    const locationsSnap = await getDocs(collection(db, "locations"));
    const result: any[] = [];
    locationsSnap.forEach((snap) => {
      const data = snap.data();
      if (data.isActive === 1 || data.isActive === true) {
        result.push(data);
      }
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch locations", details: err.message });
  }
});

// Create or update a geolocated laundry branch
app.post("/api/locations", async (req, res) => {
  if (!db) return res.status(500).json({ error: "Database not connected" });
  const { id, name, address, isActive } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    if (id) {
      await updateDoc(doc(db, "locations", id), {
        name,
        address: address || null,
        isActive: isActive ? 1 : 0
      });
      res.json({ success: true, message: "Location updated" });
    } else {
      const newId = "loc_" + Date.now();
      await setDoc(doc(db, "locations", newId), {
        id: newId,
        name,
        address: address || null,
        isActive: isActive !== false ? 1 : 0
      });
      res.json({ success: true, message: "Location created" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save location", details: err.message });
  }
});

// -- Vite Middleware and Production Asset Serving Setup --
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
