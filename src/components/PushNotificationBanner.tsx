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
      <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mb-4 animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950 leading-tight">Alertas de llegada activadas 🔔</p>
            <p className="text-[11px] text-emerald-700 font-medium">Este celular sonará cuando un cliente avise que viene en camino.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testSent}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <span>{testSent ? "¡Enviando alerta...!" : "Probar notificación ahora"}</span>
        </button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 px-4 flex items-center gap-3 mb-4 text-left">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Notificaciones bloqueadas en el navegador</p>
          <p className="text-[11px] text-amber-700">Para recibir alertas con la pantalla apagada, activa los permisos en la configuración del sitio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-r from-blue-900 to-[#0f55d8] text-white rounded-2xl p-4 shadow-md mb-4 text-left relative overflow-hidden animate-in fade-in">
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <BellRing className="w-5 h-5 text-amber-300 animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold">Activar Alertas al Celular</span>
              <span className="px-1.5 py-0.5 bg-amber-400 text-blue-950 font-black text-[9px] rounded uppercase tracking-wider">
                Exclusivo Personal
              </span>
            </div>
            <p className="text-xs text-blue-100 font-medium leading-relaxed">
              Recibe avisos sonoros instantáneos en la pantalla de bloqueo cuando los clientes vengan en camino a dejar su cesto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-blue-50 text-[#0f55d8] rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>{loading ? "Activando..." : "Activar en este celular"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
