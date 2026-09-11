'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Target, Users, Book, Database, ChevL, X, Info } from './Icons';

const Search = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...p}>
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);

const NAV = [
  { label: 'Pipeline', items: [
    { href: '/', txt: 'Minha segunda-feira', Ic: Target, badge: 'fechar' },
    { href: '/equipe', txt: 'Equipe', Ic: Users },
  ] },
  { label: 'Sobre o score', items: [
    { href: '/metodo', txt: 'Como funciona', Ic: Book },
    { href: '/dados', txt: 'Dados do CRM', Ic: Database, badge: 'decidir' },
  ] },
];
const TITULO = Object.fromEntries(NAV.flatMap((g) => g.items).map((i) => [i.href, i.txt]));

export default function Sidebar({ badges = {} }) {
  const rota = usePathname();
  const [min, setMin] = useState(false);
  const [gaveta, setGaveta] = useState(false);

  useEffect(() => { try { if (localStorage.getItem('g4-ls-sb') === 'min') setMin(true); } catch { /* sem storage */ } }, []);
  const toggleMin = () => setMin((m) => { try { localStorage.setItem('g4-ls-sb', m ? 'max' : 'min'); } catch { /* ignora */ } return !m; });
  useEffect(() => { setGaveta(false); }, [rota]);
  useEffect(() => {
    if (!gaveta) return;
    const ant = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setGaveta(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ant; window.removeEventListener('keydown', onKey); };
  }, [gaveta]);

  const abrirBusca = () => window.dispatchEvent(new CustomEvent('g4:busca'));

  return (
    <>
      <header className="mtop">
        <button className="mtop-btn" onClick={() => setGaveta(true)} aria-label="Abrir menu" aria-expanded={gaveta}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <span className="sb-logo"><img src="/g4-branca.svg" alt="G4" /></span>
        <span className="mtop-t">{TITULO[rota] ?? 'Lead Scorer'}</span>
        <button className="mtop-btn" onClick={abrirBusca} aria-label="Buscar" style={{ marginLeft: 'auto' }}><Search /></button>
      </header>
      <div className="sb-veu" data-on={gaveta} onClick={() => setGaveta(false)} aria-hidden="true" />

      <aside className="sb" data-min={min} data-gaveta={gaveta}>
        <div className="sb-top">
          <div className="sb-brand">
            {/* Logo oficial G4, versão branca. Só o símbolo quando recolhida. */}
            <span className="sb-logo"><img src="/g4-branca.svg" alt="G4 Educação" /></span>
            <div className="t"><b>Lead Scorer</b>Pipeline · RevOps</div>
          </div>
          <button className="sb-btn sb-so-desktop" onClick={toggleMin} aria-label={min ? 'Expandir menu' : 'Recolher menu'} title={min ? 'Expandir' : 'Recolher'}>
            <ChevL size={15} style={{ transform: min ? 'rotate(180deg)' : 'none', transition: 'transform .22s' }} />
          </button>
          <button className="sb-btn sb-so-mobile" onClick={() => setGaveta(false)} aria-label="Fechar menu"><X size={15} /></button>
        </div>

        <button className="sb-search" onClick={abrirBusca} title="Buscar deal ou conta">
          <Search /><span className="txt">Buscar deal, conta…</span><span className="k">⌘K</span>
        </button>

        {NAV.map((g) => (
          <nav key={g.label} className="sb-group">
            <div className="sb-label">{g.label}</div>
            {g.items.map(({ href, txt, Ic, badge }) => (
              <Link key={href} href={href} className="sb-item" data-on={rota === href} title={txt}>
                <span className="ic"><Ic size={17} /></span>
                <span className="txt">{txt}</span>
                {badge && badges[badge] != null && <span className="badge">{badges[badge]}</span>}
              </Link>
            ))}
          </nav>
        ))}

        <div className="sb-foot">
          <Link href="/metodo#limites" className="sb-sup" title="O que o score não faz">
            <Info size={16} style={{ color: 'var(--ink-3)' }} /><span className="txt">Limites do score</span><span className="tag gold" style={{ fontSize: 10 }}>leia</span>
          </Link>
          <div className="sb-user" title="Fabrício Rojas · candidato">
            <span className="av">FR</span>
            <div className="u"><b>Fabrício Rojas</b><span>Challenge 003 · G4 AI Master</span></div>
          </div>
        </div>
      </aside>
    </>
  );
}
