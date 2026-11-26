import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import BagFlow from './pages/BagFlow';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import AssociateScanner from './pages/AssociateScanner';
import AssociateSimulator from './pages/AssociateSimulator';
import AssociateAssignPreRegistered from './pages/AssociateAssignPreRegistered';
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
        const target = e.target as HTMLElement | null;
        if (!target || activeEl.contains(target)) return;
        if (
          target.closest(
            'button, a, label, input, textarea, select, [role="button"], [role="radio"], .form-bottom-sheet, .form-overlay'
          )
        ) {
          return;
        }
        (activeEl as HTMLElement).blur();
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

  const handleNavbarClick = () => {
    if (isLongPressRef.current) return;
    navigate('/');
  };

  const isLandingPage = location.pathname === '/';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Soporte de rueda de ratón y teclado desde cualquier área en escritorio
  useEffect(() => {
    const handleWindowWheel = (e: WheelEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (e.target instanceof Element && e.target.closest('.form-bottom-sheet')) {
        return;
      }
      if (!container.contains(e.target as Node)) {
        container.scrollTop += e.deltaY;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }
      const container = scrollContainerRef.current;
      if (!container) return;

      if (e.key === 'ArrowDown') {
        container.scrollBy({ top: 90, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        container.scrollBy({ top: -90, behavior: 'smooth' });
      } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        container.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        container.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      }
    };

    window.addEventListener('wheel', handleWindowWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWindowWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const containerClasses = [
    'w-full',
    'flex',
    'flex-col',
    'overflow-x-hidden',
    'bg-[#FFFCEF]',
    'touch-pan-y',
    isLandingPage ? 'h-full overflow-y-auto overscroll-y-contain' : 'min-h-full overflow-y-auto'
  ].join(' ');

  const headerClasses =
    'sticky top-0 w-full z-50 transition-all duration-200 select-none bg-[#FFFCEF] text-gray-900 shadow-sm';

  const innerNavClasses =
    'max-w-sm mx-auto px-4 h-[34px] relative flex items-center justify-center space-x-1.5';

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
      id="app-scroll-container"
      ref={scrollContainerRef}
      tabIndex={0}
      className={containerClasses + " outline-none"}
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
                onClick={(e) => { e.stopPropagation(); setRole('customer'); navigate('/'); }}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 uppercase tracking-wider text-slate-600 transition-all duration-200 absolute left-4 cursor-pointer"
              >
                Salir
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
          <Route path="/associate/link" element={<AssociateAssignPreRegistered />} />
          <Route path="/simulator" element={<AssociateSimulator />} />
        </Routes>

        <GlobalArrivalListener />
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
