import { useState, useEffect } from "react";
import { Bell, BellRing, Check, ShieldAlert, Smartphone } from "lucide-react";
import { requestNotificationPermissionAndSubscribe, triggerLocalNotification } from "../utils/pushNotifications";

interface PushNotificationBannerProps {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export default function PushNotificationBanner({
  userId = "associate_default",
  userRole = "associate",
  userName = "Asociado SOMOS"
}: PushNotificationBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setSubscribed(true);
      }
    }
  }, []);

  if (dismissed || userRole === "customer") {
    return null;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermissionAndSubscribe(userId, userRole, userName);
      if (result.success) {
        setPermission("granted");
        setSubscribed(true);
      } else if (result.permission) {
        setPermission(result.permission);
      }
    } finally {
      setLoading(false);
    }
  };

  const [testSent, setTestSent] = useState(false);

  const handleTestNotification = async () => {
    setTestSent(true);
    // Play test chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio test failed:", e);
    }

    await triggerLocalNotification(
      "🧺 ¡Prueba de Alerta Exitosa! - SOMOS",
      "Las notificaciones push en tu iPhone están funcionando correctamente."
    );

    setTimeout(() => setTestSent(false), 3000);
  };

  if (subscribed && permission === "granted") {
    return (
      <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-2xs mb-4 animate-in fade-in">
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
    <div className="mb-4 animate-in fade-in">
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
