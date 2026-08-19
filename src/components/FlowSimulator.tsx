import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  ArrowRight, 
  Smartphone, 
  User, 
  ShieldAlert, 
  Package, 
  Bell, 
  Truck, 
  QrCode, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  Layers,
  HelpCircle
} from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc, collection, query, where } from "firebase/firestore";
import { RoleContext } from "../App";

export default function FlowSimulator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, setRole } = useContext(RoleContext);
  
  // Tab to switch between Client Perspective vs Associate Ops Perspective
  const [activeTab, setActiveTab] = useState<"client" | "associate">("client");

  // Simulation states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [bagStatus, setBagStatus] = useState<string>("unassigned");
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [arrivalNotice, setArrivalNotice] = useState<any>(null);

  // Fetch initial state of CESTO-001 to sync step correctly on load
  const checkStatus = async () => {
    try {
      const id = "CESTO-001";
      const bagSnap = await getDoc(doc(db, "bags", id));
      if (bagSnap.exists()) {
        const bagData = bagSnap.data() as any;
        setBagStatus(bagData.status);
        if (bagData.status === "assigned" && bagData.userId) {
          const userSnap = await getDoc(doc(db, "users", bagData.userId));
          const userData = userSnap.exists() ? userSnap.data() : null;
          setRegisteredUser(userData);

          // Check active notices
          const noticesSnap = await getDocs(collection(db, "arrival_notices"));
          let latestNotice: any = null;
          let latestNoticeTime = 0;
          noticesSnap.forEach((nSnap) => {
            const nData = nSnap.data();
            if (nData.bagId === id && nData.status !== "dismissed" && nData.status !== "attended") {
              const time = nData.timestamp ? new Date(nData.timestamp).getTime() : 0;
              if (time > latestNoticeTime) {
                latestNoticeTime = time;
                latestNotice = { id: nSnap.id, ...nData };
              }
            }
          });
          setArrivalNotice(latestNotice);

          const ordersSnap = await getDocs(collection(db, "orders"));
          let activeOrder: any = null;
          let latestCreatedAt = 0;
          let hasCompleted = false;

          ordersSnap.forEach((oSnap) => {
            const data = oSnap.data();
            if (data.bagId === id) {
              if (data.status !== "completed") {
                const creationTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;
                if (creationTime > latestCreatedAt) {
                  latestCreatedAt = creationTime;
                  activeOrder = data;
                }
              } else if (data.status === "completed") {
                hasCompleted = true;
              }
            }
          });

          if (activeOrder) {
            setActiveOrderId(activeOrder.id);
            setCurrentStep(4); // Order is active/confirmed
          } else {
            if (hasCompleted) {
              setActiveOrderId("");
              setCurrentStep(5); // Completed & Delivered
            } else {
              setActiveOrderId("");
              setCurrentStep(3); // Linked but order not confirmed yet
            }
          }
        } else {
          setActiveOrderId("");
          setArrivalNotice(null);
          // Check if preregistered user exists in DB by querying the phone
          const q = query(collection(db, "users"), where("phone", "==", "9212393938"));
          const usersSnap = await getDocs(q);
          if (!usersSnap.empty) {
            const uData = usersSnap.docs[0].data();
            setRegisteredUser(uData);
            setCurrentStep(2); // Registered but bag unassigned
          } else {
            setRegisteredUser(null);
            setCurrentStep(1); // Not registered
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [location.pathname]);

  // Setup / Ensure client Jaime is linked to CESTO-001 for immediate testing
  const ensureClientAssigned = async () => {
    setLoading(true);
    setStatusMsg("Preparando cesto asignado a Jaime...");
    try {
      const phone = "9212393938";
      const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
      const usersSnap = await getDocs(usersQuery);
      let userId: string;

      const userData: any = {
        name: "Jaime Hernández",
        phone: phone,
        deliveryPreference: "24 horas",
        addressColonia: "Las Palmas",
        addressCalle: "Paseo de las Palmas",
        addressNumero: "209",
        preferredTime: "Mañana (8:00 AM – 10:00 AM)"
      };

      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
        await updateDoc(doc(db, "users", userId), userData);
      } else {
        userId = "USR-jaime123";
        await setDoc(doc(db, "users", userId), {
          id: userId,
          ...userData,
          credits: 0.0,
          createdAt: new Date().toISOString()
        });
      }

      await setDoc(doc(db, "bags", "CESTO-001"), {
        id: "CESTO-001",
        status: "assigned",
        userId: userId
      });

      setRegisteredUser(userData);
      setBagStatus("assigned");
      setCurrentStep(3);
      setStatusMsg("✅ CESTO-001 listo y asignado a Jaime.");
    } catch (e: any) {
      setStatusMsg(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Client Scan Navigation
  const openClientScanView = async () => {
    await ensureClientAssigned();
    setRole("customer");
    navigate("/cesto/CESTO-001");
  };

  // Trigger Associate Scan Navigation
  const openAssociateScanView = async () => {
    setRole("associate");
    navigate("/cesto/CESTO-001");
  };

  // Step 1: Pre-register user
  const runStep1 = async () => {
    setLoading(true);
    setStatusMsg("Pre-registrando a Jaime...");
    try {
      const phone = "9212393938";
      const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
      const usersSnap = await getDocs(usersQuery);
      let userId;

      const userData: any = {
        name: "Jaime Hernández",
        phone: phone,
        deliveryPreference: "",
        addressColonia: "Las Palmas",
        addressCalle: "Paseo de las Palmas",
        addressNumero: "209",
        preferredTime: ""
      };

      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
        await updateDoc(doc(db, "users", userId), userData);
      } else {
        userId = "USR-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "users", userId), {
          id: userId,
          ...userData,
          credits: 0.0,
          createdAt: new Date().toISOString()
        });
      }

      setRegisteredUser(userData);
      setCurrentStep(2);
      setStatusMsg("✅ Jaime Hernández pre-registrado con éxito.");
    } catch (e: any) {
      setStatusMsg(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Auto-link
  const runStep2Auto = async () => {
    setLoading(true);
    setStatusMsg("Vinculando CESTO-001 a Jaime...");
    try {
      const bagRef = doc(db, "bags", "CESTO-001");
      const phone = "9212393938";
      const usersQuery = query(collection(db, "users"), where("phone", "==", phone));
      const usersSnap = await getDocs(usersQuery);
      let userId: string;

      const userData: any = {
        name: "Jaime Hernández",
        phone: phone,
        deliveryPreference: "24 horas",
        addressColonia: "Las Palmas",
        addressCalle: "Paseo de las Palmas",
        addressNumero: "209",
        preferredTime: ""
      };

      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
        await updateDoc(doc(db, "users", userId), userData);
      } else {
        userId = "USR-jaime123";
        await setDoc(doc(db, "users", userId), {
          id: userId,
          ...userData,
          credits: 0.0,
          createdAt: new Date().toISOString()
        });
      }

      await setDoc(bagRef, { id: "CESTO-001", status: "assigned", userId });
      setBagStatus("assigned");
      setRegisteredUser(userData);
      setCurrentStep(3);
      setStatusMsg("🔗 CESTO-001 asignado con éxito a Jaime.");
    } catch (e: any) {
      setStatusMsg(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Receive & Create Order
  const runStep3Auto = async () => {
    setLoading(true);
    setStatusMsg("Recibiendo prendas y generando Orden...");
    try {
      const bagId = "CESTO-001";
      const bagSnap = await getDoc(doc(db, "bags", bagId));
      if (!bagSnap.exists() || bagSnap.data()?.status !== "assigned") {
        await ensureClientAssigned();
      }

      const bag = (await getDoc(doc(db, "bags", bagId))).data() as any;
      const userSnap = await getDoc(doc(db, "users", bag.userId));
      const user = userSnap.exists() ? userSnap.data() as any : { name: "Jaime Hernández", id: bag.userId };

      const ordersSnap = await getDocs(collection(db, "orders"));
      let nextIdVal = 1;
      ordersSnap.forEach((oSnap) => {
        const dIdVal = parseInt(oSnap.id, 10);
        if (!isNaN(dIdVal) && dIdVal >= nextIdVal) {
          nextIdVal = dIdVal + 1;
        }
      });

      const orderId = nextIdVal.toString();
      const finalDeliveryType = user.deliveryPreference || "24 horas";

      for (const oSnap of ordersSnap.docs) {
        const data = oSnap.data();
        if (data.bagId === bagId && data.status !== "completed") {
          await updateDoc(doc(db, "orders", oSnap.id), { status: "completed" });
        }
      }

      const newOrder = {
        id: orderId,
        bagId,
        userId: user.id,
        status: "pending",
        deliveryType: finalDeliveryType,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "orders", orderId), newOrder);

      setActiveOrderId(orderId);
      setCurrentStep(4);
      setStatusMsg(`🎉 ¡Orden #${orderId} creada para Jaime!`);
    } catch (e: any) {
      setStatusMsg(`❌ Error al crear orden: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send simulated arrival notice directly
  const sendSimulatedArrivalNotice = async () => {
    setLoading(true);
    try {
      await ensureClientAssigned();
      const noticeId = `notice_CESTO-001_${Date.now()}`;
      const noticeData = {
        id: noticeId,
        bagId: "CESTO-001",
        userId: "USR-jaime123",
        userName: "Jaime Hernández",
        userPhone: "9212393938",
        deliveryPreference: "24 horas",
        status: "on_the_way",
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "arrival_notices", noticeId), noticeData);
      setArrivalNotice(noticeData);
      setStatusMsg(`🔔 Aviso "Voy en camino" emitido para Jaime Hernández.`);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset demo back to unassigned
  const resetDemo = async () => {
    setLoading(true);
    setStatusMsg("Restableciendo base de datos...");
    try {
      const userIdsToDelete: string[] = ["USR-simula1", "USR-simula2", "USR-jaime123"];
      const uq = query(collection(db, "users"), where("phone", "==", "9212393938"));
      const usnap = await getDocs(uq);
      usnap.forEach((uDoc) => {
        userIdsToDelete.push(uDoc.id);
      });

      // Reset CESTO-001
      await setDoc(doc(db, "bags", "CESTO-001"), { id: "CESTO-001", status: "unassigned", userId: null });

      // Delete active orders for CESTO-001
      const ordersSnap = await getDocs(collection(db, "orders"));
      for (const oDoc of ordersSnap.docs) {
        const odata = oDoc.data();
        if (odata.bagId === "CESTO-001") {
          await deleteDoc(doc(db, "orders", oDoc.id));
        }
      }

      // Delete arrival notices
      const noticesSnap = await getDocs(collection(db, "arrival_notices"));
      for (const nDoc of noticesSnap.docs) {
        if (nDoc.data().bagId === "CESTO-001") {
          await deleteDoc(doc(db, "arrival_notices", nDoc.id));
        }
      }

      // Delete temporary / simulator users
      for (const uid of userIdsToDelete) {
        await deleteDoc(doc(db, "users", uid));
      }

      setRegisteredUser(null);
      setBagStatus("unassigned");
      setActiveOrderId("");
      setArrivalNotice(null);
      setCurrentStep(1);
      setStatusMsg("🔄 Simulación reiniciada. CESTO-001 sin asignar.");
    } catch (e: any) {
      setStatusMsg(`❌ Error de comunicación con Firestore: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white text-slate-800 p-5 flex flex-col items-stretch space-y-4 font-sans select-none"
    >
      {/* Simulation Steps Deck */}
      <div className="space-y-3 text-left">
        {/* Step 1 */}
        <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-start gap-3">
          <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border mt-0.5 ${
            currentStep > 1 ? "bg-[#0f55d8] text-white border-[#0f55d8]" : "bg-blue-50 text-[#0f55d8] border-[#0f55d8]"
          }`}>
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Pre-registro de Jaime</span>
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={runStep1}
                  disabled={loading}
                  className="text-[11px] font-bold px-3 py-1 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg cursor-pointer transition-colors"
                >
                  Pre-registrar
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {currentStep > 1 ? "✓ Registrado en base de datos." : "Simula registro online de cliente nuevo."}
            </span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-start gap-3">
          <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border mt-0.5 ${
            currentStep > 2 ? "bg-[#0f55d8] text-white border-[#0f55d8]" : currentStep === 2 ? "bg-blue-50 text-[#0f55d8] border-[#0f55d8]" : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Vincular CESTO-001</span>
              {currentStep === 2 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate("/associate/link?bagId=CESTO-001&phone=9212393938")}
                    className="text-[10px] font-bold px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg bg-white cursor-pointer"
                  >
                    Pantalla 🔍
                  </button>
                  <button
                    type="button"
                    onClick={runStep2Auto}
                    disabled={loading}
                    className="text-[10px] font-bold px-2.5 py-1 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg cursor-pointer"
                  >
                    Auto ⚡
                  </button>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {currentStep > 2 ? "✓ Cesto asignado a Jaime." : "Asocia el cesto al cliente."}
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-start gap-3">
          <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border mt-0.5 ${
            currentStep > 3 ? "bg-[#0f55d8] text-white border-[#0f55d8]" : currentStep === 3 ? "bg-blue-50 text-[#0f55d8] border-[#0f55d8]" : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : "3"}
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Recepción y Ticket</span>
              {currentStep === 3 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={openAssociateScanView}
                    className="text-[10px] font-bold px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg bg-white cursor-pointer"
                  >
                    Ver 🧺
                  </button>
                  <button
                    type="button"
                    onClick={runStep3Auto}
                    disabled={loading}
                    className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                  >
                    Crear Orden ⚡
                  </button>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {currentStep > 3 ? "✓ Orden generada con ticket." : "Recepción en mostrador."}
            </span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-start gap-3">
          <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs border mt-0.5 ${
            currentStep >= 4 ? "bg-emerald-600 border-emerald-600 text-white font-black" : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep >= 4 ? <Check className="w-3.5 h-3.5" /> : "4"}
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Pesaje & Entrega</span>
              {currentStep >= 4 && (
                <button
                  type="button"
                  onClick={openAssociateScanView}
                  className="text-[10px] font-bold px-3 py-1 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg cursor-pointer"
                >
                  Ir a Orden #{activeOrderId || "ACTIVA"} 📦
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {currentStep >= 4 ? "✓ Pantalla operativa de pesaje y entrega." : "Pesaje final y entrega."}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Customer Scan Simulation Button */}
      <button
        type="button"
        onClick={openClientScanView}
        disabled={loading}
        className="w-full py-3.5 px-4 bg-[#0f55d8] hover:bg-[#0c4ab9] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        <span>Simular Escaneo como Cliente 📱</span>
        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
      </button>

      {/* Full-width Single Line Reset Button */}
      <button
        type="button"
        onClick={resetDemo}
        disabled={loading}
        className="w-full py-3 px-4 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        <span>Reiniciar Datos</span>
      </button>

      {/* Status log panel */}
      {statusMsg && (
        <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] font-mono text-left border border-slate-100 flex items-start gap-1.5 text-[#0f55d8]">
          <span className="text-slate-400 select-none">&gt;</span>
          <p className="flex-1 leading-normal">{statusMsg}</p>
        </div>
      )}
    </motion.div>
  );
}
