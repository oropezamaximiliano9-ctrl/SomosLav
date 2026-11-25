import { Download } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

interface QrBagModalProps {
  selectedQRBag: any;
  onClose: () => void;
  onExportPdf: (bagId: string) => void;
}

export function QrBagModal({
  selectedQRBag,
  onClose,
  onExportPdf
}: QrBagModalProps) {
  if (!selectedQRBag) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none w-full max-w-sm overflow-hidden p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
            {selectedQRBag.id}
          </h2>
          <div className="p-6 bg-white border border-gray-100 rounded-none relative">
            <QRCodeSVG
              value={`${window.location.origin}/cesto/${selectedQRBag.id}`}
              size={240}
            />
            {/* Hidden high-res canvas used for generating crisp PDF vector graphics */}
            <div style={{ display: "none" }}>
              <QRCodeCanvas
                id="qr-canvas-hidden"
                value={`${window.location.origin}/cesto/${selectedQRBag.id}`}
                size={400}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span
              className={`text-sm font-medium uppercase tracking-wider ${
                selectedQRBag.status === "assigned"
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {selectedQRBag.status === "assigned" ? "Asignada" : "Sin Asignar"}
            </span>
            {selectedQRBag.status === "assigned" ? (
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold text-gray-800 text-center px-4">
                  {selectedQRBag.userName || "Cliente Asignado"}
                </p>
                {selectedQRBag.assignedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Asignado:{" "}
                    {new Date(selectedQRBag.assignedAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center px-4">
                Sin cliente asignado
              </p>
            )}
          </div>

          <div className="w-full space-y-2 mt-4">
            <button
              onClick={() => onExportPdf(selectedQRBag.id)}
              className="w-full py-3 bg-[#0f55d8] text-white font-bold rounded-xl hover:bg-[#0d4bc0] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Etiqueta PDF
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
              autoFocus
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
