import { useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toBlob } from "html-to-image";

interface BagReceiptTicketProps {
  bag: any;
  isPrinting: boolean;
  confirmedOrderData: any;
  whatsappUrl: string | null;
  onBackToDelivery: () => void;
  onNavigateScanner: () => void;
}

export function BagReceiptTicket({
  bag,
  isPrinting,
  confirmedOrderData,
  whatsappUrl,
  onBackToDelivery,
  onNavigateScanner,
}: BagReceiptTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const renderTicketBlob = async () => {
    if (!ticketRef.current) return null;
    return toBlob(ticketRef.current, {
      cacheBust: true,
      backgroundColor: "#f6eedd",
      pixelRatio: 4,
    });
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendTicketImage = async () => {
    if (!ticketRef.current) return;
    setIsGeneratingImage(true);
    setErrorMessage("");
    try {
      const blob = await renderTicketBlob();
      if (!blob) throw new Error("No se pudo generar el bloque de imagen.");

      const orderNumber = confirmedOrderData?.orderId || "SOMOS";
      const fileName = `Ticket-SOMOS-${orderNumber}.png`;

      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3500);
      } catch (clipErr) {
        console.warn("Clipboard copy image failed, fallback to automatic download:", clipErr);
        triggerBlobDownload(blob, fileName);
      }

      if (whatsappUrl) {
        const clientName = confirmedOrderData?.user?.name || "Cliente";
        const deliveryType = confirmedOrderData?.deliveryType || "24 horas";
        const dateText = confirmedOrderData?.date || "Hoy";

        const textMessage = `¡Hola, *${clientName}*! 🫧\n\nAquí tienes tu ticket digital de *SOMOS lavandería*:\n\n📦 *Orden:* #${String(orderNumber).padStart(4, "0")}\n📅 *Fecha:* ${dateText}\n🚀 *Servicio:* ${deliveryType}\n\n_(Te copiamos la imagen del ticket al portapapeles. ¡Solo mantén presionado el chat y dale Pegar para enviarla!)_`;

        const finalWaUrl = `${whatsappUrl}?text=${encodeURIComponent(textMessage)}`;
        window.open(finalWaUrl, "_blank");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al preparar el ticket visual.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isPrinting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 min-h-[400px]">
        <div className="relative flex flex-col items-center">
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
          <h3 className="font-sans font-semibold text-slate-800 text-sm">
            Generando Recibo Digital
          </h3>
          <p className="text-gray-400 text-xs font-mono animate-pulse">
            Registrando internamente & adaptando ticket a WhatsApp...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start text-center py-2 px-4 space-y-6 max-w-sm mx-auto w-full">
      <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-bounce mt-2">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Recepción Confirmada
        </span>
      </div>

      <motion.div
        ref={ticketRef}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full bg-[#f6eedd] border border-[#0c3ab5]/15 rounded-sm p-5 text-left relative overflow-hidden flex flex-col items-stretch text-[#0c3ab5] font-sans text-sm leading-relaxed"
      >
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-white/20 backdrop-blur-[0.5px] border border-white/10 rotate-[-1deg] pointer-events-none select-none z-20"
          style={{
            clipPath:
              "polygon(2% 18%, 8% 0%, 92% 4%, 98% 15%, 100% 88%, 91% 100%, 9% 95%, 0% 80%)",
          }}
        />

        <div className="flex justify-between items-start pt-3 pb-2 border-b border-[#0c3ab5]/30">
          <div>
            <h1 className="font-sans text-3xl font-black text-slate-900 tracking-tighter leading-none">
              SOMOS
            </h1>
            <span className="font-sans text-[8px] uppercase tracking-[0.25em] font-black text-[#0c3ab5]/60 block mt-0.5">
              LAVANDERÍA
            </span>
          </div>

          <div className="flex items-stretch gap-1.5 h-9">
            <div className="w-[1px] bg-[#0c3ab5]/20 my-1"></div>
            <div className="text-right flex flex-col justify-between">
              <span className="text-[7px] font-black tracking-widest text-[#0c3ab5]/50 leading-none">
                ORDEN
              </span>
              <span className="font-sans font-black text-2xl tracking-tight text-[#d1351b] leading-none">
                #{String(confirmedOrderData?.orderId || "1").padStart(4, "0")}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full border border-[#0c3ab5]/30 bg-transparent overflow-hidden mt-3 text-xs text-[#0c3ab5] font-sans">
          <div className="grid grid-cols-12 divide-x divide-[#0c3ab5]/30 border-b border-[#0c3ab5]/30">
            <div className="col-span-7 p-1.5 py-1 space-y-0.5 text-left">
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">
                Nombre:
              </span>
              <span className="font-bold text-slate-900 block truncate text-sm">
                {confirmedOrderData?.user?.name || "Cliente"}
              </span>
            </div>
            <div className="col-span-5 p-1.5 py-1 space-y-0.5 text-left">
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">
                Teléfono:
              </span>
              <span className="font-bold text-slate-900 block truncate text-sm">
                {confirmedOrderData?.user?.phone || "------"}
              </span>
            </div>
          </div>
          <div className="p-1.5 py-1 space-y-0.5 text-left">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0c3ab5]/50 block">
              Fecha de Recepción:
            </span>
            <span className="font-bold text-slate-900 block text-sm truncate whitespace-nowrap">
              {confirmedOrderData?.date || "------"}
            </span>
          </div>
        </div>

        <div className="mt-4 border-t-2 border-b-2 border-[#0c3ab5]/40 py-1.5 relative text-[#0c3ab5] font-sans">
          <div className="absolute inset-y-0 right-10 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />
          <div className="absolute inset-y-0 right-20 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />
          <div className="absolute inset-y-0 right-30 w-[1px] bg-[#0c3ab5]/15 pointer-events-none" />

          <div className="py-2.5 border-b border-[#0c3ab5]/15 flex justify-between items-center relative z-10">
            <div className="pr-3 text-left">
              <h4 className="text-sm font-bold text-slate-900">
                Lavado cesto mediano
              </h4>
            </div>
            <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
              <span>$150</span>
            </div>
          </div>

          <div className="py-2.5 border-b border-[#0c3ab5]/15 flex justify-between items-center relative z-10">
            <div className="pr-3 text-left">
              <h4 className="text-sm font-bold text-slate-900">
                Entrega a domicilio
              </h4>
            </div>
            <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
              <span>Gratis</span>
            </div>
          </div>

          <div className="py-2.5 flex justify-between items-center relative z-10 min-h-[40px]">
            <div className="pr-3 text-left" />
            <div className="text-right font-sans text-[11px] font-black text-[#0c3ab5] shrink-0 pr-1 flex items-center justify-end min-w-[65px]">
              <span></span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-b border-[#0c3ab5]/30 py-2 flex justify-between items-baseline font-sans text-[#0c3ab5]">
          <span className="text-xs font-black uppercase tracking-wider text-[#0c3ab5]/70">
            Total MXN:
          </span>
          <span className="text-xl font-black font-sans text-[#0c3ab5]">
            $150.00
          </span>
        </div>

        <div className="my-5 flex justify-center items-center">
          <div
            className="transform -rotate-[4deg] text-[#001bb0] font-bold text-center select-none bg-black/5 px-4 py-2 border border-[#0c3ab5]/10 rounded-xl"
            style={{
              fontFamily: '"Comic Sans MS", "Marker Felt", "Brush Script MT", cursive',
            }}
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

      <div className="w-full space-y-3.5 pb-6">
        {bag?.activeOrder && (
          <button
            type="button"
            onClick={onBackToDelivery}
            className="w-full py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs border border-amber-200 select-none cursor-pointer"
          >
            <span>🚚 Volver a Entrega </span>
          </button>
        )}

        {copiedImage && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs flex flex-col items-center space-y-1 leading-normal text-slate-700"
          >
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              ✨ ¡Prisino Ticket Copiado!
            </span>
            <span className="text-[11px] text-slate-500">
              Al abrir WhatsApp, mantén presionado el chat del cliente y selecciona *Pegar* (o presiona *Ctrl+V*) para mandar la imagen del Ticket.
            </span>
          </motion.div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-mono">
            🚫 {errorMessage}
          </div>
        )}

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
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.102.99 11.999.99 6.562.99 2.135 5.361 2.131 10.793c-.001 1.741.47 3.442 1.364 4.958L2.525 21l5.3-1.378H7.8a9.412 9.412 0 0 0-1.153-.466zm10.59-6.394c-.3-.15-1.77-.875-2.043-.974-.275-.098-.475-.148-.674.15-.2.298-.773.974-.948 1.171-.175.199-.349.224-.65.075-.3-.15-1.261-.464-2.4-.1.478-1.018.918-1.519 1.17-1.192.175-.298.087-.56-.044-.81-.13-.252-.674-1.62-.924-2.22-.243-.585-.49-.505-.674-.515-.175-.01-.375-.01-.575-.01-.2 0-.524.075-.798.374-.275.299-1.047 1.022-1.047 2.493 0 1.47 1.072 2.89 1.222 3.09.15.199 2.11 3.221 5.11 4.516.713.308 1.27.492 1.704.63.717.228 1.37.195 1.884.118.574-.085 1.77-.723 2.019-1.419.25-.697.25-1.295.175-1.419-.075-.124-.275-.199-.575-.349z" />
              </svg>
              <span>Enviar Ticket por WhatsApp 🫧</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              const blob = await renderTicketBlob();
              if (!blob) return;
              triggerBlobDownload(blob, `Ticket-SOMOS-${confirmedOrderData?.orderId || "0000"}.png`);
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
          onClick={onNavigateScanner}
          className="p-3.5 rounded-xl font-bold w-full border border-gray-200 hover:bg-gray-200 transition-colors text-xs text-slate-700 mt-2 select-none"
        >
          Continuar al Escáner
        </button>
      </div>
    </div>
  );
}
