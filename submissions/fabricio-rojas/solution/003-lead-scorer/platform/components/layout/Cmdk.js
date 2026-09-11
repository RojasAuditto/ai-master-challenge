'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usd } from '@/lib/fmt';
import { TOM } from '@/lib/explain';
import { Search, ArrowR } from '@/components/ui/Icons';
import Avatar from '@/components/ui/Avatar';

/** Busca global (⌘K / "/"). Indexa os deals abertos; Enter abre a página do deal. */
export default function Cmdk({ itens, janelas }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inp = useRef(null);

  useEffect(() => {
    const abrir = () => { setOn(true); setQ(''); setSel(0); };
    const onKey = (e) => {
      const alvoTexto = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !alvoTexto)) { e.preventDefault(); abrir(); }
      if (e.key === 'Escape') setOn(false);
    };
    window.addEventListener('keydown', onKey); window.addEventListener('ls:busca', abrir);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('ls:busca', abrir); };
  }, []);
  useEffect(() => { if (on) setTimeout(() => inp.current?.focus(), 20); }, [on]);

  const lista = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return itens.slice(0, 8);
    return itens.filter((i) => (i.account ?? '').toLowerCase().includes(s) || i.id.toLowerCase().includes(s) || i.agent.toLowerCase().includes(s) || i.product.toLowerCase().includes(s)).slice(0, 10);
  }, [q, itens]);

  const ir = (i) => { setOn(false); router.push(`/deal/${i.id}`); };
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(lista.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter' && lista[sel]) ir(lista[sel]);
  };
  if (!on) return null;
  return (
    <div className="cmdk" onClick={() => setOn(false)} role="dialog" aria-label="Buscar">
      <div className="cmdk-box" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-in"><Search size={17} style={{ color: 'var(--t3)' }} /><input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onInputKey} placeholder="Conta, deal, vendedor ou produto…" /><kbd>esc</kbd></div>
        <div className="cmdk-list">
          {lista.length === 0 && <div className="empty">Nada encontrado para “{q}”.</div>}
          {lista.map((i, k) => (
            <button key={i.id} className="cmdk-it" data-sel={k === sel} onMouseEnter={() => setSel(k)} onClick={() => ir(i)}>
              <Avatar nome={i.account ?? i.id} size={30} />
              <span className="tx"><b>{i.account ?? 'Conta não atribuída'}</b><span>{i.id} · {i.product} · {i.agent}</span></span>
              <span className={`pill ${TOM[i.acao]}`}>{janelas[i.acao].rotulo}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{usd(i.ev)}</span>
              <ArrowR size={14} style={{ color: 'var(--t3)' }} />
            </button>
          ))}
        </div>
        <div className="cmdk-ft"><span><kbd>↑↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span style={{ marginLeft: 'auto' }}>{itens.length} deals abertos</span></div>
      </div>
    </div>
  );
}
