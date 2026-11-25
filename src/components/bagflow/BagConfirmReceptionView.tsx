import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface BagConfirmReceptionViewProps {
  bag: any;
  prefTime: string;
  setPrefTime: (time: string | ((prev: string) => string)) => void;
  receiving: boolean;
  onReceiveBag: (selectedDeliveryType?: string, preferredTimePreference?: string) => Promise<void>;
}

export function BagConfirmReceptionView({
  bag,
  prefTime,
  setPrefTime,
  receiving,
  onReceiveBag,
}: BagConfirmReceptionViewProps) {
  const isFirstVisit =
    !bag.user || !bag.user.deliveryPreference || bag.user.deliveryPreference === "";
  const isEligibleForDelivery =
    bag?.user?.addressColonia?.toLowerCase().includes("palmas") ?? false;

  return (
    <div className="flex-1 flex flex-col mt-4 pb-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-medium text-gray-900 uppercase tracking-tight">
          Confirmar Recepción
        </h1>
      </div>

      <div className="p-6 border border-gray-100 space-y-4 rounded-none bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 w-full">
          <div className="text-left space-y-4 w-full">
            {isFirstVisit && (
              <div className="space-y-1.5 pb-4 border-b border-gray-100 w-full">
                <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-[#0f55d8] border border-blue-100 rounded-md text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                  Nuevo Cliente
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Configuración inicial.
                </h3>
              </div>
            )}
            <div className="space-y-0.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">
                Cliente
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-gray-900 leading-none">
                  {bag.user?.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isFirstVisit ? (
          <div className="space-y-4 py-1">
            {isEligibleForDelivery && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block pb-0.5">
                  Horario de Entrega Preferido
                </label>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPrefTime("Mañana (8:00 AM – 10:00 AM)")}
                    className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                      prefTime === "Mañana (8:00 AM – 10:00 AM)"
                        ? "bg-blue-50/70 border-[#0f55d8] border-2"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span
                      className={`font-black text-sm sm:text-base tracking-tight block ${
                        prefTime === "Mañana (8:00 AM – 10:00 AM)"
                          ? "text-[#0f55d8]"
                          : "text-slate-800"
                      }`}
                    >
                      Mañana
                    </span>
                    <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                      8 AM-10 AM
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPrefTime("Noche (8:00 PM – 10:00 PM)")}
                    className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                      prefTime === "Noche (8:00 PM – 10:00 PM)"
                        ? "bg-blue-50/70 border-[#0f55d8] border-2"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span
                      className={`font-black text-sm sm:text-base tracking-tight block ${
                        prefTime === "Noche (8:00 PM – 10:00 PM)"
                          ? "text-[#0f55d8]"
                          : "text-slate-800"
                      }`}
                    >
                      Noche
                    </span>
                    <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                      8 PM-10 PM
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
                Preferencias de entrega
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {isEligibleForDelivery && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                  <div className="space-y-0.5 text-left min-w-0">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      Horario Preferido
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                      {prefTime === "Noche (8:00 PM – 10:00 PM)" ? (
                        <>
                          Noche
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            8 PM-10 PM
                          </span>
                        </>
                      ) : (
                        <>
                          Mañana
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            8 AM-10 AM
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrefTime((p) =>
                        p === "Mañana (8:00 AM – 10:00 AM)"
                          ? "Noche (8:00 PM – 10:00 PM)"
                          : "Mañana (8:00 AM – 10:00 AM)"
                      );
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white rounded-lg font-bold text-[9px] sm:text-[10px] transition-all cursor-pointer uppercase border border-slate-200/60 hover:border-slate-900 shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {(bag.user?.addressColonia || bag.user?.addressCalle) && (
                <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl text-left space-y-1">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Domicilio de Entrega
                  </span>
                  <p className="text-xs font-bold text-slate-700 leading-normal">
                    {bag.user?.addressCalle} {bag.user?.addressNumero || ""}, Col.{" "}
                    {bag.user?.addressColonia || ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={() => onReceiveBag("24 horas", isEligibleForDelivery ? prefTime : "")}
          disabled={receiving}
          className="w-full bg-[#0f55d8] text-white p-5 rounded-2xl font-bold flex items-center justify-center hover:-translate-y-1 transition-all disabled:opacity-50 text-lg cursor-pointer select-none"
        >
          {receiving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isFirstVisit ? (
            "Guardar y Confirmar Recepción"
          ) : (
            "Confirmar"
          )}
        </button>
      </div>
    </div>
  );
}
