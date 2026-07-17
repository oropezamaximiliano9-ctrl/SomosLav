import { useState, useEffect, useContext, FormEvent, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, Loader2, ArrowRight, Zap, Clock, Sun, Moon, Sparkles, Check, Info } from "lucide-react";
import { RoleContext } from "../App";
import { motion } from "motion/react";
import { toBlob } from "html-to-image";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, getDocs, collection } from "firebase/firestore";

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
  
  const ticketRef = useRef<HTMLDivElement>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Associate state
  const [receiving, setReceiving] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showDeliverySuccess, setShowDeliverySuccess] = useState(false);
  
  const [prefSpeed, setPrefSpeed] = useState("Estándar (48 h)");
  const [prefTime, setPrefTime] = useState("Mañana (8:00 AM – 10:00 AM)");

  useEffect(() => {
    if (bag?.user) {
      if (bag.user.deliveryPreference) {
        setPrefSpeed(bag.user.deliveryPreference);
      }
      if (bag.user.preferredTime) {
        setPrefTime(bag.user.preferredTime);
      }
    }
  }, [bag]);

  useEffect(() => {
    fetchBag();
  }, [id, orderConfirmed]);

  useEffect(() => {
    if (orderConfirmed) {
      setIsPrinting(true);
      const timer = setTimeout(() => {
        setIsPrinting(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
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
      }

      const mergedBag = { ...bagData, user: userData, activeOrder };
      setBag(mergedBag);

      // If there is an active order in the DB, pre-populate receipt view so the ticket is ready on demand, but do not force redirect
      if (activeOrder) {
        const formattedDate = new Date(activeOrder.createdAt).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });

        setConfirmedOrderData({
          orderId: activeOrder.id,
          user: userData,
          deliveryType: activeOrder.deliveryType || userData?.deliveryPreference || "Estándar (48 h)",
          date: formattedDate
        });

        if (userData && userData.phone) {
          const phoneClean = userData.phone.replace(/\D/g, "");
          const mxPhone = phoneClean.length === 10 ? `52${phoneClean}` : phoneClean;
          setWhatsAppUrl(`https://wa.me/${mxPhone}`);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      let userData = userSnap.data() as any;

      const pref = selectedDeliveryType || userData.deliveryPreference || "Estándar (48 h)";
      const prefTime = preferredTimePreference || userData.preferredTime || "Mañana (8:00 AM – 10:00 AM)";
      await updateDoc(doc(db, "users", userData.id), { deliveryPreference: pref, preferredTime: prefTime });
      userData.deliveryPreference = pref;
      userData.preferredTime = prefTime;

      const ordersSnap = await getDocs(collection(db, "orders"));
      let nextIdVal = 1;
      ordersSnap.forEach((oSnap) => {
        const dIdVal = parseInt(oSnap.id, 10);
        if (!isNaN(dIdVal) && dIdVal >= nextIdVal) {
          nextIdVal = dIdVal + 1;
        }
      });

      const orderId = nextIdVal.toString();
      const finalDeliveryType = selectedDeliveryType || userData.deliveryPreference || "Estándar (48 h)";

      // Complete any past uncompleted orders for this bag
      for (const oSnap of ordersSnap.docs) {
        const data = oSnap.data();
        if (data.bagId === id && data.status !== "completed") {
          await updateDoc(doc(db, "orders", oSnap.id), { status: "completed" });
        }
      }

      const newOrder = {
        id: orderId,
        bagId: id,
        userId: userData.id,
        status: "pending",
        deliveryType: finalDeliveryType,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "orders", orderId), newOrder);

      const formattedDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      setConfirmedOrderData({
        orderId: orderId,
        user: userData,
        deliveryType: selectedDeliveryType || userData.deliveryPreference || 'Estándar (48 h)',
        date: formattedDate
      });

      setOrderConfirmed(true);
      
      if (userData && userData.phone) {
        const phoneClean = userData.phone.replace(/\D/g, '');
        const mxPhone = phoneClean.length === 10 ? `52${phoneClean}` : phoneClean;
        
        const waUrl = `https://wa.me/${mxPhone}`;
        setWhatsAppUrl(waUrl);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReceiving(false);
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
      const orderRef = doc(db, "orders", String(activeOrderId));
      await updateDoc(orderRef, { status: "completed" });
      
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
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
            La orden ha sido marcada como completada y el cesto <span className="font-mono font-bold text-slate-700">#{id}</span> se liberó con éxito para nuevas recepciones.
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
        <button onClick={() => navigate("/")} className="text-blue-500 underline">Volver</button>
      </div>
    );
  }

  // FLUJO 1: UNASSIGNED BAG
  if (bag.status === 'unassigned') {
    if (role === 'customer') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in p-6">
          <Package className="w-24 h-24 text-gray-300" />
          <div className="space-y-2">
            <h2 className="text-2xl font-light">Cesto no asignado</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
              Este cesto aún no está vinculado. Por favor, entrégalo a un asociado de SOMOS para que lo asigne a tu cuenta.
            </p>
          </div>

          <div className="w-full max-w-sm mt-8 pt-8 border-t border-dashed border-gray-200">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Acceso de Personal SOMOS</span>
              <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                Si eres asociado de SOMOS y abriste este enlace desde la cámara del celular, presiona el botón para activar tu vista de trabajo.
              </p>
              <button
                onClick={() => setRole('associate')}
                className="w-full bg-[#0f55d8] text-white py-3 px-4 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all outline-none"
              >
                Activar Panel Asociado
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Associate View - Unassigned Bag
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in p-6">
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
           onClick={() => navigate(`/associate/link?bagId=${encodeURIComponent(id || "")}`, { state: { prefilledBagId: id } })} 
           className="w-full bg-[#0f55d8] text-white p-4 rounded-xl font-bold flex items-center justify-center mt-4 hover:-translate-y-1 hover:/30 transition-all"
        >
          Asignar a Cliente
        </button>
      </div>
    );
  }

  // FLUJO 2: ASSIGNED BAG
  if (role === 'customer') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-2 border border-green-100">
          <Package className="w-10 h-10 text-green-600" />
        </div>
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold uppercase tracking-widest text-gray-500">
            Tu cesto
          </div>
          <h2 className="text-3xl font-light">Hola, {bag.user?.name?.split(' ')[0]}</h2>
          <p className="text-gray-500 text-sm max-w-[260px] mx-auto leading-relaxed">
            Puedes depositar este cesto en cualquier punto SOMOS. Nosotros nos encargamos del resto.
          </p>
        </div>
        
        <div className="card w-full max-w-sm mt-4 p-5 border border-gray-100 rounded-none bg-white space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block text-center">Tus Datos de Entrega</label>
          <div className="bg-blue-50 text-blue-700 py-3 rounded-none text-center border border-blue-100">
            <p className="font-bold notranslate" translate="no">{bag.user?.deliveryPreference || 'Estándar (48 h)'}</p>
            {(bag.user?.addressColonia || bag.user?.addressCalle) && (
              <div className="mt-2 pt-2 border-t border-blue-200/50 flex flex-col items-center px-4">
                 <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">Domicilio</span>
                 <p className="text-xs font-semibold opacity-90 pb-1">
                   {bag.user?.addressCalle} {bag.user?.addressNumero}, Col. {bag.user?.addressColonia}
                 </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-sm mt-8 pt-8 border-t border-dashed border-gray-200">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Acceso de Personal SOMOS</span>
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              Si eres asociado de SOMOS y abriste este enlace desde la cámara del celular, presiona el botón para activar tu vista de trabajo.
            </p>
            <button
              onClick={() => setRole('associate')}
              className="w-full bg-[#0f55d8] text-white py-3 px-4 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all outline-none"
            >
              Activar Panel Asociado
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bypassed automatic blocking screen to allow making new receptions seamlessly

  const handleSendTicketImage = async () => {
    if (!ticketRef.current) return;
    setIsGeneratingImage(true);
    setErrorMessage("");
    try {
      const blob = await toBlob(ticketRef.current, {
        cacheBust: true,
        backgroundColor: "#f6eedd",
        pixelRatio: 4
      });
      if (!blob) throw new Error("No se pudo generar el bloque de imagen.");

      const orderNumber = confirmedOrderData?.orderId || "SOMOS";
      const fileName = `Ticket-SOMOS-${orderNumber}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Action 1: Copy image ticket to clipboard so the user has the high-fidelity visual ready
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3500);
      } catch (clipErr) {
        console.warn("Clipboard copy image failed, fallback to automatic download:", clipErr);
        // Action 2: Fallback direct download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Action 3: Directly open WhatsApp with target text & phone number (avoiding the generic contact picker)
      if (whatsappUrl) {
        const orderNumber = confirmedOrderData?.orderId || "SOMOS";
        const clientName = confirmedOrderData?.user?.name || "Cliente";
        const deliveryType = confirmedOrderData?.deliveryType || "Estándar (48 h)";
        const dateText = confirmedOrderData?.date || "Hoy";

        const textMessage = `¡Hola, *${clientName}*! 🫧\n\nAquí tienes tu ticket digital de *SOMOS lavandería*:\n\n📦 *Orden:* #${String(orderNumber).padStart(4, '0')}\n📅 *Fecha:* ${dateText}\n🚀 *Servicio:* ${deliveryType}\n\n_(Te copiamos la imagen del ticket al portapapeles. ¡Solo mantén presionado el chat y dale Pegar para enviarla!)_`;

        const finalWaUrl = `${whatsappUrl}?text=${encodeURIComponent(textMessage)}`;
        window.open(finalWaUrl, "_blank");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al preparar el ticket visual.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Associate View - Active Order Delivery Screen
  if (bag && bag.activeOrder && !orderConfirmed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start text-center py-4 px-4 space-y-6 max-w-sm mx-auto w-full animate-in fade-in duration-300">
        
        {/* Header Indicator */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-medium tracking-widest text-gray-900 uppercase tracking-tight">Entrega de Ropa</h2>
        </div>


        {/* Customer Information Card */}
        <div className="w-full border border-gray-100 p-5 rounded-3xl bg-white text-left space-y-4">
          <div className="space-y-1.5 border-b border-gray-100 pb-4">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">Cliente</span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{bag.user?.name || "Cliente Registrado"}</h3>
            <p className="text-sm font-medium text-gray-500">{bag.user?.phone || "Sin teléfono registrado"}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">No. Orden</span>
            <p className="text-sm font-semibold text-slate-700 leading-none">
              #{String(bag.activeOrder.id).padStart(4, "0")}
            </p>
          </div>

          {(bag.user?.addressCalle || bag.user?.addressColonia) && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">Dirección de Entrega</span>
              <p className="text-sm font-bold text-slate-900 leading-normal">
                {bag.user?.addressCalle} {bag.user?.addressNumero || ""}, Col. {bag.user?.addressColonia || ""}
              </p>
            </div>
          )}
        </div>

        {/* Actions panel */}
        <div className="w-full pt-4">
          <button
            type="button"
            onClick={handleDeliverBag}
            disabled={delivering}
            className="w-full py-4 bg-[#0f55d8] hover:bg-[#0c4ab9] disabled:bg-blue-300 font-extrabold tracking-wide text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer text-base"
          >
            {delivering ? "Entregando..." : "Entregar"}
          </button>
        </div>
      </div>
    );
  }

  // Associate View - Receiving
  if (orderConfirmed) {
    if (isPrinting) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 min-h-[400px]">
          <div className="relative flex flex-col items-center">
            {/* An animated ticket machine/slot with a ticking slip */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="text-5xl"
            >
              📥
            </motion.div>
            <motion.div 
              initial={{ height: 4, opacity: 0.3 }}
              animate={{ height: 28, opacity: 1 }}
              transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="w-16 bg-slate-200 border-x-2 border-b-2 border-slate-300 mt-2 rounded-b-md"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-slate-800 text-sm">Generando Recibo Digital</h3>
            <p className="text-gray-400 text-xs font-mono animate-pulse">Registrando internamente & adaptando ticket a WhatsApp...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-start text-center py-2 px-4 space-y-6 animate-in fade-in max-w-sm mx-auto w-full animate-out duration-300">
        {/* Confirmed Indicator */}
        <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-bounce mt-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Recepción Confirmada</span>
        </div>

        {/* The Aesthetic Thermal Paper Ticket */}
        <motion.div
          ref={ticketRef}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full bg-[#f6eedd] border border-[#0c3ab5]/15 rounded-sm p-5 text-left relative overflow-hidden flex flex-col items-stretch text-[#0c3ab5] font-sans text-sm leading-relaxed"
          style={{
            boxShadow: '0 20px 40px -15px rgba(12,58,181,0.08), 0 15px 20px -10px rgba(0,0,0,0.05)'
          }}
        >
          {/* Adhesive Tape on Top Center (mimicking the original image) */}
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-white/20 backdrop-blur-[0.5px] border border-white/10 rotate-[-1deg] pointer-events-none select-none z-20" 
            style={{ 
              clipPath: 'polygon(2% 18%, 8% 0%, 92% 4%, 98% 15%, 100% 88%, 91% 100%, 9% 95%, 0% 80%)'
            }} 
          />

          {/* Header section with brand and Serial No. */}
          <div className="flex justify-between items-start pt-3 pb-2 border-b border-[#0c3ab5]/30">
            <div>
              <h1 className="font-sans text-3xl font-black text-slate-900 tracking-tighter leading-none">
                SOMOS
              </h1>
              <span className="font-sans text-[8px] uppercase tracking-[0.25em] font-black text-[#0c3ab5]/60 block mt-0.5">
                LAVANDERÍA
              </span>
            </div>
            
            {/* Red Order counter */}
            <div className="flex items-stretch gap-1.5 h-9">
              <div className="w-[1px] bg-[#0c3ab5]/20 my-1"></div>
              <div className="text-right flex flex-col justify-between">
                <span className="text-[7px] font-black tracking-widest text-[#0c3ab5]/50 leading-none">ORDEN</span>
                <span className="font-sans font-black text-2xl tracking-tight text-[#d1351b] leading-none">
                  #{String(confirmedOrderData?.orderId || '1').padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Form metadata fields in ruled grid */}
          <div className="w-full border border-[#0c3ab5]/30 bg-transparent overflow-hidden mt-3 text-xs text-[#0c3ab5] font-sans">
            {/* Row 1: Nombre and Teléfono */}
            <div className="grid grid-cols-12 divide-x divide-[#0c3ab5]/30 border-b border-[#0c3ab5]/30">
              <div className="col-span-7 p-1.5 py-1 space-y-0.5 text-left">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">Nombre:</span>
                <span className="font-bold text-slate-900 block truncate text-sm">{confirmedOrderData?.user?.name || 'Cliente'}</span>
              </div>
              <div className="col-span-5 p-1.5 py-1 space-y-0.5 text-left">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">Teléfono:</span>
                <span className="font-bold text-slate-900 block truncate text-sm">{confirmedOrderData?.user?.phone || '------'}</span>
              </div>
            </div>
            {/* Row 2: Fecha (utilizes the full ticket width) */}
            <div className="p-1.5 py-1 space-y-0.5 text-left">
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">Fecha de Recepción:</span>
              <span className="font-bold text-slate-900 block text-sm truncate whitespace-nowrap">{confirmedOrderData?.date || '------'}</span>
            </div>
          </div>

          {/* Ruled Columns Grid */}
          <div className="mt-4 border-t-2 border-b-2 border-[#0c3ab5]/40 py-1.5 relative text-[#0c3ab5] font-sans">
            {/* Background alignment lines mimicking physical column grid */}
            <div className="absolute inset-y-0 right-10 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />
            <div className="absolute inset-y-0 right-20 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />
            <div className="absolute inset-y-0 right-30 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />

            {/* Service Item 1: Lavado cesto mediano */}
            <div className="py-2.5 border-b border-[#0c3ab5]/15 flex justify-between items-center relative z-10">
              <div className="pr-3 text-left">
                <h4 className="text-sm font-bold text-slate-900">Lavado cesto mediano</h4>
              </div>
              <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
                <span>$150</span>
              </div>
            </div>

            {/* Service Item 2: Entrega a domicilio */}
            <div className="py-2.5 border-b border-[#0c3ab5]/15 flex justify-between items-center relative z-10">
              <div className="pr-3 text-left">
                <h4 className="text-sm font-bold text-slate-900">Entrega a domicilio</h4>
              </div>
              <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
                <span>Gratis</span>
              </div>
            </div>

            {/* Service Item 3: Cesto Inteligente SOMOS (Espacio vacío) */}
            <div className="py-2.5 flex justify-between items-center relative z-10 min-h-[40px]">
              <div className="pr-3 text-left">
                {/* Manteniendo el espacio vacío */}
              </div>
              <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
                <span></span>
              </div>
            </div>
          </div>

          {/* Double rule pricing line - Placed directly below the service grid */}
          <div className="border-t-2 border-b border-[#0c3ab5]/30 py-2 flex justify-between items-baseline font-sans text-[#0c3ab5]">
            <span className="text-xs font-black uppercase tracking-wider text-[#0c3ab5]/70">Total MXN:</span>
            <span className="text-xl font-black font-sans text-[#0c3ab5]">$150.00</span>
          </div>

          {/* Dynamic Playful Handwriting Scribble Note in Blue Permanent Marker style - Placed below the total */}
          <div className="my-5 flex justify-center items-center">
            <div 
              className="transform -rotate-[4deg] text-[#001bb0] font-bold text-center select-none bg-black/5 px-4 py-2 border border-[#0c3ab5]/10 rounded-xl"
              style={{ fontFamily: '"Comic Sans MS", "Marker Felt", "Brush Script MT", cursive' }}
            >
              <span className="text-lg font-black tracking-wide block">
                ¡Muchas gracias!
              </span>
              <span className="text-[11px] font-bold opacity-90 block mt-0.5">
                ¡Gracias por su preferencia!
              </span>
            </div>
          </div>
        </motion.div>

        {/* Real Action Buttons for the associate */}
        <div className="w-full space-y-3.5 pb-6">
          {/* Link back to delivery/release screen if there is an active order */}
          {bag?.activeOrder && (
            <button
              type="button"
              onClick={() => setOrderConfirmed(false)}
              className="w-full py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border border-amber-200 select-none cursor-pointer"
            >
              <span>🚚 Volver a Entrega y Liberación</span>
            </button>
          )}

          {copiedImage && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-2xl text-xs flex flex-col items-center space-y-1 leading-normal text-slate-700"
            >
              <span className="font-bold text-emerald-700 flex items-center gap-1">✨ ¡Prisino Ticket Copiado!</span>
              <span className="text-[11px] text-slate-500">Al abrir WhatsApp, mantén presionado el chat del cliente y selecciona *Pegar* (o presiona *Ctrl+V*) para mandar la imagen del Ticket.</span>
            </motion.div>
          )}

          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-mono">
              🚫 {errorMessage}
            </div>
          )}

          {/* Main Action: Generate Ticket Image and dispatch to customer */}
          <button 
            type="button"
            onClick={handleSendTicketImage}
            disabled={isGeneratingImage}
            className="w-full p-4.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 transition-all text-white rounded-2xl font-black flex items-center justify-center gap-2.5 text-base border-b-4 border-emerald-700 hover:border-emerald-800 select-none cursor-pointer"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Ticket en Imagen...</span>
              </>
            ) : (
              <>
                <svg className="w-5.5 h-5.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.102.99 11.999.99 6.562.99 2.135 5.361 2.131 10.793c-.001 1.741.47 3.442 1.364 4.958L2.525 21l5.3-1.378H7.8a9.412 9.412 0 0 0-1.153-.466zm10.59-6.394c-.3-.15-1.77-.875-2.043-.974-.275-.098-.475-.148-.674.15-.2.298-.773.974-.948 1.171-.175.199-.349.224-.65.075-.3-.15-1.261-.464-2.4-.1.478-1.018.918-1.519 1.17-1.192.175-.298.087-.56-.044-.81-.13-.252-.674-1.62-.924-2.22-.243-.585-.49-.505-.674-.515-.175-.01-.375-.01-.575-.01-.2 0-.524.075-.798.374-.275.299-1.047 1.022-1.047 2.493 0 1.47 1.072 2.89 1.222 3.09.15.199 2.11 3.221 5.11 4.516.713.308 1.27.492 1.704.63.717.228 1.37.195 1.884.118.574-.085 1.77-.723 2.019-1.419.25-.697.25-1.295.175-1.419-.075-.124-.275-.199-.575-.349z"/>
                </svg>
                <span>Enviar Ticket por WhatsApp 🫧</span>
              </>
            )}
          </button>

          {/* Quick Fallback Download */}
          <button 
            type="button"
            onClick={async () => {
              if (!ticketRef.current) return;
              try {
                const blob = await toBlob(ticketRef.current, { cacheBust: true, backgroundColor: "#f6eedd", pixelRatio: 4 });
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Ticket-SOMOS-${confirmedOrderData?.orderId || '0000'}.png`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border border-gray-200 select-none cursor-pointer"
          >
            <span>💾 Descargar Imagen en Galería</span>
          </button>

          <button 
            type="button"
            onClick={() => navigate("/scanner")} 
            className="p-3.5 rounded-xl bg-gray-150 font-bold w-full border border-gray-200 hover:bg-gray-200 transition-colors text-xs text-slate-700 mt-2 select-none"
          >
            Continuar al Escáner
          </button>
        </div>
      </div>
    );
  }

  const isFirstVisit = !bag.user || !bag.user.deliveryPreference || bag.user.deliveryPreference === '';
  const isEligibleForDelivery = bag?.user?.addressColonia?.toLowerCase().includes("palmas") ?? false;

  return (
    <div className="flex-1 flex flex-col mt-4 animate-in slide-in-from-bottom-4 duration-500 pb-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase tracking-tight">Confirmar Recepción</h1>
      </div>

      <div className="card p-6 border border-gray-100 space-y-4 rounded-none bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 w-full">
          <div className="text-left space-y-4 w-full">
            {isFirstVisit && (
              <div className="space-y-1.5 pb-4 border-b border-gray-100 w-full">
                <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-[#0f55d8] border border-blue-100 rounded-md text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                  Nuevo Cliente
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Configuración inicial.</h3>
              </div>
            )}
            <div className="space-y-0.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block">Cliente</label>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-gray-900 leading-none">{bag.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
        
        {isFirstVisit ? (
          <div className="space-y-4 py-1">

            {/* Plan de Entrega Preferido */}
            <div className="space-y-3 text-left">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block pb-0.5">Plan de Entrega Preferido</label>

              <div className="grid grid-cols-2 gap-3 mt-1">
                {/* Estándar Card */}
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setPrefSpeed("Estándar (48 h)")}
                  className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                    prefSpeed === "Estándar (48 h)"
                      ? "bg-blue-50/70 border-[#0f55d8] border-2"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <span className={`font-black text-sm sm:text-base tracking-tight block ${prefSpeed === "Estándar (48 h)" ? "text-[#0f55d8]" : "text-slate-800"}`}>
                    Estándar
                  </span>
                  <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                    48 horas
                  </span>
                </motion.button>

                {/* Express Card */}
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setPrefSpeed("Express (24 h)")}
                  className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                    prefSpeed === "Express (24 h)"
                      ? "bg-blue-50/70 border-[#0f55d8] border-2"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <span 
                    translate="no" 
                    className={`font-black text-sm sm:text-base tracking-tight block notranslate ${prefSpeed === "Express (24 h)" ? "text-[#0f55d8]" : "text-slate-800"}`}
                  >
                    Express
                  </span>
                  <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                    24 horas
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Horario de Entrega Preferido */}
            {isEligibleForDelivery && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block pb-0.5">Horario de Entrega Preferido</label>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  {/* Mañana Card */}
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPrefTime("Mañana (8:00 AM – 10:00 AM)")}
                    className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                      prefTime === "Mañana (8:00 AM – 10:00 AM)"
                        ? "bg-blue-50/70 border-[#0f55d8] border-2"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className={`font-black text-sm sm:text-base tracking-tight block ${prefTime === "Mañana (8:00 AM – 10:00 AM)" ? "text-[#0f55d8]" : "text-slate-800"}`}>
                      Mañana
                    </span>
                    <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                      8 AM-10 AM
                    </span>
                  </motion.button>

                  {/* Noche Card */}
                  <motion.button
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPrefTime("Noche (8:00 PM – 10:00 PM)")}
                    className={`relative py-3 px-3 rounded-xl border text-center transition-all duration-300 focus:outline-none flex flex-col items-center justify-center min-h-[4rem] cursor-pointer ${
                      prefTime === "Noche (8:00 PM – 10:00 PM)"
                        ? "bg-blue-50/70 border-[#0f55d8] border-2"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className={`font-black text-sm sm:text-base tracking-tight block ${prefTime === "Noche (8:00 PM – 10:00 PM)" ? "text-[#0f55d8]" : "text-slate-800"}`}>
                      Noche
                    </span>
                    <span className="text-xs leading-tight text-gray-500 font-bold block mt-0.5">
                      8 PM-10 PM
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
                Preferencias de entrega
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Plan de Entrega Row Card */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                <div className="space-y-0.5 text-left min-w-0">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Plan de Entrega</span>
                  <span translate="no" className="text-sm sm:text-base font-black text-slate-800 notranslate flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                    {prefSpeed === 'Express (24 h)' ? (
                      <>
                        Express
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">24 h</span>
                      </>
                    ) : (
                      <>
                        Estándar
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">48 h</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrefSpeed(p => p === "Express (24 h)" ? "Estándar (48 h)" : "Express (24 h)");
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white rounded-lg font-bold text-[9px] sm:text-[10px] transition-all cursor-pointer uppercase border border-slate-200/60 hover:border-slate-900 shrink-0"
                >
                  Cambiar
                </button>
              </div>

              {/* Horario Row Card (only if eligible) */}
              {isEligibleForDelivery && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200 animate-slide-in">
                  <div className="space-y-0.5 text-left min-w-0">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Horario Preferido</span>
                    <span className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                      {prefTime === "Noche (8:00 PM – 10:00 PM)" ? (
                        <>
                          Noche
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">8 PM-10 PM</span>
                        </>
                      ) : (
                        <>
                          Mañana
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">8 AM-10 AM</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrefTime(p => p === "Mañana (8:00 AM – 10:00 AM)" ? "Noche (8:00 PM – 10:00 PM)" : "Mañana (8:00 AM – 10:00 AM)");
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white rounded-lg font-bold text-[9px] sm:text-[10px] transition-all cursor-pointer uppercase border border-slate-200/60 hover:border-slate-900 shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Domicilio de Entrega */}
              {(bag.user?.addressColonia || bag.user?.addressCalle) && (
                <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl text-left space-y-1">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Domicilio de Entrega</span>
                  <p className="text-xs font-bold text-slate-700 leading-normal">
                    {bag.user?.addressCalle} {bag.user?.addressNumero || ""}, Col. {bag.user?.addressColonia || ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {isFirstVisit ? (
          <button 
            onClick={() => handleReceiveBag(prefSpeed, isEligibleForDelivery ? prefTime : "")}
            disabled={receiving}
            className="w-full bg-[#0f55d8] text-white p-5 rounded-2xl font-bold flex items-center justify-center hover:-translate-y-1 hover:/30 transition-all disabled:opacity-50 text-lg cursor-pointer select-none"
          >
            {receiving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar y Confirmar Recepción"}
          </button>
        ) : (
          <button 
            onClick={() => handleReceiveBag(prefSpeed, isEligibleForDelivery ? prefTime : "")}
            disabled={receiving}
            className="w-full bg-[#0f55d8] text-white p-5 rounded-2xl font-bold flex items-center justify-center hover:-translate-y-1 hover:/30 transition-all disabled:opacity-50 text-lg cursor-pointer select-none"
          >
            {receiving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
          </button>
        )}
      </div>
    </div>
  );
}
