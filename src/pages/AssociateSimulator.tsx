import { Play } from "lucide-react";
import FlowSimulator from "../components/FlowSimulator";
import PushNotificationBanner from "../components/PushNotificationBanner";
import { useContext } from "react";
import { RoleContext } from "../App";

export default function AssociateSimulator() {
  const { role } = useContext(RoleContext);

  return (
    <div className="flex-1 flex flex-col pt-4 animate-in fade-in h-full pb-12 overflow-y-auto select-none">
      <div className="w-full max-w-md mx-auto px-4 pb-12 mt-4">
        
        {/* Push Notification Panel */}
        <PushNotificationBanner userRole={role} userName="Asociado Sucursal" />

        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <Play className="w-8 h-8 text-amber-500 mb-1" />
          <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase">Simulador</h1>
        </div>

        {/* Content Card Wrapper */}
        <div className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-xs">
          <FlowSimulator />
        </div>
      </div>
    </div>
  );
}
