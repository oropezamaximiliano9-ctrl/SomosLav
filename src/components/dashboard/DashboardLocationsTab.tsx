import { FormEvent } from "react";
import { ArrowLeft, ChevronRight, Edit2, MapPin, PackageSearch, Plus } from "lucide-react";
import { LocationModal } from "./LocationModal";

interface DashboardLocationsTabProps {
  locations: any[];
  orders: any[];
  selectedLocation: any | null;
  setSelectedLocation: (loc: any | null) => void;
  showLocModal: boolean;
  setShowLocModal: (show: boolean) => void;
  editingLoc: any;
  setEditingLoc: (loc: any) => void;
  savingLoc: boolean;
  onSaveLocation: (e: FormEvent) => Promise<void>;
  updatingOrderId: string | null;
  onUpdateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
}

export function DashboardLocationsTab({
  locations,
  orders,
  selectedLocation,
  setSelectedLocation,
  showLocModal,
  setShowLocModal,
  editingLoc,
  setEditingLoc,
  savingLoc,
  onSaveLocation,
  updatingOrderId,
  onUpdateOrderStatus,
}: DashboardLocationsTabProps) {
  if (selectedLocation) {
    return (
      <div key="location-detail" className="space-y-4 w-full">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setSelectedLocation(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              {selectedLocation.name}
            </h3>
            <p className="text-xs text-gray-500">{selectedLocation.address}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-none p-5 space-y-4">
          <h4 className="font-medium text-sm text-gray-700 border-b border-gray-50 pb-2 text-left">
            Órdenes en esta ubicación (Simulado)
          </h4>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 space-y-4 py-8">
              <PackageSearch className="w-10 h-10 opacity-20" />
              <p className="text-sm">No hay órdenes registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 bg-gray-50/50 rounded-none gap-4"
                >
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{o.userName}</p>
                      <div className="relative">
                        <select
                          value={o.status}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value)}
                          disabled={updatingOrderId === o.id}
                          className={`text-[10px] font-bold border px-1.5 py-0.5 pr-5.5 rounded tracking-wide capitalize cursor-pointer appearance-none outline-none transition-all ${
                            o.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100/50"
                              : o.status === "processing"
                              ? "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/50"
                              : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50"
                          }`}
                        >
                          <option value="pending">⏳ Pendiente</option>
                          <option value="processing">⚙️ Procesando</option>
                          <option value="completed">✅ Completado</option>
                        </select>
                        <div
                          className={`pointer-events-none absolute inset-y-0 right-1 flex items-center text-[7px] ${
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
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                      <span>{o.bagId}</span>
                      <span>•</span>
                      <span>
                        {new Date(o.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>•</span>
                      <span translate="no" className="notranslate">
                        {o.deliveryType || "Estándar"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className="text-xs text-gray-400 font-mono">
                      #{String(o.id || "").padStart(4, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div key="locations-list" className="space-y-4 w-full">
      <div className="flex justify-between items-center bg-white border border-gray-100 rounded-none p-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-left">Sucursales Activas</h3>
          <p className="text-xs text-gray-500 text-left">Administra los puntos de recolección</p>
        </div>
        <button
          onClick={() => {
            setEditingLoc({ name: "", address: "", isActive: true });
            setShowLocModal(true);
          }}
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span className="inline">Nuevo Punto</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-white border text-left border-gray-100 rounded-none p-4 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-all group"
            onClick={() => setSelectedLocation(loc)}
          >
            <div>
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                {loc.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">{loc.address}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingLoc(loc);
                  setShowLocModal(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
            </div>
          </div>
        ))}
      </div>

      {showLocModal && (
        <LocationModal
          editingLoc={editingLoc}
          setEditingLoc={setEditingLoc}
          onSave={onSaveLocation}
          onClose={() => setShowLocModal(false)}
          savingLoc={savingLoc}
        />
      )}
    </div>
  );
}
