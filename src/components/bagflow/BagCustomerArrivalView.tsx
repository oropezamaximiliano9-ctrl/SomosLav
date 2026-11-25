import { Check, Info, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface BagCustomerArrivalViewProps {
  bag: any;
  arrivalNotified: boolean;
  notifyingArrival: boolean;
  onNotifyArrival: () => Promise<void>;
}

export function BagCustomerArrivalView({
  bag,
  arrivalNotified,
  notifyingArrival,
  onNotifyArrival,
}: BagCustomerArrivalViewProps) {
  const isEnCamino = bag.activeArrivalNotice?.status === "on_the_way";
  const isLlegue = bag.activeArrivalNotice?.status === "arrived";
  const clientFirstName = bag.user?.name?.split(" ")[0] || "Cliente";

  return (
    <div className="flex-1 flex flex-col items-center justify-start text-center py-4 px-4 space-y-6 max-w-sm mx-auto w-full">
      {/* Header Badge */}
      <div className="space-y-1.5 pt-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Hola, {clientFirstName} 👋
        </h2>
        <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
          ¿Vas a dejar tu ropa en sucursal? Avísanos para que nuestro equipo esté listo para recibirte.
        </p>
      </div>

      {/* Action Card: Voy en camino */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
              Titular
            </span>
            <p className="text-sm font-bold text-slate-800">
              {bag.user?.name || "Cliente Registrado"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
              Horario Preferido
            </span>
            <p className="text-xs font-bold text-[#0f55d8]">
              {bag.user?.preferredTime?.includes("Noche")
                ? "Noche (8–10 PM)"
                : bag.user?.preferredTime?.includes("Mañana")
                ? "Mañana (8–10 AM)"
                : bag.user?.preferredTime || "Mañana (8–10 AM)"}
            </p>
          </div>
        </div>

        {/* Status feedback if already notified */}
        {arrivalNotified || isEnCamino || isLlegue ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-2"
          >
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-emerald-900">
                ¡Aviso enviado a recepción!
              </h4>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                Nuestro asociado estará listo para recibir tu cesto al llegar.
              </p>
            </div>
            <div className="pt-1 flex justify-center items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Asociado en espera de tu llegada</span>
            </div>
          </motion.div>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={onNotifyArrival}
              disabled={notifyingArrival}
              className="w-full py-4 px-4 bg-[#0f55d8] hover:bg-[#0c4ab9] active:scale-[0.98] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer select-none"
            >
              {notifyingArrival ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando aviso...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🏃‍♂️</span>
                  <span>Voy en camino</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
          <Info className="w-4 h-4 text-[#0f55d8] shrink-0" />
          <span>Entrega rápida sin filas</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Al escanear tu cesto y avisar, el asociado prepara tu orden automáticamente. Solo dejas el cesto y listo.
        </p>
      </div>
    </div>
  );
}
