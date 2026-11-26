import { useState, useContext, useRef, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleContext } from '../App';
import { db } from '../firebase';
import { collection, doc, getDocs, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { getColoniaDistance, asyncGetColoniaDistance } from '../utils/distance';
import { dismissKeyboard } from '../utils/keyboard';

// Modular Landing Subcomponents
import { HeroSection } from '../components/landing/HeroSection';
import { FeatureCardsSection } from '../components/landing/FeatureCardsSection';
import { RegistrationBottomSheet } from '../components/landing/RegistrationBottomSheet';

export default function Landing() {
  const { role, setRole } = useContext(RoleContext);
  const navigate = useNavigate();

  // Long press for Associate / Admin login access
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const handleNavbarPointerDown = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (role !== 'associate' && role !== 'admin') {
        navigate('/login');
      }
    }, 1500);
  };

  const handleNavbarPointerUpOrLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleNavbarClick = () => {
    if (isLongPressRef.current) return;
    const container = document.querySelector('.overflow-y-auto');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // State: User Data & Registration Flow
  const [name, setName] = useState(() => localStorage.getItem('user_name') || '');
  const [phone, setPhone] = useState(() => {
    const raw = localStorage.getItem('user_phone') || '';
    const trimmed = raw.trim();
    let digits = trimmed.replace(/\D/g, '');
    if (trimmed.startsWith('+52')) {
      digits = trimmed.slice(3).replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('52')) {
      digits = digits.slice(2);
    } else if (digits.length === 13 && digits.startsWith('521')) {
      digits = digits.slice(3);
    }
    return digits.slice(0, 10);
  });
  const [deliveryPreference, setDeliveryPreference] = useState(
    () => localStorage.getItem('user_delivery_preference') || ''
  );
  const [addressColonia, setAddressColonia] = useState(() => localStorage.getItem('user_address_colonia') || '');
  const [addressCalle, setAddressCalle] = useState(() => localStorage.getItem('user_address_calle') || '');
  const [preferredTime, setPreferredTime] = useState(() => localStorage.getItem('user_preferred_time') || '');

  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(() => localStorage.getItem('user_registered') === 'true');
  const [formStep, setFormStep] = useState<1 | 2 | 'verifying'>(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(() =>
    getColoniaDistance(addressColonia || '')
  );

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_phone', phone);
    localStorage.setItem('user_delivery_preference', deliveryPreference);
    localStorage.setItem('user_address_colonia', addressColonia);
    localStorage.setItem('user_address_calle', addressCalle);
    localStorage.setItem('user_preferred_time', preferredTime);
    localStorage.setItem('user_registered', registered ? 'true' : 'false');
  }, [name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, registered]);

  // GPS Autofill state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsAutofillLoading, setGpsAutofillLoading] = useState(false);
  const [gpsAutofillError, setGpsAutofillError] = useState<string | null>(null);
  const [showColoniaSuggestions, setShowColoniaSuggestions] = useState(false);

  const handleAddressInputClick = () => {
    if (!addressCalle.trim() && !gpsAutofillLoading) {
      handleAutofillGPS();
    }
  };

  const handleAutofillGPS = () => {
    if (!navigator.geolocation) {
      setGpsAutofillError('Tu dispositivo o navegador no soporta geolocalización directa.');
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
            console.warn('Server proxy failed, trying direct client-side geocoding:', err);
          }

          // 2. Direct client-side Google Maps API query
          if (!fetchSuccess) {
            const clientApiKey = 'AIzaSyAiAQXG7cEBvUFBOF5EW1p4HRzpq1_b-Cc';
            try {
              const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${clientApiKey}&language=es`;
              const response = await fetch(url);
              if (response.ok) {
                const gData = await response.json();
                if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
                  const firstResult = gData.results[0];
                  const components = firstResult.address_components || [];
                  let street_number = '';
                  let route = '';
                  let sublocality = '';
                  let neighborhood = '';

                  for (const comp of components) {
                    const types = comp.types || [];
                    if (types.includes('street_number')) street_number = comp.long_name;
                    else if (types.includes('route')) route = comp.long_name;
                    else if (types.includes('sublocality') || types.includes('sublocality_level_1'))
                      sublocality = comp.long_name;
                    else if (types.includes('neighborhood')) neighborhood = comp.long_name;
                  }

                  data = {
                    calle: route,
                    numero: street_number,
                    colonia: sublocality || neighborhood || 'Centro',
                    source: 'client-google',
                  };
                  fetchSuccess = true;
                }
              }
            } catch (clientErr) {
              console.error('Direct Google reverse geocode failed:', clientErr);
            }
          }

          // 3. Fallback to OpenStreetMap Nominatim
          if (!fetchSuccess) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                {
                  headers: {
                    'User-Agent': 'SomosLaundryApp/1.0 (oropezamaximiliano9@gmail.com)',
                  },
                }
              );
              if (response.ok) {
                const osmData = await response.json();
                let colonia = 'Centro';
                let calle = '';
                let numero = '';

                if (osmData.address) {
                  const addr = osmData.address;
                  colonia =
                    addr.suburb ||
                    addr.neighbourhood ||
                    addr.quarter ||
                    addr.residential ||
                    addr.village ||
                    'Centro';
                  calle = addr.road || '';
                  numero = addr.house_number || '';
                }
                data = { calle, numero, colonia, source: 'nominatim' };
                fetchSuccess = true;
              }
            } catch (err) {
              console.error('OSM direct fallback failed:', err);
            }
          }

          if (fetchSuccess && data) {
            let colonia = data.colonia || 'Centro';
            let calle = data.calle || '';
            let numero = data.numero || '';

            let calleYNum = calle;
            if (numero) calleYNum = `${calle} ${numero}`;

            if (
              !colonia ||
              colonia.toLowerCase() === 'coatzacoalcos' ||
              colonia.toLowerCase() === 'coatzacoalcos centro'
            ) {
              colonia = 'Centro';
            }

            const fullAddr = [calleYNum, colonia].filter(Boolean).join(', ');
            setAddressCalle(fullAddr || calleYNum || colonia);
            setAddressColonia(colonia || fullAddr);
            setFormError(null);
          } else {
            setGpsAutofillError('Error al obtener la dirección desde el servidor de mapas.');
          }
        } catch (err) {
          console.error('GPS Autofill error:', err);
          setGpsAutofillError('No se pudo conectar con el servicio de geocodificación.');
        } finally {
          setGpsAutofillLoading(false);
        }
      },
      (error) => {
        setGpsAutofillLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsAutofillError('Permiso de ubicación denegado. Por favor, actívalo en tu navegador.');
        } else {
          setGpsAutofillError('No se pudo obtener tu ubicación actual.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPhoneError = Boolean(formError?.toLowerCase().includes('teléfono'));

  // Input & slider refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const calleInputRef = useRef<HTMLInputElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const [sliderHeight, setSliderHeight] = useState<number | string>('auto');

  useEffect(() => {
    if (!isBottomSheetOpen) return;
    let observer: ResizeObserver | null = null;
    let rafId = 0;

    const attachObserver = () => {
      const activeRef = formStep === 1 ? step1Ref : step2Ref;
      const el = activeRef?.current;
      if (!el) {
        rafId = window.requestAnimationFrame(attachObserver);
        return;
      }
      const handleResize = () => {
        setSliderHeight(el.offsetHeight);
      };
      handleResize();
      observer = new ResizeObserver(handleResize);
      observer.observe(el);
    };

    attachObserver();
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [formStep, isBottomSheetOpen, registered]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
    }
    if (!isBottomSheetOpen) return;
    const timer = setTimeout(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollLeft = 0;
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [formStep, isBottomSheetOpen]);

  const openBottomSheet = () => {
    setIsBottomSheetOpen(true);
    setRegistered(false);
    setGpsAutofillError(null);

    if (phone.trim().length === 10) {
      setFormStep(2);
    } else {
      setFormStep(1);
    }

    setFormError(null);
  };

  const handlePhoneBlur = async () => {
    if (!phone || phone.length < 5) return;
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.name) setName(data.name);
        if (data.deliveryPreference) setDeliveryPreference(data.deliveryPreference);
        if (data.addressColonia) setAddressColonia(data.addressColonia);
        if (data.addressCalle) setAddressCalle(data.addressCalle);
        if (data.preferredTime) setPreferredTime(data.preferredTime);
      } else {
        throw new Error('Phone not found in DB');
      }
    } catch {
      try {
        const savedUsers = JSON.parse(localStorage.getItem('simulated_users') || '{}');
        const user = savedUsers[phone];
        if (user) {
          if (user.name) setName(user.name);
          if (user.deliveryPreference) setDeliveryPreference(user.deliveryPreference);
          if (user.addressColonia) setAddressColonia(user.addressColonia);
          if (user.addressCalle) setAddressCalle(user.addressCalle);
          if (user.preferredTime) setPreferredTime(user.preferredTime);
        }
      } catch {}
    }
  };

  const goToStep2 = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setGpsAutofillError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setFormError('Por favor ingresa tu teléfono.');
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (trimmedPhone.length !== 10) {
      setFormError('El número de teléfono debe tener exactamente 10 caracteres.');
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError('El número de teléfono no puede contener letras.');
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }

    setFormStep(2);
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
    }
    window.setTimeout(() => {
      calleInputRef.current?.focus({ preventScroll: true });
      if (viewportRef.current) viewportRef.current.scrollLeft = 0;
    }, 310);
  };

  const dbPreregister = async (distanceKmValue: number) => {
    const usersQuery = query(collection(db, 'users'), where('phone', '==', phone.trim()));
    const usersSnap = await getDocs(usersQuery);
    let userId: string;

    if (!usersSnap.empty) {
      const docSnap = usersSnap.docs[0];
      userId = docSnap.id;
      const existingUser = docSnap.data();

      const resolvedName = name || existingUser.name || '';
      const pref = deliveryPreference || existingUser.deliveryPreference || '';
      const col = addressColonia || existingUser.addressColonia || null;
      const calle = addressCalle || existingUser.addressCalle || null;
      const prefTime = preferredTime || existingUser.preferredTime || '';
      const distKm = distanceKmValue || (col ? getColoniaDistance(col) : existingUser.distanceKm || null);

      if (distKm) localStorage.setItem('user_distance_km', String(distKm));

      await updateDoc(doc(db, 'users', userId), {
        name: resolvedName,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        preferredTime: prefTime,
        distanceKm: distKm,
      });
    } else {
      userId = 'USR-' + Math.random().toString(36).substr(2, 9);
      const distKm = distanceKmValue || (addressColonia ? getColoniaDistance(addressColonia) : null);

      if (distKm) localStorage.setItem('user_distance_km', String(distKm));

      await setDoc(doc(db, 'users', userId), {
        id: userId,
        name: name || '',
        phone: phone.trim(),
        deliveryPreference,
        addressColonia: addressColonia || null,
        addressCalle: addressCalle || null,
        addressNumero: '',
        preferredTime,
        addressReferences: '',
        distanceKm: distKm,
        credits: 0.0,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const submitStep2AndVerify = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length !== 10 || /[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError('Por favor verifica tu número de teléfono.');
      setFormStep(1);
      window.setTimeout(() => phoneInputRef.current?.focus({ preventScroll: true }), 310);
      return;
    }

    const fullAddress = addressCalle.trim() || addressColonia.trim();
    if (!fullAddress) {
      setFormError('Por favor ingresa tu dirección.');
      calleInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (!addressCalle.trim()) setAddressCalle(fullAddress);
    if (!addressColonia.trim()) setAddressColonia(fullAddress);

    dismissKeyboard();
    setFormStep('verifying');
    setVerificationProgress(0);
    setLoading(true);

    let distance: number;
    try {
      distance = await asyncGetColoniaDistance(fullAddress, gpsCoords);
    } catch {
      distance = getColoniaDistance(fullAddress);
    }
    setCalculatedDistance(distance);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    setVerificationProgress(1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setVerificationProgress(2);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setVerificationProgress(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await dbPreregister(distance);
    } catch (err) {
      console.warn('API preregister fallback to client storage:', err);
    } finally {
      try {
        const distVal = distance || getColoniaDistance(fullAddress);
        const savedUsers = JSON.parse(localStorage.getItem('simulated_users') || '{}');
        savedUsers[phone] = {
          name,
          phone,
          deliveryPreference,
          addressColonia: fullAddress,
          addressCalle: fullAddress,
          preferredTime,
          distanceKm: distVal,
        };
        localStorage.setItem('simulated_users', JSON.stringify(savedUsers));
      } catch {}

      setRegistered(true);
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* 1. Primera pantalla: Hero sticky con fotografía y selector de fecha */}
      <HeroSection
        role={role}
        setRole={setRole}
        handleNavbarPointerDown={handleNavbarPointerDown}
        handleNavbarPointerUpOrLeave={handleNavbarPointerUpOrLeave}
        handleNavbarClick={handleNavbarClick}
        setPreferredTime={setPreferredTime}
        openBottomSheet={openBottomSheet}
      />

      {/* 2. Segunda pantalla: Tarjetas editoriales sobre el Hero */}
      <FeatureCardsSection
        role={role}
        setRole={setRole}
        handleNavbarPointerDown={handleNavbarPointerDown}
        handleNavbarPointerUpOrLeave={handleNavbarPointerUpOrLeave}
        handleNavbarClick={handleNavbarClick}
      />

      {/* 3. Bottom Sheet de Registro / Verificación */}
      <RegistrationBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => {
          dismissKeyboard();
          setIsBottomSheetOpen(false);
        }}
        formError={formError}
        setFormError={setFormError}
        registered={registered}
        name={name}
        phone={phone}
        setPhone={setPhone}
        addressCalle={addressCalle}
        setAddressCalle={setAddressCalle}
        addressColonia={addressColonia}
        setAddressColonia={setAddressColonia}
        preferredTime={preferredTime}
        formStep={formStep}
        setFormStep={setFormStep}
        verificationProgress={verificationProgress}
        calculatedDistance={calculatedDistance}
        loading={loading}
        isPhoneError={isPhoneError}
        handlePhoneBlur={handlePhoneBlur}
        goToStep2={goToStep2}
        submitStep2AndVerify={submitStep2AndVerify}
        gpsAutofillLoading={gpsAutofillLoading}
        gpsAutofillError={gpsAutofillError}
        handleAddressInputClick={handleAddressInputClick}
        showColoniaSuggestions={showColoniaSuggestions}
        setShowColoniaSuggestions={setShowColoniaSuggestions}
        setGpsCoords={setGpsCoords}
        viewportRef={viewportRef}
        phoneInputRef={phoneInputRef}
        calleInputRef={calleInputRef}
        step1Ref={step1Ref}
        step2Ref={step2Ref}
        sliderHeight={sliderHeight}
      />
    </div>
  );
}
