import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import canvasLaundryBag from '../../assets/images/IMG_8321.jpg';
import { DatePickerBottomSheet } from './DatePickerBottomSheet';

const DATE_CONFIG = {
  cutoffHour: 21,
  quickDays: 2,
  storageKey: 'somos:selected-date',
} as const;

interface DateItem {
  date: Date;
  key: string;
  label: string;
  dayNum: number;
  monthShort: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getBaseDays = (now = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return { today, tomorrow };
};

const parseDateKey = (key: string | null): Date | null => {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  parsed.setHours(0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateItem = (d: Date, base = getBaseDays()): DateItem => {
  const { today, tomorrow } = base;
  let label: string;
  if (d.getTime() === today.getTime()) label = 'Hoy';
  else if (d.getTime() === tomorrow.getTime()) label = 'Mañana';
  else label = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');

  return {
    date: d,
    key: dateKey(d),
    label,
    dayNum: d.getDate(),
    monthShort: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
  };
};

const formatPreferredTime = (d: Date): string => {
  const { today, tomorrow } = getBaseDays();
  const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
  const dayNum = d.getDate();
  const monthShort = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  const text = `${weekday}, ${dayNum} ${monthShort}`;

  if (d.getTime() === today.getTime()) return `HOY (${text})`;
  if (d.getTime() === tomorrow.getTime()) return `MAÑANA (${text})`;
  return text;
};

const loadSelection = (): string | null => {
  try {
    return sessionStorage.getItem(DATE_CONFIG.storageKey);
  } catch {
    return null;
  }
};

const saveSelection = (key: string | null) => {
  try {
    if (key) sessionStorage.setItem(DATE_CONFIG.storageKey, key);
    else sessionStorage.removeItem(DATE_CONFIG.storageKey);
  } catch {}
};

const buildDates = (now = new Date()): DateItem[] => {
  const base = getBaseDays(now);
  const startOffset = now.getHours() >= DATE_CONFIG.cutoffHour ? 1 : 0;

  const items: DateItem[] = [];
  for (let i = startOffset; i < startOffset + DATE_CONFIG.quickDays; i++) {
    const d = new Date(base.today);
    d.setDate(d.getDate() + i);
    items.push(formatDateItem(d, base));
  }
  return items;
};

const getMinCustomDateFrom = (dates: DateItem[]): Date => {
  const lastQuick = dates[dates.length - 1];
  const min = new Date(lastQuick.date);
  min.setDate(min.getDate() + 1);
  return min;
};

const computeInitialDateState = () => {
  const dates = buildDates();
  const quickKeys = dates.map((d) => d.key);
  const minCustom = getMinCustomDateFrom(dates);
  const base = getBaseDays();
  let selectedKey = loadSelection();
  let customDate: DateItem | null = null;

  if (selectedKey && !quickKeys.includes(selectedKey)) {
    const parsed = parseDateKey(selectedKey);
    if (parsed && parsed.getTime() >= minCustom.getTime()) {
      customDate = formatDateItem(parsed, base);
    } else {
      selectedKey = null;
      saveSelection(null);
    }
  }

  return { dates, customDate, selectedKey };
};

const ArrowIcon = () => (
  <svg className="date-card-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M7.5 4.5L13 10L7.5 15.5"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface HeroSectionProps {
  role: 'customer' | 'associate' | 'admin';
  setRole: (role: 'customer' | 'associate' | 'admin') => void;
  handleNavbarPointerDown: () => void;
  handleNavbarPointerUpOrLeave: () => void;
  handleNavbarClick: () => void;
  setPreferredTime: (time: string) => void;
  openBottomSheet: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  role,
  setRole,
  handleNavbarPointerDown,
  handleNavbarPointerUpOrLeave,
  handleNavbarClick,
  setPreferredTime,
  openBottomSheet,
}) => {
  const navigate = useNavigate();

  const [dateState, setDateState] = useState(computeInitialDateState);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const { dates, customDate, selectedKey } = dateState;

  const rebuildDates = useCallback(() => {
    setDateState((prev) => {
      const nextDates = buildDates();
      const quickKeys = nextDates.map((d) => d.key);
      const minCustom = getMinCustomDateFrom(nextDates);
      const base = getBaseDays();

      let nextCustom = prev.customDate;
      if (nextCustom && nextCustom.date.getTime() < minCustom.getTime()) {
        nextCustom = null;
      }

      let nextSelected = prev.selectedKey;
      if (nextSelected && !quickKeys.includes(nextSelected)) {
        const parsed = parseDateKey(nextSelected);
        if (parsed && parsed.getTime() >= minCustom.getTime()) {
          nextCustom = formatDateItem(parsed, base);
        } else {
          nextSelected = null;
          saveSelection(null);
        }
      }

      return {
        dates: nextDates,
        customDate: nextCustom,
        selectedKey: nextSelected,
      };
    });
  }, []);

  // Programa la próxima actualización automática a medianoche o a la hora de corte (21:00)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextRebuild = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      midnight.setDate(midnight.getDate() + 1);

      const cutoff = new Date(now);
      if (now.getHours() >= DATE_CONFIG.cutoffHour) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      cutoff.setHours(DATE_CONFIG.cutoffHour, 0, 0, 0);

      const nextTime = Math.min(midnight.getTime(), cutoff.getTime());
      const ms = Math.max(1000, nextTime - now.getTime());

      timeoutId = setTimeout(() => {
        rebuildDates();
        scheduleNextRebuild();
      }, ms);
    };

    scheduleNextRebuild();
    return () => clearTimeout(timeoutId);
  }, [rebuildDates]);

  const minCustomDate = getMinCustomDateFrom(dates);
  const hasCustom = Boolean(customDate);
  const isCustomSelected = Boolean(customDate && customDate.key === selectedKey);

  const triggerDateAction = (date: Date) => {
    setPreferredTime(formatPreferredTime(date));
    openBottomSheet();
  };

  const handleSelectQuickDate = (item: DateItem) => {
    setDateState((prev) => ({ ...prev, selectedKey: item.key }));
    saveSelection(item.key);
    triggerDateAction(item.date);
  };

  const handleConfirmCustomDate = (pickedDate: Date) => {
    const formatted = formatDateItem(pickedDate);
    setDateState((prev) => ({
      ...prev,
      customDate: formatted,
      selectedKey: formatted.key,
    }));
    saveSelection(formatted.key);
    setIsDateSheetOpen(false);
    triggerDateAction(formatted.date);
  };

  const handleOtherCardClick = () => {
    if (customDate && selectedKey !== customDate.key) {
      setDateState((prev) => ({ ...prev, selectedKey: customDate.key }));
      saveSelection(customDate.key);
      triggerDateAction(customDate.date);
    } else {
      setIsDateSheetOpen(true);
    }
  };

  return (
    <section className="hero">
      <img
        className="hero-bg"
        src="https://i.ibb.co/cc81GSmJ/IMG-9746.jpg"
        alt="Cesto de lavandería Somos"
        fetchPriority="high"
        decoding="async"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = canvasLaundryBag;
        }}
      />
      <div className="hero-gradient" />

      {/* Zona superior invisible para acceso staff por pulsación larga y botón Salir */}
      <header
        className="absolute top-0 left-0 right-0 z-30 w-full h-[34px] bg-transparent text-white select-none cursor-pointer flex items-center justify-center"
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={handleNavbarPointerDown}
        onPointerUp={handleNavbarPointerUpOrLeave}
        onPointerLeave={handleNavbarPointerUpOrLeave}
        onPointerCancel={handleNavbarPointerUpOrLeave}
        onClick={handleNavbarClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-sm w-full mx-auto px-4 h-[34px] relative flex items-center justify-center">
          {(role === 'associate' || role === 'admin') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRole('customer');
                navigate('/');
              }}
              className="text-xs font-semibold px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 uppercase tracking-wider text-white transition-all duration-200 absolute left-4 cursor-pointer"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      <div className="hero-content">
        <p className="hero-title">
          Lavado profesional
          <br />a un precio fijo
        </p>

        <p className="hero-subtitle">
          Recibe nuestro cesto gratis y
          <br />
          llénalo con la ropa que quieras
        </p>

        <div className="hero-price-wrap">
          <span className="hero-price mi-resaltado">
            Lo lavamos todo por <span className="dollar">$</span>
            <span className="amount">95</span>
          </span>
        </div>

        <div className="hero-info">
          <span>A domicilio</span>
          <span>•</span>
          <span>En 24 horas</span>
        </div>
      </div>

      <div className="hero-spacer" />

      {/* Etiqueta flotante de capacidad anclada proporcionalmente */}
      <div className="hero-badge">
        <span className="hero-badge-main">Caben</span>
        <span className="hero-badge-sub">hasta 5 kg</span>
      </div>

      {/* Cápsula inferior con selector de fechas */}
      <div className="hero-date-wrap">
        <div className="hero-capsule">
          <p className="date-title">¿Cuándo te llevamos tu cesto?</p>
          <div className="date-grid-wrap">
            <div className="date-grid" id="dateGrid" role="radiogroup" aria-label="Día de entrega del cesto">
              {dates.map((item) => {
                const isSelected = item.key === selectedKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`date-card${isSelected ? ' selected' : ''}`}
                    role="radio"
                    aria-checked={isSelected}
                    data-key={item.key}
                    onClick={() => handleSelectQuickDate(item)}
                  >
                    <span className="date-card-arrow-spacer" aria-hidden="true" />
                    <span className="date-card-content">
                      <span className="date-card-label">{item.label}</span>
                      <span className="date-card-day">
                        {item.dayNum} {item.monthShort}
                      </span>
                    </span>
                    <ArrowIcon />
                  </button>
                );
              })}

              <button
                type="button"
                className={`date-card date-card-other${!hasCustom ? ' is-empty' : ''}${
                  isCustomSelected ? ' selected' : ''
                }`}
                role="radio"
                aria-checked={isCustomSelected}
                data-action="other"
                aria-label={
                  customDate
                    ? isCustomSelected
                      ? `${customDate.dayNum} ${customDate.monthShort}, tocar para elegir otro día`
                      : `Seleccionar ${customDate.dayNum} ${customDate.monthShort}`
                    : 'Elegir otro día'
                }
                onClick={handleOtherCardClick}
              >
                {customDate ? (
                  <>
                    <span className="date-card-arrow-spacer" aria-hidden="true" />
                    <span className="date-card-content">
                      <span className="date-card-label">{customDate.label}</span>
                      <span className="date-card-day">
                        {customDate.dayNum} {customDate.monthShort}
                      </span>
                    </span>
                    <span className="edit-hint" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </span>
                    <ArrowIcon />
                  </>
                ) : (
                  <>
                    <span className="date-card-arrow-spacer" aria-hidden="true" />
                    <span className="date-card-content">
                      <span className="date-card-label">Elegir</span>
                      <span className="date-card-day">otro día</span>
                    </span>
                    <ArrowIcon />
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="date-subtitle">
            <span className="highlight">¿Sin ropa sucia?</span> Pídelo gratis y llénalo después.
          </p>
        </div>
      </div>

      {/* Selector de próximos días hecho a medida */}
      <DatePickerBottomSheet
        isOpen={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        minDate={minCustomDate}
        initialSelectedKey={customDate?.key ?? null}
        onConfirm={handleConfirmCustomDate}
      />
    </section>
  );
};
