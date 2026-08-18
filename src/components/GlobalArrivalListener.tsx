import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { triggerLocalNotification } from "../utils/pushNotifications";
import { BellRing, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ArrivalListenerProps {
  userRole: string;
}

export default function GlobalArrivalListener({ userRole }: ArrivalListenerProps) {
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    bagId: string;
    userName: string;
    deliveryPreference: string;
    timeStr: string;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Only associates and admins should listen to customer arrival events
    if (userRole !== "associate" && userRole !== "admin") return;

    const initialLoadTime = Date.now();
    const q = query(
      collection(db, "arrival_notices"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const docCreatedTime = new Date(data.createdAt || data.timestamp).getTime();

          // If the event happened recently (after app loaded or within the last 60s)
          if (docCreatedTime > initialLoadTime - 5000) {
            const timeStr = new Date(data.timestamp || data.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit"
            });

            // Play notification sound if possible
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
              // AudioContext might require user gesture first
            }

            // Trigger native device push / local notification
            triggerLocalNotification(
              "🧺 ¡Cliente en Camino! - SOMOS",
              `${data.userName || "Cliente"} va en camino a dejar el cesto #${data.bagId} (${data.deliveryPreference || "Estándar"}).`,
              `/cesto/${data.bagId}`
            );

            // Trigger floating in-app popup for associate
            setActiveAlert({
              id: change.doc.id,
              bagId: data.bagId,
              userName: data.userName || "Cliente Registrado",
              deliveryPreference: data.deliveryPreference || "Estándar (48 h)",
              timeStr
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [userRole]);

  if (!activeAlert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-2 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>
        
        <div className="flex-1 space-y-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">¡Cliente en Camino!</span>
            <span className="text-[10px] text-slate-400">{activeAlert.timeStr}</span>
          </div>
          <p className="text-xs font-bold text-slate-100">{activeAlert.userName}</p>
          <p className="text-[11px] text-slate-300">Cesto #{activeAlert.bagId} • {activeAlert.deliveryPreference}</p>
          
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                navigate(`/cesto/${activeAlert.bagId}`);
                setActiveAlert(null);
              }}
              className="px-3 py-1.5 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver y Recibir Cesto</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
