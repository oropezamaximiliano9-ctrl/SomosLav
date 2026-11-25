import { Loader2, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface DashboardQrCodesTabProps {
  bags: any[];
  creatingBag: boolean;
  onCreateBag: () => Promise<void>;
  onSelectQRBag: (bag: any) => void;
}

export function DashboardQrCodesTab({
  bags,
  creatingBag,
  onCreateBag,
  onSelectQRBag,
}: DashboardQrCodesTabProps) {
  const unassignedBags = bags.filter((b) => b.status === "unassigned");
  const assignedBags = bags.filter((b) => b.status === "assigned");

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="flex justify-between items-center bg-white border border-gray-100 rounded-none p-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-left">
            Generador de QR para Cestos
          </h3>
          <p className="text-xs text-gray-500 text-left">
            Imprime los siguientes códigos para pegarlos en los cestos físicos.
          </p>
        </div>
        <button
          onClick={onCreateBag}
          disabled={creatingBag}
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex-shrink-0 ml-4"
        >
          {creatingBag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="inline">Nuevo Cesto</span>
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-none p-5 space-y-4">
        <h4 className="font-medium text-gray-800 text-left border-b border-gray-100 pb-2">
          Cestos Sin Asignar
        </h4>
        {unassignedBags.length === 0 ? (
          <p className="text-sm text-gray-400 text-left py-4">No hay cestos sin asignar.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
            {unassignedBags.map((bag) => {
              const qrUrl = `${window.location.origin}/cesto/${bag.id}`;
              return (
                <div
                  key={bag.id}
                  onClick={() => onSelectQRBag(bag)}
                  className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-none bg-gray-50 cursor-pointer hover:border-blue-200"
                >
                  <div className="p-2 bg-white rounded-none mb-2 pointer-events-none">
                    <QRCodeSVG value={qrUrl} size={80} />
                  </div>
                  <span className="font-mono text-xs font-semibold text-gray-800">{bag.id}</span>
                  <span className="text-[10px] text-gray-500 mt-1 uppercase">Sin Asignar</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-none p-5 space-y-4">
        <h4 className="font-medium text-gray-800 text-left border-b border-gray-100 pb-2">
          Cestos Asignados
        </h4>
        {assignedBags.length === 0 ? (
          <p className="text-sm text-gray-400 text-left py-4">
            No hay cestos asignados a órdenes actualmente.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2 cursor-pointer">
            {assignedBags.map((bag) => {
              const qrUrl = `${window.location.origin}/cesto/${bag.id}`;
              return (
                <div
                  key={bag.id}
                  onClick={() => onSelectQRBag(bag)}
                  className="flex flex-col items-center justify-center p-4 border border-blue-50 rounded-none bg-blue-50/30 cursor-pointer hover:border-blue-200"
                >
                  <div className="p-2 bg-white rounded-none mb-2 pointer-events-none">
                    <QRCodeSVG value={qrUrl} size={80} />
                  </div>
                  <span className="font-mono text-xs font-semibold text-gray-800">{bag.id}</span>
                  <span className="text-[10px] text-blue-600 mt-1 uppercase font-medium">
                    Asignada
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
