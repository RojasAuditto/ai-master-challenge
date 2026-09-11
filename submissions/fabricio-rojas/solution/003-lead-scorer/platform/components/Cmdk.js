'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usd } from '@/lib/fmt';
import { ArrowR } from './Icons';

const ACAO = { fechar: 'ok', acompanhar: 'blue', decidir: 'no', engajar: 'violet' };

/** Busca global (⌘K). Abre pelo atalho, pelo botão da sidebar ou pelo evento g4:busca. */
export default function Cmdk({ itens }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inp = useRef(null);

  useEffect(() => {
    const abrir = () => { setOn(true); setQ(''); setSel(0); };
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrir(); }
      if (e.key === 'Escape') setOn(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('g4:busca', abrir);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('g4:busca', abrir); };
  }, []);
  useEffect(() => { if (on) setTimeout(() => inp.current?.focus(), 20); }, [on]);

  const lista = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return itens.slice(0, 8);
    return itens.filter((i) => (i.account ?? '').toLowerCase().includes(s) || i.id.toLowerCase().includes(s) || i.agent.toLowerCase().includes(s) || i.product.toLowerCase().includes(s)).slice(0, 10);
  }, [q, itens]);

  const ir = (i) => { setOn(false); router.push(`/?deal=${i.id}&agente=${encodeURIComponent(i.agent)}`); };
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(lista.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter' && lista[sel]) ir(lista[sel]);
  };

  if (!on) return null;
  return (
    <div className="cmdk" onClick={() => setOn(false)} role="dialog" aria-label="Buscar">
      <div className="cmdk-box" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-in">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--ink-3)' }} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onInputKey} placeholder="Conta, deal, vendedor ou produto…" />
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list">
          {lista.length === 0 && <div className="empty">Nada encontrado para “{q}”.</div>}
          {lista.map((i, k) => (
            <button key={i.id} className="cmdk-it" data-sel={k === sel} onMouseEnter={() => setSel(k)} onClick={() => ir(i)}>
              <span className={`tag ${ACAO[i.acao]}`} style={{ minWidth: 92, justifyContent: 'center' }}>{i.acao}</span>
              <span className="tx"><b>{i.account ?? 'Conta não atribuída'}</b><span>{i.id} · {i.product} · {i.agent}</span></span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold-soft)' }}>{usd(i.ev)}</span>
              <ArrowR size={14} style={{ color: 'var(--ink-3)' }} />
            </button>
          ))}
        </div>
        <div className="cmdk-ft"><span><span className="kbd">↑↓</span> navegar</span><span><span className="kbd">↵</span> abrir deal</span><span>{itens.length} deals abertos indexados</span></div>
      </div>
    </div>
  );
}
