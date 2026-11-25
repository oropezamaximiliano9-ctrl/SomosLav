import { ArrowLeft, Edit2, Loader2, ChevronRight } from "lucide-react";

interface CustomerDetailModalProps {
  selectedCustomer: any;
  customerOrders: any[];
  loadingCustOrders: boolean;
  editingCustomer: any | null;
  setEditingCustomer: (c: any | null) => void;
  savingCustomer: boolean;
  onBack: () => void;
  onSelectOrder: (order: any) => void;
  onSaveCustomerDetails: (customer: any) => Promise<void>;
  formatBagId: (id: string) => string;
}

export function CustomerDetailModal({
  selectedCustomer,
  customerOrders,
  loadingCustOrders,
  editingCustomer,
  setEditingCustomer,
  savingCustomer,
  onBack,
  onSelectOrder,
  onSaveCustomerDetails,
  formatBagId
}: CustomerDetailModalProps) {
  if (!selectedCustomer) return null;

  return (
    <div className="space-y-6 w-full text-left pb-10">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <span className="text-[9px] uppercase font-bold text-blue-600 font-mono tracking-wider">
            Historial de Cliente
          </span>
          <h3 className="font-semibold text-lg text-gray-900 leading-none">
            {selectedCustomer.name}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Profile details */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-widest font-mono">
                Datos de Cliente
              </h4>
              <button
                onClick={() => setEditingCustomer(selectedCustomer)}
                className="text-xs font-bold text-[#0f55d8] hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Editar Datos
              </button>
            </div>
            <div className="space-y-3 text-[13px] text-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">
                  Contacto:
                </span>
                <span className="font-mono text-gray-900 font-medium">
                  {selectedCustomer.phone}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">
                  Dirección:
                </span>
                <span className="text-gray-900 font-bold">
                  {selectedCustomer.addressCalle || "Sin calle registrada"}
                </span>
                {selectedCustomer.addressCalle?.trim() !==
                  (selectedCustomer.addressColonia || "").trim() && (
                  <span className="text-gray-500 block text-xs mt-0.5">
                    Colonia: {selectedCustomer.addressColonia || "Mostrador / General"}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">
                  Preferencia de Entrega:
                </span>
                <span
                  translate="no"
                  className={`notranslate ${
                    selectedCustomer.orderCount === 0
                      ? "text-gray-400 italic text-xs block font-medium"
                      : "text-gray-950 font-semibold"
                  }`}
                >
                  {selectedCustomer.orderCount === 0
                    ? "No seleccionada aún (Pendiente de visita al punto)"
                    : selectedCustomer.deliveryPreference || "24 horas"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">
                  Horario de Entrega:
                </span>
                <span
                  className={
                    selectedCustomer.orderCount === 0
                      ? "text-gray-400 italic text-xs block font-medium"
                      : "text-gray-950 font-semibold"
                  }
                >
                  {selectedCustomer.orderCount === 0
                    ? "No especificado (Pendiente de visita al punto)"
                    : selectedCustomer.preferredTime || "No especificado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: History list */}
        <div className="md:col-span-7 bg-white border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wider font-mono">
              Historial de Órdenes ({customerOrders.length})
            </h4>
          </div>

          {loadingCustOrders ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12 italic text-sm">
              Este cliente no tiene órdenes registradas aún.
            </div>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((o) => (
                <div
                  key={o.id}
                  className="group p-4 border bg-slate-50/50 hover:bg-slate-50/90 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm transition-all rounded-xl cursor-pointer"
                  onClick={() => onSelectOrder(o)}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        #{String(o.id || "").padStart(4, "0")}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          o.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : o.status === "processing"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {o.status === "completed"
                          ? "● Completada"
                          : o.status === "processing"
                          ? "● Procesando"
                          : "● Pendiente"}
                      </span>
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
                          year: "numeric"
                        })}
                      </span>
                      <span className="text-xs font-medium">
                        {new Date(o.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 select-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-md transition-colors group-hover:bg-slate-100/60 group-hover:text-slate-700 font-mono">
                        DESGLOSE
                      </span>
                      <div className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editing Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-md p-6 flex flex-col items-stretch text-left">
            <h2 className="text-sm font-bold mb-4 font-mono uppercase tracking-widest text-slate-800">
              Editar Perfil de Cliente
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveCustomerDetails(editingCustomer);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                  Nombre
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                  value={editingCustomer.name || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                  Teléfono
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                  value={editingCustomer.phone || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                  Calle y Número
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                  value={editingCustomer.addressCalle || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, addressCalle: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                  Colonia
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-slate-50 focus:bg-white"
                  value={editingCustomer.addressColonia || ""}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      addressColonia: e.target.value
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="flex-1 py-2 rounded-xl bg-[#0f55d8] text-white hover:bg-[#0d4bc0] text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {savingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
