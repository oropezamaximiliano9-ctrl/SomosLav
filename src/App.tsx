import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import BagFlow from './pages/BagFlow';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import AssociateScanner from './pages/AssociateScanner';
import AssociateSchedule from './pages/AssociateSchedule';
import AssociateSimulator from './pages/AssociateSimulator';
import AssociateAssignPreRegistered from './pages/AssociateAssignPreRegistered';
import { MoreVertical } from 'lucide-react';
import GlobalArrivalListener from './components/GlobalArrivalListener';

export const RoleContext = createContext<{
  role: 'customer' | 'associate' | 'admin';
  setRole: (role: 'customer' | 'associate' | 'admin') => void;
}>({
  role: 'customer',
  setRole: () => {}
});

function useGlobalKeyboardDismiss() {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      ) {
        if (!activeEl.contains(e.target as Node)) {
          (activeEl as HTMLElement).blur();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
}

function AppContent() {
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

  const handleNavbarClick = (e: React.MouseEvent) => {
    // Si fue long press (se abrió login), no hacer nada
    if (isLongPressRef.current) return;
    
    // Si ya estamos en la landing, scrollear suavemente al inicio (hero)
    if (isLandingPage) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Si estamos en cualquier otra vista, navegar a la ruta raíz '/'
      navigate('/');
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/';
  const showAlwaysNavbar = role === 'associate' || role === 'admin' || location.pathname === '/login' || !isLandingPage;
  const [isAtHero, setIsAtHero] = useState(true);
  const [hideNavbar, setHideNavbar] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLandingPage) {
      setIsAtHero(false);
      setHideNavbar(false);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingDown = currentScrollTop > lastScrollTop;

      setIsAtHero(currentScrollTop < 60);

      if (isScrollingDown) {
        if (currentScrollTop > lastScrollTop + 10) {
          if (!hideNavbar && !showAlwaysNavbar) {
            setHideNavbar(true);
          }
        }
      } else {
        if (currentScrollTop < lastScrollTop - 5) {
          if (hideNavbar) {
            setHideNavbar(false);
          }
        }
      }

      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isLandingPage, location.pathname, hideNavbar, showAlwaysNavbar]);

  const containerClasses = [
    'w-full',
    'flex',
    'flex-col',
    'transition-colors',
    'duration-75',
    'overflow-x-hidden',
    'bg-[#fdf0d5]',
    isLandingPage ? 'h-[100dvh] overflow-y-auto overscroll-y-contain [scroll-behavior:smooth]' : 'min-h-[100dvh] overflow-y-auto'
  ].join(' ');

  const headerClasses = [
    'sticky',
    'top-0',
    'w-full',
    'z-50',
    'transition-all',
    'duration-200',
    'select-none',
    isLandingPage && isAtHero 
      ? 'bg-transparent text-white' 
      : 'bg-[#fdf0d5] text-gray-900 shadow-sm'
  ].join(' ');

  const innerNavClasses = [
    'max-w-sm',
    'mx-auto',
    'px-4',
    'h-[34px]',
    'relative',
    'flex',
    'items-center',
    'justify-center',
    'space-x-1.5',
    'transition-opacity',
    'duration-75',
    hideNavbar ? 'opacity-0 pointer-events-none' : 'opacity-100'
  ].join(' ');

  const mainClasses = [
    'flex-1',
    'w-full',
    'relative',
    'flex',
    'flex-col',
    isLandingPage ? 'pt-0 pb-0 px-0' : 'max-w-sm mx-auto px-4 pt-4 pb-4'
  ].join(' ');

  return (
    <div 
      ref={scrollContainerRef}
      className={containerClasses}
      style={{ scrollBehavior: 'smooth', scrollPaddingTop: '34px', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header global (solo en rutas fuera de la landing, ya que Landing gestiona su propio Navbar con sticky stacking) */}
      {!isLandingPage && (
        <header 
          className={headerClasses + " cursor-pointer"}
          style={{ WebkitTouchCallout: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onPointerCancel={handlePointerUpOrLeave}
          onClick={handleNavbarClick}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className={innerNavClasses}>
            {(role === 'associate' || role === 'admin') && (
              <button 
                onClick={(e) => { e.stopPropagation(); setRole('customer'); setIsMenuOpen(false); navigate('/'); }}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 uppercase tracking-wider text-slate-600 transition-all duration-200 absolute left-4 cursor-pointer"
              >
                Salir
              </button>
            )}
            {role === 'associate' && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors animate-pulse absolute left-16 cursor-pointer"
                title="Opciones de Asociado (Simulador)"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={mainClasses}>
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

        <GlobalArrivalListener userRole={role} />
      </main>
    </div>
  );
}

export default function App() {
  const [role, setRoleState] = useState<'customer' | 'associate' | 'admin'>(() => {
    return (localStorage.getItem('user_role') as 'customer' | 'associate' | 'admin') || 'customer';
  });

  const setRole = (newRole: 'customer' | 'associate' | 'admin') => {
    localStorage.setItem('user_role', newRole);
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </RoleContext.Provider>
  );
}
