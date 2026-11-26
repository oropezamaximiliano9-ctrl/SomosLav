import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import { useBodyScrollLock } from '../../utils/keyboard';

export interface CustomDateOption {
  date: Date;
  key: string;
  weekdayShort: string;
  dayNum: number;
  monthShort: string;
}

interface DatePickerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  minDate: Date;
  initialSelectedKey: string | null;
  onConfirm: (date: Date) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);

const DAYS_TO_SHOW = 6;

export const DatePickerBottomSheet: React.FC<DatePickerBottomSheetProps> = ({
  isOpen,
  onClose,
  minDate,
  initialSelectedKey,
  onConfirm,
}) => {
  const minTimestamp = minDate.getTime();
  useBodyScrollLock(isOpen);

  const upcomingDays = useMemo<CustomDateOption[]>(() => {
    const start = new Date(minTimestamp);
    start.setHours(0, 0, 0, 0);

    const list: CustomDateOption[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const weekdayShort = capitalize(
        d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
      );
      const monthShort = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

      list.push({
        date: d,
        key: toDateKey(d),
        weekdayShort,
        dayNum: d.getDate(),
        monthShort,
      });
    }
    return list;
  }, [minTimestamp]);

  const [draftKey, setDraftKey] = useState<string>(() => {
    const matchesInitial = initialSelectedKey && upcomingDays.some((d) => d.key === initialSelectedKey);
    return matchesInitial ? initialSelectedKey : upcomingDays[0]?.key || '';
  });

  useEffect(() => {
    if (!isOpen) return;
    const matchesInitial = initialSelectedKey && upcomingDays.some((d) => d.key === initialSelectedKey);
    setDraftKey(matchesInitial ? initialSelectedKey : upcomingDays[0]?.key || '');
  }, [isOpen, initialSelectedKey, upcomingDays]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedOption = upcomingDays.find((d) => d.key === draftKey) || upcomingDays[0];

  const handleConfirm = () => {
    if (!selectedOption) return;
    onConfirm(selectedOption.date);
  };

  const overlayPointerDownRef = useRef(false);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="form-overlay"
        data-open={isOpen ? 'true' : 'false'}
        onPointerDown={(e) => {
          overlayPointerDownRef.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (!overlayPointerDownRef.current || e.target !== e.currentTarget) return;
          overlayPointerDownRef.current = false;
          onClose();
        }}
        aria-hidden={!isOpen}
      >
        <div
          className="form-bottom-sheet bg-white pt-4 px-6"
          data-open={isOpen ? 'true' : 'false'}
          role="dialog"
          aria-modal="true"
          aria-label="Elegir día de entrega del cesto"
          aria-hidden={!isOpen}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-1 shrink-0" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar selector de fechas"
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-50 transition-colors rounded-full cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="form-content-inner w-full flex flex-col mt-1.5"
          style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        >
          {/* Header */}
          <div className="pr-7 mb-2.5 select-none">
            <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight leading-snug font-geist">
              Elige otro día
            </h2>
          </div>

          {/* 3-column upcoming days grid (2 rows of 3) */}
          <div
            className="grid grid-cols-3 gap-2 select-none"
            role="radiogroup"
            aria-label="Próximos días disponibles"
          >
            {upcomingDays.map((item) => {
              const isSelected = item.key === selectedOption?.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setDraftKey(item.key)}
                  className={`relative h-[54px] px-2 rounded-[13px] flex flex-col items-center justify-center transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f55d8] active:translate-y-[1.5px] active:shadow-none ${
                    isSelected
                      ? 'bg-[#eff5ff] border-[1.5px] border-[#0f55d8] shadow-[0_2px_0_#0f55d8]'
                      : 'bg-white border-[1.5px] border-slate-200/90 shadow-[0_2px_0_rgba(15,23,42,0.06)] hover:border-[#0f55d8]/50'
                  }`}
                >
                  <span className="text-[11.5px] font-semibold leading-none mb-1 font-geist whitespace-nowrap text-slate-500">
                    {item.weekdayShort}
                  </span>
                  <span className="text-[14px] font-bold leading-tight tabular-nums font-geist whitespace-nowrap text-slate-900">
                    {item.dayNum} {item.monthShort}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary Confirm CTA matching RegistrationBottomSheet button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedOption}
            className="w-full py-2 mt-4 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] active:scale-[0.99] text-white font-extrabold text-base flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none disabled:opacity-50"
          >
            <span className="font-geist">Continuar</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
};
