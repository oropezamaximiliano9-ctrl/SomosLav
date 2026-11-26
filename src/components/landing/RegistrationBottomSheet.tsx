import React from 'react';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import {
  X,
  Info,
  CheckCircle2,
  MapPin,
  CheckCircle,
  Loader2,
  ArrowRight,
  Phone,
  Check,
} from 'lucide-react';
import { ALL_COATZA_COLONIAS, normalizeText } from '../../utils/distance';

interface RegistrationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formError: string | null;
  setFormError: (err: string | null) => void;
  registered: boolean;
  name: string;
  phone: string;
  setPhone: (phone: string) => void;
  addressCalle: string;
  setAddressCalle: (calle: string) => void;
  addressColonia: string;
  setAddressColonia: (col: string) => void;
  preferredTime?: string;
  formStep: 1 | 2 | 'verifying';
  setFormStep: (step: 1 | 2 | 'verifying') => void;
  verificationProgress: number;
  calculatedDistance: number;
  loading: boolean;
  isPhoneError: boolean;
  handlePhoneBlur: () => void;
  goToStep2: (e: React.FormEvent) => void;
  submitStep2AndVerify: (e: React.FormEvent) => void;
  gpsAutofillLoading: boolean;
  gpsAutofillError: string | null;
  handleAddressInputClick: () => void;
  showColoniaSuggestions: boolean;
  setShowColoniaSuggestions: (show: boolean) => void;
  setGpsCoords: (coords: { lat: number; lon: number } | null) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  phoneInputRef: React.RefObject<HTMLInputElement | null>;
  calleInputRef: React.RefObject<HTMLInputElement | null>;
  step1Ref: React.RefObject<HTMLDivElement | null>;
  step2Ref: React.RefObject<HTMLDivElement | null>;
  sliderHeight: number | string;
}

export const RegistrationBottomSheet: React.FC<RegistrationBottomSheetProps> = ({
  isOpen,
  onClose,
  formError,
  setFormError,
  registered,
  name,
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
  submitStep2AndVerify,
  gpsAutofillLoading,
  gpsAutofillError,
  handleAddressInputClick,
  showColoniaSuggestions,
  setShowColoniaSuggestions,
  setGpsCoords,
  viewportRef,
  phoneInputRef,
  calleInputRef,
  step1Ref,
  step2Ref,
  sliderHeight,
}) => {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      repositionInputs={false}
      fixed={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Drawer.Content
          id="bottom-sheet-container"
          className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex h-auto max-h-[90dvh] w-full max-w-[440px] flex-col rounded-t-3xl bg-white pt-4 outline-none"
        >
          {/* Accessible title & description required by Vaul/Radix Dialog */}
          <Drawer.Title className="sr-only">
            {registered
              ? 'Registro completado'
              : formStep === 'verifying'
              ? 'Verificando cobertura'
              : formStep === 1
              ? '¿Cuál es tu número?'
              : '¿Dónde te lo entregamos?'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Ingresa tu WhatsApp y dirección para coordinar la entrega gratuita de tu cesto.
          </Drawer.Description>

          {/* Drag handle */}
          <div className="mx-auto mb-1 h-1 w-12 shrink-0 rounded-full bg-slate-200" aria-hidden="true" />

          {/* Close Button X on top-right */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Scrollable inner content area ONLY (not Drawer.Content) */}
          <div
            className="relative mt-3 min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-6"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="form-content-inner flex w-full flex-col">
              {formError && (
                <div className="z-20 mb-2.5 flex shrink-0 select-none items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-2 text-[11px] font-bold">
                  <Info className="h-4.5 w-4.5 shrink-0 text-red-500" />
                  <span className="leading-tight">{formError}</span>
                </div>
              )}

              {registered ? (
                (() => {
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
                      className="flex w-full flex-col items-center justify-center pb-1 pt-2 text-center font-geist"
                    >
                      <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-5.5 w-5.5" />
                      </div>

                      <h2 className="mb-1.5 text-balance text-[20px] font-bold tracking-tight text-slate-900">
                        {firstName ? `¡Todo listo, ${firstName}!` : '¡Todo listo!'}
                      </h2>

                      <p className="mb-4 max-w-[320px] text-[13.5px] leading-relaxed text-slate-500">
                        Tu cesto ya está listo. Nos pondremos en contacto contigo al{' '}
                        <span className="whitespace-nowrap font-semibold tabular-nums text-slate-800">
                          {formattedPhone}
                        </span>{' '}
                        para coordinar la entrega.
                      </p>

                      <div className="w-full divide-y divide-slate-200/70 rounded-2xl border border-slate-200/80 bg-slate-50 text-left">
                        {formattedDeliveryDay && (
                          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                            <span className="shrink-0 text-xs font-medium text-slate-500">Día de entrega</span>
                            <span className="text-right text-xs font-semibold text-slate-800">
                              {formattedDeliveryDay}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <span className="shrink-0 text-xs font-medium text-slate-500">Contacto</span>
                          <span className="text-right text-xs font-semibold tabular-nums text-slate-800">
                            {formattedPhone}
                          </span>
                        </div>

                        {formattedAddress && (
                          <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                            <span className="shrink-0 text-xs font-medium text-slate-500">Dirección</span>
                            <span className="text-right text-xs font-semibold leading-snug text-slate-800">
                              {formattedAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 w-full cursor-pointer select-none rounded-xl bg-[#0f55d8] py-2.5 text-base font-extrabold text-white transition-all duration-150 hover:bg-[#0d4bc0] active:scale-[0.99]"
                      >
                        Entendido
                      </button>
                    </motion.div>
                  );
                })()
              ) : formStep === 'verifying' ? (
                <motion.div
                  key="step-verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex w-full select-none flex-col items-center justify-center py-6 text-center"
                >
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                    <div
                      className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-dashed border-[#0f55d8]/40"
                      style={{ animationDuration: '10s' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-[#0f55d8]/5" />
                    <MapPin className="relative z-10 h-8 w-8 text-[#0f55d8]" />
                  </div>

                  <h3 className="mb-1.5 font-geist text-lg font-bold tracking-tight text-slate-900">
                    Verificando Cobertura
                  </h3>
                  <p className="mb-5 text-[19px] font-semibold uppercase tracking-wider text-gray-400">
                    Análisis de Ruta en Tiempo Real
                  </p>

                  <div className="w-full max-w-sm space-y-3 rounded-xl border bg-slate-50 p-4 text-left font-geist">
                    <div className="flex items-center gap-3">
                      {verificationProgress >= 1 ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 text-blue-500" />
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
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : verificationProgress === 1 ? (
                        <Loader2 className="h-4 w-4 shrink-0 text-blue-500" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
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
                        <CheckCircle className="h-4 w-4 shrink-0 text-[#0f55d8]" />
                      ) : verificationProgress === 2 ? (
                        <Loader2 className="h-4 w-4 shrink-0 text-blue-500" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
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

                  <div className="mt-6 h-1 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full bg-[#0f55d8]"
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
                  className="relative flex w-full flex-col"
                >
                  {/* Segmented Progress Indicator */}
                  <div className="mb-1 flex shrink-0 justify-center gap-2">
                    {[1, 2].map((step) => {
                      const isActive = step <= formStep;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setFormStep(step as 1 | 2);
                            if (viewportRef.current) viewportRef.current.scrollLeft = 0;
                            window.setTimeout(() => {
                              if (step === 1) phoneInputRef.current?.focus({ preventScroll: true });
                              else if (step === 2) calleInputRef.current?.focus({ preventScroll: true });
                              if (viewportRef.current) viewportRef.current.scrollLeft = 0;
                            }, 310);
                          }}
                          className="group relative flex h-5 flex-1 cursor-pointer items-center focus:outline-none"
                          title={`Ir al Paso ${step}`}
                        >
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 transition-colors group-hover:bg-slate-300">
                            <div
                              className="h-full rounded-full bg-[#0f55d8] transition-all duration-300"
                              style={{ width: isActive ? '100%' : '0%' }}
                            />
                          </div>
                          <span className="sr-only">Paso {step}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Static Title block */}
                  <div className="shrink-0 select-none pb-1 pt-2">
                    <h2 className="flex h-7 items-center gap-1.5 whitespace-nowrap text-[18px] font-semibold leading-none tracking-tight text-slate-800 sm:text-[19px]">
                      {formStep === 1 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="animate-sheet-wave select-none">👋</span>
                          <span className="animate-sheet-grin select-none">😁</span>
                          <span>¿Cuál es tu número?</span>
                        </span>
                      )}
                      {formStep === 2 && (
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
                    className="relative mt-3 w-full overflow-hidden"
                    style={{
                      height: typeof sliderHeight === 'number' ? `${sliderHeight}px` : sliderHeight,
                      transition: 'height 250ms ease',
                    }}
                  >
                    <div
                      className="flex w-full transform-gpu items-start"
                      style={{
                        transform: formStep === 2 ? 'translateX(-100%)' : 'translateX(0%)',
                        transition: 'transform 300ms cubic-bezier(0.32, 0.94, 0.6, 1)',
                      }}
                    >
                      {/* Paso 1: Teléfono */}
                      <div
                        ref={step1Ref}
                        className={`w-full shrink-0 px-0.5 transition-opacity duration-200 ${
                          formStep !== 1 ? 'pointer-events-none select-none opacity-40' : 'opacity-100'
                        }`}
                        aria-hidden={formStep !== 1}
                      >
                        <form
                          noValidate
                          data-vaul-no-drag
                          onSubmit={goToStep2}
                          className="flex flex-col space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="ml-0.5 flex h-4 select-none items-center justify-between">
                                <label className="block text-[11px] font-semibold uppercase leading-none tracking-wider text-gray-400">
                                  WhatsApp
                                </label>
                                <span
                                  className={`font-geist text-[11px] font-semibold leading-none tracking-wider transition-colors ${
                                    phone.length === 10
                                      ? 'font-bold text-emerald-600'
                                      : phone.length > 10
                                      ? 'font-bold text-red-600'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {phone.length}/10
                                </span>
                              </div>
                              <div className="relative">
                                <Phone
                                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
                                    isPhoneError ? 'text-red-500' : 'text-slate-400'
                                  }`}
                                />
                                <input
                                  ref={phoneInputRef}
                                  data-vaul-no-drag
                                  type="tel"
                                  inputMode="tel"
                                  required
                                  autoComplete="tel-national"
                                  tabIndex={formStep === 1 ? 0 : -1}
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
                                      goToStep2(e);
                                    }
                                  }}
                                  className={`h-[42px] w-full select-text rounded-xl pl-9 pr-4 text-base font-semibold leading-normal outline-none focus:ring-2 ${
                                    isPhoneError
                                      ? 'border border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-100'
                                      : 'border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-[#0f55d8] focus:bg-white focus:ring-blue-100'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            tabIndex={formStep === 1 ? 0 : -1}
                            onMouseDown={(e) => e.preventDefault()}
                            className="flex h-[42px] w-full cursor-pointer select-none items-center justify-center gap-1.5 rounded-xl bg-[#0f55d8] text-base font-extrabold text-white hover:bg-[#0d4bc0]"
                          >
                            <span className="font-geist">Continuar</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </form>
                      </div>

                      {/* Paso 2: Dirección */}
                      <div
                        ref={step2Ref}
                        className={`w-full shrink-0 px-0.5 transition-opacity duration-200 ${
                          formStep !== 2 ? 'pointer-events-none select-none opacity-40' : 'opacity-100'
                        }`}
                        aria-hidden={formStep !== 2}
                      >
                        <form
                          noValidate
                          data-vaul-no-drag
                          onSubmit={submitStep2AndVerify}
                          className="flex flex-col space-y-4"
                        >
                          {gpsAutofillError && (
                            <p className="select-none rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-center text-[11px] font-bold leading-tight text-red-500">
                              {gpsAutofillError}
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="relative space-y-1">
                              <div className="ml-0.5 flex h-4 select-none items-center justify-between">
                                <label className="block text-[11px] font-semibold uppercase leading-none tracking-wider text-gray-400">
                                  Dirección
                                </label>
                              </div>
                              <div className="relative">
                                {gpsAutofillLoading ? (
                                  <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />
                                ) : (
                                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                )}
                                <input
                                  ref={calleInputRef}
                                  data-vaul-no-drag
                                  type="text"
                                  required
                                  autoComplete="street-address"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  tabIndex={formStep === 2 ? 0 : -1}
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
                                      submitStep2AndVerify(e);
                                    }
                                  }}
                                  className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-base font-semibold leading-normal text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#0f55d8] focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                                    <div
                                      data-vaul-no-drag
                                      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-36 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
                                    >
                                      {matches.map((col) => (
                                        <button
                                          key={col}
                                          type="button"
                                          onClick={() => {
                                            const newAddr = addressCalle
                                              .toLowerCase()
                                              .includes(col.toLowerCase())
                                              ? addressCalle
                                              : `${addressCalle}, ${col}`;
                                            setAddressCalle(newAddr);
                                            setAddressColonia(col);
                                            setShowColoniaSuggestions(false);
                                            setFormError(null);
                                          }}
                                          className="flex w-full cursor-pointer select-none items-center justify-between px-3.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#0f55d8]"
                                        >
                                          <span>Colonia {col}</span>
                                          <Check className="h-3.5 w-3.5 text-[#0f55d8] opacity-0 hover:opacity-100" />
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
                            tabIndex={formStep === 2 ? 0 : -1}
                            className="flex h-[42px] w-full cursor-pointer select-none items-center justify-center gap-1.5 rounded-xl bg-[#0f55d8] text-base font-extrabold text-white hover:bg-[#0d4bc0] disabled:opacity-50"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <span className="font-geist">Terminar</span>
                                <ArrowRight className="h-4 w-4" />
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
