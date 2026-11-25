import { useState, useEffect } from "react";
import { BellRing, Check, ShieldAlert } from "lucide-react";
import { requestNotificationPermissionAndSubscribe, triggerLocalNotification } from "../utils/pushNotifications";
import { playArrivalChime } from "../utils/audio";

interface PushNotificationBannerProps {
  userRole?: string;
  userName?: string;
}

export default function PushNotificationBanner({
  userRole = "associate",
  userName = "Asociado SOMOS"
}: PushNotificationBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (userRole === "customer") {
    return null;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermissionAndSubscribe("associate_default", userRole, userName);
      if (result.success) {
        setPermission("granted");
      } else if (result.permission) {
        setPermission(result.permission);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    playArrivalChime();

    await triggerLocalNotification(
      "🧺 ¡Prueba de Alerta Exitosa! - SOMOS",
      "Las notificaciones push en tu iPhone están funcionando correctamente."
    );

    setTimeout(() => setTestSent(false), 3000);
  };

  if (permission === "granted") {
    return (
      <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-2xs mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-emerald-950">Alertas activadas 🔔</span>
        </div>
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testSent}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <span>{testSent ? "¡Probando...!" : "Probar alerta"}</span>
        </button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 px-3 flex items-center gap-2.5 mb-4 text-left">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-xs font-semibold text-amber-900">Notificaciones bloqueadas en el navegador</span>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full py-3 px-4 bg-linear-to-r from-blue-900 to-[#0f55d8] hover:from-blue-950 hover:to-[#0c48b8] active:scale-[0.99] text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
      >
        <BellRing className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>{loading ? "Activando..." : "Activar Alertas de Llegada"}</span>
      </button>
    </div>
  );
}
