import { FormEvent } from "react";
import { Loader2 } from "lucide-react";

interface LocationModalProps {
  editingLoc: any;
  setEditingLoc: (loc: any) => void;
  onSave: (e: FormEvent) => Promise<void>;
  onClose: () => void;
  savingLoc: boolean;
}

export function LocationModal({
  editingLoc,
  setEditingLoc,
  onSave,
  onClose,
  savingLoc
}: LocationModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-none w-full max-w-md p-6 flex flex-col items-stretch text-left">
        <h2 className="text-xl font-bold mb-4">
          {editingLoc?.id ? "Editar Punto" : "Nuevo Punto de Recolección"}
        </h2>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
              Nombre
            </label>
            <input
              required
              type="text"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
              value={editingLoc?.name || ""}
              onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
              placeholder="Ej. Sucursal Roma"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
              Dirección
            </label>
            <input
              required
              type="text"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
              value={editingLoc?.address || ""}
              onChange={(e) => setEditingLoc({ ...editingLoc, address: e.target.value })}
              placeholder="Ej. Álvaro Obregón 123"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700">Punto Activo</label>
            <input
              type="checkbox"
              checked={editingLoc?.isActive === true || editingLoc?.isActive === 1}
              onChange={(e) => setEditingLoc({ ...editingLoc, isActive: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-4 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingLoc}
              className="flex-1 p-4 rounded-xl font-bold bg-[#0f55d8] text-white hover:bg-[#0d4bc0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingLoc && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
