import { ArrowDown } from "lucide-react";

export interface WaterfallData {
  baseRevenue: number;
  upsellRevenue: number;
  suppliesCost: number;
  operationsCost: number;
  logisticsCost: number;
  fixedCosts: number;
  isHomeDelivery: boolean;
}

export function OrderWaterfall({ data }: { data: WaterfallData }) {
  const totalRevenue = data.baseRevenue + data.upsellRevenue;
  const totalVariableCosts = data.suppliesCost + data.operationsCost + data.logisticsCost;
  const contributionMargin = totalRevenue - totalVariableCosts;
  const netMargin = contributionMargin - data.fixedCosts;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        
        {/* Header */}
        <div className="grid grid-cols-12 items-center text-sm font-semibold text-gray-900 pb-3 mb-3 border-b border-gray-200">
          <div className="col-span-4">Concepto</div>
          <div className="col-span-5 text-center">Desglose</div>
          <div className="col-span-3 text-right">Valor</div>
        </div>

        {/* Ingresos Section */}
        <div className="grid grid-cols-12 items-center py-3">
          <div className="col-span-4 font-medium text-gray-900">Ingresos</div>
          <div className="col-span-5"></div>
          <div className="col-span-3 text-right font-medium text-emerald-600">{formatCurrency(totalRevenue)}</div>
        </div>
        
        <div className="grid grid-cols-12 items-center py-2 text-sm border-b border-gray-200">
          <div className="col-span-4"></div>
          <div className="col-span-5 text-center text-sm text-gray-500">Carga Estándar</div>
          <div className="col-span-3 text-right text-gray-700">{formatCurrency(data.baseRevenue)}</div>
        </div>
                
        {/* Costos Variables Section */}
        <div className="grid grid-cols-12 items-center py-3 mt-2">
          <div className="col-span-4 font-medium text-gray-900">
            Costos V.
          </div>
          <div className="col-span-5"></div>
          <div className="col-span-3 text-right font-medium text-rose-600">-{formatCurrency(totalVariableCosts)}</div>
        </div>

        <div className="grid grid-cols-12 items-center py-2 text-sm">
          <div className="col-span-4"></div>
          <div className="col-span-5 text-center text-sm text-gray-500">Insumos</div>
          <div className="col-span-3 text-right text-gray-700">-{formatCurrency(data.suppliesCost)}</div>
        </div>

        <div className="grid grid-cols-12 items-center py-2 text-sm">
          <div className="col-span-4"></div>
          <div className="col-span-5 text-center text-sm text-gray-500">Servicios</div>
          <div className="col-span-3 text-right text-gray-700">-{formatCurrency(data.operationsCost)}</div>
        </div>

        <div className="grid grid-cols-12 items-center py-2 text-sm border-b border-gray-200">
          <div className="col-span-4"></div>
          <div className="col-span-5 text-center text-sm text-gray-500">Logística</div>
          <div className={`col-span-3 text-right ${!data.isHomeDelivery ? 'text-gray-400 opacity-60' : 'text-gray-700'}`}>
            -{formatCurrency(data.logisticsCost)}
          </div>
        </div>
        
        {/* Margen de Contribucion */}
        <div className="grid grid-cols-12 items-center py-3 mt-2 border-b border-gray-200">
          <div className="col-span-4 font-medium text-gray-900">Margen B.</div>
          <div className="col-span-5 text-center text-sm text-gray-500">(Ingresos - Costos V.)</div>
          <div className="col-span-3 text-right font-medium text-gray-900">{formatCurrency(contributionMargin)}</div>
        </div>

        <div className="grid grid-cols-12 items-center py-3 mt-2 border-b border-gray-200">
          <div className="col-span-4 font-medium text-gray-900">
            Costos F.
          </div>
          <div className="col-span-5 text-center text-sm text-gray-500">Overhead prorrateado</div>
          <div className="col-span-3 text-right font-medium text-rose-600">-{formatCurrency(data.fixedCosts)}</div>
        </div>

        {/* Margen Neto */}
        <div className="grid grid-cols-12 items-center py-3 mt-2">
          <div className="col-span-4 font-bold text-gray-900">Margen N.</div>
          <div className="col-span-5 text-center text-sm text-gray-500">Ganancia real</div>
          <div className="col-span-3 text-right font-bold text-emerald-600">{formatCurrency(netMargin)}</div>
        </div>

      </div>
    </div>
  );
}
