import { Play } from "lucide-react";
import FlowSimulator from "../components/FlowSimulator";

export default function AssociateSimulator() {
  return (
    <div className="flex-1 flex flex-col pt-4 animate-in fade-in h-full pb-12 overflow-y-auto select-none">
      <div className="w-full max-w-md mx-auto px-4 pb-12 mt-4">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <Play className="w-8 h-8 text-amber-500 mb-1" />
          <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase">Simulador</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed text-left">
          Usa este panel interactivo para simular el proceso de recepción, vinculación de códigos de barras (QR) y generación automática de tickets sin depender de escaneos físicos.
        </p>

        {/* Content Card Wrapper */}
        <div className="overflow-hidden bg-white rounded-none border border-gray-100">
          <FlowSimulator />
        </div>
      </div>
    </div>
  );
}
