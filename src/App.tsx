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
import GlobalArrivalListener from "./components/GlobalArrivalListener";
import { useGlobalKeyboardDismiss } from "./hooks/useGlobalKeyboardDismiss";

interface RoleContextType {
  role: 'customer' | 'associate' | 'admin';
  setRole: (role: 'customer' | 'associate' | 'admin') => void;
}

export const RoleContext = createContext<RoleContextType>({ role: 'customer', setRole: () => {} });

// MainLayout extracted to wrap inside BrowserRouter for use of hooks like useNavigate
function MainLayout() {
  useGlobalKeyboardDismiss();
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

  const [hideNavbar, setHideNavbar] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLandingPage) {
      setHideNavbar(false);
      return;
    }

    const guindaSection = document.getElementById("lava-estrena-section");
    const container = scrollContainerRef.current;

    if (!guindaSection || !container) return;

    let isAutoScrolling = false;
    let autoScrollTimeout: any = null;
    let scrollEndTimer: any = null;
    let touchStartY = 0;
    let touchStartedInsideGuinda = false;
    let momentumRestrictedToGuinda = false;
    let lastScrollTop = container.scrollTop;

    const getGuindaOffsetTop = () => guindaSection.offsetTop;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      const guindaTop = getGuindaOffsetTop();
      // Solo consideramos que empezó dentro si está claramente más abajo del tope
      if (container.scrollTop > guindaTop + 15) {
        touchStartedInsideGuinda = true;
        momentumRestrictedToGuinda = true;
      } else {
        touchStartedInsideGuinda = false;
        momentumRestrictedToGuinda = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartedInsideGuinda) return;

      const currentY = e.touches[0].clientY;
      const isDraggingDown = currentY > touchStartY; // Arrastrar hacia abajo = scroll up hacia sección anterior
      const guindaTop = getGuindaOffsetTop();

      // Si inició dentro de la sección y al subir llega al tope en este mismo gesto, frenar en el tope
      if (isDraggingDown && container.scrollTop <= guindaTop) {
        container.scrollTop = guindaTop;
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      const guindaTop = getGuindaOffsetTop();
      if (container.scrollTop <= guindaTop + 5) {
        if (touchStartedInsideGuinda) {
          container.scrollTop = guindaTop;
        }
        container.style.scrollSnapType = 'y mandatory';
        momentumRestrictedToGuinda = false;
      }
      touchStartedInsideGuinda = false;
    };

    const handleWheel = (e: WheelEvent) => {
      const guindaTop = getGuindaOffsetTop();

      // Si scrolleamos hacia arriba desde adentro de la sección guinda
      if (container.scrollTop > guindaTop + 10 && e.deltaY < 0) {
        if (container.scrollTop + e.deltaY <= guindaTop) {
          e.preventDefault();
          container.scrollTop = guindaTop;
          container.style.scrollSnapType = 'y mandatory';
        }
      }
    };

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingDown = currentScrollTop > lastScrollTop;
      const guindaTop = getGuindaOffsetTop();
      const rect = guindaSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Si venía de un scroll/momentum que inició dentro de la sección guinda y llegó al tope
      if (momentumRestrictedToGuinda && currentScrollTop < guindaTop) {
        container.scrollTop = guindaTop;
        momentumRestrictedToGuinda = false;
      }

      // Auto-corrección de reposo:
      // Si un deslizamiento excepcionalmente suave o con micro-inercia se detiene flotando en un margen ambiguo justo por encima del tope,
      // el sistema ejecuta de inmediato un ajuste suave alineándolo al inicio exacto de la sección guinda sin saltos ni cortes
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        const top = container.scrollTop;
        const gTop = getGuindaOffsetTop();
        if (top > gTop - 90 && top < gTop) {
          container.scrollTo({ top: gTop, behavior: 'smooth' });
        }
      }, 80);

      // Desactivar scroll snap dentro de la sección guinda (> guindaTop + 10) para desplazamiento libre
      // En el tope o por encima (<= guindaTop + 5), activar scroll snap para transiciones limpias entre secciones
      if (container.scrollTop > guindaTop + 10) {
        if (container.style.scrollSnapType !== 'none') {
          container.style.scrollSnapType = 'none';
        }
      } else {
        if (container.style.scrollSnapType !== 'y mandatory') {
          container.style.scrollSnapType = 'y mandatory';
        }
      }

      // Visibilidad del Navbar y guía rápida de entrada
      if (isScrollingDown) {
        if (rect.top <= viewportHeight * 0.65 && rect.bottom >= 80) {
          setHideNavbar(true);
        } else {
          setHideNavbar(false);
        }

        // Snap rápido y fluido al entrar a la sección ÚNICAMENTE desde arriba (fuera de la sección)
        if (!isAutoScrolling && currentScrollTop < guindaTop - 20 && rect.top > 20 && rect.top < viewportHeight * 0.80) {
          isAutoScrolling = true;
          guindaSection.scrollIntoView({ behavior: 'smooth' });
          clearTimeout(autoScrollTimeout);
          autoScrollTimeout = setTimeout(() => {
            isAutoScrolling = false;
          }, 400);
        }
      } else {
        // Al subir hacia la sección anterior: reaparece tras salir de la sección guinda (20% de la ventana)
        if (rect.top > viewportHeight * 0.20 || rect.bottom < 80) {
          setHideNavbar(false);
        } else {
          setHideNavbar(true);
        }
      }

      lastScrollTop = container.scrollTop;
    };

    // Initial check
    handleScroll();

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(autoScrollTimeout);
      clearTimeout(scrollEndTimer);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isLandingPage, location.pathname]);

  return (
    <div 
      ref={scrollContainerRef}
      className={`w-full flex flex-col transition-colors duration-75 overflow-x-hidden ${
        hideNavbar ? "bg-[#4E0000]" : "bg-[#fdf0d5]"
      } ${
        isLandingPage ? "h-[100dvh] overflow-y-auto snap-y snap-mandatory" : "min-h-[100dvh] overflow-y-auto"
      }`}
      style={{ scrollBehavior: 'smooth', scrollPaddingTop: '50px' }}
    >
      {/* Top Banner removed */}

      {/* Header - Always present, sticky below the top banner */}
      <header 
        className={`sticky top-0 w-full z-50 transition-all duration-75 ${
          hideNavbar 
            ? "bg-[#4E0000] text-white" 
            : "bg-[#fdf0d5]/95 backdrop-blur-md text-gray-900"
        }`}
      >
        <div className={`max-w-sm mx-auto px-4 h-[50px] flex items-center justify-between transition-opacity duration-75 ${
          hideNavbar ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          <span 
            onClick={handleClick}
            className="text-[20px] leading-none font-unbounded font-normal text-gray-900 select-none cursor-pointer relative -top-[1px]"
            style={{ WebkitTouchCallout: 'none', letterSpacing: '-0.04em' }}
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
            <img 
              src="https://i.ibb.co/3ynSFBH9/IMG-8932.webp" 
              alt="Somos Logo" 
              className="h-[31px] w-auto object-contain select-none cursor-pointer transition-all duration-300" 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area - Mobile constrained with modern standard spacing */}
      <main className={`flex-1 w-full relative flex flex-col ${isLandingPage ? "pt-0 pb-0 px-0" : "max-w-sm mx-auto px-4 pt-4 pb-4"}`}>
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
        
        {/* Global listener for customer arrivals with sound & alerts */}
        <GlobalArrivalListener userRole={role} />
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
