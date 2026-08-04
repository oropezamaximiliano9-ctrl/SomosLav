import { useNavigate } from "react-router-dom";
import { Check, CheckCircle, CheckCircle2, Clock, Info, Loader2, MapPin, Phone, MessageCircleMore, User, X, ArrowRight, Building, Truck, Sparkles, Shirt, PackageCheck, Zap, BedDouble, ShoppingBag, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useContext, useRef, FormEvent, useEffect, ReactNode } from "react";
import { motion } from "motion/react";
import { RoleContext } from "../App";
import canvasLaundryBag from "../assets/images/IMG_8321.jpg";
import { db } from "../firebase";
import { collection, doc, getDocs, updateDoc, setDoc, query, where } from "firebase/firestore";
import { getColoniaDistance, asyncGetColoniaDistance, ORIGEN_LAVANDERIA } from "../utils/distance";

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
    <div className="w-full text-center pt-2 pb-3 select-none px-4" id="rotating-title-container">
      <h1 className="text-center text-[26px] text-[#333333] font-semibold font-geist">
        Tu ropa <span className="text-[#0f55d8]">limpia</span>
      </h1>
      <p className="text-center text-[26px] text-[#333333] font-semibold font-geist -mt-[3px]">
        con envío{" "}
        <span className="relative inline-block px-0.5">
          gratis
          <svg
            className="absolute left-0 -bottom-[2px] w-full h-[8px] text-[#0f55d8] pointer-events-none overflow-visible"
            viewBox="0 0 100 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M 1 6 C 30 4.5, 70 7, 99 5.5"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </p>
    </div>
  );
};

const FloatingBadge = ({ 
  text, 
  position = "top-left", 
  className,
  noBorder = false,
  textClassName,
  innerClassName
}: { 
  text: ReactNode; 
  position?: "top-left" | "top-right"; 
  className?: string;
  noBorder?: boolean;
  textClassName?: string;
  innerClassName?: string;
}) => {
  const defaultPos = position === "top-right"
    ? "absolute top-[2px] -right-[12px] sm:-right-[10px] z-20 rotate-[8deg] pointer-events-none"
    : "absolute top-[2px] -left-[2px] sm:left-[0px] z-20 -rotate-[8deg] pointer-events-none";

  return (
    <div className={className || defaultPos}>
      <div className={`bg-white ${noBorder ? '' : 'border-2 border-dashed border-[#333333]'} rounded-full ${innerClassName || 'px-2.5 h-[36px]'} flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.08)]`}>
        <span className={textClassName || "font-geist font-semibold text-[#333333] text-[18px] tracking-tight whitespace-nowrap"}>
          {text}
        </span>
      </div>
    </div>
  );
};

export default function Landing() {
  const { role } = useContext(RoleContext);
  const navigate = useNavigate();

  const [name, setName] = useState(() => localStorage.getItem("user_name") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("user_phone") || "");
  const [deliveryPreference, setDeliveryPreference] = useState(() => localStorage.getItem("user_delivery_preference") || "");
  
  const [addressColonia, setAddressColonia] = useState(() => localStorage.getItem("user_address_colonia") || "");
  const [addressCalle, setAddressCalle] = useState(() => localStorage.getItem("user_address_calle") || "");
  const [preferredTime, setPreferredTime] = useState(() => localStorage.getItem("user_preferred_time") || "");
  
  const [loading, setLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPriceInfoModalOpen, setIsPriceInfoModalOpen] = useState(false);
  const [registered, setRegistered] = useState(() => localStorage.getItem("user_registered") === "true");
  const [isWaitlisted, setIsWaitlisted] = useState(() => localStorage.getItem("user_is_waitlisted") === "true");
  const [formStep, setFormStep] = useState<1 | 2 | "verifying" | "not_eligible_result">(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(() => getColoniaDistance(addressColonia || ""));

  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const slideWidth = carouselRef.current.clientWidth;
      setCurrentSlide(Math.round(scrollPosition / slideWidth));
    }
  };

  const scrollToSlide = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (carouselRef.current) {
        const nextSlide = (currentSlide + 1) % 3;
        scrollToSlide(nextSlide);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [currentSlide]);

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

  const [isNavigatingGPS, setIsNavigatingGPS] = useState(false);
  const [gpsLoadingStep, setGpsLoadingStep] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsAutofillLoading, setGpsAutofillLoading] = useState(false);
  const [gpsAutofillError, setGpsAutofillError] = useState<string | null>(null);
  const [hasRequestedGps, setHasRequestedGps] = useState(false);
  const [showColoniaSuggestions, setShowColoniaSuggestions] = useState(false);

  const ALL_COATZA_COLONIAS = [
    "Las Palmas",
    "Petrolera",
    "Rancho Alegre",
    "Rancho Alegre 1",
    "Rancho Alegre 2",
    "Paraíso",
    "Puerto México",
    "Pensiones",
    "Vistalmar",
    "María de la Piedad",
    "Centro",
    "Playa Sol",
    "El Tesoro",
    "FOVISSSTE",
    "Guadalupe Victoria",
    "Santa Isabel",
    "Manuel Ávila Camacho",
    "Benito Juárez Norte",
    "Benito Juárez Sur",
    "Adolfo López Mateos",
    "Gaviotas",
    "Trópico de la Rivera",
    "Puerto Esmeralda",
    "Teresa Morales",
    "Lomas de Coatzacoalcos",
    "Lomas de Barrillas",
    "Ciudad Olmeca",
    "San Martín"
  ];

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
      const activeRef = formStep === 2 ? step2Ref : step1Ref;
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
  }, [formStep, isBottomSheetOpen, registered]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
    }
  }, [formStep]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      const timer = setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = 0;
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [formStep, isBottomSheetOpen]);
  
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
    setFormStep(2);
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
      const distKm = calculatedDistance || (col ? getColoniaDistance(col) : existingUser.distanceKm || null);

      if (distKm) {
        localStorage.setItem("user_distance_km", String(distKm));
      }

      await updateDoc(doc(db, "users", userId), {
        name,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        preferredTime: prefTime,
        distanceKm: distKm
      });
      console.log(`[Firestore Call] dbPreregister: Successfully updated user ${userId}`);
    } else {
      console.log(`[Firestore Call] dbPreregister: User not found. Creating new record...`);
      userId = "USR-" + Math.random().toString(36).substr(2, 9);
      const pref = deliveryPreference !== undefined ? deliveryPreference : "";
      const prefTime = preferredTime || "";
      const distKm = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);

      if (distKm) {
        localStorage.setItem("user_distance_km", String(distKm));
      }

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
        distanceKm: distKm,
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
      setFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!trimmedPhone) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      triggerShake();
      setDirection("backward");
      setFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (trimmedPhone.length !== 10) {
      setFormError("El número de teléfono debe tener exactamente 10 caracteres.");
      triggerShake();
      setDirection("backward");
      setFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError("El número de teléfono no puede contener letras.");
      triggerShake();
      setDirection("backward");
      setFormStep(1);
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
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("API preregister failed, falling back to seamless client-side experience:", err);
      // Seamless LocalStorage Fallback!
      try {
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
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
      setFormStep(2);
    } catch (err: any) {
      // Offline fallback
      setFormStep(2);
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
      setFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!phone.trim()) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      setDirection("backward");
      setFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }

    // Validate Step 2
    if (!addressCalle.trim() || !addressColonia.trim()) {
      setFormError("Por favor ingresa tu dirección en el paso 2.");
      setDirection("backward");
      setFormStep(2);
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
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline confirmation fallback:", err);
      try {
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
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
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(true);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline waitlist confirmation fallback:", err);
      try {
        const distVal = calculatedDistance || (addressColonia ? getColoniaDistance(addressColonia) : null);
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, distanceKm: distVal };
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
      <section className="relative w-full px-0 pt-0 pb-8 sm:pb-12 flex flex-col items-start text-left justify-between snap-start snap-always min-h-[calc(100dvh-50px)] min-h-[calc(100svh-50px)]" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 50px)' }}>

        <div className="relative z-10 w-full max-w-sm mx-auto pt-0">

          <TypewriterTitle />

          {/* Cesto grande centrado en ambiente real minimal con texto descriptivo unificado */}
          <div className="px-0 sm:px-0 mt-2.5 mb-6 w-full relative">
            <div className="absolute top-[4px] -left-[10px] sm:-left-[8px] z-20 w-[105px] sm:w-[120px] pointer-events-none">
              <img 
                src="https://iili.io/CU67SLX.webp" 
                alt="Cesto incluido" 
                className="w-full h-auto object-contain drop-shadow-sm"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-[1.05] font-semibold text-white/95 text-[18px] sm:text-[20px] font-geist rotate-[2deg] pt-0.5 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                <span>Cesto</span>
                <span>incluido</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-100/50 overflow-hidden bg-white">
              <div id="basket-container" className="relative w-full h-[270px] flex flex-col">
                {/* Imagen del cesto */}
                <div className="relative w-full flex-1 select-none overflow-hidden bg-transparent flex items-center justify-center px-2.5 pt-3">
                  <img 
                    src="https://i.ibb.co/VcVSqJbP/A5-DFA592-E652-4373-9358-BA9-DC228-E0-D7.webp" 
                    alt="Cesto de lona premium SOMOS en ambiente real minimal" 
                    className="w-full h-full object-cover object-[center_65%] pointer-events-none select-none rounded-md"
                    fetchPriority="high"
                    decoding="sync"
                    onError={(e) => {
                      e.currentTarget.src = canvasLaundryBag;
                    }}
                  />
                </div>
              </div>

              {/* Tarjeta de beneficios */}
              <div className="pt-2 pb-2.5 px-2 w-full border-t border-gray-100/50">
                {/* Textos de inclusión */}
                <div className="flex flex-col gap-2 select-none text-left pt-2">
                  <div className="ml-2">
                    <span className="font-geist text-[#333333] text-[18px] font-medium leading-tight">
                      Toda la ropa de tu cesto:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-[16px] h-[16px] text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#333333] text-[18px] font-medium leading-tight">
                      Lavada y doblada
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-[16px] h-[16px] text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#333333] text-[18px] font-medium leading-tight">
                      Lista en 24 horas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 ml-2 flex items-center justify-center">
                      <Check className="w-[16px] h-[16px] text-[#0f55d8]" strokeWidth={4} />
                    </div>
                    <span className="font-geist text-[#333333] text-[18px] font-medium leading-tight">
                      A domicilio
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-[27px] w-full max-w-[340px] justify-start ml-2">
                  <button 
                     onClick={openBottomSheet}
                    className="h-[45px] px-3.5 shrink-0 bg-[#0f55d8] text-white rounded-full font-semibold text-[18px] font-geist flex items-center justify-center gap-1.5 select-none disabled:opacity-85 hover:bg-[#0d4bc0] transition-colors border border-white/50 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.65)]"
                  >
                    <span>Quiero mi cesto</span>
                  </button>
                  <button 
                    onClick={() => {
                      document.getElementById('empieza-hoy-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="h-[45px] px-3 shrink-0 bg-white border border-[#333333] text-[#333333] rounded-full font-semibold text-[18px] font-geist flex items-center justify-center gap-0.5 select-none hover:bg-black/5 transition-colors shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.65)]"
                  >
                    <span>Saber más</span>
                    <ChevronDown className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
      </section>

      {/* Nueva Sección: Empieza hoy (Sin salir de casa) */}
      <section className="relative w-full px-0 pt-0 pb-8 sm:pb-12 flex flex-col justify-between bg-transparent snap-start snap-always min-h-[calc(100dvh-56px)] min-h-[calc(100svh-56px)]" id="empieza-hoy-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans">
          {/* Título de la sección fuera de la tarjeta */}
          <div className="w-full text-center pt-2 pb-3 select-none px-4" id="empieza-hoy-title-container">
            <h1 className="text-center text-[26px] text-[#333333] font-semibold font-geist">
              Empieza
            </h1>
            <p className="text-center text-[26px] text-[#333333] font-semibold font-geist -mt-[3px]">
              sin salir de casa
            </p>
          </div>

          {/* Tarjeta de Servicio a Domicilio - Blanca */}
          <div className="px-0 sm:px-0 mt-2.5 w-full relative">
            <div 
              className="w-full rounded-lg border border-gray-100/50 shadow-none flex flex-col bg-white relative" 
              id="empty-green-landing-card"
            >
              {/* Texto explicativo ARRIBA de la imagen */}
              <div className="pt-5 pb-3 px-6 w-full text-left">
                <p className="text-[22px] text-[#333333] font-medium font-geist leading-tight">
                  <span className="text-[#0f55d8] font-semibold">Recibe</span> tu cesto hoy<br />y llénalo a tu propio ritmo
                </p>
              </div>

              {/* Imagen en el MEDIO */}
              <div className="w-full h-[270px] flex flex-col relative">
                <FloatingBadge 
                  text="Es gratis" 
                  position="top-right" 
                  className="absolute -top-[5px] -right-[10px] sm:-right-[4px] z-20 rotate-[6deg] pointer-events-none"
                />
                
                {/* Línea curva punteada que conecta la etiqueta "Es gratis" con el cesto de la imagen */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M 83 7 Q 92 28, 58 48" 
                    stroke="#333333" 
                    strokeWidth="1.5" 
                    strokeDasharray="8 8" 
                    strokeOpacity="0.6"
                    fill="none" 
                    strokeLinecap="round" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="relative w-full flex-1 select-none overflow-hidden bg-transparent flex items-center justify-center px-2.5">
                  <img 
                    src="https://i.ibb.co/sdyNTT4D/1-E69988-B-12-E9-42-D8-A11-C-FA3-C665-B140-E.png" 
                    alt="Servicio a domicilio SOMOS" 
                    className="w-full h-full object-cover object-center pointer-events-none select-none rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = "https://i.ibb.co/NdZJ00qk/1-E69988-B-12-E9-42-D8-A11-C-FA3-C665-B140-E.png";
                    }}
                  />
                </div>
              </div>

              {/* Texto explicativo DEBAJO de la imagen */}
              <div className="pt-3 pb-3 pl-4 pr-2 sm:pl-6 sm:pr-3 w-full text-left">
                <p className="text-[21px] text-[#333333] font-medium font-geist leading-tight">
                  Toda la ropa que quepa por <span className="text-[#0f55d8] font-bold">$95</span>
                </p>
                {/* Enlace "Más información" subrayado en la siguiente línea dentro de la tarjeta */}
                <div className="mt-7 text-right">
                  <button
                    type="button"
                    onClick={() => setIsPriceInfoModalOpen(true)}
                    className="font-geist text-[15px] sm:text-[16px] font-semibold text-black underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer select-none"
                  >
                    Más información
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full px-0 pt-0 flex flex-col justify-between pb-8 sm:pb-12 bg-[#fdf0d5] snap-start snap-always min-h-[calc(100dvh-56px)] min-h-[calc(100svh-56px)]" id="editorial-location-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans">
          
          {/* Header directly in the layout, matching Empieza hoy title container */}
          <div className="w-full text-center pt-2 pb-3 select-none px-4" id="location-editorial-head">
            <h1 className="text-center text-[26px] text-[#333333] font-semibold font-geist">
              Visítanos
            </h1>
            <p className="text-center text-[26px] text-[#333333] font-semibold font-geist -mt-[3px]">
              con tu cesto listo
            </p>
          </div>

          {/* Tarjeta de Recepción - Blanca del mismo tamaño y estilo exacto que la tarjeta Empieza hoy */}
          <div className="px-0 sm:px-0 mt-2.5 w-full relative">
            <FloatingBadge text="Cerca de ti" position="top-right" />
            <div 
              className="w-full rounded-lg overflow-hidden flex flex-col bg-white" 
              id="recepcion-landing-card"
            >
              {/* Texto explicativo ARRIBA del mapa */}
              <div className="pt-5 pb-1 px-6 w-full text-left">
                <div>
                  <p className="text-[22px] text-[#333333] font-medium font-geist leading-tight">
                    Dejas tu ropa sucia
                  </p>
                  <p className="font-geist text-[#333333] text-[21px] font-medium leading-tight -mt-0.5 whitespace-nowrap">
                    <span className="text-[#0f55d8] font-semibold">sin esperar</span>
                  </p>
                </div>
              </div>

              {/* Contenedor con Mapa con su tamaño original h-[270px] */}
              <div className="w-full h-[270px] flex flex-col pt-2">
                <div className="relative w-full flex-1 select-none overflow-visible bg-transparent flex items-center justify-center px-2.5">
                  <a 
                    href="https://www.google.com/maps/place/Paseo+de+las+Palmas+209,+Coatzacoalcos,+Veracruz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full rounded-md overflow-visible bg-[#f4f5f5] border border-gray-300 flex items-center justify-center font-sans tracking-tight block cursor-pointer hover:opacity-95 transition-opacity" 
                    id="location-dynamic-map-frame-container"
                  >
                    {/* Inner map canvas container to keep streets & markers clipped to map rounded corners */}
                    <div className="absolute inset-0 rounded-md overflow-hidden bg-[#f4f5f5]">
                      {/* Streets & Roads Layer */}
                      {/* Paseo de las palmas */}
                      <div className="absolute top-[-20%] bottom-[40%] left-[48%] w-[32px] bg-[#cbcfdb] z-0">
                         <span translate="no" className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-[#495464] text-[10px] font-semibold tracking-wide notranslate">Paseo de las Palmas</span>
                      </div>
                      
                      {/* Avestruces */}
                      <div className="absolute top-[-20%] bottom-[-20%] right-0 w-[32px] bg-[#cbcfdb] z-0">
                        <span translate="no" className="absolute top-[31.4%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-[#495464] text-[10px] font-semibold tracking-wide notranslate">Avestruces</span>
                      </div>

                      {/* Middle horizontal street - Río Calzadas (colinda con Paseo de las Palmas) */}
                      <div className="absolute bottom-[40%] -left-10 right-0 h-[32px] bg-[#cbcfdb] z-0 flex items-center">
                         <span translate="no" className="absolute left-[38%] top-1/2 -translate-y-1/2 text-[#495464] text-[10px] font-semibold tracking-wide whitespace-nowrap notranslate">Río Calzadas</span>
                         <ArrowRight className="absolute right-12 top-1/2 -translate-y-1/2 text-[#6e7682] w-3.5 h-3.5 rotate-180" />
                      </div>
                      
                      {/* Bottom horizontal street (Calle del Oxxo) - Río Calzadas */}
                      <div className="absolute bottom-[15%] -left-10 right-0 h-[32px] bg-[#cbcfdb] z-0 flex items-center">
                         <span translate="no" className="absolute left-[20%] top-1/2 -translate-y-1/2 text-[#495464] text-[10px] font-semibold tracking-wide whitespace-nowrap notranslate">Río Calzadas</span>
                         <ArrowRight className="absolute left-[47%] top-1/2 -translate-y-1/2 text-[#6e7682] w-3.5 h-3.5" />
                      </div>
                      
                      {/* Conexión de calles izquierda */}
                      <div className="absolute bottom-[15%] -left-6 w-[50px] h-[30%] bg-[#cbcfdb] z-0"></div>

                      {/* Markers & Labels */}
                      
                      {/* Red Pin - Positioned at left-[38%] to keep the blue circle near but not touching the street text */}
                      <div className="absolute top-[19%] left-[38%] z-20 cursor-pointer flex flex-col items-center">
                        {/* Attached label positioned to the left without affecting the marker's position */}
                        <div className="absolute right-[100%] pr-1.5 top-[2px] flex flex-col text-right leading-tight whitespace-nowrap font-geist">
                          <span translate="no" className="text-[#333333] text-[15px] sm:text-[16px] font-semibold tracking-tight notranslate">Punto de</span>
                          <span translate="no" className="text-[#333333] text-[15px] sm:text-[16px] font-semibold tracking-tight notranslate">recepción</span>
                        </div>
                        <div className="relative origin-bottom flex items-center justify-center w-[38px] h-[38px]">
                          {/* Circle enclosing the pin marker */}
                          <div className="absolute -inset-0.5 border-2 border-[#0f55d8] bg-[#0f55d8]/10 rounded-full pointer-events-none"></div>
                          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm relative z-10">
                            <defs>
                              <mask id="google-pin-cutout">
                                <rect width="24" height="24" fill="white" />
                                <circle cx="12" cy="9" r="2.8" fill="black" />
                              </mask>
                            </defs>
                            <path 
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                              fill="#ea4335" 
                              mask="url(#google-pin-cutout)"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Ferreteria */}
                      <div className="absolute bottom-[50%] left-[65%] flex flex-col items-center z-10 transition-transform cursor-pointer">
                        <span translate="no" className="text-black text-[12px] font-medium tracking-tight notranslate mb-0.5">Ferretería</span>
                        <div className="w-[22px] h-[22px] bg-[#9ca3af] rounded-full flex items-center justify-center text-white border-2 border-white">
                          <div className="w-[6px] h-[6px] bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* OXXO Santa Isabel */}
                      <div className="absolute bottom-[3%] right-[15%] flex flex-col items-center z-10 transition-transform cursor-pointer">
                        <div className="bg-white w-[34px] h-[22px] rounded-[2px] border-2 border-white shadow-sm flex items-center justify-center mb-1 overflow-hidden">
                          <img src="https://upload.wikimedia.org/wikipedia/en/4/40/OXXO_logo.svg" alt="OXXO" className="w-full h-full object-contain" />
                        </div>
                        <span translate="no" className="text-black text-[12px] font-medium whitespace-nowrap tracking-tight notranslate">OXXO Santa Isabel</span>
                      </div>
                    </div>

                    {/* Botón Abrir mapa ubicado en la esquina inferior izquierda sobresaliendo del mapa */}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigationAndGPS();
                      }}
                      disabled={isNavigatingGPS}
                      className="absolute bottom-[-19px] left-[-4px] sm:left-[-2px] z-30 h-[38px] px-5 bg-[#0f55d8] text-white rounded-full font-semibold text-[16px] font-geist flex items-center justify-center gap-1.5 select-none cursor-pointer disabled:opacity-85 transition-colors whitespace-nowrap border border-white/50 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.65)]"
                      id="location-cta-navigation-button"
                    >
                      {isNavigatingGPS ? (
                        <span>Conectando...</span>
                      ) : (
                        <span>Abrir mapa</span>
                      )}
                    </button>
                  </a>
                </div>
              </div>

              {/* Texto explicativo DEBAJO del mapa */}
              <div className="pt-9 pb-6 px-6 w-full text-left">
                <p className="text-[22px] text-[#333333] font-medium font-geist leading-tight">
                  Te la entregamos limpia en casa&nbsp;&nbsp;
                  <span className="text-[#0f55d8] font-semibold">sin costo</span>
                </p>

                {isNavigatingGPS && gpsLoadingStep && (
                  <div className="mt-3 w-full max-w-[280px] p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-center text-xs text-[#0f55d8] font-bold flex items-center justify-center gap-2 select-none">
                    <span className="w-2 h-2 rounded-full bg-[#0f55d8] animate-pulse" />
                    <span>{gpsLoadingStep}</span>
                  </div>
                )}

                {geoError && (
                  <div className="mt-3 w-full max-w-[280px] p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-left text-[11.5px] text-rose-600 font-semibold leading-relaxed" id="gps-status-error">
                    ⚠️ {geoError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nueva Sección: Servicios adicionales */}
      <section className="w-full px-0 pt-0 flex flex-col justify-between pb-0 bg-[#fdf0d5] snap-start snap-always min-h-[calc(100dvh-56px)] min-h-[calc(100svh-56px)]" id="servicios-adicionales-section" style={{ scrollSnapAlign: 'start', minHeight: 'calc(100dvh - 56px)' }}>
        <div className="w-full max-w-sm mx-auto text-left flex flex-col justify-between flex-1 h-full">
          
          <div>
            <div className="w-full text-center pt-2 pb-[18px] select-none px-4" id="soluciones-title-container">
              <h2 className="text-center text-[26px] text-[#333333] font-semibold font-geist">
                Adicionales
              </h2>
            </div>

            <div 
              role="region" 
              aria-roledescription="carousel"
              className="px-0 sm:px-0 mt-3 w-full"
            >
              <div 
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-0 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {/* Slide 1 - Urgente */}
                <div role="group" aria-roledescription="slide" aria-label="1 of 3" className="w-full shrink-0 snap-center bg-white rounded-lg p-0 text-left relative overflow-hidden flex flex-col border border-gray-100/50 shadow-none">
                  <div className="flex items-center gap-4 p-4 pb-2">
                    <div className="shrink-0">
                      <div className="bg-[#0f55d8]/10 w-[64px] flex justify-center py-2 rounded-full">
                        <span className="font-geist font-semibold text-[#0f55d8] text-[16px] sm:text-[18px] leading-none tracking-tight">
                          +$20
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-geist font-semibold text-[#333333] text-[16.5px] leading-snug mb-1.5">
                        Urgente
                      </h4>
                      <p className="font-geist text-[#333333] text-[14.5px] font-medium leading-snug">
                        Tu ropa limpia el mismo día.
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-1 w-full flex items-center justify-start gap-1.5">
                    <Info className="w-[14px] h-[14px] text-[#0f55d8] shrink-0" />
                    <span className="font-geist text-[#4b6a9b] text-[13px] font-medium leading-snug text-left">
                      Pídelo en recepción
                    </span>
                  </div>
                </div>

                {/* Slide 2 - Suavizante premium */}
                <div role="group" aria-roledescription="slide" aria-label="2 of 3" className="w-full shrink-0 snap-center bg-white rounded-lg p-0 text-left relative overflow-hidden flex flex-col border border-gray-100/50 shadow-none">
                  <div className="flex items-center gap-4 p-4 pb-2">
                    <div className="shrink-0">
                      <div className="bg-[#0f55d8]/10 w-[64px] flex justify-center py-2 rounded-full">
                        <span className="font-geist font-semibold text-[#0f55d8] text-[16px] sm:text-[18px] leading-none tracking-tight">
                          +$10
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-geist font-semibold text-[#333333] text-[16.5px] leading-snug mb-1.5">
                        Suavizante premium
                      </h4>
                      <p className="font-geist text-[#333333] text-[14.5px] font-medium leading-snug">
                        Aroma de larga duración.
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-1 w-full flex items-center justify-start gap-1.5">
                    <Info className="w-[14px] h-[14px] text-[#0f55d8] shrink-0" />
                    <span className="font-geist text-[#4b6a9b] text-[13px] font-medium leading-snug text-left">
                      Pídelo en recepción
                    </span>
                  </div>
                </div>

                {/* Slide 3 - Ropa de cama */}
                <div role="group" aria-roledescription="slide" aria-label="3 of 3" className="w-full shrink-0 snap-center bg-white rounded-lg p-0 text-left relative overflow-hidden flex flex-col border border-gray-100/50 shadow-none">
                  <div className="flex items-center gap-4 p-4 pb-2">
                    <div className="shrink-0">
                      <div className="bg-[#0f55d8]/10 w-[64px] flex justify-center py-2 rounded-full">
                        <span className="font-geist font-semibold text-[#0f55d8] text-[16px] sm:text-[18px] leading-none tracking-tight">
                          +$$$
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-geist font-semibold text-[#333333] text-[16.5px] leading-snug mb-1.5">
                        Ropa de cama
                      </h4>
                      <p className="font-geist text-[#333333] text-[14.5px] font-medium leading-snug">
                        Lavado de edredón, cobertor o sábana.
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-1 w-full flex items-center justify-start gap-1.5">
                    <Info className="w-[14px] h-[14px] text-[#0f55d8] shrink-0" />
                    <span className="font-geist text-[#4b6a9b] text-[13px] font-medium leading-snug text-left">
                      Entrégalo por separado
                    </span>
                  </div>
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-center gap-2.5 mt-2 pb-2">
                <button 
                  onClick={() => scrollToSlide(Math.max(0, currentSlide - 1))}
                  className="p-1 rounded-full bg-white border border-[#EDE9E0] text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  disabled={currentSlide === 0}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => scrollToSlide(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${currentSlide === i ? 'bg-[#0f55d8]' : 'bg-gray-300'}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => scrollToSlide(Math.min(2, currentSlide + 1))}
                  className="p-1 rounded-full bg-white border border-[#EDE9E0] text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  disabled={currentSlide === 2}
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Minimalista */}
          <footer className="w-full pt-1.5 pb-0 mt-auto border-t border-[#EDE9E0]/80 text-center text-[11px] font-geist select-none">
            <div className="max-w-sm mx-auto px-4 flex flex-col items-center justify-center gap-0 pb-0.5">
              <p className="font-medium text-gray-500 leading-tight">
                © {new Date().getFullYear()} Somos Lavandería. Todos los derechos reservados.
              </p>
              <button 
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-[#0f55d8] hover:underline font-semibold cursor-pointer transition-colors leading-tight py-0.5"
              >
                Políticas de privacidad
              </button>
            </div>
          </footer>

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
                <motion.div 
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
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm mt-4 select-none"
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
                         className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm mt-4 select-none"
                       >
                         Listo, ¡muchas gracias!
                       </button>
                    </>
                  )}
                </motion.div>
              ) : formStep === "verifying" ? (
                <motion.div
                  key="step-verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-center flex flex-col items-center justify-center w-full py-6 select-none"
                >
                  <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                    {/* Animated pulsing target ring representing the routing check */}
                    <div className="absolute inset-0 border-[2.5px] border-dashed border-[#0f55d8]/40 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
                    <div className="absolute inset-2 bg-[#0f55d8]/5 rounded-full" />
                    <MapPin className="w-8 h-8 text-[#0f55d8] relative z-10" />
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
                    <motion.div
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
                </motion.div>
              ) : (
                <motion.div
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
                      const currentStepNum = formStep === 2 ? 2 : 1;
                      const isActive = step <= currentStepNum;
                      return (
                        <button 
                          key={step}
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setDirection(step > currentStepNum ? "forward" : "backward");
                            setFormStep(step as 1 | 2);
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
                            <div className="h-full bg-[#0f55d8] rounded-full" style={{ width: isActive ? "100%" : "0%" }} />
                          </div>
                          <span className="sr-only">Paso {step}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Static Title/Subtitle block (does not slide) */}
                  <div className="pt-2 pb-1 shrink-0 select-none">
                    <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight leading-snug">
                      {(formStep === 1 || formStep !== 2) && "Tu cesto SOMOS te espera"}
                      {formStep === 2 && "Tu dirección de entrega"}
                    </h2>
                    <p className="text-gray-550 text-xs mt-0.5 font-semibold">
                      {(formStep === 1 || formStep !== 2) && "Pedirla toma menos de un minuto."}
                      {formStep === 2 && "Usaremos tu ubicación para llenarlo automáticamente"}
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
                        transform: formStep === 2 ? 'translateX(-50%)' : 'translateX(0%)',
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
                            className="w-full py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
                            <p className="text-red-500 text-[11px] font-bold text-center leading-tight bg-red-50 border border-red-100 py-1.5 px-3 rounded-lg">
                              {gpsAutofillError}
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Calle y número</label>
                              <div className="relative">
                                {gpsAutofillLoading ? (
                                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
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
 
                            <div className="space-y-1 relative">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Colonia</label>
                              <div className="relative">
                                {gpsAutofillLoading ? (
                                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
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
                                  onFocus={() => setShowColoniaSuggestions(true)}
                                  onChange={(e) => { 
                                    setAddressColonia(e.target.value); 
                                    setShowColoniaSuggestions(true);
                                    setFormError(null); 
                                    setGpsCoords(null); 
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      setShowColoniaSuggestions(false);
                                      submitStep2AndVerify(e);
                                    }
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                  placeholder=""
                                />
                              </div>

                              {/* Menu desplegable de sugerencias autocompletables */}
                              {showColoniaSuggestions && addressColonia.trim().length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-36 overflow-y-auto divide-y divide-slate-100">
                                  {ALL_COATZA_COLONIAS.filter(c => 
                                    c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                     .includes(addressColonia.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                                  ).slice(0, 5).map((col) => (
                                    <button
                                      key={col}
                                      type="button"
                                      onClick={() => {
                                        setAddressColonia(col);
                                        setShowColoniaSuggestions(false);
                                        setFormError(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0f55d8] flex items-center justify-between cursor-pointer transition-colors"
                                    >
                                      <span>Colonia {col}</span>
                                      <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 text-[#0f55d8]" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
 
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setFormError(null); setDirection("backward"); setFormStep(1); }}
                              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-sm font-geist shrink-0"
                            >
                              Atrás
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 py-2.5 rounded-xl bg-[#0f55d8] text-white font-extrabold text-[18px] font-geist disabled:opacity-50 flex items-center justify-center gap-1.5 border border-white/50 shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.65)]"
                            >
                              {loading ? <Loader2 className="w-4 h-4" /> : (
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
                </motion.div>
              )}
            
          </div>
        </div>
      </div>

      {/* Modal de Políticas de Privacidad */}
      {isPrivacyOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsPrivacyOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto space-y-4 text-left shadow-2xl relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="font-geist font-bold text-lg text-gray-900">Políticas de Privacidad</h3>
              <button 
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm font-geist text-gray-600 space-y-3 leading-relaxed">
              <p>
                En <strong>Somos Lavandería</strong>, valoramos y respetamos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos la información personal que nos proporcionas al utilizar nuestros servicios.
              </p>
              
              <h4 className="font-bold text-gray-800 text-sm pt-1">1. Información recopilada</h4>
              <p>
                Recopilamos información básica como tu nombre, número de teléfono, dirección de entrega y preferencias de servicio únicamente para procesar y entregar tus pedidos de lavandería.
              </p>

              <h4 className="font-bold text-gray-800 text-sm pt-1">2. Uso de la información</h4>
              <p>
                Tus datos son utilizados exclusivamente para la coordinación de la recolección y entrega de tu cesto, comunicación sobre el estado de tu ropa y mejoras en el servicio. No vendemos ni compartimos tu información personal con terceros.
              </p>

              <h4 className="font-bold text-gray-800 text-sm pt-1">3. Seguridad de los datos</h4>
              <p>
                Implementamos medidas de seguridad técnicas y administrativas para proteger tus datos contra acceso no autorizado, alteración o divulgación.
              </p>

              <h4 className="font-bold text-gray-800 text-sm pt-1">4. Tus derechos</h4>
              <p>
                Puedes solicitar el acceso, rectificación o eliminación de tus datos personales en cualquier momento poniéndote en contacto con nosotros a través de nuestros canales oficiales de atención.
              </p>
            </div>

            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="w-full py-2.5 bg-[#0f55d8] text-white font-semibold rounded-xl text-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Información de Precio / Modelo por Cesto */}
      {isPriceInfoModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setIsPriceInfoModalOpen(false)}
        >
          <div 
            className="bg-white rounded-t-2xl sm:rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto text-left shadow-2xl relative z-[101] border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsPriceInfoModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Content */}
            <div className="font-geist text-gray-700 space-y-3.5 pt-1 text-[14px] leading-relaxed">
              {/* Especificaciones del cesto / Capacidad y tamaño */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#333333] text-[14px] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#0f55d8]" />
                  Especificaciones del cesto
                </h4>
                <div className="space-y-2.5 text-[13px] text-slate-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Capacidad aproximada:</strong> 8 a 10 kg de ropa de uso diario (~30 a 35 prendas).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Volumen y tamaño:</strong> ~50 Litros (55 cm × 38 cm × 32 cm).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Límite de llenado:</strong> Toda la ropa debe colocarse dentro del cesto de forma razonable sin desbordar el borde superior.</span>
                  </div>
                </div>
              </div>

              {/* Condiciones y restricciones */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <h4 className="font-bold text-[#333333] text-[14px]">Condiciones de uso</h4>
                <div className="space-y-2.5 text-[13px] text-slate-600">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Ropa de uso diario:</strong> Incluye playeras, pantalones, ropa interior, toallas y prendas personales.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#0f55d8] shrink-0 mt-0.5" />
                    <span><strong>Piezas especiales:</strong> Edredones, cobertores o ropa de cama voluminosa se cobran por separado.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent Safari rubber-band snap glitch on the last section */}
      <div className="h-0 w-full shrink-0 bg-transparent snap-end" style={{ scrollSnapAlign: 'end' }} />
    </div>
  );
}

