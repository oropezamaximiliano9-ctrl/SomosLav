import { ChevronRight, MapPin, Users } from "lucide-react";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { formatBagId } from "../../utils/dashboardMetrics";

interface DashboardCustomersTabProps {
  customers: any[];
  selectedCustomer: any | null;
  customerOrders: any[];
  loadingCustOrders: boolean;
  editingCustomer: any | null;
  setEditingCustomer: (c: any | null) => void;
  savingCustomer: boolean;
  onSelectCustomer: (cust: any) => Promise<void>;
  onBackFromCustomer: () => void;
  onOpenOrderBreakdown: (order: any) => void;
  onSaveCustomerDetails: (customer: any) => Promise<void>;
}

export function DashboardCustomersTab({
  customers,
  selectedCustomer,
  customerOrders,
  loadingCustOrders,
  editingCustomer,
  setEditingCustomer,
  savingCustomer,
  onSelectCustomer,
  onBackFromCustomer,
  onOpenOrderBreakdown,
  onSaveCustomerDetails,
}: DashboardCustomersTabProps) {
  if (selectedCustomer) {
    return (
      <CustomerDetailModal
        selectedCustomer={selectedCustomer}
        customerOrders={customerOrders}
        loadingCustOrders={loadingCustOrders}
        editingCustomer={editingCustomer}
        setEditingCustomer={setEditingCustomer}
        savingCustomer={savingCustomer}
        onBack={onBackFromCustomer}
        onSelectOrder={onOpenOrderBreakdown}
        onSaveCustomerDetails={onSaveCustomerDetails}
        formatBagId={formatBagId}
      />
    );
  }

  return (
    <div className="space-y-4 w-full">
      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-12 bg-white border border-gray-100">
          <Users className="w-12 h-12 opacity-25 mb-3" />
          <p className="text-sm">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((cust) => (
            <div
              key={cust.id}
              onClick={() => onSelectCustomer(cust)}
              className="group p-4 bg-white hover:bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-xl border border-slate-100 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5 text-left w-full sm:flex-1 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 border flex items-center justify-center font-bold text-slate-600 text-xs tracking-wider select-none transition-colors group-hover:bg-white group-hover:border-slate-200">
                  {cust.name ? cust.name.substring(0, 2).toUpperCase() : "CL"}
                </div>
                <div className="space-y-1 text-left min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-[14px] leading-tight tracking-tight truncate">
                    {cust.name}
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600 break-words leading-normal">
                      {cust.addressCalle ? (
                        cust.addressCalle.trim() === (cust.addressColonia || "").trim()
                          ? `${cust.addressCalle} ${cust.addressNumero || ""}`.trim()
                          : `${cust.addressCalle} ${cust.addressNumero || ""} ${
                              cust.addressColonia ? `• Col. ${cust.addressColonia}` : ""
                            }`.trim()
                      ) : (
                        <span className="text-slate-400 italic font-normal">
                          Mostrador / Entrega en sucursal
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 select-none pt-2 sm:pt-0 border-t sm:border-0 border-slate-100/50 w-full sm:w-auto justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md transition-colors group-hover:bg-slate-100/60 group-hover:text-slate-700 font-mono">
                  HISTORIAL
                </span>
                <div className="p-1.5 rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
