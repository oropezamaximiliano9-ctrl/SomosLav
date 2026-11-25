interface CustomerFrequencyChartProps {
  frequency: {
    habitual: number;
    ocasional: number;
    enRiesgo: number;
    promedio: number;
  };
}

export function CustomerFrequencyChart({ frequency }: CustomerFrequencyChartProps) {
  const { habitual, ocasional, enRiesgo, promedio } = frequency;
  const total = habitual + ocasional + enRiesgo;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-none border border-dashed border-slate-200">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-sm font-bold text-slate-400">0</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 font-mono tracking-wider">Clientes</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 font-medium">No hay suficiente información en los últimos 30 días</p>
      </div>
    );
  }

  const r = 38;
  const circ = 2 * Math.PI * r;

  const habPct = (habitual / total) * 100;
  const ocaPct = (ocasional / total) * 100;
  const enRPct = (enRiesgo / total) * 100;

  const habDash = (habPct / 100) * circ;

  const ocaOffset = habDash;
  const ocaDash = (ocaPct / 100) * circ;

  const enROffset = habDash + ocaDash;
  const enRDash = (enRPct / 100) * circ;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-4 flex justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f8fafc" strokeWidth="10" />

              {habitual > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray={`${habDash} ${circ - habDash}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              )}
              {ocasional > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="10"
                  strokeDasharray={`${ocaDash} ${circ - ocaDash}`}
                  strokeDashoffset={-ocaOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              )}
              {enRiesgo > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="10"
                  strokeDasharray={`${enRDash} ${circ - enRDash}`}
                  strokeDashoffset={-enROffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-800 leading-none">{total}</span>
              <span className="text-[7px] uppercase font-bold text-slate-400 mt-0.5 font-mono tracking-widest">
                Clientes
              </span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-8 space-y-1.5">
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#10b981] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Habituales</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {habitual} <span className="text-[10px] text-slate-400">({Math.round(habPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${habPct}%` }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f59e0b] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Ocasionales</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {ocasional} <span className="text-[10px] text-slate-400">({Math.round(ocaPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${ocaPct}%` }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f43f5e] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Ausentes</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {enRiesgo} <span className="text-[10px] text-slate-400">({Math.round(enRPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f43f5e] h-full transition-all duration-500" style={{ width: `${enRPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-100/70 flex justify-between items-baseline font-sans">
        <div className="text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
            Promedio de pedidos por cliente
          </span>
        </div>
        <div className="text-right font-mono text-xs font-semibold text-slate-600">
          {promedio.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
