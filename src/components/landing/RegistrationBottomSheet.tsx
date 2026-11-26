import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  Info,
  CheckCircle2,
  MapPin,
  CheckCircle,
  Loader2,
  User,
  ArrowRight,
  Phone,
  Check,
} from 'lucide-react';
import { ALL_COATZA_COLONIAS, normalizeText } from '../../utils/distance';
import {
  dismissKeyboard,
  useBodyScrollLock,
  useKeyboardSheetOffset,
} from '../../utils/keyboard';

interface RegistrationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formError: string | null;
  setFormError: (err: string | null) => void;
  registered: boolean;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  addressCalle: string;
  setAddressCalle: (calle: string) => void;
  addressColonia: string;
  setAddressColonia: (col: string) => void;
  preferredTime?: string;
  formStep: 1 | 2 | 3 | 'verifying';
  setFormStep: (step: 1 | 2 | 3 | 'verifying') => void;
  verificationProgress: number;
  calculatedDistance: number;
  loading: boolean;
  isPhoneError: boolean;
  handlePhoneBlur: () => void;
  goToStep2: (e: React.FormEvent) => void;
  goToStep3: (e: React.FormEvent) => void;
  submitStep3AndVerify: (e: React.FormEvent) => void;
  gpsAutofillLoading: boolean;
  gpsAutofillError: string | null;
  handleAddressInputClick: () => void;
  showColoniaSuggestions: boolean;
  setShowColoniaSuggestions: (show: boolean) => void;
  setGpsCoords: (coords: { lat: number; lon: number } | null) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  phoneInputRef: React.RefObject<HTMLInputElement | null>;
  calleInputRef: React.RefObject<HTMLInputElement | null>;
  step1Ref: React.RefObject<HTMLDivElement | null>;
  step2Ref: React.RefObject<HTMLDivElement | null>;
  step3Ref: React.RefObject<HTMLDivElement | null>;
  sliderHeight: number | string;
}

export const RegistrationBottomSheet: React.FC<RegistrationBottomSheetProps> = ({
  isOpen,
  onClose,
  formError,
  setFormError,
  registered,
  name,
  setName,
  phone,
  setPhone,
  addressCalle,
  setAddressCalle,
  addressColonia,
  setAddressColonia,
  preferredTime,
  formStep,
  setFormStep,
  verificationProgress,
  calculatedDistance,
  loading,
  isPhoneError,
  handlePhoneBlur,
  goToStep2,
  goToStep3,
  submitStep3AndVerify,
  gpsAutofillLoading,
  gpsAutofillError,
  handleAddressInputClick,
  showColoniaSuggestions,
  setShowColoniaSuggestions,
  setGpsCoords,
  viewportRef,
  nameInputRef,
  phoneInputRef,
  calleInputRef,
  step1Ref,
  step2Ref,
  step3Ref,
  sliderHeight,
}) => {
  const overlayPointerDownRef = useRef(false);
  const kbLayerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);
  useKeyboardSheetOffset(isOpen, kbLayerRef, sheetRef);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Bottom Sheet sliding panel modal - High Performance pure CSS */}
      <div
        className="form-overlay"
        data-open={isOpen ? 'true' : 'false'}
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          overlayPointerDownRef.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (!overlayPointerDownRef.current || e.target !== e.currentTarget) return;
          overlayPointerDownRef.current = false;
          onClose();
          dismissKeyboard();
        }}
      />

      <div ref={kbLayerRef} className="form-sheet-kb-layer">
        <div
          ref={sheetRef}
          className="form-bottom-sheet pt-4 px-6"
          data-open={isOpen ? 'true' : 'false'}
          id="bottom-sheet-container"
          onClick={(e) => {
            e.stopPropagation();
            const target = e.target as HTMLElement | null;
            if (
              target &&
              !target.closest('input, textarea, button, a, label, [role="button"], [role="radio"]')
            ) {
              dismissKeyboard();
            }
          }}
        >
        {/* Visual drag indicator */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-1 shrink-0" />

        {/* Close Button X on top-right */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onClose();
            dismissKeyboard();
          }}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-50 transition-colors rounded-full pointer-events-auto cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable inner content area with overscroll-behavior: contain */}
        <div className="form-sheet-scroll w-full relative mt-3">
          <div className="form-content-inner w-full flex flex-col">
            {formError && (
              <div className="mb-2.5 p-2 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold flex items-center gap-2 select-none shrink-0 z-20">
                <Info className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <span className="leading-tight">{formError}</span>
              </div>
            )}
            {registered ? (() => {
              const firstName = name.trim().split(/\s+/)[0] || '';
              const digits = phone.replace(/\D/g, '');
              const formattedPhone =
                digits.length === 10
                  ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
                  : phone;

              const formattedDeliveryDay = (() => {
                if (!preferredTime) return '';
                const trimmed = preferredTime.trim();
                const todayMatch = trimmed.match(/^HOY\s*\((.+)\)$/i);
                if (todayMatch) return `Hoy · ${todayMatch[1]}`;
                const tomorrowMatch = trimmed.match(/^MAÑANA\s*\((.+)\)$/i);
                if (tomorrowMatch) return `Mañana · ${tomorrowMatch[1]}`;
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              })();

              const cleanCalle = addressCalle?.trim() || '';
              const cleanColonia = addressColonia?.trim() || '';
              const formattedAddress =
                !cleanColonia || cleanCalle.toLowerCase() === cleanColonia.toLowerCase()
                  ? cleanCalle || cleanColonia
                  : `${cleanCalle}, ${cleanColonia}`;

              return (
                <motion.div
                  key="step-registered"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-center flex flex-col items-center justify-center w-full pt-2 pb-1 font-geist"
                >
                  <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shrink-0">
                    <CheckCircle2 className="w-5.5 h-5.5" />
                  </div>

                  <h2 className="text-[20px] font-bold text-slate-900 tracking-tight mb-1.5 text-balance">
                    {firstName ? `¡Todo listo, ${firstName}!` : '¡Todo listo!'}
                  </h2>

                  <p className="text-slate-500 text-[13.5px] leading-relaxed max-w-[320px] mb-4">
                    Tu cesto ya está listo. Nos pondremos en contacto contigo al{' '}
                    <span className="font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                      {formattedPhone}
                    </span>{' '}
                    para coordinar la entrega.
                  </p>

                  <div className="w-full rounded-2xl bg-slate-50 border border-slate-200/80 divide-y divide-slate-200/70 text-left">
                    {formattedDeliveryDay && (
                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 shrink-0">Día de entrega</span>
                        <span className="text-xs font-semibold text-slate-800 text-right">
                          {formattedDeliveryDay}
                        </span>
                      </div>
                    )}

                    <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-500 shrink-0">Contacto</span>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums text-right">
                        {formattedPhone}
                      </span>
                    </div>

                    {formattedAddress && (
                      <div className="px-3.5 py-2.5 flex items-start justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 shrink-0">Dirección</span>
                        <span className="text-xs font-semibold text-slate-800 text-right leading-snug">
                          {formattedAddress}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] active:scale-[0.99] text-white font-extrabold text-base mt-4 transition-all duration-150 cursor-pointer select-none"
                  >
                    Entendido
                  </button>
                </motion.div>
              );
            })() : formStep === 'verifying' ? (
              <motion.div
                key="step-verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="text-center flex flex-col items-center justify-center w-full py-6 select-none"
              >
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                  <div
                    className="absolute inset-0 border-[2.5px] border-dashed border-[#0f55d8]/40 rounded-full animate-spin"
                    style={{ animationDuration: '10s' }}
                  />
                  <div className="absolute inset-2 bg-[#0f55d8]/5 rounded-full" />
                  <MapPin className="w-8 h-8 text-[#0f55d8] relative z-10" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5 font-geist">
                  Verificando Cobertura
                </h3>
                <p className="text-gray-400 text-[19px] font-semibold uppercase tracking-wider mb-5">
                  Análisis de Ruta en Tiempo Real
                </p>

                <div className="w-full max-w-sm space-y-3 bg-slate-50 border rounded-xl p-4 text-left font-geist">
                  <div className="flex items-center gap-3">
                    {verificationProgress >= 1 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <p
                      className={`text-xs font-semibold ${
                        verificationProgress >= 1 ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      Geolocalizando dirección ({addressColonia})...
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {verificationProgress >= 2 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : verificationProgress === 1 ? (
                      <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <p
                      className={`text-xs font-semibold ${
                        verificationProgress >= 2
                          ? 'text-emerald-700'
                          : verificationProgress === 1
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      Trazando ruta óptima y vías de acceso...
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {verificationProgress >= 3 ? (
                      <CheckCircle className="w-4 h-4 text-[#0f55d8] shrink-0" />
                    ) : verificationProgress === 2 ? (
                      <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <p
                      className={`text-xs font-semibold ${
                        verificationProgress >= 3
                          ? 'text-emerald-700'
                          : verificationProgress === 2
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {verificationProgress >= 3
                        ? `Distancia de traslado calculada: ~${calculatedDistance.toFixed(1)} km`
                        : 'Estimando distancia de traslado...'}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-6 max-w-sm">
                  <motion.div
                    className="bg-[#0f55d8] h-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width:
                        verificationProgress === 0
                          ? '15%'
                          : verificationProgress === 1
                          ? '45%'
                          : verificationProgress === 2
                          ? '75%'
                          : '100%',
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
                transition={{ duration: 0.15 }}
                className="w-full relative flex flex-col"
              >
                {/* Segmented Progress Indicator */}
                <div className="flex gap-2 shrink-0 justify-center mb-1">
                  {[1, 2, 3].map((step) => {
                    const isActive = step <= formStep;
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setFormStep(step as 1 | 2 | 3);
                          requestAnimationFrame(() => {
                            if (step === 1) nameInputRef.current?.focus({ preventScroll: true });
                            else if (step === 2) phoneInputRef.current?.focus({ preventScroll: true });
                            else if (step === 3) calleInputRef.current?.focus({ preventScroll: true });
                            if (viewportRef.current) viewportRef.current.scrollLeft = 0;
                          });
                        }}
                        className="h-5 flex-1 relative group focus:outline-none pointer-events-auto cursor-pointer flex items-center"
                        title={`Ir al Paso ${step}`}
                      >
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden group-hover:bg-slate-300 transition-colors">
                          <div
                            className="h-full bg-[#0f55d8] rounded-full transition-all duration-300"
                            style={{ width: isActive ? '100%' : '0%' }}
                          />
                        </div>
                        <span className="sr-only">Paso {step}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Static Title/Subtitle block */}
                <div className="pt-2 pb-1 shrink-0 select-none">
                  <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight leading-snug flex items-center gap-1.5">
                    {formStep === 1 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="animate-sheet-wave select-none">👋</span>
                        <span className="animate-sheet-grin select-none">😁</span>
                        <span>¿Cuál es tu nombre?</span>
                      </span>
                    )}
                    {formStep === 2 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="animate-sheet-ring select-none">📱</span>
                        <span>¿Tu número de teléfono?</span>
                      </span>
                    )}
                    {formStep === 3 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="animate-sheet-bounce select-none">📍</span>
                        <span>¿Dónde te lo entregamos?</span>
                      </span>
                    )}
                  </h2>
                </div>

                {/* Slider viewport */}
                <div
                  ref={viewportRef}
                  onScroll={(e) => {
                    e.currentTarget.scrollLeft = 0;
                  }}
                  className="w-full overflow-hidden relative mt-3"
                  style={{
                    height: typeof sliderHeight === 'number' ? `${sliderHeight}px` : sliderHeight,
                    transition: 'height 250ms ease',
                  }}
                >
                  <div
                    className="w-full flex transform-gpu"
                    style={{
                      transform:
                        formStep === 2 ? 'translateX(-100%)' : formStep === 3 ? 'translateX(-200%)' : 'translateX(0%)',
                      transition: 'transform 300ms cubic-bezier(0.32, 0.94, 0.6, 1)',
                    }}
                  >
                    {/* Paso 1: Nombre Completo */}
                    <div
                      ref={step1Ref}
                      className={`w-full shrink-0 px-0.5 transition-opacity duration-200 ${
                        formStep !== 1 ? 'pointer-events-none opacity-40 select-none' : 'opacity-100'
                      }`}
                      aria-hidden={formStep !== 1}
                    >
                      <form noValidate onSubmit={goToStep2} className="space-y-4 flex flex-col">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5 select-none">
                              Nombre Completo
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                ref={nameInputRef}
                                type="text"
                                required
                                autoComplete="name"
                                tabIndex={formStep === 1 ? 0 : -1}
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  setFormError(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    goToStep2(e);
                                  }
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-[16px] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 select-text"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          tabIndex={formStep === 1 ? 0 : -1}
                          onMouseDown={(e) => e.preventDefault()}
                          className="w-full py-2 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-base flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                          <span className="font-geist">Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                    {/* Paso 2: Teléfono */}
                    <div
                      ref={step2Ref}
                      className={`w-full shrink-0 px-0.5 transition-opacity duration-200 ${
                        formStep !== 2 ? 'pointer-events-none opacity-40 select-none' : 'opacity-100'
                      }`}
                      aria-hidden={formStep !== 2}
                    >
                      <form noValidate onSubmit={goToStep3} className="space-y-4 flex flex-col">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center ml-0.5 select-none">
                              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                WhatsApp
                              </label>
                              <span
                                className={`text-[11px] font-semibold tracking-wider transition-colors font-geist ${
                                  phone.length === 10
                                    ? 'text-emerald-600 font-bold'
                                    : phone.length > 10
                                    ? 'text-red-600 font-bold'
                                    : 'text-gray-400'
                                }`}
                              >
                                {phone.length}/10
                              </span>
                            </div>
                            <div className="relative">
                              <Phone
                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
                                  isPhoneError ? 'text-red-500' : 'text-slate-400'
                                }`}
                              />
                              <input
                                ref={phoneInputRef}
                                type="tel"
                                inputMode="tel"
                                required
                                autoComplete="tel-national"
                                tabIndex={formStep === 2 ? 0 : -1}
                                value={phone}
                                onChange={(e) => {
                                  const trimmed = e.target.value.trim();
                                  let digits = trimmed.replace(/\D/g, '');

                                  if (trimmed.startsWith('+52')) {
                                    digits = trimmed.slice(3).replace(/\D/g, '');
                                    if (digits.length === 11 && digits.startsWith('1')) {
                                      digits = digits.slice(1);
                                    }
                                  } else if (trimmed.startsWith('0052')) {
                                    digits = trimmed.slice(4).replace(/\D/g, '');
                                    if (digits.length === 11 && digits.startsWith('1')) {
                                      digits = digits.slice(1);
                                    }
                                  } else if (digits.length === 12 && digits.startsWith('52')) {
                                    digits = digits.slice(2);
                                  } else if (digits.length === 13 && digits.startsWith('521')) {
                                    digits = digits.slice(3);
                                  }

                                  setPhone(digits.slice(0, 10));
                                  setFormError(null);
                                }}
                                onBlur={handlePhoneBlur}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    goToStep3(e);
                                  }
                                }}
                                className={`w-full pl-9 pr-4 py-2 rounded-xl outline-none font-semibold text-[16px] focus:ring-2 select-text ${
                                  isPhoneError
                                    ? 'bg-red-50/30 border border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100'
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white focus:ring-blue-100 placeholder:text-slate-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          tabIndex={formStep === 2 ? 0 : -1}
                          onMouseDown={(e) => e.preventDefault()}
                          className="w-full py-2 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-base flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                          <span className="font-geist">Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                    {/* Paso 3: Dirección */}
                    <div
                      ref={step3Ref}
                      className={`w-full shrink-0 px-0.5 transition-opacity duration-200 ${
                        formStep !== 3 ? 'pointer-events-none opacity-40 select-none' : 'opacity-100'
                      }`}
                      aria-hidden={formStep !== 3}
                    >
                      <form noValidate onSubmit={submitStep3AndVerify} className="space-y-4 flex flex-col">
                        {gpsAutofillError && (
                          <p className="text-red-500 text-[11px] font-bold text-center leading-tight bg-red-50 border border-red-100 py-1.5 px-3 rounded-lg select-none">
                            {gpsAutofillError}
                          </p>
                        )}

                        <div className="space-y-3">
                          <div className="space-y-1 relative">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">
                              Dirección
                            </label>
                            <div className="relative">
                              {gpsAutofillLoading ? (
                                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin pointer-events-none" />
                              ) : (
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              )}
                              <input
                                ref={calleInputRef}
                                type="text"
                                required
                                autoComplete="street-address"
                                tabIndex={formStep === 3 ? 0 : -1}
                                value={addressCalle}
                                onClick={handleAddressInputClick}
                                onFocus={() => {
                                  setShowColoniaSuggestions(true);
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAddressCalle(val);
                                  setAddressColonia(val);
                                  setShowColoniaSuggestions(true);
                                  setFormError(null);
                                  setGpsCoords(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setShowColoniaSuggestions(false);
                                    submitStep3AndVerify(e);
                                  }
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl outline-none font-semibold text-[16px] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                placeholder="Compartir ubicación"
                              />
                            </div>

                            {/* Dropdown de colonias */}
                            {showColoniaSuggestions &&
                              addressCalle.trim().length > 0 &&
                              (() => {
                                const normalizedInput = normalizeText(addressCalle);
                                const matches = ALL_COATZA_COLONIAS.filter((c) =>
                                  normalizeText(c).includes(normalizedInput)
                                ).slice(0, 5);

                                if (matches.length === 0) return null;

                                return (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-36 overflow-y-auto divide-y divide-slate-100">
                                    {matches.map((col) => (
                                      <button
                                        key={col}
                                        type="button"
                                        onClick={() => {
                                          const newAddr = addressCalle.toLowerCase().includes(col.toLowerCase())
                                            ? addressCalle
                                            : `${addressCalle}, ${col}`;
                                          setAddressCalle(newAddr);
                                          setAddressColonia(col);
                                          setShowColoniaSuggestions(false);
                                          setFormError(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0f55d8] flex items-center justify-between cursor-pointer transition-colors select-none"
                                      >
                                        <span>Colonia {col}</span>
                                        <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 text-[#0f55d8]" />
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          tabIndex={formStep === 3 ? 0 : -1}
                          className="w-full py-2 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-base flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span className="font-geist">Terminar</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>,
    document.body
  );
};
