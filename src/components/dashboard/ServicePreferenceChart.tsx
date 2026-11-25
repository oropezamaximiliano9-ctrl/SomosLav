interface ServicePreferenceChartProps {
  preferences: {
    estandar: number;
    express: number;
    otros: number;
  };
}

export function ServicePreferenceChart({ preferences }: ServicePreferenceChartProps) {
  const { estandar, express, otros } = preferences;
  const total = estandar + express + otros;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-none border border-dashed border-slate-200">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-sm font-bold text-slate-400">0</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 font-mono tracking-wider">Servicios</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 font-medium">No hay suficiente información en este período</p>
      </div>
    );
  }

  const estPct = (estandar / total) * 100;
  const expPct = (express / total) * 100;
  const otrPct = (otros / total) * 100;

  const r = 38;
  const circ = 2 * Math.PI * r;

  const estDash = (estPct / 100) * circ;

  const expOffset = estDash;
  const expDash = (expPct / 100) * circ;

  const otrOffset = estDash + expDash;
  const otrDash = (otrPct / 100) * circ;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
      {/* SVG Donut Center */}
      <div className="sm:col-span-4 flex justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f8fafc" strokeWidth="10" />

            {estandar > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#3771e7"
                strokeWidth="10"
                strokeDasharray={`${estDash} ${circ - estDash}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {express > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray={`${expDash} ${circ - expDash}`}
                strokeDashoffset={-expOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {otros > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={`${otrDash} ${circ - otrDash}`}
                strokeDashoffset={-otrOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[7px] uppercase font-bold text-slate-400 mt-0.5 font-mono tracking-widest">
              Servicios
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="sm:col-span-8 space-y-1.5">
        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-[#3771e7] block shrink-0" />
              <span className="text-xs font-bold text-slate-700">Estándar (48 h)</span>
            </div>
            <div className="text-right font-mono text-xs font-semibold text-slate-500">
              {estandar} <span className="text-[10px] text-slate-400">({Math.round(estPct)}%)</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
            <div className="bg-[#3771e7] h-full transition-all duration-500" style={{ width: `${estPct}%` }} />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-[#10b981] block shrink-0" />
              <span className="text-xs font-bold text-slate-700">Express (24 h)</span>
            </div>
            <div className="text-right font-mono text-xs font-semibold text-slate-500">
              {express} <span className="text-[10px] text-slate-400">({Math.round(expPct)}%)</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
            <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${expPct}%` }} />
          </div>
        </div>

        {otros > 0 && (
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#f59e0b] block shrink-0" />
                <span className="text-xs font-bold text-slate-700">Otros / Personalizado</span>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-slate-500">
                {otros} <span className="text-[10px] text-slate-400">({Math.round(otrPct)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
              <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${otrPct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
