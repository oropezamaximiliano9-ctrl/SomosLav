import { ChevronDown, ChevronRight, PackageSearch } from "lucide-react";
import { OrderFinancialBreakdown } from "./OrderFinancialBreakdown";
import { formatBagId } from "../../utils/dashboardMetrics";

interface DashboardOrdersTabProps {
  orders: any[];
  orderFilter: "all" | "pending" | "processing" | "completed";
  setOrderFilter: (filter: "all" | "pending" | "processing" | "completed") => void;
  selectedOrder: any | null;
  setSelectedOrder: (order: any | null) => void;
  updatingOrderId: string | null;
  onUpdateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
}

export function DashboardOrdersTab({
  orders,
  orderFilter,
  setOrderFilter,
  selectedOrder,
  setSelectedOrder,
  updatingOrderId,
  onUpdateOrderStatus,
}: DashboardOrdersTabProps) {
  if (selectedOrder) {
    return (
      <OrderFinancialBreakdown
        selectedOrder={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  const countAll = orders.length;
  const countPending = orders.filter((o) => o.status === "pending").length;
  const countProcessing = orders.filter((o) => o.status === "processing").length;
  const countCompleted = orders.filter((o) => o.status === "completed").length;

  const filteredOrders = orders.filter(
    (o) => orderFilter === "all" || o.status === orderFilter
  );

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-end pt-1 pb-1">
        <div className="relative">
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value as any)}
            className="appearance-none bg-white border border-gray-200 px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer leading-none"
          >
            <option value="all">Todas ({countAll})</option>
            <option value="pending">Pendientes ({countPending})</option>
            <option value="processing">Procesando ({countProcessing})</option>
            <option value="completed">Completadas ({countCompleted})</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 space-y-4 py-16 bg-white border border-gray-100 rounded-none">
          <PackageSearch className="w-12 h-12 opacity-20" />
          <p className="text-sm">No se encontraron órdenes con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="group p-4 bg-white hover:bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-none border border-slate-100 text-left cursor-pointer"
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName.toLowerCase() !== "select") {
                  setSelectedOrder(o);
                }
              }}
            >
              <div className="space-y-2 text-left w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pb-0.5">
                  <p className="font-bold text-slate-800 text-[14px]">{o.userName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      #{String(o.id || "").padStart(4, "0")}
                    </span>
                    <div className="relative">
                      <select
                        value={o.status}
                        onChange={(e) => onUpdateOrderStatus(o.id, e.target.value)}
                        disabled={updatingOrderId === o.id}
                        className={`text-xs font-medium px-2 py-0.5 pr-5.5 rounded-full border cursor-pointer appearance-none outline-none transition-all ${
                          o.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                            : o.status === "processing"
                            ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/50"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50"
                        }`}
                      >
                        <option value="pending">● Pendiente</option>
                        <option value="processing">● Procesando</option>
                        <option value="completed">● Completada</option>
                      </select>
                      <div
                        className={`pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[7px] ${
                          o.status === "completed"
                            ? "text-emerald-500"
                            : o.status === "processing"
                            ? "text-sky-500"
                            : "text-amber-500"
                        }`}
                      >
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-medium flex flex-wrap gap-x-3 gap-y-1">
                  <span>Cesto: {formatBagId(o.bagId)}</span>
                  <span className="text-slate-300">•</span>
                  <span translate="no" className="notranslate">
                    Plan: {o.deliveryType || "Estándar"}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between sm:justify-end gap-x-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto shrink-0">
                <div className="flex items-center gap-x-4 text-left sm:text-right">
                  <span className="text-xs font-medium">
                    {new Date(o.createdAt).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs font-medium">
                    {new Date(o.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 select-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md transition-colors group-hover:bg-slate-100/60 group-hover:text-slate-700 font-mono">
                    DESGLOSE
                  </span>
                  <div className="p-1.5 rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
