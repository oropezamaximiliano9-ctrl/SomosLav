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

    const guindaSection = document.getElementById("lava-estrena-section");
    const container = scrollContainerRef.current;

    if (!guindaSection || !container) return;

    let touchStartY = 0;
    let touchStartedInsideGuinda = false;
    let momentumRestrictedToGuinda = false;
    let lastScrollTop = container.scrollTop;
    let scrollEndTimer: any = null;

    const getGuindaOffsetTop = () => guindaSection.offsetTop;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      const guindaTop = getGuindaOffsetTop();
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
      const isDraggingDown = currentY > touchStartY;
      const guindaTop = getGuindaOffsetTop();

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

      setIsAtHero(currentScrollTop < 60);

      if (momentumRestrictedToGuinda && currentScrollTop < guindaTop) {
        container.scrollTop = guindaTop;
        momentumRestrictedToGuinda = false;
      }

      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        const top = container.scrollTop;
        const gTop = getGuindaOffsetTop();
        if (top > gTop - 90 && top < gTop) {
          container.scrollTo({ top: gTop, behavior: 'smooth' });
        }
      }, 100);

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

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isLandingPage, location.pathname, hideNavbar, showAlwaysNavbar]);

  const containerClasses = [
    'w-full',
    'flex',
    'flex-col',
    'transition-colors',
    'duration-75',
    'overflow-x-hidden',
    hideNavbar ? 'bg-[#4E0000]' : 'bg-[#fdf0d5]',
    isLandingPage ? 'h-[100dvh] overflow-y-auto snap-y snap-mandatory' : 'min-h-[100dvh] overflow-y-auto'
  ].join(' ');

  const headerClasses = [
    'sticky',
    'top-0',
    'w-full',
    'z-50',
    'transition-all',
    'duration-200',
    'select-none',
    hideNavbar 
      ? 'bg-[#4E0000] text-white' 
      : isLandingPage && isAtHero 
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
    isLandingPage ? '-mt-[34px] pt-0 pb-0 px-0' : 'max-w-sm mx-auto px-4 pt-4 pb-4'
  ].join(' ');

  return (
    <div 
      ref={scrollContainerRef}
      className={containerClasses}
      style={{ scrollBehavior: 'smooth', scrollPaddingTop: '34px' }}
    >
      {/* Header con soporte de pulsación larga en cualquier punto de la navbar */}
      <header 
        className={headerClasses}
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
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
