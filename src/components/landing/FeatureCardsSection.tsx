import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface FeatureCardsSectionProps {
  role: 'customer' | 'associate' | 'admin';
  setRole: (role: 'customer' | 'associate' | 'admin') => void;
  handleNavbarPointerDown: () => void;
  handleNavbarPointerUpOrLeave: () => void;
  handleNavbarClick: () => void;
}

const CheckmarkIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 011.414-1.42l2.543 2.543 6.543-6.543a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const FeatureCardsSection: React.FC<FeatureCardsSectionProps> = ({
  role,
  setRole,
  handleNavbarPointerDown,
  handleNavbarPointerUpOrLeave,
  handleNavbarClick,
}) => {
  const navigate = useNavigate();
  const lineRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    const head = headRef.current;
    if (!line || !head) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let phase = 0;
    let last: number | null = null;
    let rafId = 0;

    const smoothstep = (a: number, b: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const drawFrame = () => {
      let d = '';
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const y = 12 + u * 158;
        const env = smoothstep(0, 0.06, u) * (1 - smoothstep(0.88, 1, u));
        const x = 42 + 4 * env * Math.sin(u * 4.4 * Math.PI * 2 - phase * 3.2);
        d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      line.setAttribute('d', d);
      const tipY = 174;
      head.setAttribute(
        'd',
        'M 30.5 ' + (tipY - 12.5).toFixed(2) + ' L 42 ' + tipY.toFixed(2) + ' L 53.5 ' + (tipY - 12.5).toFixed(2)
      );
    };

    if (prefersReducedMotion) {
      drawFrame();
      return;
    }

    const animate = (ts: number) => {
      if (last === null) last = ts;
      phase += Math.min((ts - last) / 1000, 0.05) * 2.5;
      last = ts;
      drawFrame();
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div id="content-stack-wrapper">
      <header
        className="header-2 select-none cursor-pointer flex items-center justify-center"
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={handleNavbarPointerDown}
        onPointerUp={handleNavbarPointerUpOrLeave}
        onPointerLeave={handleNavbarPointerUpOrLeave}
        onPointerCancel={handleNavbarPointerUpOrLeave}
        onClick={() => {
          const container =
            document.getElementById('app-scroll-container') ?? document.querySelector('.overflow-y-auto');
          const scrollTop = container ? container.scrollTop : window.scrollY;
          if (scrollTop < 40) {
            const target = document.getElementById('content-stack-wrapper');
            if (target && container && container.scrollHeight > container.clientHeight) {
              const containerRect = container.getBoundingClientRect();
              const targetRect = target.getBoundingClientRect();
              container.scrollTo({
                top: container.scrollTop + (targetRect.top - containerRect.top),
                behavior: 'smooth',
              });
              return;
            }
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              return;
            }
          }
          handleNavbarClick();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="sheet-peek-handle" aria-hidden="true" />
        {(role === 'associate' || role === 'admin') && (
          <div className="max-w-sm w-full mx-auto px-4 h-full relative flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRole('customer');
                navigate('/');
              }}
              className="text-xs font-semibold px-3.5 py-0.5 rounded-full bg-slate-200/80 hover:bg-slate-200 uppercase tracking-wider text-slate-700 transition-all duration-200 cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}
      </header>

      <section className="section-colecciones">
        {/* Tarjeta 1: Precio único */}
        <article className="title-group">
          <h2 className="section-title">
            <span className="word-blue">Sin pagar</span> de más
          </h2>
          <p className="subtitle-desc">
            Si cabe en el cesto, se lava al mismo precio. No importa el peso ni la cantidad.
          </p>
          <div className="card-tray card-tray--single">
            <span className="card-tray-item">
              <CheckmarkIcon />
              <span>Incluye secado y doblado</span>
            </span>
          </div>
        </article>

        {/* Flecha ondulada animada que conecta la primera tarjeta con la segunda */}
        <div className="card-connector" aria-hidden="true">
          <svg id="flecha-ondulada" width="84" height="189" viewBox="0 0 84 189" fill="none">
            <path
              ref={lineRef}
              id="fo-linea"
              stroke="#0A0F23"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={headRef}
              id="fo-punta"
              stroke="#0A0F23"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Tarjeta 2: Entrega */}
        <article className="title-group">
          <h2 className="section-title">
            <span className="word-blue">Sin salir</span> de casa
          </h2>
          <p className="subtitle-desc">Pasamos por tu ropa sucia y te la devolvemos limpia en 24 horas.</p>
          <div className="card-tray card-tray--single">
            <span className="card-tray-item">
              <CheckmarkIcon />
              <span>Servicio a domicilio gratis</span>
            </span>
          </div>
        </article>
      </section>
    </div>
  );
};
