import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getColoniaDistance } from '../../utils/distance';
import { CYCLE_OPTIONS } from '../../utils/dashboardMetrics';
import { OrderWaterfall, WaterfallData } from './OrderWaterfall';

interface OrderFinancialBreakdownProps {
  selectedOrder: any;
  onBack: () => void;
}

export function OrderFinancialBreakdown({ selectedOrder, onBack }: OrderFinancialBreakdownProps) {
  const storageKey = `order_calc_${selectedOrder.id}`;

  let savedCalc: any = null;
  try {
    const rawSaved = localStorage.getItem(storageKey);
    if (rawSaved) savedCalc = JSON.parse(rawSaved);
  } catch {}

  const [washMinutes, setWashMinutes] = useState(
    () => selectedOrder?.financialCalc?.washMinutes || savedCalc?.washMinutes || ''
  );
  const [dryMinutes, setDryMinutes] = useState(
    () => selectedOrder?.financialCalc?.dryMinutes || savedCalc?.dryMinutes || ''
  );
  const [weightKilos, setWeightKilos] = useState(
    () => selectedOrder?.financialCalc?.weightKilos || savedCalc?.weightKilos || ''
  );
  const [transportKm, setTransportKm] = useState(() => {
    if (selectedOrder?.financialCalc?.transportKm !== undefined && selectedOrder?.financialCalc?.transportKm !== '') {
      return String(selectedOrder.financialCalc.transportKm);
    }
    if (savedCalc?.transportKm !== undefined && savedCalc?.transportKm !== '') {
      return String(savedCalc.transportKm);
    }
    if (selectedOrder?.user?.distanceKm !== undefined && selectedOrder?.user?.distanceKm !== null) {
      return String(selectedOrder.user.distanceKm);
    }
    const col =
      selectedOrder?.addressColonia ||
      selectedOrder?.user?.addressColonia;
    if (col) {
      return String(getColoniaDistance(col));
    }
    return localStorage.getItem('user_distance_km') || '';
  });
  const [showResult, setShowResult] = useState(() => !!selectedOrder?.financialCalc || !!savedCalc);

  const isHomeDelivery = !!selectedOrder?.addressCalle;

  const waterfallData: WaterfallData = {
    baseRevenue: selectedOrder?.totalPrice || 100,
    upsellRevenue: 0,
    suppliesCost: 0,
    operationsCost: 0,
    logisticsCost: 0,
    fixedCosts: 0,
    isHomeDelivery,
  };

  const handleCalculate = async () => {
    if (weightKilos && washMinutes && dryMinutes) {
      const calcData = {
        washMinutes,
        dryMinutes,
        weightKilos,
        transportKm,
      };
      localStorage.setItem(storageKey, JSON.stringify(calcData));

      try {
        const orderRef = doc(db, 'orders', String(selectedOrder.id));
        await updateDoc(orderRef, { financialCalc: calcData });
      } catch (err) {
        console.error('Failed to save calc to DB:', err);
      }

      setShowResult(true);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">#{String(selectedOrder.id || '').padStart(4, '0')}</h2>
            <p className="text-sm text-gray-500">Desglose Financiero</p>
          </div>
        </div>
        {showResult && (
          <button
            onClick={() => setShowResult(false)}
            className="text-sm font-medium text-[#0f55d8] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Editar cálculo
          </button>
        )}
      </div>

      {!showResult ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 w-full max-w-3xl mx-auto space-y-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Calculadora de Costos Operativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso Real (Kilos)</label>
              <input
                type="number"
                value={weightKilos}
                onChange={(e) => setWeightKilos(e.target.value)}
                placeholder="Ej. 5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-1 focus:ring-[#0f55d8] focus:border-[#0f55d8] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Transporte (Km)</label>
              <input
                type="number"
                value={transportKm}
                onChange={(e) => setTransportKm(e.target.value)}
                placeholder="Ej. 2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-1 focus:ring-[#0f55d8] focus:border-[#0f55d8] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lavado (Ciclos) *</label>
              <select
                value={washMinutes}
                onChange={(e) => setWashMinutes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-1 focus:ring-[#0f55d8] focus:border-[#0f55d8] outline-none transition-colors bg-white appearance-none"
              >
                <option value="">Seleccionar...</option>
                {CYCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Secado (Ciclos) *</label>
              <select
                value={dryMinutes}
                onChange={(e) => setDryMinutes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-1 focus:ring-[#0f55d8] focus:border-[#0f55d8] outline-none transition-colors bg-white appearance-none"
              >
                <option value="">Seleccionar...</option>
                {CYCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              onClick={handleCalculate}
              disabled={!weightKilos || !washMinutes || !dryMinutes}
              className="px-5 py-2.5 bg-[#0f55d8] hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
            >
              Calcular Costos
            </button>
          </div>
        </div>
      ) : (
        <OrderWaterfall data={waterfallData} />
      )}
    </div>
  );
}
