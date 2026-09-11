'use client';
import { useEffect, useRef, useState } from 'react';
import { num, usd, usdK, int } from '@/lib/fmt';

/** Dispara uma vez quando entra na tela; com fallback para nunca deixar conteúdo invisível. */
export function useInView(margem = '-40px') {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return setOn(true);
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { rootMargin: `0px 0px ${margem} 0px` });
    obs.observe(el);
    const t = setTimeout(() => { setOn(true); obs.disconnect(); }, 1200);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [margem]);
  return [ref, on];
}

export function Rise({ children, atraso = 0, className = '', ...rest }) {
  const [ref, on] = useInView();
  return <div ref={ref} className={`rise ${on ? 'on' : ''} ${className}`} style={{ transitionDelay: `${atraso}ms` }} {...rest}>{children}</div>;
}

const FORMATOS = { int: (v) => int(v), num: (v) => num(v), usd: (v) => usd(v), usdK: (v) => usdK(v), pct: (v) => num(v, 0) + '%' };

/** Contador SSR-first: o HTML já traz o número; com JS e movimento, recua e sobe. */
export function Counter({ para, duracao = 900, formato = 'int', atraso = 0 }) {
  const formata = FORMATOS[formato] ?? FORMATOS.int;
  const [ref, on] = useInView();
  const [v, setV] = useState(para);
  useEffect(() => { setV(para); }, [para]);
  useEffect(() => {
    if (!on) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off') return;
    let raf, t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0 - atraso) / duracao);
      if (p >= 0) setV(para * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setV(0); raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, para, duracao, atraso]);
  return <span ref={ref}>{formata(v)}</span>;
}
