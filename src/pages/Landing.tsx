import { Link, useNavigate } from "react-router-dom";
import { Check, CheckCircle, CheckCircle2, Clock, Info, Loader2, MapPin, Phone, MessageCircleMore, ShoppingBag, Sparkles, Truck, User, X, Banknote, ArrowRight, Building, Wrench, Shirt, Package } from "lucide-react";
import { useState, useContext, useRef, FormEvent, useEffect } from "react";
import { RoleContext } from "../App";
import canvasLaundryBag from "../assets/images/IMG_8321.jpg";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from "firebase/firestore";

declare const process: any;

const ORIGEN_LAVANDERIA = { lat: 18.1372216, lng: -94.4771462 };

const AnimatedTruck = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Clean gradient background pulse */}
    <div 
      className="absolute inset-0 bg-blue-50/60 rounded-full -z-10"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
    />
    
    {/* Micro motion speed lines behind truck */}
    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pt-1">
      <div 
        className="w-4 h-1 bg-[#0f55d8]/40 rounded-full"
        animate={{ x: [0, -15], opacity: [0, 0.8, 0], scaleX: [0.6, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
      />
      <div className="w-3 h-[3px] bg-[#0f55d8]/30 rounded-full " />
    </div>

    {/* Elegant Truck Icon with bobbing effect */}
    <div
      animate={{ 
        y: [0, -2, 0, -1, 0],
        rotate: [0, 1, -1, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.6, 
        ease: "easeInOut" 
      }}
    >
      <Truck className="w-8 h-8 text-[#0f55d8]" />
    </div>
  </div>
);

const AnimatedClock = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing spinning aura ring */}
    <div className="absolute inset-1 border border-dashed border-[#0f55d8]/20 rounded-full -z-10 -slow" />
    
    <div className="absolute inset-0 bg-blue-50/60 rounded-full -z-10 " />

    {/* Beautifully rotating clock face representation */}
    <div
      animate={{ 
        scale: [1, 1.04, 1],
        rotate: [0, 3, -3, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.2, 
        ease: "easeInOut" 
      }}
      className="relative flex items-center justify-center"
    >
      <Clock className="w-8 h-8 text-[#0f55d8]" />
    </div>
  </div>
);

const AnimatedLocation = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing background pulsing aura */}
    <div className="absolute inset-0 bg-blue-50/70 rounded-full -z-10 -fast" />

    {/* Location ripple rings underneath */}
    <div className="absolute bottom-2 w-8 h-2 bg-blue-500/10 rounded-full " />

    {/* Elegant Pin bounce animation */}
    <div
      animate={{ 
        y: [-3, 3, -3],
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.0, 
        ease: "easeInOut" 
      }}
    >
      <MapPin className="w-8 h-8 text-[#0f55d8]" />
    </div>
  </div>
);

const AnimatedMoney = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing background pulsing aura */}
    <div className="absolute inset-0 bg-emerald-50/80 rounded-full -z-10 -fast" />

    {/* Floating tiny shiny sparkles */}
    <div className="absolute top-2 right-2 flex items-center justify-center ">
      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
    </div>

    <div className="absolute bottom-1 left-2 flex items-center justify-center ">
      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
    </div>

    {/* Premium Banknote cash icon floating and tilting */}
    <div
      animate={{ 
        y: [-2, 2, -2],
        rotate: [-3, 3, -3],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.4, 
        ease: "easeInOut" 
      }}
    >
      <Banknote className="w-8 h-8 text-emerald-600" />
    </div>
  </div>
);

const drillVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 8 : -8,
    opacity: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -8 : 8,
    opacity: 0,
  }),
};

const drillTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.12,
};

const TypewriterTitle = () => {
  return (
    <div className="w-full text-center pt-2 pb-[18px] select-none px-4" id="rotating-title-container">
      <h1 
        className="text-[28px] sm:text-[34px] font-semibold text-gray-800 tracking-tight leading-tight font-geist"
      >
        Obtén tu cesto hoy
      </h1>
      <p className="text-center text-[19px] sm:text-[21px] text-[#6A6A6A] font-semibold px-4 font-geist whitespace-nowrap" style={{ marginTop: '6px' }}>
        Paga solo al usarlo
      </p>
    </div>
  );
};

const distancesKm: Record<string, number> = {
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

const getHardcodedDistance = (coloniaName: string): number | null => {
  if (!coloniaName) return null;
  const normalized = coloniaName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(distancesKm)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
};

const getColoniaDistance = (coloniaName: string): number => {
  const explicitDistance = getHardcodedDistance(coloniaName);
  if (explicitDistance !== null) return explicitDistance;

  const normalized = coloniaName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 3 + (Math.abs(hash) % 6) + parseFloat(((Math.abs(hash) % 10) / 10).toFixed(1));
};

const asyncGetColoniaDistance = async (coloniaName: string, coords?: { lat: number; lon: number } | null): Promise<number> => {
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
  if (coloniaName.trim()) {
    try {
      const isColonia = coloniaName.toString().toLowerCase().includes("colonia");
      const queryStr = isColonia 
        ? `${coloniaName}, Coatzacoalcos, Veracruz`
        : `Colonia ${coloniaName}, Coatzacoalcos, Veracruz`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryStr)}&key=${clientApiKey}&language=es`;
      const geocodeRes = await fetch(geocodeUrl);
      if (geocodeRes.ok) {
        const geocodeData = await geocodeRes.json();
        if (geocodeData.status === "OK" && geocodeData.results?.[0]) {
          const loc = geocodeData.results[0].geometry.location;
          
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

export default function Landing() {
  const { role } = useContext(RoleContext);
  const navigate = useNavigate();

  const [activeFeature, setActiveFeature] = useState(0);

  const [name, setName] = useState(() => localStorage.getItem("user_name") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("user_phone") || "");
  const [deliveryPreference, setDeliveryPreference] = useState(() => localStorage.getItem("user_delivery_preference") || "");
  
  const [addressColonia, setAddressColonia] = useState(() => localStorage.getItem("user_address_colonia") || "");
  const [addressCalle, setAddressCalle] = useState(() => localStorage.getItem("user_address_calle") || "");
  const [preferredTime, setPreferredTime] = useState(() => localStorage.getItem("user_preferred_time") || "");
  
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(() => localStorage.getItem("user_registered") === "true");
  const [isWaitlisted, setIsWaitlisted] = useState(() => localStorage.getItem("user_is_waitlisted") === "true");
  const [formStep, setFormStep] = useState<1 | 2 | "verifying" | "not_eligible_result">(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(() => getColoniaDistance(addressColonia || ""));

  useEffect(() => {
    localStorage.setItem("user_name", name);
    localStorage.setItem("user_phone", phone);
    localStorage.setItem("user_delivery_preference", deliveryPreference);
    localStorage.setItem("user_address_colonia", addressColonia);
    localStorage.setItem("user_address_calle", addressCalle);
    localStorage.setItem("user_preferred_time", preferredTime);
    localStorage.setItem("user_registered", registered ? "true" : "false");
    localStorage.setItem("user_is_waitlisted", isWaitlisted ? "true" : "false");
  }, [name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, registered, isWaitlisted]);

  const [copied, setCopied] = useState(false);
  const [isNavigatingGPS, setIsNavigatingGPS] = useState(false);
  const [gpsLoadingStep, setGpsLoadingStep] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsAutofillLoading, setGpsAutofillLoading] = useState(false);
  const [gpsAutofillError, setGpsAutofillError] = useState<string | null>(null);
  const [hasRequestedGps, setHasRequestedGps] = useState(false);

  const handleAddressInputClick = () => {
    if (!hasRequestedGps && !addressCalle && !addressColonia && !gpsAutofillLoading) {
      setHasRequestedGps(true);
      handleAutofillGPS();
    }
  };

  const handleAutofillGPS = () => {
    if (!navigator.geolocation) {
      setGpsAutofillError("Tu dispositivo o navegador no soporta geolocalización directa.");
      return;
    }

    setGpsAutofillLoading(true);
    setGpsAutofillError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lon: longitude });

        try {
          let data: any = null;
          let fetchSuccess = false;

          // 1. Try server-side secure proxy first
          try {
            const response = await fetch(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            if (response.ok) {
              data = await response.json();
              fetchSuccess = true;
            }
          } catch (err) {
            console.warn("Server proxy failed, trying direct client-side geocoding:", err);
          }

          // 2. Direct client-side Google Maps API query using hardcoded key
          if (!fetchSuccess) {
            let clientApiKey = "AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc";

            if (clientApiKey) {
              try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${clientApiKey}&language=es`;
                const response = await fetch(url);
                if (response.ok) {
                  const gData = await response.json();
                  if (gData.status === "OK" && gData.results && gData.results.length > 0) {
                    const firstResult = gData.results[0];
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
                      } else if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
                        sublocality = comp.long_name;
                      } else if (types.includes("neighborhood")) {
                        neighborhood = comp.long_name;
                      }
                    }

                    data = {
                      calle: route,
                      numero: street_number,
                      colonia: sublocality || neighborhood || "Centro",
                      source: "client-google"
                    };
                    fetchSuccess = true;
                  }
                }
              } catch (clientErr) {
                console.error("Direct Google reverse geocode failed:", clientErr);
              }
            }
          }

          // 3. Fallback to client-side OSM Nominatim if Google Maps API key is not available or fails
          if (!fetchSuccess) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                {
                  headers: {
                    "User-Agent": "SomosLaundryApp/1.0 (oropezamaximiliano9@gmail.com)"
                  }
                }
              );
              if (response.ok) {
                const osmData = await response.json();
                let colonia = "Centro";
                let calle = "";
                let numero = "";

                if (osmData.address) {
                  const addr = osmData.address;
                  colonia = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "Centro";
                  calle = addr.road || "";
                  numero = addr.house_number || "";
                }
                data = {
                  calle,
                  numero,
                  colonia,
                  source: "nominatim"
                };
                fetchSuccess = true;
              }
            } catch (err) {
              console.error("OSM direct fallback failed:", err);
            }
          }

          if (fetchSuccess && data) {
            let colonia = data.colonia || "Centro";
            let calle = data.calle || "";
            let numero = data.numero || "";

            // Format address
            let calleYNum = calle;
            if (numero) {
              calleYNum = `${calle} ${numero}`;
            }

            // Filter out Coatzacoalcos as colonia name
            if (!colonia || colonia.toLowerCase() === "coatzacoalcos" || colonia.toLowerCase() === "coatzacoalcos centro") {
              colonia = "Centro";
            }

            setAddressColonia(colonia);
            if (calleYNum) {
              setAddressCalle(calleYNum);
            }
            
            setFormError(null);
          } else {
            setGpsAutofillError("Error al obtener la dirección desde el servidor de mapas.");
          }
        } catch (err) {
          console.error("GPS Autofill error:", err);
          setGpsAutofillError("No se pudo conectar con el servicio de geocodificación.");
        } finally {
          setGpsAutofillLoading(false);
        }
      },
      (error) => {
        setGpsAutofillLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsAutofillError("Permiso de ubicación denegado. Por favor, actívalo en tu navegador.");
        } else {
          setGpsAutofillError("No se pudo obtener tu ubicación actual.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleNavigationAndGPS = () => {
    const DEST_ADDRESS = "Paseo de las Palmas 209, Coatzacoalcos, Veracruz";

    if (!navigator.geolocation) {
      setGeoError("Tu dispositivo o navegador no soporta geolocalización directa.");
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_ADDRESS)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setIsNavigatingGPS(true);
    setGpsLoadingStep("Solicitando acceso a tu ubicación...");
    setGeoError(null);

    // Small delay to make state transitions feel stable and natural
    setTimeout(() => {
      setGpsLoadingStep("Determinando la ubicación exacta...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGpsLoadingStep("Ubicación obtenida. Abriendo Google Maps...");
          
          setTimeout(() => {
            setIsNavigatingGPS(false);
            setGpsLoadingStep(null);
            // High precision route using real-time coordinates obtained from device
            const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(DEST_ADDRESS)}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }, 1000);
        },
        (error) => {
          setIsNavigatingGPS(false);
          setGpsLoadingStep(null);
          
          // Revert to reliable fallback
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_ADDRESS)}`;
          window.open(url, "_blank", "noopener,noreferrer");

          if (error.code === error.PERMISSION_DENIED) {
            setGeoError("Permiso de ubicación denegado. Se abrió la ruta estándar hacia Paseo de las Palmas 209 en Google Maps.");
          } else {
            setGeoError("No se pudo obtener tu ubicación actual. Se abrió la ruta estándar hacia Paseo de las Palmas 209.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 600);
  };

  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("Ubicación Palmas");
  
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeFormStep, setActiveFormStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [formError, setFormError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const isNameError = formError ? formError.toLowerCase().includes("nombre") : false;
  const isPhoneError = formError ? (
    formError.toLowerCase().includes("teléfono") || 
    formError.toLowerCase().includes("caracteres") || 
    formError.toLowerCase().includes("letras")
  ) : false;
  const isCalleError = formError ? formError.toLowerCase().includes("calle") : false;
  const isColoniaError = formError ? formError.toLowerCase().includes("colonia") : false;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const formRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const calleInputRef = useRef<HTMLInputElement>(null);
  const coloniaInputRef = useRef<HTMLInputElement>(null);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const [sliderHeight, setSliderHeight] = useState<number | string>("auto");

  useEffect(() => {
    if (isBottomSheetOpen) {
      const activeRef = activeFormStep === 1 ? step1Ref : step2Ref;
      if (activeRef.current) {
        const handleResize = () => {
          if (activeRef.current) {
            setSliderHeight(activeRef.current.offsetHeight);
          }
        };
        handleResize();
        const observer = new ResizeObserver(handleResize);
        observer.observe(activeRef.current);
        return () => observer.disconnect();
      }
    } else {
      setSliderHeight("auto");
    }
  }, [activeFormStep, isBottomSheetOpen, registered, formStep]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
    }
  }, [activeFormStep]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      const timer = setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = 0;
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [activeFormStep, isBottomSheetOpen]);
  
  useEffect(() => {
    console.log("[Firestore Call] Initiating fetch for 'locations' collection...");
    getDocs(collection(db, "locations"))
      .then(snap => {
        console.log("[Firestore Call] Successfully fetched 'locations', document count:", snap.size);
        const list: any[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.isActive === 1 || data.isActive === true) {
            list.push(data);
          }
        });
        if (list.length === 0) throw new Error("No active locations in DB");
        setLocations(list);
        setSelectedLocationName(list[0].name);
      })
      .catch((err) => {
        console.error("[Firestore Error] Failed to fetch locations:", err);
        console.warn("[Firestore Fallback] Using offline mock locations.");
        const mockLocations = [{ id: "loc_1", name: "Ubicación Palmas", address: "Paseo de las Palmas 209, Coatzacoalcos, Veracruz", isActive: 1, latitude: 18.1404, longitude: -94.4632 }];
        setLocations(mockLocations);
        setSelectedLocationName(mockLocations[0].name);
      });
  }, []);

  const openBottomSheet = () => {
    setIsBottomSheetOpen(true);
    setRegistered(false);
    setFormStep(1);
    setActiveFormStep(1);
    setDirection("forward");
    setFormError(null);
  };

  const handlePhoneBlur = async () => {
    if (!phone || phone.length < 5) return;
    try {
      console.log(`[Firestore Call] Querying 'users' collection for phone number: ${phone.trim()}`);
      const q = query(collection(db, "users"), where("phone", "==", phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        console.log(`[Firestore Call] Found existing user matching phone number.`);
        const data = snap.docs[0].data();
        if (data.name) setName(data.name);
        if (data.deliveryPreference) setDeliveryPreference(data.deliveryPreference);
        if (data.addressColonia) setAddressColonia(data.addressColonia);
        if (data.addressCalle) setAddressCalle(data.addressCalle);
        if (data.preferredTime) setPreferredTime(data.preferredTime);
      } else {
        throw new Error("Phone not found in DB");
      }
    } catch(e) {
      // Offline fallback: try reading from localStorage of simulated user database
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        const user = savedUsers[phone];
        if (user) {
          if (user.name) setName(user.name);
          if (user.deliveryPreference) setDeliveryPreference(user.deliveryPreference);
          if (user.addressColonia) setAddressColonia(user.addressColonia);
          if (user.addressCalle) setAddressCalle(user.addressCalle);
          if (user.preferredTime) setPreferredTime(user.preferredTime);
        }
      } catch (err) {}
    }
  };

  const goToStep2 = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedPhone = phone.trim();
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre completo.");
      triggerShake();
      nameInputRef.current?.focus();
      return;
    }
    
    if (!trimmedPhone) {
      setFormError("Por favor ingresa tu teléfono.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    if (trimmedPhone.length !== 10) {
      setFormError("El número de teléfono debe tener exactamente 10 caracteres.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError("El número de teléfono no puede contener letras.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    setDirection("forward");
    setActiveFormStep(2);
  };

  const dbPreregister = async () => {
    console.log(`[Firestore Call] dbPreregister: Searching users with phone: ${phone.trim()}`);
    const usersQuery = query(collection(db, "users"), where("phone", "==", phone.trim()));
    const usersSnap = await getDocs(usersQuery);
    let userId;

    if (!usersSnap.empty) {
      console.log(`[Firestore Call] dbPreregister: User already exists. Updating record...`);
      const docSnap = usersSnap.docs[0];
      userId = docSnap.id;
      const existingUser = docSnap.data();

      const pref = deliveryPreference !== undefined ? deliveryPreference : (existingUser.deliveryPreference || "");
      const col = addressColonia !== undefined ? addressColonia : (existingUser.addressColonia || null);
      const calle = addressCalle !== undefined ? addressCalle : (existingUser.addressCalle || null);
      const prefTime = preferredTime !== undefined ? preferredTime : (existingUser.preferredTime || "");

      await updateDoc(doc(db, "users", userId), {
        name,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        preferredTime: prefTime
      });
      console.log(`[Firestore Call] dbPreregister: Successfully updated user ${userId}`);
    } else {
      console.log(`[Firestore Call] dbPreregister: User not found. Creating new record...`);
      userId = "USR-" + Math.random().toString(36).substr(2, 9);
      const pref = deliveryPreference !== undefined ? deliveryPreference : "";
      const prefTime = preferredTime || "";

      await setDoc(doc(db, "users", userId), {
        id: userId,
        name,
        phone: phone.trim(),
        deliveryPreference: pref,
        addressColonia: addressColonia || null,
        addressCalle: addressCalle || null,
        addressNumero: "",
        preferredTime: prefTime,
        addressReferences: "",
        credits: 0.0,
        createdAt: new Date().toISOString()
      });
      console.log(`[Firestore Call] dbPreregister: Successfully created new user ${userId}`);
    }
    return { success: true, userId };
  };

  const submitStep2AndVerify = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Guard: Validate Step 1 fields
    const trimmedPhone = phone.trim();
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre en el paso 1.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!trimmedPhone) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (trimmedPhone.length !== 10) {
      setFormError("El número de teléfono debe tener exactamente 10 caracteres.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError("El número de teléfono no puede contener letras.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }

    // Guard: Validate Step 2 fields
    if (!addressCalle.trim()) {
      setFormError("Por favor ingresa tu calle y número.");
      triggerShake();
      calleInputRef.current?.focus();
      return;
    }
    if (!addressColonia.trim()) {
      setFormError("Por favor ingresa tu colonia.");
      triggerShake();
      coloniaInputRef.current?.focus();
      return;
    }

    setFormStep("verifying");
    setVerificationProgress(0);
    setLoading(true);

    let distance = 5.0;
    try {
      distance = await asyncGetColoniaDistance(addressColonia, gpsCoords);
    } catch (e) {
      distance = getColoniaDistance(addressColonia);
    }
    const eligible = distance <= 1.0;
    setCalculatedDistance(distance);

    // Timed step-by-step verification phases
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setVerificationProgress(1);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setVerificationProgress(2);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setVerificationProgress(3);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {}

    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      if (eligible) {
        setIsWaitlisted(false);
        setDirection("forward");
        setRegistered(true);
      } else {
        setDirection("forward");
        setFormStep("not_eligible_result");
      }
    } catch (err: any) {
      console.warn("API preregister failed, falling back to seamless client-side experience:", err);
      // Seamless LocalStorage Fallback!
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      if (eligible) {
        setIsWaitlisted(false);
        setDirection("forward");
        setRegistered(true);
      } else {
        setDirection("forward");
        setFormStep("not_eligible_result");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !phone.trim() || !addressCalle.trim() || !addressColonia.trim()) {
      setFormError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    const distance = await asyncGetColoniaDistance(addressColonia, gpsCoords);
    const eligible = distance <= 1.0;
    setCalculatedDistance(distance);

    try {
      await dbPreregister();
      setFormStep(eligible ? 2 : "not_eligible_result");
    } catch (err: any) {
      // Offline fallback
      setFormStep(eligible ? 2 : "not_eligible_result");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEligible = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    // Validate Step 1
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre en el paso 1.");
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!phone.trim()) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }

    // Validate Step 2
    if (!addressCalle.trim() || !addressColonia.trim()) {
      setFormError("Por favor ingresa tu dirección en el paso 2.");
      setDirection("backward");
      setActiveFormStep(2);
      setTimeout(() => {
        if (!addressCalle.trim()) calleInputRef.current?.focus();
        else coloniaInputRef.current?.focus();
      }, 150);
      return;
    }

    setLoading(true);
    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline confirmation fallback:", err);
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWaitlist = async () => {
    setFormError(null);
    setLoading(true);
    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(true);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline waitlist confirmation fallback:", err);
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(true);
      setDirection("forward");
      setRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-[#fdf0d5]">
      {/* Hero Section */}
      <section className="relative w-full px-0 pt-0 pb-12 flex flex-col items-start text-left justify-start snap-start snap-always" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>

        <div className="relative z-10 w-full max-w-sm mx-auto pt-0">

          <TypewriterTitle />

          {/* Cesto grande centrado en ambiente real minimal con texto descriptivo unificado */}
          <div className="px-0 sm:px-0 mt-3 mb-6 w-full">
            <div className="rounded-lg border border-gray-100/50 overflow-hidden bg-white">
              <div id="basket-container" className="relative w-full h-[270px] flex flex-col">
                {/* Texto superior del cesto */}
                <div className="py-2.5 px-3.5 select-none shrink-0">
                  <span className="font-geist text-[#6A6A6A] text-[16px] font-medium text-center block w-full" style={{ lineHeight: '1.5' }}>
                    <span className="text-[#0f55d8] font-bold">$95</span> por toda la ropa que metas
                  </span>
                </div>

                {/* Imagen del cesto */}
                <div className="relative w-full flex-1 select-none overflow-hidden bg-transparent flex items-center justify-center px-2.5">
                  <img 
                    src="https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp" 
                    alt="Cesto de lona premium SOMOS en ambiente real minimal" 
                    className="w-full h-full object-cover object-[center_60%] pointer-events-none select-none rounded-md"
                    fetchPriority="high"
                    decoding="sync"
                    onError={(e) => {
                      e.currentTarget.src = canvasLaundryBag;
                    }}
                  />
                </div>
              </div>

              {/* Tarjeta de beneficios */}
              <div className="pt-2 pb-2 px-4 w-full border-t border-gray-100/50">
                {/* Textos de inclusión */}
                <div className="flex flex-col gap-2 select-none text-left">
                  <span className="font-geist text-[#6A6A6A] text-[16px] font-medium ml-3 mb-0.5">
                    Incluye:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight">
                      Lavado, secado y doblado
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight">
                      Espacio para tu carga semanal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight">
                      Entrega a domicilio en 24 horas
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={openBottomSheet}
                  className="w-full h-[50px] bg-[#0f55d8] text-white rounded-2xl font-bold text-lg font-geist flex items-center justify-center gap-2 select-none disabled:opacity-85 hover:brightness-110 mt-8"
                >
                  <div className="flex items-center space-x-2">
                    <span>Quiero mi cesto</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
          </div>
        </div>
      </div>
      </section>



      {/* Sección Exclusiva: El cesto SOMOS */}
      <section className="w-full pt-4 pb-12 flex flex-col justify-start bg-transparent snap-start snap-always" id="conoce-tu-cesto-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans ">
          {/* Título de la sección */}
          <div className="w-full pb-4">
            <h2 className="text-center text-[28px] sm:text-[34px] font-semibold tracking-tight text-gray-800 leading-tight px-4 font-geist">
              Empieza hoy
            </h2>
            <p className="text-center text-[19px] sm:text-[21px] text-[#6A6A6A] font-semibold px-4 font-geist whitespace-nowrap" style={{ marginTop: '6px' }}>
              Sin salir de casa
            </p>
          </div>

          {/* Tarjeta Unica de Pasos */}
          <div className="px-0 sm:px-0 mt-6 w-full">
            <div className="w-full bg-white border-t border-x border-[#eaeaea] rounded-t-lg pt-3.5 pb-3.5 pl-5 pr-2.5 text-left relative overflow-hidden">
              <div className="flex flex-col">
                {/* Item 1 */}
                <div className="flex items-center gap-4 pt-[6px] pb-[12px]">
                  <span className="font-inter font-semibold text-[19px] text-[#6A6A6A] shrink-0 w-9 h-9 flex items-center justify-center select-none">1</span>
                  <div className="space-y-0.5">
                    <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-tight">
                      Pide nuestro cesto
                    </h4>
                    <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-snug">
                      Con envío gratis
                    </p>
                  </div>
                </div>

                 {/* Item 2 */}
                <div className="w-full flex flex-col">
                  {/* Separador 1 */}
                  <div className="border-t border-[#EDE9E0] w-full" />

                  <div className="flex items-center gap-4 pt-[18px] pb-[12px]">
                    <span className="font-inter font-semibold text-[19px] text-[#6A6A6A] shrink-0 w-9 h-9 flex items-center justify-center select-none">2</span>
                    <div className="space-y-0.5">
                      <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-tight">
                        Llénalo en casa
                      </h4>
                      <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-snug">
                        A tu propio ritmo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="w-full flex flex-col">
                  {/* Separador 2 */}
                  <div className="border-t border-[#EDE9E0] w-full" />

                  <div className="flex items-center gap-4 pt-[18px] pb-[6px]">
                    <span className="font-inter font-semibold text-[19px] text-[#6A6A6A] shrink-0 w-9 h-9 flex items-center justify-center select-none">3</span>
                    <div className="space-y-0.5">
                      <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-tight">
                        Déjalo en el punto de recolección
                      </h4>
                      <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-snug">
                        Sin pesar ni esperar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full">
              {/* Underlay to bridge the straight white card with the rounded blue card corners */}
              <div className="absolute top-0 left-0 right-0 h-5 bg-white border-x border-[#eaeaea] z-0 pointer-events-none" />

              <div 
               
                className="w-full bg-[#f8fbff] border border-[#0f55d8]/30 rounded-lg pt-3.5 pb-3.5 pl-5 pr-2.5 mt-0 mb-0 text-left flex items-center gap-4 select-none transform-gpu relative z-10 overflow-hidden" 
                id="flow-reward-banner"
              >
                <div 
                  className="shrink-0 w-9 h-9 flex items-center justify-center" 
                  id="flow-reward-icon-container"
                >
                  <div 
                    className="w-7 h-7 text-[#0f55d8] bg-[#0f55d8]/10 border-[1.5px] border-[#0f55d8]/30 rounded-full flex items-center justify-center transform-gpu"
                   
                  >
                    <Check className="w-[15px] h-[15px]" strokeWidth={3.5} />
                  </div>
                </div>
                <div className="flex flex-col text-left space-y-0.5">
                  <p className="font-geist font-bold text-[#0f55d8] text-[16px] sm:text-[17px] leading-tight">
                    Tu ropa limpia a domicilio
                  </p>
                  <p className="font-geist text-[#4b6a9b] font-medium text-[16px] leading-snug">
                    Entrega al día siguiente
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 px-4 sm:px-0">
            <button 
              onClick={openBottomSheet}
              className="w-full py-4 bg-[#0f55d8] text-white rounded-2xl font-bold text-lg font-geist flex items-center justify-center gap-2 select-none disabled:opacity-85 hover:brightness-110  "
             
            >
              <div className="flex items-center space-x-2">
                <span>Quiero mi cesto</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
            <p className="text-center text-[15px] font-semibold text-gray-500 mt-2.5">Recíbelo gratis, paga solo al lavar</p>
          </div>
        </div>
      </section>

      {/* Nueva Sección: Ubicación Dinámica Interactiva sin Clave de API */}
      <section className="w-full px-0 pt-5 flex flex-col justify-start pb-10 bg-[#fdf0d5] snap-start snap-always" id="editorial-location-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="w-full max-w-sm mx-auto text-left">
          
          {/* Header directly in the layout, extremely bold and crisp */}
          <div id="location-editorial-head" className="w-full pb-4">
            <h2 className="text-center text-[28px] sm:text-[34px] font-semibold tracking-tight text-gray-800 leading-tight px-4 font-geist">
              Recolección
            </h2>
            <p className="text-center text-[19px] sm:text-[21px] text-[#6A6A6A] font-semibold px-4 font-geist no-underline pointer-events-none select-text cursor-text" style={{ textDecoration: 'none', borderBottom: 'none', marginTop: '6px' }}>
              Cerca de ti
            </p>
          </div>



          {/* Custom CSS Map Container matching the exact provided location image */}
          <div className="px-0 sm:px-0 mt-6 w-full">
            <div className="w-full bg-white border border-[#eaeaea] rounded-lg p-[10px] text-left relative overflow-hidden flex flex-col">
              {/* Dirección */}
              <div className="pb-2 pt-1 w-full bg-white relative z-10 flex flex-col items-center px-1.5">
                <div className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight text-center">
                  Paseo de las Palmas 209
                </div>
              </div>

              <div className="w-full p-0">
                <a 
                  href="https://www.google.com/maps/place/Paseo+de+las+Palmas+209,+Coatzacoalcos,+Veracruz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-[250px] rounded-lg overflow-hidden bg-[#f4f5f5] flex items-center justify-center font-sans tracking-tight block cursor-pointer hover:opacity-95 transition-opacity" 
                  id="location-dynamic-map-frame-container"
                >
              {/* Streets & Roads Layer */}
              {/* Paseo de las palmas */}
              <div className="absolute top-[-20%] bottom-[40%] left-[48%] w-[32px] bg-[#cbcfdb] z-0">
                 <span translate="no" className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-[#495464] text-[10px] font-medium tracking-wide notranslate">Paseo de las Palmas</span>
              </div>
              
              {/* Avestruces */}
              <div className="absolute top-[-20%] bottom-[-20%] right-0 w-[32px] bg-[#cbcfdb] z-0">
                <span translate="no" className="absolute top-[31.4%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-[#495464] text-[10px] font-medium tracking-wide notranslate">Avestruces</span>
              </div>

              {/* Río Calzadas */}
              <div className="absolute bottom-[40%] -left-10 right-0 h-[32px] bg-[#cbcfdb] z-0 flex items-center justify-center">
                 <span translate="no" className="text-[#495464] text-[10px] font-medium tracking-wide whitespace-nowrap mr-10 relative notranslate">Río Calzadas</span>
                 <ArrowRight className="absolute right-12 text-[#6e7682] w-3.5 h-3.5 rotate-180" />
              </div>
              
              {/* Bottom horizontal street */}
              <div className="absolute bottom-[15%] -left-10 right-0 h-[32px] bg-[#cbcfdb] z-0">
                 <ArrowRight className="absolute left-[47%] top-1/2 -translate-y-1/2 text-[#6e7682] w-3.5 h-3.5" />
              </div>
              
              {/* Conexión de calles izquierda */}
              <div className="absolute bottom-[15%] -left-6 w-[50px] h-[30%] bg-[#cbcfdb] z-0"></div>

              {/* Markers & Labels */}
              
              {/* Lions Boot Camp */}
              <div className="absolute top-[13%] left-[12%] flex items-center z-10 transition-transform cursor-pointer">
                <span translate="no" className="text-black text-[12px] font-medium mr-2 tracking-tight notranslate">Lions Boot Camp</span>
                <div className="w-[22px] h-[22px] bg-[#9ca3af] rounded-full flex items-center justify-center text-white border-2 border-white">
                  <div className="w-[6px] h-[6px] bg-white rounded-full"></div>
                </div>
              </div>

              {/* Ferreteria */}
              <div className="absolute bottom-[50%] left-[65%] flex flex-col items-center z-10 transition-transform cursor-pointer">
                <span translate="no" className="text-black text-[12px] font-medium tracking-tight notranslate mb-0.5">Ferretería</span>
                <div className="w-[22px] h-[22px] bg-[#9ca3af] rounded-full flex items-center justify-center text-white border-2 border-white">
                  <div className="w-[6px] h-[6px] bg-white rounded-full"></div>
                </div>
              </div>

              {/* Red Pin - Location */}
              <div className="absolute top-[19%] left-[40%] z-20 cursor-pointer flex flex-col items-center">
                <div className="text-[#ea4335] relative origin-bottom">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div className="absolute top-[9px] left-1/2 w-3 h-3 bg-[#a50f03] rounded-full -translate-x-1/2 opacity-30"></div>
                </div>
              </div>

              {/* OXXO Santa Isabel */}
              <div className="absolute bottom-[3%] right-[15%] flex flex-col items-center z-10 transition-transform cursor-pointer">
                <div className="bg-white w-[34px] h-[22px] rounded-[2px] border-2 border-white shadow-sm flex items-center justify-center mb-1 overflow-hidden">
                  <img src="https://upload.wikimedia.org/wikipedia/en/4/40/OXXO_logo.svg" alt="OXXO" className="w-full h-full object-contain" />
                </div>
                <span translate="no" className="text-black text-[12px] font-medium whitespace-nowrap tracking-tight notranslate">OXXO Santa Isabel</span>
              </div>
                </a>
              </div>

              {/* Tarjeta de información */}
              <div className="pt-2.5 pb-0.5 w-full bg-white relative z-10 flex flex-row justify-between items-center px-1.5">
                {/* Contacto */}
                <div className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight flex items-center gap-1.5">
                  <MessageCircleMore size={16} strokeWidth={2} />
                  <a 
                    href="https://wa.me/529212393938?text=Hola%2C%20tengo%20una%20duda%20sobre%20SOMOS%20lavander%C3%ADa."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6A6A6A] underline hover:no-underline"
                  >
                    Contáctanos
                  </a>
                </div>
                {/* Horario */}
                <div className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-tight flex items-center gap-1.5">
                  <Clock size={16} strokeWidth={2} />
                  9 am - 6 pm
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Route CTA helper */}
          <div className="space-y-4 mt-10 px-4 sm:px-0 flex flex-col items-center">
            <div className="w-full flex flex-col items-center gap-y-1.5" id="cta-info-wrapper">
              <button 
                type="button"
                onClick={handleNavigationAndGPS}
                disabled={isNavigatingGPS}
                className="w-full py-4 bg-[#0f55d8] hover:bg-[#0d4bc0]  text-white rounded-2xl font-bold text-lg font-geist flex items-center justify-center gap-2 select-none cursor-pointer disabled:opacity-85"
               
                id="location-cta-navigation-button"
              >
                {isNavigatingGPS ? (
                  <span>Conectando...</span>
                ) : (
                  <span>¿Cómo llegar?</span>
                )}
              </button>

            </div>

            {isNavigatingGPS && gpsLoadingStep && (
              <div className="w-full p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-center text-sm text-[#0f55d8] font-bold flex items-center justify-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#0f55d8]" />
                <span>{gpsLoadingStep}</span>
              </div>
            )}

            {geoError && (
              <div className="w-full p-3 bg-rose-50 border border-rose-100 rounded-2xl text-left text-[11.5px] text-rose-600 font-semibold leading-relaxed" id="gps-status-error">
                ⚠️ {geoError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Nueva Sección: Servicios adicionales */}
      <section className="w-full px-0 pt-5 flex flex-col justify-start pb-10 bg-[#fdf0d5] snap-start snap-always" id="servicios-adicionales-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="w-full max-w-sm mx-auto text-left">
          
          <div className="w-full pb-4">
            <h2 className="text-center text-[28px] sm:text-[34px] font-semibold tracking-tight text-gray-800 leading-tight px-4 font-geist">
              Soluciones
            </h2>
            <p className="text-center text-[19px] sm:text-[21px] text-[#6A6A6A] font-semibold px-4 font-geist no-underline pointer-events-none select-text cursor-text" style={{ textDecoration: 'none', borderBottom: 'none', marginTop: '6px' }}>
              Con costo adicional
            </p>
          </div>

          <div className="px-0 sm:px-0 mt-6 w-full">
            <div className="w-full bg-white border border-[#eaeaea] rounded-lg pt-5 pb-2.5 px-4 text-left relative overflow-hidden flex flex-col">
              <div className="flex flex-col">
                <div className="flex flex-col pb-2.5">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="bg-white w-[64px] flex justify-center py-2 rounded-full border-[1.5px] border-[#4b6a9b]">
                        <span className="font-geist font-bold text-[#0f55d8] text-[16px] sm:text-[18px] leading-none tracking-tight">
                          +$20
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-snug">
                        Urgente
                      </h4>
                      <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">
                        Recibe tu ropa limpia el mismo día.
                      </p>
                      <div className="flex items-start gap-1.5 pt-4">
                        <Info className="w-[14px] h-[14px] text-[#0f55d8] shrink-0 mt-[2px]" />
                        <span className="font-geist text-[#4b6a9b] text-[13.5px] font-semibold leading-snug">
                          Pídelo al entregar tu cesto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#EDE9E0] w-full" />

                <div className="flex flex-col pt-5 pb-2.5">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="bg-white w-[64px] flex justify-center py-2 rounded-full border-[1.5px] border-[#4b6a9b]">
                        <span className="font-geist font-bold text-[#0f55d8] text-[16px] sm:text-[18px] leading-none tracking-tight">
                          +$$$
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-geist font-bold text-[#181818] text-[16px] sm:text-[17px] leading-snug">
                        Ropa de cama
                      </h4>
                      <p className="font-geist text-[#6A6A6A] text-[16px] font-medium leading-relaxed">
                        Añade el lavado de tu edredón, cobertor o sábana.
                      </p>
                      <div className="flex items-start gap-1.5 pt-4">
                        <Info className="w-[14px] h-[14px] text-[#0f55d8] shrink-0 mt-[2px]" />
                        <span className="font-geist text-[#4b6a9b] text-[13.5px] font-semibold leading-snug">
                          Entrégalo por separado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>


        </div>
      </section>

      {/* Bottom Sheet sliding panel modal - High Performance pure CSS */}
      <div 
        className="form-overlay" 
        data-open={isBottomSheetOpen ? "true" : "false"}
        onClick={() => setIsBottomSheetOpen(false)}
      />

      <div 
        className="form-bottom-sheet h-auto pt-4 pb-8 px-6" 
        data-open={isBottomSheetOpen ? "true" : "false"}
        id="bottom-sheet-container"
      >
        {/* Visual drag indicator (mobile-native premium aesthetic) */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-1 shrink-0" />

        {/* Close Button X on top-right */}
        <button
          onClick={() => setIsBottomSheetOpen(false)}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors rounded-full pointer-events-auto z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {formError && (
          <div className="mx-0 mt-2 p-2 bg-red-50 border border-red-100 text-red-650 rounded-xl text-[11px] font-bold flex items-center gap-2 select-none shrink-0 z-20">
            <Info className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span className="leading-tight">{formError}</span>
          </div>
        )}

        {/* Form Inner Content Scroller with static height */}
        <div className="w-full relative mt-3">
          <div className="form-content-inner w-full flex flex-col">
            
              {registered ? (
                <div 
                  key="step-registered"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-center flex flex-col items-center justify-center w-full py-4"
                >
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                    ¡Listo, {name.split(' ')[0]}!
                  </h2>

                  {isWaitlisted ? (
                    <>
                      <p className="text-gray-550 text-xs leading-relaxed mb-5">
                        Hemos asignado y reservado tu cesto premium gratis. Aunque no contamos con reparto a domicilio en tu zona, te esperamos en nuestro mostrador para recibir y entregar tu ropa limpia.
                      </p>

                      {/* simulated coupon notches */}
                      <div className="w-full border-t border-dashed border-gray-200 my-2 relative">
                        <div className="absolute -left-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-r border-[#ebecef]"></div>
                        <div className="absolute -right-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-l border-[#ebecef]"></div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl w-full text-left space-y-1.5 mt-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                            Punto de Entrega y Recepción
                          </p>
                          <p className="font-extrabold text-gray-800 text-xs">
                            {selectedLocationName || 'Ubicación Palmas (Mostrador)'}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Tu colonia ({addressColonia}) queda fuera de reparto, ¡pero tu cesto te espera en mostrador!
                          </p>
                        </div>
                        
                        <div className="border-t border-slate-150 pt-1.5 flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-semibold">Pre-registro:</span>
                          <span className="bg-[#EBECEF] text-slate-800 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">Activo — Mostrador</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsBottomSheetOpen(false)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm mt-4 select-none "
                      >
                        Entendido, ¡gracias!
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-xs leading-relaxed mb-5">
                        Hemos asignado y guardado un cesto premium exclusivo a tu número. Tu ropa limpia llegará directo a tu puerta en <span className="font-bold text-gray-800">{addressColonia}</span>.
                      </p>

                      {/* simulated coupon notches */}
                      <div className="w-full border-t border-dashed border-gray-200 my-2 relative">
                        <div className="absolute -left-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-r border-[#ebecef]"></div>
                        <div className="absolute -right-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-l border-[#ebecef]"></div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl w-full text-left space-y-1.5 mt-2">
                         <div>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                             Dirección Registrada
                           </p>
                           <p className="font-extrabold text-gray-800 text-xs text-slate-800">
                             {addressCalle}, {addressColonia}
                           </p>
                         </div>
                         
                         <div className="border-t border-slate-150 pt-1.5 flex justify-between items-center text-[10px]">
                           <span className="text-slate-500 font-semibold">Pre-registro:</span>
                           <span className="bg-[#EBECEF] text-slate-800 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">Activo</span>
                         </div>
                       </div>

                       <button
                         type="button"
                         onClick={() => setIsBottomSheetOpen(false)}
                         className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm mt-4 select-none "
                       >
                         Listo, ¡muchas gracias!
                       </button>
                    </>
                  )}
                </div>
              ) : formStep === "verifying" ? (
                <div
                  key="step-verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-center flex flex-col items-center justify-center w-full py-6 select-none"
                >
                  <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                    {/* Animated pulsing target ring representing the routing check */}
                    <div className="absolute inset-0 border-[2.5px] border-dashed border-[#0f55d8]/40 rounded-full -slower" />
                    <div className="absolute inset-2 bg-[#0f55d8]/5 rounded-full " />
                    <MapPin className="w-8 h-8 text-[#0f55d8] relative z-10 " />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5 font-geist">
                    Verificando Cobertura
                  </h3>
                  <p className="text-gray-400 text-[19px] font-semibold uppercase tracking-wider mb-5">
                    Análisis de Ruta en Tiempo Real
                  </p>

                  <div className="w-full max-w-sm space-y-3 bg-slate-50 border border-slate-150 rounded-xl p-4 text-left font-geist">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3">
                      {verificationProgress >= 1 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <p className={`text-xs font-semibold ${verificationProgress >= 1 ? 'text-emerald-700' : 'text-slate-600'}`}>
                        Geolocalizando dirección ({addressColonia})...
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3">
                      {verificationProgress >= 2 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : verificationProgress === 1 ? (
                        <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <p className={`text-xs font-semibold ${verificationProgress >= 2 ? 'text-emerald-700' : verificationProgress === 1 ? 'text-slate-600' : 'text-slate-400'}`}>
                        Trazando ruta óptima y vías de acceso...
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3">
                      {verificationProgress >= 3 ? (
                        <CheckCircle className="w-4 h-4 text-[#0f55d8] shrink-0" />
                      ) : verificationProgress === 2 ? (
                        <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <p className={`text-xs font-semibold ${verificationProgress >= 3 ? 'text-emerald-700' : verificationProgress === 2 ? 'text-slate-600' : 'text-slate-400'}`}>
                        {verificationProgress >= 3 
                          ? `Distancia de traslado calculada: ~${calculatedDistance.toFixed(1)} km` 
                          : "Estimando distancia de traslado..."}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-6 max-w-sm">
                    <div
                      className="bg-[#0f55d8] h-full"
                      initial={{ width: "0%" }}
                      animate={{
                        width:
                          verificationProgress === 0 ? "15%" :
                          verificationProgress === 1 ? "45%" :
                          verificationProgress === 2 ? "75%" : "100%"
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ) : formStep === "not_eligible_result" ? (
                <div 
                  key="step-not-eligible"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-center flex flex-col items-center justify-center w-full py-4 zoom-in-95 duration-200"
                >
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shrink-0">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2 leading-tight">
                    ¡Recoge gratis en sucursal!
                  </h2>
                  
                  <p className="text-gray-550 text-xs leading-relaxed mb-5 max-w-sm">
                    Por ahora no contamos con entregas a domicilio en tu zona, pero aún puedes pedir tu cesto gratis y manejar tus prendas directamente en nuestro mostrador.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmWaitlist}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#0f55d8] text-white font-extrabold text-sm font-geist disabled:opacity-50 flex items-center justify-center gap-1.5 pointer-events-auto"
                   
                  >
                    {loading ? <Loader2 className="w-4 h-4 " /> : (
                      <>
                        <span>Quiero mi cesto</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDirection("backward"); setFormStep(1); setActiveFormStep(2); setTimeout(() => { coloniaInputRef.current?.focus(); }, 40); }}
                    className="text-gray-400 hover:text-gray-650 text-xs font-semibold mt-3.5 font-geist transition-colors text-center pointer-events-auto w-full block"
                   
                  >
                    Probar con otra dirección
                  </button>
                </div>
              ) : (
                <div
                  key="active-steps-slider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full relative flex flex-col"
                >
                  {/* Elegant Segmented Progress Indicator */}
                  <div className="flex gap-2 shrink-0 justify-center mb-1">
                    {[1, 2].map((step) => {
                      const isActive = step <= activeFormStep;
                      return (
                        <button 
                          key={step}
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setDirection(step > activeFormStep ? "forward" : "backward");
                            setActiveFormStep(step as 1 | 2);
                            setTimeout(() => {
                              if (step === 1) {
                                nameInputRef.current?.focus();
                              } else if (step === 2) {
                                calleInputRef.current?.focus();
                              }
                            }, 40);
                          }}
                          className="h-5 flex-1 relative group focus:outline-none pointer-events-auto"
                          title={`Ir al Paso ${step}`}
                        >
                          <div className="h-1.5 w-full bg-slate-105 rounded-full overflow-hidden group-hover:bg-slate-200">
                            <div className={`h-full bg-[#0f55d8] rounded-full ${step === 1 ? "" : ""}`} style={{ width: isActive ? "100%" : "0%" }} />
                          </div>
                          <span className="sr-only">Paso {step}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Static Title/Subtitle block (does not slide) */}
                  <div className="pt-2 pb-1 shrink-0 select-none">
                    <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight leading-snug">
                      {activeFormStep === 1 && "Tu cesto SOMOS te espera"}
                      {activeFormStep === 2 && "Tu dirección de entrega"}
                    </h2>
                    <p className="text-gray-550 text-xs mt-0.5 font-semibold">
                      {activeFormStep === 1 && "Pedirla toma menos de un minuto."}
                      {activeFormStep === 2 && "¿A dónde te llevamos tu cesto?"}
                    </p>
                  </div>

                  {/* Slider viewport */}
                  <div 
                    className="w-full overflow-hidden relative mt-3"
                    style={{ 
                      height: typeof sliderHeight === "number" ? `${sliderHeight}px` : sliderHeight,
                      transition: 'height 250ms ease'
                    }}
                  >
                    <div 
                      className="flex w-[200%] transform-gpu"
                      style={{
                        transform: activeFormStep === 1 ? 'translateX(0%)' : 'translateX(-50%)',
                        transition: 'transform 300ms cubic-bezier(0.32, 0.94, 0.6, 1)'
                      }}
                    >
                      {/* Paso 1 */}
                      <div ref={step1Ref} className="w-1/2 shrink-0 select-none px-0.5">
                        <form onSubmit={goToStep2} className="space-y-4 flex flex-col">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Nombre Completo</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  ref={nameInputRef}
                                  type="text"
                                  required
                                  autoComplete="name"
                                  value={name}
                                  onChange={(e) => { setName(e.target.value); setFormError(null); }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      phoneInputRef.current?.focus();
                                    }
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                  placeholder=""
                                />
                              </div>
                            </div>
       
                            <div className="space-y-1">
                              <div className="flex justify-between items-center ml-0.5">
                                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Teléfono (WhatsApp)</label>
                                <span className={`text-[11px] font-semibold tracking-wider transition-colors font-geist ${
                                  phone.length === 10 
                                    ? "text-emerald-600 font-bold" 
                                    : phone.length > 10 
                                      ? "text-red-600 font-bold" 
                                      : "text-gray-400"
                                }`}>
                                  {phone.length}/10
                                </span>
                              </div>
                              <div className={`relative ${isShaking ? "" : ""}`}>
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPhoneError ? "text-red-500" : "text-slate-400"}`} />
                                <input
                                  ref={phoneInputRef}
                                  type="tel"
                                  required
                                  autoComplete="tel"
                                  value={phone}
                                  onChange={(e) => { setPhone(e.target.value); setFormError(null); }}
                                  onBlur={handlePhoneBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      goToStep2(e);
                                    }
                                  }}
                                  className={`w-full pl-9 pr-4 py-2 rounded-xl outline-none font-semibold text-base focus:ring-2 ${
                                    isPhoneError
                                      ? "bg-red-50/30 border border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100"
                                      : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white focus:ring-blue-100 placeholder:text-slate-400"
                                  }`}
                                  placeholder=""
                                />
                              </div>
                            </div>
                          </div>
 
                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-sm flex items-center justify-center gap-1.5/10 cursor-pointer"
                          >
                            <span className="font-geist">Continuar</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      </div>

                      {/* Paso 2 */}
                      <div ref={step2Ref} className="w-1/2 shrink-0 select-none px-0.5">
                        <form onSubmit={submitStep2AndVerify} className="space-y-4 flex flex-col">
                          
                          {gpsAutofillError && (
                            <p className="text-red-500 text-[11px] font-bold text-center leading-tight bg-red-50 border border-red-100 py-1.5 px-3 rounded-lg ">
                              {gpsAutofillError}
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Calle y número</label>
                              <div className="relative">
                                {gpsAutofillLoading ? (
                                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 " />
                                ) : (
                                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                )}
                                <input
                                  ref={calleInputRef}
                                  type="text"
                                  required
                                  autoComplete="street-address"
                                  value={addressCalle}
                                  onClick={handleAddressInputClick}
                                  onChange={(e) => { setAddressCalle(e.target.value); setFormError(null); setGpsCoords(null); }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      coloniaInputRef.current?.focus();
                                    }
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                  placeholder=""
                                />
                              </div>
                            </div>
 
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Colonia</label>
                              <div className="relative">
                                {gpsAutofillLoading ? (
                                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 " />
                                ) : (
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                )}
                                <input
                                  ref={coloniaInputRef}
                                  type="text"
                                  required
                                  autoComplete="address-level2"
                                  value={addressColonia}
                                  onClick={handleAddressInputClick}
                                  onChange={(e) => { setAddressColonia(e.target.value); setFormError(null); setGpsCoords(null); }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      submitStep2AndVerify(e);
                                    }
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                  placeholder=""
                                />
                              </div>
                            </div>
                          </div>
 
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setFormError(null); setDirection("backward"); setActiveFormStep(1); }}
                              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-sm font-geist shrink-0"
                             
                            >
                              Atrás
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 py-2.5 rounded-xl bg-[#0f55d8] text-white font-extrabold text-sm font-geist disabled:opacity-50 flex items-center justify-center gap-1.5"
                             
                            >
                              {loading ? <Loader2 className="w-4 h-4 " /> : (
                                <>
                                  <span>Quiero mi cesto</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
          </div>
        </div>
      </div>

      {/* Spacer to prevent Safari rubber-band snap glitch on the last section */}
      <div className="h-[2vh] w-full shrink-0 bg-transparent snap-end" style={{ scrollSnapAlign: 'end' }} />
    </div>
  );
}

