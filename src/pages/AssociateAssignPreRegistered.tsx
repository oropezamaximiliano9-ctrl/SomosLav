import { useState, useRef, useEffect, FormEvent } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, QrCode, Loader2, Camera, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { extractBagId } from "../utils/qr";
import { db } from "../firebase";
import { doc, getDoc, getDocs, updateDoc, setDoc, collection, query, where } from "firebase/firestore";

export default function AssociateAssignPreRegistered() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prefilledBagId = searchParams.get("bagId") || location.state?.prefilledBagId || "";
  const prefilledPhone = searchParams.get("phone") || "";
  const [phoneSearch, setPhoneSearch] = useState(prefilledPhone);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string, name: string, phone: string } | null>(null);
  const [searchError, setSearchError] = useState("");
  const [scanning, setScanning] = useState(false);
  
  // Success state
  const [successData, setSuccessData] = useState<{ name: string, bagId: string } | null>(null);

  // Auto trigger search if prefilled phone parameter exists
  useEffect(() => {
    if (prefilledPhone) {
      const fetchPrefilledUser = async () => {
        setLoading(true);
        setSearchError("");
        try {
          const q = query(collection(db, "users"), where("phone", "==", prefilledPhone));
          const snap = await getDocs(q);
          if (snap.empty) {
            throw new Error("Cliente no encontrado.");
          }
          const uDoc = snap.docs[0];
          setFoundUser({ id: uDoc.id, ...uDoc.data() } as any);
        } catch (err: any) {
          setSearchError("No encontrado. Intenta con otro teléfono.");
          setFoundUser(null);
        } finally {
          setLoading(false);
        }
      };
      fetchPrefilledUser();
    }
  }, [prefilledPhone]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneSearch) return;

    setLoading(true);
    setSearchError("");
    try {
      const q = query(collection(db, "users"), where("phone", "==", phoneSearch.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("Cliente no encontrado.");
      }
      const uDoc = snap.docs[0];
      setFoundUser({ id: uDoc.id, ...uDoc.data() } as any);
    } catch (err: any) {
      setSearchError("No encontrado. Intenta con otro teléfono.");
      setFoundUser(null);
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = async (bagId: string) => {
    if (!foundUser) return;
    setLoading(true);
    try {
      const bagRef = doc(db, "bags", bagId);
      const bagSnap = await getDoc(bagRef);
      if (!bagSnap.exists()) {
        throw new Error("Cesto no encontrado.");
      }
      const bagData = bagSnap.data() as any;
      if (bagData.status === "assigned") {
        throw new Error("El cesto ya está asignada.");
      }

      const usersQuery = query(collection(db, "users"), where("phone", "==", foundUser.phone));
      const usersSnap = await getDocs(usersQuery);
      let targetUserId = foundUser.id;

      if (!usersSnap.empty) {
        const docSnap = usersSnap.docs[0];
        targetUserId = docSnap.id;
        const existingUser = docSnap.data();

        await updateDoc(doc(db, "users", targetUserId), {
          name: foundUser.name,
          deliveryPreference: existingUser.deliveryPreference || "",
          addressColonia: existingUser.addressColonia || null,
          addressCalle: existingUser.addressCalle || null,
          addressNumero: existingUser.addressNumero || null,
          preferredTime: existingUser.preferredTime || "",
          addressReferences: existingUser.addressReferences || ""
        });
      } else {
        targetUserId = "USR-" + Math.random().toString(36).substring(2, 11);
        await setDoc(doc(db, "users", targetUserId), {
          id: targetUserId,
          name: foundUser.name,
          phone: foundUser.phone,
          deliveryPreference: "",
          addressColonia: null,
          addressCalle: null,
          addressNumero: null,
          preferredTime: "",
          addressReferences: "",
          credits: 0.0,
          createdAt: new Date().toISOString()
        });
      }

      await updateDoc(doc(db, "bags", bagId), { status: "assigned", userId: targetUserId, assignedAt: new Date().toISOString() });
      
      // Success! Show green screen mode
      setSuccessData({ name: foundUser.name, bagId });
      setScanning(false);
      setFoundUser(null);
      setPhoneSearch("");
      
      // Reset and redirect after 2 seconds
      setTimeout(() => {
        setSuccessData(null);
        navigate(`/cesto/${bagId}`);
      }, 2000);
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center bg-green-500 text-white w-full absolute inset-0 z-50 animate-in fade-in duration-300">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="space-y-6 flex flex-col items-center px-4 w-full"
        >
          <div className="w-24 h-24 bg-white/20 rounded-full flex flex-col items-center justify-center backdrop-blur-md">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase leading-tight">
            ✓ Cesto asignado a<br />{successData.name.split(' ')[0]}
          </h1>
          <p className="text-xl font-medium bg-black/20 px-6 py-3 rounded-2xl">
            {successData.bagId}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full">
      <div className="p-6 pb-2 relative shrink-0">
         <button onClick={() => {
            if (scanning) {
                setScanning(false);
            } else if (foundUser) {
                setFoundUser(null);
                setPhoneSearch("");
            } else {
                navigate("/scanner");
            }
         }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center transition-transform">
           <ArrowLeft className="w-5 h-5 text-gray-700" />
         </button>
      </div>

      <div className="flex-1 flex flex-col px-6 w-full max-w-md mx-auto">
        {!foundUser && !scanning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col pt-6">
            <div className="mb-8">
              <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase mb-2">Buscar Cliente</h1>
              <p className="text-gray-500 text-sm">Pre-registros en línea</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Teléfono</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-lg"
                    placeholder="Ej. 55 1234 5678"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {searchError && <p className="text-red-500 text-sm mt-3 ml-1">{searchError}</p>}
              </div>

              <button
                 type="submit"
                 disabled={loading || !phoneSearch}
                 className="w-full p-4 mt-6 rounded-2xl bg-[#0f55d8] text-white font-bold text-lg hover:bg-[#0d4bc0] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
               >
                 {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Buscar"}
               </button>
            </form>
          </motion.div>
        )}

        {foundUser && !scanning && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center pb-20">
             <div className="w-full space-y-8">
               <div>
                  <div className="inline-flex items-center justify-center px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-green-100 flex items-center space-x-2">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <span>Encontrado</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight truncate px-4 block">{foundUser.name}</h1>
                  <p className="text-lg text-gray-400 mt-2 font-mono">{foundUser.phone}</p>
               </div>

               <div className="pt-8">
                  <button
                    onClick={() => {
                      if (prefilledBagId) {
                        simulateScan(prefilledBagId);
                      } else {
                        setScanning(true);
                      }
                    }}
                    className="w-full bg-[#0f55d8] text-white p-5 rounded-2xl font-bold flex flex-col items-center justify-center hover:-translate-y-1 hover:/30 transition-all disabled:opacity-50 text-lg cursor-pointer select-none outline-none"
                  >
                    {prefilledBagId ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-85">Confirmar Vinculación</span>
                        <span className="text-base tracking-wider font-extrabold">{prefilledBagId}</span>
                      </div>
                    ) : (
                      "Asignar cesto"
                    )}
                  </button>
                  {prefilledBagId && (
                    <button
                      onClick={() => setScanning(true)}
                      className="w-full py-4 mt-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 font-bold text-sm hover:bg-gray-50 hover:text-gray-750 transition-all outline-none flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Escanear otro cesto</span>
                    </button>
                  )}
               </div>
             </div>
          </motion.div>
        )}

        {scanning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col pt-6 h-full pb-6">
             <div className="mb-6 text-center shrink-0">
                <div className="inline-flex w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4 border border-blue-100">
                   <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold">Escanear Cesto</h2>
                <p className="text-gray-500 text-sm mt-1">Escanea el código QR de un cesto vacío para asignárselo a {foundUser?.name.split(' ')[0]}.</p>
             </div>

             <div className="flex-1 w-full bg-black rounded-none overflow-hidden relative">
               {loading && (
                 <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                   <Loader2 className="w-8 h-8 text-white animate-spin" />
                 </div>
               )}
               <Scanner 
                  onScan={(result) => {
                    if (result && result.length > 0 && result[0].rawValue) {
                      let value = extractBagId(result[0].rawValue) || "";
                      if (value.includes('/cesto/')) {
                        value = value.split('/cesto/').pop() || value;
                      } else if (value.includes('=')) {
                          // just in case they have it in search params
                          value = value.split('=').pop() || value;
                      }
                      if (value && !loading) {
                         simulateScan(value);
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
             
             <div className="mt-8 shrink-0 text-center text-xs text-gray-400">
                Apunta la cámara al código QR del cesto SOMOS
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
