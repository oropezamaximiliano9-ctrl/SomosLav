import { Link, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import { useContext, useState } from "react";
import { RoleContext } from "../App";
import { Scanner } from "@yudiel/react-qr-scanner";
import { extractBagId } from "../utils/qr";

export default function AssociateScanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bagIdParam = searchParams.get("bagId");
  const { role } = useContext(RoleContext);
  
  const [isCameraActive, setIsCameraActive] = useState(false);

  if (bagIdParam) {
    if (role === 'associate' || role === 'admin') {
      return <Navigate to={`/cesto/${bagIdParam}`} replace />;
    } else {
      return <Navigate to={`/login?redirect=/cesto/${bagIdParam}`} replace />;
    }
  }

  return (
    <div className="flex-1 flex flex-col pt-4 animate-in fade-in h-full pb-12 overflow-y-auto px-4">
      
      {/* Upper Navigation Action */}
      <div className="mb-4 mt-2 shrink-0">
        <Link 
          to="/associate/link" 
          className="flex items-center justify-center px-6 py-3 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-bold rounded-xl transition-all w-full text-sm"
        >
          <span>Vincular Pre-registro</span>
        </Link>
      </div>

      {/* Title */}
      <div className="mb-4 text-center shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3 border border-blue-100">
          <Camera className="w-5 h-5 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Escanear Cesto</h1>
        <p className="text-gray-500 text-xs px-2 leading-relaxed">Apunta la cámara al código QR del cesto SOMOS para comenzar</p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Physical Camera Block */}
        <div className="bg-black rounded-2xl overflow-hidden relative border border-slate-900 h-72 flex flex-col items-center justify-center w-full">
          {isCameraActive ? (
            <>
              <button 
                onClick={() => setIsCameraActive(false)}
                className="absolute top-4 right-4 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors border border-white/10"
                title="Apagar Cámara"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-full h-full relative">
                <Scanner 
                  onScan={(result) => {
                    if (result && result.length > 0 && result[0].rawValue) {
                      const id = extractBagId(result[0].rawValue);
                      if (id) {
                        navigate(`/cesto/${id}`);
                      }
                    }
                  }}
                  onError={(error) => console.log(error?.message)}
                  components={{
                    audio: true,
                    finder: true,
                  }}
                  styles={{
                    video: { width: "100%", height: "100%", objectFit: "cover" },
                    container: { width: '100%', height: '100%' }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center p-6 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 text-white/40" />
              </div>
              <button 
                onClick={() => setIsCameraActive(true)}
                className="px-6 py-3 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-bold rounded-xl transition-all text-sm"
              >
                Activar Cámara
              </button>
              <p className="text-gray-400 text-[10px] tracking-wide">Requiere permisos de acceso a la cámara</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
