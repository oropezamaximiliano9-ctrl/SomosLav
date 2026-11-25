import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { doc, getDoc, updateDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { RoleContext } from "../App";
import { db } from "../firebase";
import { getColoniaDistance } from "../utils/distance";
import { triggerLocalNotification } from "../utils/pushNotifications";
import { playArrivalChime } from "../utils/audio";
import { BagCustomerArrivalView } from "../components/bagflow/BagCustomerArrivalView";
import { BagProcessingAndDeliveryView } from "../components/bagflow/BagProcessingAndDeliveryView";
import { BagReceiptTicket } from "../components/bagflow/BagReceiptTicket";
import { BagConfirmReceptionView } from "../components/bagflow/BagConfirmReceptionView";

export default function BagFlow() {
  const { id } = useParams<{ id: string }>();
  const { role, setRole } = useContext(RoleContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bag, setBag] = useState<any>(null);
  const [error, setError] = useState("");

  const [whatsappUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [confirmedOrderData, setConfirmedOrderData] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Associate state
  const [receiving, setReceiving] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showDeliverySuccess, setShowDeliverySuccess] = useState(false);
  const [prefTime, setPrefTime] = useState("Mañana (8:00 AM – 10:00 AM)");

  const [washMinutes, setWashMinutes] = useState("");
  const [dryMinutes, setDryMinutes] = useState("");
  const [weightKilos, setWeightKilos] = useState("");
  const [transportKm, setTransportKm] = useState("");
  const [startingProcess, setStartingProcess] = useState(false);

  // Customer arrival notification state
  const [notifyingArrival, setNotifyingArrival] = useState(false);
  const [arrivalNotified, setArrivalNotified] = useState(false);

  useEffect(() => {
    if (!bag) return;

    if (bag.user?.preferredTime) {
      setPrefTime(bag.user.preferredTime);
    }

    if (bag.activeOrder?.financialCalc?.transportKm !== undefined && bag.activeOrder?.financialCalc?.transportKm !== "") {
      setTransportKm(String(bag.activeOrder.financialCalc.transportKm));
    } else {
      const userDist =
        bag.user?.distanceKm ??
        (bag.user?.addressColonia ? getColoniaDistance(bag.user.addressColonia) : null) ??
        localStorage.getItem("user_distance_km");
      if (userDist !== null && userDist !== undefined && userDist !== "") {
        setTransportKm(String(userDist));
      }
    }

    if (bag.activeOrder?.financialCalc) {
      if (bag.activeOrder.financialCalc.washMinutes) setWashMinutes(String(bag.activeOrder.financialCalc.washMinutes));
      if (bag.activeOrder.financialCalc.dryMinutes) setDryMinutes(String(bag.activeOrder.financialCalc.dryMinutes));
      if (bag.activeOrder.financialCalc.weightKilos) setWeightKilos(String(bag.activeOrder.financialCalc.weightKilos));
    }
  }, [bag]);

  useEffect(() => {
    fetchBag();
  }, [id, orderConfirmed]);

  useEffect(() => {
    if (!orderConfirmed) return;
    setIsPrinting(true);
    const timer = setTimeout(() => setIsPrinting(false), 1500);
    return () => clearTimeout(timer);
  }, [orderConfirmed]);

  const fetchBag = async () => {
    setLoading(true);
    try {
      if (!id) throw new Error("ID de cesto es requerido");
      const bagSnap = await getDoc(doc(db, "bags", id));
      if (!bagSnap.exists()) {
        throw new Error("Cesto no encontrado en la base de datos.");
      }

      const bagData = bagSnap.data() as any;
      let userData: any = null;
      let activeOrder: any = null;
      let latestNotice: any = null;

      if (bagData.status === "assigned" && bagData.userId) {
        const userSnap = await getDoc(doc(db, "users", bagData.userId));
        userData = userSnap.exists() ? userSnap.data() : null;

        const ordersSnap = await getDocs(collection(db, "orders"));
        let latestCreatedAt = 0;
        ordersSnap.forEach((oSnap) => {
          const data = oSnap.data();
          if (data.bagId === id && data.status !== "completed") {
            const creationTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
            if (creationTime > latestCreatedAt) {
              latestCreatedAt = creationTime;
              activeOrder = data;
            }
          }
        });

        const noticesSnap = await getDocs(collection(db, "arrival_notices"));
        let latestNoticeTime = 0;
        noticesSnap.forEach((nSnap) => {
          const nData = nSnap.data();
          if (nData.bagId === id && nData.status !== "dismissed" && nData.status !== "attended") {
            const time = nData.timestamp ? new Date(nData.timestamp).getTime() : 0;
            if (time > latestNoticeTime && Date.now() - time < 4 * 60 * 60 * 1000) {
              latestNoticeTime = time;
              latestNotice = { id: nSnap.id, ...nData };
            }
          }
        });

        if (latestNotice) {
          setArrivalNotified(true);
        }
      }

      setBag({ ...bagData, user: userData, activeOrder, activeArrivalNotice: latestNotice });

      if (activeOrder) {
        const formattedDate = new Date(activeOrder.createdAt).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        setConfirmedOrderData({
          orderId: activeOrder.id,
          user: userData,
          deliveryType: activeOrder.deliveryType || userData?.deliveryPreference || "24 horas",
          date: formattedDate,
        });

        if (userData?.phone) {
          setWhatsAppUrl(buildWhatsAppUrl(userData.phone));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppUrl = (phoneStr: string) => {
    const phoneClean = phoneStr.replace(/\D/g, "");
    const mxPhone = phoneClean.length === 10 ? `52${phoneClean}` : phoneClean;
    return `https://wa.me/${mxPhone}`;
  };

  const handleNotifyArrival = async () => {
    if (!id || !bag?.user) return;
    setNotifyingArrival(true);

    const userName = bag.user.name || "Cliente";
    const userPhone = bag.user.phone || "";
    const deliveryPref = bag.user.deliveryPreference || "24 horas";

    playArrivalChime();
    triggerLocalNotification(
      "🧺 ¡Cliente en Camino! - SOMOS",
      `${userName} va en camino a dejar el cesto #${id} (${deliveryPref}).`,
      `/cesto/${id}`
    );

    try {
      const noticeId = `notice_${id}_${Date.now()}`;
      await setDoc(doc(db, "arrival_notices", noticeId), {
        id: noticeId,
        bagId: id,
        userId: bag.user.id || bag.userId,
        userName,
        userPhone,
        deliveryPreference: deliveryPref,
        status: "on_the_way",
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      setArrivalNotified(true);
    } catch (err: any) {
      alert("Error al enviar aviso: " + (err.message || "Intenta de nuevo"));
    } finally {
      setNotifyingArrival(false);
    }
  };

  const handleReceiveBag = async (selectedDeliveryType?: string, preferredTimePreference?: string) => {
    setReceiving(true);
    try {
      if (!id) throw new Error("ID de cesto es requerido");
      const bagSnap = await getDoc(doc(db, "bags", id));
      if (!bagSnap.exists() || bagSnap.data()?.status !== "assigned") {
        throw new Error("El cesto no está asignado o no fue encontrado.");
      }

      const bagData = bagSnap.data() as any;
      const userSnap = await getDoc(doc(db, "users", bagData.userId));
      if (!userSnap.exists()) {
        throw new Error("No se encontró la referencia del cliente.");
      }

      const userData = userSnap.data() as any;
      const pref = selectedDeliveryType || userData.deliveryPreference || "24 horas";
      const nextPrefTime = preferredTimePreference || userData.preferredTime || "Mañana (8:00 AM – 10:00 AM)";

      await updateDoc(doc(db, "users", userData.id), {
        deliveryPreference: pref,
        preferredTime: nextPrefTime,
      });
      userData.deliveryPreference = pref;
      userData.preferredTime = nextPrefTime;

      const ordersSnap = await getDocs(collection(db, "orders"));
      let nextIdVal = 1;
      ordersSnap.forEach((oSnap) => {
        const dIdVal = parseInt(oSnap.id, 10);
        if (!isNaN(dIdVal) && dIdVal >= nextIdVal) {
          nextIdVal = dIdVal + 1;
        }
      });

      const orderId = nextIdVal.toString();

      for (const oSnap of ordersSnap.docs) {
        const data = oSnap.data();
        if (data.bagId === id && data.status !== "completed") {
          await updateDoc(doc(db, "orders", oSnap.id), { status: "completed" });
        }
      }

      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        bagId: id,
        userId: userData.id,
        status: "pending",
        deliveryType: pref,
        createdAt: new Date().toISOString(),
      });

      const formattedDate = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setConfirmedOrderData({
        orderId,
        user: userData,
        deliveryType: pref,
        date: formattedDate,
      });
      setOrderConfirmed(true);

      if (userData?.phone) {
        setWhatsAppUrl(buildWhatsAppUrl(userData.phone));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReceiving(false);
    }
  };

  const handleStartProcessing = async () => {
    const activeOrderId = bag?.activeOrder?.id || confirmedOrderData?.orderId;
    if (!activeOrderId) {
      alert("Error: No hay una orden activa identificada para este cesto.");
      return;
    }
    if (!weightKilos) {
      alert("Por favor ingresa el peso real en kilos antes de iniciar.");
      return;
    }

    setStartingProcess(true);
    try {
      const calcData = { washMinutes, dryMinutes, weightKilos, transportKm };
      await updateDoc(doc(db, "orders", String(activeOrderId)), {
        status: "processing",
        financialCalc: calcData,
      });
      localStorage.setItem(`order_calc_${activeOrderId}`, JSON.stringify(calcData));
      await fetchBag();
    } catch (err: any) {
      alert("Error al iniciar proceso: " + err.message);
    } finally {
      setStartingProcess(false);
    }
  };

  const handleDeliverBag = async () => {
    const activeOrderId = bag?.activeOrder?.id || confirmedOrderData?.orderId;
    if (!activeOrderId) {
      alert("Error: No hay una orden activa identificada para este cesto.");
      return;
    }

    setDelivering(true);
    try {
      await updateDoc(doc(db, "orders", String(activeOrderId)), { status: "completed" });
      setShowDeliverySuccess(true);
      setTimeout(async () => {
        setShowDeliverySuccess(false);
        setOrderConfirmed(false);
        setConfirmedOrderData(null);
        await fetchBag();
      }, 2500);
    } catch (err: any) {
      alert("Error al entregar ropa: " + err.message);
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showDeliverySuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
        <motion.div
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Ropa Entregada!</h2>
          <p className="text-sm text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">
            La orden ha sido marcada como completada y el cesto{" "}
            <span className="font-mono font-bold text-slate-700">#{id}</span> se liberó con éxito para nuevas recepciones.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-mono bg-emerald-50/55 px-3 py-1.5 rounded-full border border-emerald-100">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Cesto listo para siguiente servicio
        </div>
      </div>
    );
  }

  if (error || !bag) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 font-medium">{error || "Cesto no encontrado"}</div>
        <button onClick={() => navigate("/")} className="text-blue-500 underline">
          Volver
        </button>
      </div>
    );
  }

  // FLUJO 1: UNASSIGNED BAG
  if (bag.status === "unassigned") {
    if (role === "customer") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-6">
          <Package className="w-24 h-24 text-gray-300" />
          <div className="space-y-2">
            <h2 className="text-2xl font-light">Cesto no asignado</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
              Este cesto aún no está vinculado. Por favor, entrégalo a un asociado de SOMOS para que lo asigne a tu cuenta.
            </p>
          </div>

          <div className="w-full max-w-sm mt-8 pt-8 border-t border-dashed border-gray-200">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">
                Acceso de Personal SOMOS
              </span>
              <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                Si eres asociado de SOMOS y abriste este enlace desde la cámara del celular, presiona el botón para activar tu vista de trabajo.
              </p>
              <button
                onClick={() => setRole("associate")}
                className="w-full bg-[#0f55d8] text-white py-3 px-4 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all outline-none"
              >
                Activar Panel Asociado
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-6">
        <Package className="w-20 h-20 text-blue-500" />
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-widest border border-blue-100">
            Cesto Nuevo
          </div>
          <h2 className="text-3xl font-light">Cesto {id}</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
            Este cesto está disponible. Para asignarlo a un cliente, utiliza el buscador de pre-registros.
          </p>
        </div>
        <button
          onClick={() =>
            navigate(`/associate/link?bagId=${encodeURIComponent(id || "")}`, {
              state: { prefilledBagId: id },
            })
          }
          className="w-full bg-[#0f55d8] text-white p-4 rounded-xl font-bold flex items-center justify-center mt-4 hover:-translate-y-1 transition-all"
        >
          Asignar a Cliente
        </button>
      </div>
    );
  }

  // FLUJO 2: ASSIGNED BAG
  if (role === "customer") {
    return (
      <BagCustomerArrivalView
        bag={bag}
        arrivalNotified={arrivalNotified}
        notifyingArrival={notifyingArrival}
        onNotifyArrival={handleNotifyArrival}
      />
    );
  }

  if (bag.activeOrder && !orderConfirmed) {
    return (
      <BagProcessingAndDeliveryView
        bag={bag}
        weightKilos={weightKilos}
        setWeightKilos={setWeightKilos}
        transportKm={transportKm}
        washMinutes={washMinutes}
        dryMinutes={dryMinutes}
        startingProcess={startingProcess}
        delivering={delivering}
        onStartProcessing={handleStartProcessing}
        onDeliverBag={handleDeliverBag}
      />
    );
  }

  if (orderConfirmed) {
    return (
      <BagReceiptTicket
        bag={bag}
        isPrinting={isPrinting}
        confirmedOrderData={confirmedOrderData}
        whatsappUrl={whatsappUrl}
        onBackToDelivery={() => setOrderConfirmed(false)}
        onNavigateScanner={() => navigate("/scanner")}
      />
    );
  }

  return (
    <BagConfirmReceptionView
      bag={bag}
      prefTime={prefTime}
      setPrefTime={setPrefTime}
      receiving={receiving}
      onReceiveBag={handleReceiveBag}
    />
  );
}
