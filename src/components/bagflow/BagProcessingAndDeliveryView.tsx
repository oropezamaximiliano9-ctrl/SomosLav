import { CYCLE_OPTIONS } from "../../utils/dashboardMetrics";

interface BagProcessingAndDeliveryViewProps {
  bag: any;
  weightKilos: string;
  setWeightKilos: (val: string) => void;
  transportKm: string;
  washMinutes: string;
  dryMinutes: string;
  startingProcess: boolean;
  delivering: boolean;
  onStartProcessing: () => Promise<void>;
  onDeliverBag: () => Promise<void>;
}

export function BagProcessingAndDeliveryView({
  bag,
  weightKilos,
  setWeightKilos,
  transportKm,
  washMinutes,
  dryMinutes,
  startingProcess,
  delivering,
  onStartProcessing,
  onDeliverBag,
}: BagProcessingAndDeliveryViewProps) {
  if (bag.activeOrder.status === "pending") {
    return (
      <div className="flex-1 flex flex-col items-center justify-start text-center py-4 px-4 space-y-6 max-w-sm mx-auto w-full">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-medium text-gray-900 uppercase tracking-tight">
            Recepción en Central
          </h2>
        </div>

        <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 space-y-4 text-left">
          <div className="space-y-1 pb-3 border-b border-gray-100">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">
              Orden
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              #{String(bag.activeOrder.id).padStart(4, "0")}
            </h3>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Por favor pesa el cesto. Puedes dejar los demás campos vacíos por ahora.
          </p>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Peso Real (Kilos)
                </label>
                <input
                  type="number"
                  value={weightKilos}
                  onChange={(e) => setWeightKilos(e.target.value)}
                  placeholder="Ej. 5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-[#0f55d8]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Transporte (Km)
                </label>
                <input
                  type="number"
                  disabled
                  value={transportKm}
                  placeholder="Calculado"
                  className="w-full border border-gray-200 bg-gray-100 text-gray-400 rounded-lg px-3 py-2.5 text-base outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Lavado (Ciclos)
                </label>
                <select
                  disabled
                  value={washMinutes}
                  className="w-full border border-gray-200 bg-gray-100 text-gray-400 rounded-lg px-3 py-2.5 text-base outline-none cursor-not-allowed appearance-none"
                >
                  <option value=""></option>
                  {CYCLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Secado (Ciclos)
                </label>
                <select
                  disabled
                  value={dryMinutes}
                  className="w-full border border-gray-200 bg-gray-100 text-gray-400 rounded-lg px-3 py-2.5 text-base outline-none cursor-not-allowed appearance-none"
                >
                  <option value=""></option>
                  {CYCLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-100 pt-4 mt-4">
            <button
              onClick={onStartProcessing}
              disabled={startingProcess || !weightKilos}
              className="px-5 py-2.5 bg-[#0f55d8] hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {startingProcess ? "Iniciando..." : "Iniciar Lavado"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start text-center py-4 px-4 space-y-6 max-w-sm mx-auto w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-medium text-gray-900 uppercase tracking-tight">
          Entrega de Ropa
        </h2>
      </div>

      <div className="w-full border border-gray-100 p-5 rounded-3xl bg-white text-left space-y-4">
        <div className="space-y-1.5 border-b border-gray-100 pb-4">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">
            Cliente
          </span>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {bag.user?.name || "Cliente Registrado"}
          </h3>
          <p className="text-sm font-medium text-gray-500">
            {bag.user?.phone || "Sin teléfono registrado"}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">
            No. Orden
          </span>
          <p className="text-sm font-semibold text-slate-700 leading-none">
            #{String(bag.activeOrder.id).padStart(4, "0")}
          </p>
        </div>

        {(bag.user?.addressCalle || bag.user?.addressColonia) && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">
              Dirección de Entrega
            </span>
            <p className="text-sm font-bold text-slate-900 leading-normal">
              {bag.user?.addressCalle} {bag.user?.addressNumero || ""}, Col.{" "}
              {bag.user?.addressColonia || ""}
            </p>
          </div>
        )}
      </div>

      <div className="w-full pt-4">
        <button
          type="button"
          onClick={onDeliverBag}
          disabled={delivering}
          className="w-full py-4 bg-[#0f55d8] hover:bg-[#0c4ab9] disabled:bg-blue-300 font-extrabold tracking-wide text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer text-base"
        >
          {delivering ? "Entregando..." : "Entregar"}
        </button>
      </div>
    </div>
  );
}
