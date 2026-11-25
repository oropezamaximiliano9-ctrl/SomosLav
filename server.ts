import express from "express";
import path from "path";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

dotenv.config();

const ORIGEN_LAVANDERIA = { lat: 18.1372216, lng: -94.4771462 };
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Firebase SDK using configured applet values
let db: ReturnType<typeof getFirestore> | null = null;
try {
  const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
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

  try {
    const initSetting = async (key: string, value: string) => {
      const docRef = doc(db!, "settings", key);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { key, value });
      }
    };
    await initSetting("coverageAreas", "palmas");
    await initSetting("expressEnabled", "true");
    await initSetting("expressDailyLimit", "50");

    const locRef = doc(db, "locations", "loc_1");
    if (!(await getDoc(locRef)).exists()) {
      await setDoc(locRef, {
        id: "loc_1",
        name: "Ubicación Palmas",
        address: "Paseo de las Palmas 209, Coatzacoalcos, Veracruz",
        isActive: 1,
        latitude: 18.1404,
        longitude: -94.4632,
      });
    }

    for (const bagId of ["CESTO-001", "CESTO-002", "CESTO-003", "CESTO-004"]) {
      const bagRef = doc(db, "bags", bagId);
      if (!(await getDoc(bagRef)).exists()) {
        await setDoc(bagRef, { id: bagId, status: "unassigned", userId: null });
      }
    }
  } catch (err) {
    console.error("Firestore database boot-seeding failed:", err);
  }
}

function calculateHaversineEstimate(lat: number, lng: number) {
  const R = 6371;
  const dLat = ((lat - ORIGEN_LAVANDERIA.lat) * Math.PI) / 180;
  const dLon = ((lng - ORIGEN_LAVANDERIA.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((ORIGEN_LAVANDERIA.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = R * c;

  const estimatedTime =
    distanceInKm < 0.8
      ? Math.max(1, (distanceInKm / 20) * 60 * 1.25)
      : (distanceInKm / 28) * 60 * 1.4;

  return {
    durationMinutes: Math.max(1, Math.round(estimatedTime)),
    distanceKm: parseFloat(distanceInKm.toFixed(2)),
  };
}

bootstrapDb();

const app = express();
app.use(express.json());

// -- GOOGLE MAPS SECURE PROXIES (CORS-SAFE, SERVER-SIDE) --
app.get("/api/maps/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

  if (!lat || !lng) {
    return res.status(400).json({ error: "Faltan parámetros de consulta (lat/lng)." });
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

    const components = data.results[0].address_components || [];
    let street_number = "";
    let route = "";
    let sublocality = "";
    let neighborhood = "";

    for (const comp of components) {
      const types = comp.types || [];
      if (types.includes("street_number")) street_number = comp.long_name;
      else if (types.includes("route")) route = comp.long_name;
      else if (types.includes("sublocality_level_1") || types.includes("sublocality")) sublocality = comp.long_name;
      else if (types.includes("neighborhood")) neighborhood = comp.long_name;
    }

    res.json({
      calle: route || "",
      numero: street_number || "",
      colonia: sublocality || neighborhood || "Centro",
      source: "google",
    });
  } catch (err: any) {
    console.error("Google Geocoding error:", err);
    res.json({
      calle: "",
      numero: "",
      colonia: "Centro",
      error: err.message,
      source: "fallback",
    });
  }
});

app.get("/api/maps/distance-matrix", async (req, res) => {
  const { lat, lng, address } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

  let finalLat = lat ? parseFloat(lat as string) : null;
  let finalLng = lng ? parseFloat(lng as string) : null;

  if (address && (!finalLat || !finalLng)) {
    try {
      const queryStr = `${address}, Coatzacoalcos, Veracruz`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${apiKey}&language=es`;
      const geocodeRes = await fetch(url);
      const geocodeData = await geocodeRes.json();
      if (geocodeData.status === "OK" && geocodeData.results?.[0]) {
        const loc = geocodeData.results[0].geometry.location;
        finalLat = loc.lat;
        finalLng = loc.lng;
      }
    } catch (e) {
      console.error("Geocoding address inside distance matrix failed:", e);
    }
  }

  if (finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) {
    return res.status(400).json({ error: "No se pudieron obtener coordenadas para calcular la distancia." });
  }

  try {
    const originStr = `${ORIGEN_LAVANDERIA.lat},${ORIGEN_LAVANDERIA.lng}`;
    const destStr = `${finalLat},${finalLng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destStr}&mode=driving&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Distance Matrix failed: ${response.statusText}`);

    const data = await response.json();
    if (data.status !== "OK" || !data.rows?.length) {
      throw new Error(`Distance Matrix status: ${data.status}`);
    }

    const element = data.rows[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      throw new Error(`Distance Matrix element status: ${element?.status || "empty"}`);
    }

    res.json({
      durationMinutes: Math.max(1, Math.round(element.duration.value / 60)),
      distanceKm: parseFloat((element.distance.value / 1000).toFixed(2)),
      source: "google",
    });
  } catch (err: any) {
    console.error("Google Distance Matrix error:", err);
    const estimate = calculateHaversineEstimate(finalLat, finalLng);
    res.json({
      ...estimate,
      source: "haversine_error_fallback",
      error: err.message,
    });
  }
});

// -- Vite Middleware and Production Asset Serving Setup --
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
      plugins: [
        {
          name: "disable-hmr-client-ws",
          enforce: "post",
          transform(code: string, id: string) {
            if (id.replace(/\\/g, "/").endsWith("/vite/dist/client/client.mjs")) {
              return {
                code: code.replace(
                  "transport.connect(createHMRHandler(handleMessage));",
                  ""
                ),
                map: null,
              };
            }
          },
        },
      ],
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} in use, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer();
