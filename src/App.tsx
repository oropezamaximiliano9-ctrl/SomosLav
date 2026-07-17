/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, createContext, useContext, useRef, MouseEvent, useEffect } from "react";
import { Calendar, Clock, Menu, MoreVertical, X, ArrowLeft, Play, MessageCircleMore } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Landing from "./pages/Landing";
import BagFlow from "./pages/BagFlow";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import AssociateScanner from "./pages/AssociateScanner";
import AssociateSchedule from "./pages/AssociateSchedule";
import AssociateAssignPreRegistered from "./pages/AssociateAssignPreRegistered";
import AssociateSimulator from "./pages/AssociateSimulator";
import FlowSimulator from "./components/FlowSimulator";

interface RoleContextType {
  role: 'customer' | 'associate' | 'admin';
  setRole: (role: 'customer' | 'associate' | 'admin') => void;
}

export const RoleContext = createContext<RoleContextType>({ role: 'customer', setRole: () => {} });

// MainLayout extracted to wrap inside BrowserRouter for use of hooks like useNavigate
function MainLayout() {
  const { role, setRole } = useContext(RoleContext);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);



  const handlePointerDown = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (role !== 'associate' && role !== 'admin') {
        navigate("/login");
      }
    }, 1500);
  };

  const handlePointerUpOrLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = (e: MouseEvent) => {
    if (!isLongPressRef.current) {
      if (role === 'associate') {
        navigate("/scanner");
      } else if (role === 'admin') {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  const isLandingPage = location.pathname === "/";
  const showAlwaysNavbar = role === 'associate' || role === 'admin' || location.pathname === '/login' || !isLandingPage;

  return (
    <div 
      className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden flex flex-col bg-[#fdf0d5] snap-y snap-mandatory"
      style={{ scrollBehavior: 'smooth', scrollPaddingTop: '56px' }}
    >
      {/* Top Banner removed */}

      {/* Header - Always present, sticky below the top banner */}
      <header className="bg-[#fdf0d5]/95 backdrop-blur-md sticky top-0 w-full z-50">
        <div className="max-w-sm mx-auto px-4 h-14 flex items-center justify-between">
          <span 
            onClick={handleClick}
            className="text-[22px] leading-none font-unbounded font-normal tracking-tight text-gray-900 select-none cursor-pointer"
            style={{ WebkitTouchCallout: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onPointerCancel={handlePointerUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            somos
          </span>
          <div className="flex items-center space-x-2 relative">
            {(role === 'associate' || role === 'admin') && (
               <button 
                 onClick={() => { setRole('customer'); setIsMenuOpen(false); navigate('/'); }}
                 className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 uppercase tracking-wider text-slate-600 transition-all duration-200"
               >
                 Salir
               </button>
            )}
            {role === 'associate' && (
               <button 
                 onClick={() => setIsMenuOpen(!isMenuOpen)}
                 className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors animate-pulse"
                 title="Opciones de Asociado (Simulador)"
               >
                 <MoreVertical className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Mobile constrained with modern standard spacing */}
      <main className={`flex-1 w-full max-w-sm mx-auto relative flex flex-col px-4 ${isLandingPage ? "pt-0 pb-0" : "pt-4 pb-4"}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/cesto/:id" element={<BagFlow />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/scanner" element={<AssociateScanner />} />
          <Route path="/schedule" element={<AssociateSchedule />} />
          <Route path="/associate/link" element={<AssociateAssignPreRegistered />} />
          <Route path="/simulator" element={<AssociateSimulator />} />
        </Routes>
        
      </main>

      {/* Menú de herramientas del asociado que se despliega desde el lado */}
      <AnimatePresence>
        {role === 'associate' && isMenuOpen && (
          <>
            {/* Backdrop oscuro con blur sutil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[100]"
            />

            {/* Panel lateral que se despliega desde el lado derecho */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 bottom-0 w-[88%] sm:w-[380px] bg-white border-l border-slate-100 z-[101] flex flex-col h-full text-slate-800 overflow-hidden"
            >
              {/* Encabezado del menú */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 select-none">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#0f55d8]">Herramientas</span>
                  <span className="text-sm font-bold text-slate-900">Menú de Asociado</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  title="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido deslizable */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Enlaces de navegación rápidos */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Navegación</span>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/schedule');
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100 border border-slate-100/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#0f55d8]" />
                        <span>Elegir horarios de la semana</span>
                      </button>
                      
                      {location.pathname !== "/scanner" && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/scanner');
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100 border border-slate-100/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                        >
                          <Menu className="w-4 h-4 text-emerald-650" />
                          <span>Ir al Escáner de Cestos</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/simulator');
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100 border border-slate-100/80 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Acceder al simulador de flujos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<'customer' | 'associate' | 'admin'>(() => {
    const saved = localStorage.getItem('app_role');
    if (saved === 'admin' || saved === 'associate' || saved === 'customer') {
      return saved as 'customer' | 'associate' | 'admin';
    }
    return 'customer';
  });

  const updateRole = (newRole: 'customer' | 'associate' | 'admin') => {
    setRole(newRole);
    localStorage.setItem('app_role', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: updateRole }}>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </RoleContext.Provider>
  );
}
