'use client';
import { useLayoutEffect, useRef, useState } from 'react';

/** Segmented control (Coinstax) com indicador que desliza até o item ativo. */
export default function Seg({ itens, valor, onChange, ariaLabel = 'Filtro' }) {
  const refs = useRef({});
  const [ind, setInd] = useState(null);
  useLayoutEffect(() => {
    const medir = () => { const el = refs.current[valor]; if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth }); };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [valor, itens]);
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {ind && <span className="ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w, opacity: 1 }} aria-hidden="true" />}
      {itens.map((it) => (
        <button key={it.k} role="tab" ref={(el) => { refs.current[it.k] = el; }} aria-pressed={valor === it.k} onClick={() => onChange(it.k)}>
          {it.cor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: it.cor, display: 'inline-block' }} />}
          {it.label}{it.n != null && <span className="n">{it.n}</span>}
        </button>
      ))}
    </div>
  );
}
