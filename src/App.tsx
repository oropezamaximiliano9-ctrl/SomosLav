import { useState, useEffect, useLayoutEffect, useRef, createContext, useContext } from 'react';
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
            'button, a, label, input, textarea, select, [role="button"], [role="radio"], .form-bottom-sheet, .form-overlay, [data-vaul-drawer], [data-vaul-overlay]'
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

function useStableViewportHeight() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const mountTime = Date.now();
    let lastWidth = window.innerWidth;
    let lastValidHeight = 0;
    let rafId = 0;
    const timers: number[] = [];

    const isInputOrDrawerActive = () => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.getAttribute('contenteditable') === 'true')
      ) {
        return true;
      }
      return Boolean(
        document.querySelector('[data-vaul-drawer], .form-bottom-sheet[data-open="true"]')
      );
    };

    const getSaneHeight = (): number | null => {
      const ih = window.innerHeight;
      const iw = window.innerWidth;
      if (!ih || ih <= 0 || !iw || iw <= 0) return null;

      const vv = window.visualViewport;
      if (vv && vv.scale && Math.abs(vv.scale - 1) > 0.08) {
        return null;
      }

      // Reject transient pre-viewport-meta heights on iOS/mobile (e.g. WKWebView 980px fallback producing ~1700px height)
      const maxScreenDim = Math.max(window.screen?.width || 0, window.screen?.height || 0);
      if (navigator.maxTouchPoints > 0 && maxScreenDim > 0 && ih > maxScreenDim + 20) {
        return null;
      }

      // If visualViewport is much shorter than innerHeight, a keyboard is currently open
      if (vv && ih - vv.height > 150) {
        return null;
      }

      const measured = vv ? Math.min(ih, Math.round(vv.height)) : ih;
      return measured > 0 ? Math.round(measured) : null;
    };

    const applyHeight = (h: number) => {
      lastValidHeight = h;
      lastWidth = window.innerWidth;
      document.documentElement.style.setProperty('--app-stable-height', `${h}px`);
    };

    const syncViewportHeight = (forceUpdate = false) => {
      if (isInputOrDrawerActive()) return false;

      const saneH = getSaneHeight();
      if (saneH === null) {
        // Never leave a bogus height frozen on :root; CSS falls back cleanly to 100svh
        if (lastValidHeight === 0) {
          document.documentElement.style.removeProperty('--app-stable-height');
        }
        return false;
      }

      const widthChanged = Math.abs(window.innerWidth - lastWidth) > 2;
      const isInitialSettle = Date.now() - mountTime < 1500;

      if (lastValidHeight === 0 || forceUpdate || widthChanged) {
        applyHeight(saneH);
        return true;
      }

      // Allow initial WKWebView/Chrome toolbar settle or growth after URL-bar keyboard closes,
      // while NEVER shrinking for a keyboard after initial boot
      if (saneH > lastValidHeight || (isInitialSettle && saneH !== lastValidHeight)) {
        applyHeight(saneH);
        return true;
      }

      return true;
    };

    if (!syncViewportHeight(true)) {
      let attempts = 0;
      const retry = () => {
        attempts += 1;
        if (syncViewportHeight(true) || attempts >= 60) {
          return;
        }
        rafId = window.requestAnimationFrame(retry);
      };
      rafId = window.requestAnimationFrame(retry);
    }

    // Catch silent iOS WKWebView / Chrome iOS viewport settle that may not fire window.resize
    for (const delay of [100, 300, 700, 1200]) {
      timers.push(window.setTimeout(() => syncViewportHeight(false), delay));
    }

    const handleResize = () => {
      syncViewportHeight(false);
    };

    const handleOrientationChange = () => {
      timers.push(window.setTimeout(() => syncViewportHeight(true), 150));
      timers.push(window.setTimeout(() => syncViewportHeight(true), 400));
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        syncViewportHeight(true);
      }
    };

    const handleLoad = () => {
      syncViewportHeight(false);
    };

    const vv = window.visualViewport;
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('load', handleLoad);
    if (vv) {
      vv.addEventListener('resize', handleResize);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('load', handleLoad);
      if (vv) {
        vv.removeEventListener('resize', handleResize);
      }
    };
  }, []);
}

function AppContent() {
  useStableViewportHeight();
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
      if (
        e.target instanceof Element &&
        e.target.closest('.form-bottom-sheet, [data-vaul-drawer], [data-vaul-overlay]')
      ) {
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
    isLandingPage
      ? 'h-[var(--app-stable-height,100svh)] min-h-[var(--app-stable-height,100svh)] overflow-y-auto overscroll-y-contain'
      : 'min-h-[var(--app-stable-height,100svh)] overflow-y-auto'
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
