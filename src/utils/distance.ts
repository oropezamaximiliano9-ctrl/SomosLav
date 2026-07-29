export const ORIGEN_LAVANDERIA = { lat: 18.1372216, lng: -94.4771462 };

export const distancesKm: Record<string, number> = {
  "las palmas": 0.5,
  "palmas": 0.5,
  "rancho alegre": 2.2,
  "vistalmar": 2.0,
  "petrolera": 1.5,
  "maria de la piedad": 2.5,
  "la piedad": 2.5,
  "piedad": 2.5,
  "playa sol": 2.8,
  "benito juarez sur": 2.6,
  "fovissste": 3.0,
  "centro": 4.2,
  "el tesoro": 3.8,
  "guadalupe victoria": 3.5,
  "santa isabel": 4.5,
  "manuel avila camacho": 3.6,
  "avila camacho": 3.6,
  "benito juarez norte": 3.4,
  "teresa morales": 8.5,
  "ciudad olmeca": 13.0,
  "olmeca": 13.0,
  "san martin": 15.0,
  "praderas del jaguey": 5.2,
  "jaguey": 5.2,
  "lomas de coatzacoalcos": 8.0,
  "adolfo lopez mateos": 4.8,
  "lopez mateos": 4.8,
  "tropico de la rivera": 6.0,
  "puerto esmeralda": 7.2,
  "lomas de barrillas": 10.5,
  "barrillas": 10.5
};

export const getHardcodedDistance = (coloniaName: string): number | null => {
  if (!coloniaName) return null;
  const normalized = coloniaName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(distancesKm)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
};

export const getColoniaDistance = (coloniaName: string): number => {
  if (!coloniaName) return 1.0;
  const explicitDistance = getHardcodedDistance(coloniaName);
  if (explicitDistance !== null) return explicitDistance;
  const normalized = coloniaName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 3 + (Math.abs(hash) % 6) + parseFloat(((Math.abs(hash) % 10) / 10).toFixed(1));
};

export const asyncGetColoniaDistance = async (
  coloniaName: string,
  coords?: { lat: number; lon: number } | null
): Promise<number> => {
  const clientApiKey = "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

  // If coords are available, query Google Maps directly via client side first
  if (coords) {
    try {
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
      const body = {
        origin: {
          location: {
            latLng: {
              latitude: ORIGEN_LAVANDERIA.lat,
              longitude: ORIGEN_LAVANDERIA.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: coords.lat,
              longitude: coords.lon
            }
          }
        },
        travelMode: "DRIVE"
      };

      const gmRes = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": clientApiKey,
          "X-Goog-FieldMask": "routes.distanceMeters"
        },
        body: JSON.stringify(body)
      });
      
      if (gmRes.ok) {
        const gmData = await gmRes.json();
        if (gmData.routes && gmData.routes.length > 0) {
          const distanceMeters = gmData.routes[0].distanceMeters;
          return parseFloat((distanceMeters / 1000).toFixed(2));
        }
      }
    } catch (clientErr) {
      console.warn("Client-side Routes API v2 failed, trying server proxy:", clientErr);
    }

    try {
      const response = await fetch(`/api/maps/distance-matrix?lat=${coords.lat}&lng=${coords.lon}`);
      if (response.ok) {
        const data = await response.json();
        if (typeof data.distanceKm === "number") {
          return data.distanceKm;
        }
      }
    } catch (error) {
      console.warn("Server distance-matrix proxy with coords failed, trying offline mathematical model:", error);
    }

    // Mathematical fallback to ORIGEN_LAVANDERIA
    const targetLat = ORIGEN_LAVANDERIA.lat;
    const targetLon = ORIGEN_LAVANDERIA.lng;
    const R = 6371; // Earth's radius in km
    const dLat = (coords.lat - targetLat) * Math.PI / 180;
    const dLon = (coords.lon - targetLon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(targetLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInKm = R * c;
    return parseFloat(distanceInKm.toFixed(2));
  }

  // If coords are not provided, we query using the typed address/colonia name
  if (coloniaName && coloniaName.trim()) {
    try {
      const isColonia = coloniaName.toString().toLowerCase().includes("colonia");
      const queryStr = isColonia 
        ? `${coloniaName}, Coatzacoalcos, Veracruz`
        : `Colonia ${coloniaName}, Coatzacoalcos, Veracruz`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${clientApiKey}&language=es`;
      
      const geoRes = await fetch(geocodeUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const loc = geoData.results[0].geometry.location;
          const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
          const body = {
            origin: {
              location: {
                latLng: {
                  latitude: ORIGEN_LAVANDERIA.lat,
                  longitude: ORIGEN_LAVANDERIA.lng
                }
              }
            },
            destination: {
              location: {
                latLng: {
                  latitude: loc.lat,
                  longitude: loc.lng
                }
              }
            },
            travelMode: "DRIVE"
          };

          const gmRes = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": clientApiKey,
              "X-Goog-FieldMask": "routes.distanceMeters"
            },
            body: JSON.stringify(body)
          });
          
          if (gmRes.ok) {
            const gmData = await gmRes.json();
            if (gmData.routes && gmData.routes.length > 0) {
              const distanceMeters = gmData.routes[0].distanceMeters;
              return parseFloat((distanceMeters / 1000).toFixed(2));
            }
          }
        }
      }
    } catch (clientErr) {
      console.warn("Client-side geocode+Routes API v2 fallback failed, trying server:", clientErr);
    }

    try {
      const response = await fetch(`/api/maps/distance-matrix?address=${encodeURIComponent(coloniaName)}`);
      if (response.ok) {
        const data = await response.json();
        if (typeof data.distanceKm === "number") {
          return data.distanceKm;
        }
      }
    } catch (error) {
      console.warn("Server distance-matrix proxy with address failed:", error);
    }
  }

  // Local fallback calculations for offline testing
  return getColoniaDistance(coloniaName);
};
