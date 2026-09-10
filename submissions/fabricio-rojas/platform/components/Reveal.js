'use client';
import { useEffect, useRef, useState } from 'react';
import { num, usd, usdK, int } from '@/lib/fmt';

/**
 * Dispara uma vez quando o elemento entra na tela. Os graficos animam a partir
 * disso — animar no mount faria a animacao acontecer fora da vista do leitor.
 */
export function useInView(margem = '-60px') {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return setVisivel(true);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisivel(true); obs.disconnect(); } },
      { rootMargin: `0px 0px ${margem} 0px` }
    );
    obs.observe(el);
    // Rede de seguranca: se o observer nao disparar (aba em background na
    // hidratacao, captura headless, navegador exotico), o conteudo aparece
    // mesmo assim. Conteudo invisivel e pior que animacao perdida.
    const t = setTimeout(() => { setVisivel(true); obs.disconnect(); }, 2500);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [margem]);
  return [ref, visivel];
}

/** Envelope de entrada: sobe e aparece. `atraso` escalona itens de uma lista. */
export function Rise({ children, atraso = 0, className = '', ...rest }) {
  const [ref, on] = useInView();
  return (
    <div ref={ref} className={`rise ${on ? 'on' : ''} ${className}`}
      style={{ transitionDelay: `${atraso}ms` }} {...rest}>
      {children}
    </div>
  );
}

// Chave em vez de funcao: server component nao pode passar funcao para client.
const FORMATOS = {
  int: (v) => int(v),
  num: (v) => num(v),
  num2: (v) => num(v, 2),
  usd: (v) => usd(v),
  usdK: (v) => usdK(v),
  pct: (v) => num(v) + '%',
};

/**
 * Contador que sobe ate o valor. Easing de saida para parar suave —
 * numero que "aterrissa" e mais legivel que numero que para seco.
 */
export function Contador({ para, duracao = 900, formato = 'int', atraso = 0 }) {
  const formata = FORMATOS[formato] ?? FORMATOS.int;
  const [ref, on] = useInView();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setV(para);
    let raf, t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0 - atraso) / duracao);
      if (p >= 0) setV(para * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, para, duracao, atraso]);
  return <span ref={ref}>{formata(v)}</span>;
}
