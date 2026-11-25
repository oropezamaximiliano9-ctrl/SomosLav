import { ChevronDown, Info } from "lucide-react";
import { ServicePreferenceChart } from "./ServicePreferenceChart";
import { CustomerFrequencyChart } from "./CustomerFrequencyChart";

interface DashboardGeneralTabProps {
  metrics: any;
  timeRange: "7d" | "4w" | "6m" | "all";
  setTimeRange: (range: "7d" | "4w" | "6m" | "all") => void;
  activeMetricTooltip: string | null;
  setActiveMetricTooltip: (key: string | null) => void;
}

export function DashboardGeneralTab({
  metrics,
  timeRange,
  setTimeRange,
  activeMetricTooltip,
  setActiveMetricTooltip,
}: DashboardGeneralTabProps) {
  const toggleTooltip = (key: string) =>
    setActiveMetricTooltip(activeMetricTooltip === key ? null : key);

  return (
    <div className="space-y-6 w-full text-left">
      <div className="flex justify-end pt-1 pb-1">
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7d" | "4w" | "6m" | "all")}
            className="appearance-none bg-white border border-gray-200 px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer leading-none"
          >
            <option value="7d">Últimos 7 Días</option>
            <option value="4w">Últimos 4 Semanas</option>
            <option value="6m">Últimos 6 Meses</option>
            <option value="all">Histórico Completo</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Margen Neto Promedio Card */}
      <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center">
        <div className="text-sm font-medium text-slate-500 mb-1">Margen Neto Promedio</div>
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-bold text-slate-900 tracking-tighter leading-none">32%</div>
          <div
            className={`text-[14px] font-medium ${
              metrics.revenue.trend.isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {metrics.revenue.trend.isPositive ? "▲" : "▼"} {metrics.revenue.trend.percent}%
          </div>
        </div>
      </div>

      {/* Dynamic stats cards responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Completadas */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("completed")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Órdenes completadas</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "completed" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-gray-900 leading-none">
              {metrics.completed.value}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.completed.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.completed.trend.isPositive ? "▲" : "▼"} {metrics.completed.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "completed" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                Total de órdenes con estado "Completado".
              </p>
            </div>
          )}
        </div>

        {/* Metric 2: Peso Promedio / Cesto */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("kilos")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Peso Promedio / Cesto</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "kilos" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-gray-900 leading-none">
                {metrics.kilos.value.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold font-mono">KG</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.kilos.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.kilos.trend.isPositive ? "▲" : "▼"} {metrics.kilos.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "kilos" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                (Total de kilos) / (Total de órdenes completadas)
              </p>
            </div>
          )}
        </div>

        {/* Metric 3: Ingresos */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("revenue")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Ingresos</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "revenue" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-gray-900 leading-none">
                {metrics.revenue.value.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold font-mono">MXN</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.revenue.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.revenue.trend.isPositive ? "▲" : "▼"} {metrics.revenue.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "revenue" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                Dinero generado por las órdenes completadas.
              </p>
            </div>
          )}
        </div>

        {/* Metric 4: Ganancia Acumulada */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("profit")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Ganancia acumulada</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "profit" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-gray-900 leading-none">
              $
              {(metrics.revenue.value * 0.32).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.revenue.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.revenue.trend.isPositive ? "▲" : "▼"} {metrics.revenue.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "profit" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">Ganancia neta.</p>
            </div>
          )}
        </div>

        {/* Metric 5: Clientes nuevos */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("customers")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Clientes nuevos</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "customers" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-gray-900 leading-none">
              {metrics.customers.value}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.customers.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.customers.trend.isPositive ? "▲" : "▼"} {metrics.customers.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "customers" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">Nuevos clientes registrados.</p>
            </div>
          )}
        </div>

        {/* Metric 6: Clientes Recurrentes */}
        <div
          className="relative bg-white border border-slate-200 p-2.5 text-left flex flex-col justify-between min-h-[5.5rem] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTooltip("recurrentes")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Clientes recurrentes</span>
            <Info
              className={`w-3 h-3 transition-colors ${
                activeMetricTooltip === "recurrentes" ? "text-blue-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-gray-900 leading-none">
              {metrics.recurrent.value}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] font-medium ${
                  metrics.recurrent.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {metrics.recurrent.trend.isPositive ? "▲" : "▼"} {metrics.recurrent.trend.percent}%
              </span>
            </div>
          </div>
          {activeMetricTooltip === "recurrentes" && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                Clientes del período actual que ya tenían órdenes previas.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <div
          className="relative bg-white border-slate-200 px-4 py-3 rounded-xl text-left flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleTooltip("services")}
        >
          <div>
            <div className="border-b border-gray-100 pb-1.5 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Preferencias de Entrega</h3>
              <div
                className={`flex items-center gap-1 transition-colors ${
                  activeMetricTooltip === "services"
                    ? "text-blue-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider">Detalles</span>
                <Info className="w-3 h-3" />
              </div>
            </div>
          </div>
          {activeMetricTooltip === "services" && (
            <div className="absolute z-10 left-4 right-4 top-10 mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                Distribución de los servicios completados según la preferencia de entrega.
              </p>
            </div>
          )}
          <div className="mt-2 w-full flex-1 flex flex-col justify-center">
            <ServicePreferenceChart preferences={metrics.servicePreferences} />
          </div>
        </div>

        <div
          className="relative bg-white border-slate-200 px-4 py-3 rounded-xl text-left flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleTooltip("frequencies")}
        >
          <div>
            <div className="border-b border-gray-100 pb-1.5 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Frecuencia de Pedidos</h3>
              <div
                className={`flex items-center gap-1 transition-colors ${
                  activeMetricTooltip === "frequencies"
                    ? "text-blue-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider">Detalles</span>
                <Info className="w-3 h-3" />
              </div>
            </div>
          </div>
          {activeMetricTooltip === "frequencies" && (
            <div className="absolute z-10 left-4 right-4 top-10 mt-1 bg-slate-800 p-2 border border-slate-700">
              <p className="text-[10px] text-white leading-tight">
                Clasificación de clientes según las órdenes completadas en los últimos 30 días.
              </p>
            </div>
          )}
          <div className="mt-2 w-full flex-1 flex flex-col justify-center">
            <CustomerFrequencyChart frequency={metrics.customerFrequency} />
          </div>
        </div>
      </div>
    </div>
  );
}
