'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Chart, Flask, Database, Calc, List, Book, ChevL, X } from './Icons';

const NAV = [
  { label: 'Diagnóstico', items: [
    { href: '/', txt: 'Visão geral', Ic: Chart },
    { href: '/evidencias', txt: 'Evidências', Ic: Flask },
    { href: '/dados', txt: 'Dados quebrados', Ic: Database },
  ] },
  { label: 'Ferramentas', items: [
    { href: '/modelo', txt: 'Modelo de risco', Ic: Calc },
    { href: '/fila', txt: 'Fila do CS', Ic: List, badgeKey: 'fila' },
  ] },
  { label: 'Sobre', items: [
    { href: '/metodo', txt: 'Método e reprodução', Ic: Book },
  ] },
];

const TITULO = Object.fromEntries(NAV.flatMap((g) => g.items).map((i) => [i.href, i.txt]));

export default function Sidebar({ badges = {} }) {
  const rota = usePathname();
  const [min, setMin] = useState(false);   // desktop: trilho de ícones
  const [gaveta, setGaveta] = useState(false); // mobile: drawer

  useEffect(() => {
    try { if (localStorage.getItem('g4-sb') === 'min') setMin(true); } catch { /* sem storage */ }
  }, []);
  const toggleMin = () => setMin((m) => {
    try { localStorage.setItem('g4-sb', m ? 'max' : 'min'); } catch { /* ignora */ }
    return !m;
  });

  // A gaveta fecha ao navegar — senão o usuário troca de página e continua olhando o menu.
  useEffect(() => { setGaveta(false); }, [rota]);

  // Enquanto a gaveta está aberta, a página atrás não rola, e Esc fecha.
  useEffect(() => {
    if (!gaveta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setGaveta(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = anterior; window.removeEventListener('keydown', onKey); };
  }, [gaveta]);

  return (
    <>
      {/* Barra superior: só existe abaixo de 980px (display:none no desktop). */}
      <header className="mtop">
        <button className="mtop-btn" onClick={() => setGaveta(true)} aria-label="Abrir menu" aria-expanded={gaveta}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <img src="/g4-branca.svg" alt="G4 Educação" />
        <span className="mtop-t">{TITULO[rota] ?? 'Diagnóstico'}</span>
      </header>

      <div className="sb-veu" data-on={gaveta} onClick={() => setGaveta(false)} aria-hidden="true" />

      <aside className="sb" data-min={min} data-gaveta={gaveta}>
        <div className="sb-top">
          <div className="sb-brand">
            {/* Logo oficial, versão branca — g4business.com/.../logo-g4-completa-branca.svg */}
            <img src="/g4-branca.svg" alt="G4 Educação" />
            <div className="t"><b>AI Master</b>Challenge 001</div>
          </div>
          <button className="sb-btn sb-so-desktop" onClick={toggleMin}
            aria-label={min ? 'Expandir menu' : 'Recolher menu'} title={min ? 'Expandir' : 'Recolher'}>
            <ChevL size={15} style={{ transform: min ? 'rotate(180deg)' : 'none', transition: 'transform .22s' }} />
          </button>
          <button className="sb-btn sb-so-mobile" onClick={() => setGaveta(false)} aria-label="Fechar menu">
            <X size={15} />
          </button>
        </div>

        {NAV.map((g) => (
          <nav key={g.label} className="sb-group">
            <div className="sb-label">{g.label}</div>
            {g.items.map(({ href, txt, Ic, badgeKey }) => (
              <Link key={href} href={href} className="sb-item" data-on={rota === href} title={txt}>
                <span className="ic"><Ic size={17} /></span>
                <span className="txt">{txt}</span>
                {badgeKey && badges[badgeKey] != null && <span className="badge">{badges[badgeKey]}</span>}
              </Link>
            ))}
          </nav>
        ))}

        <div className="sb-foot">
          <div className="sb-user" title="Fabrício Rojas · candidato">
            <span className="av">FR</span>
            <div className="u"><b>Fabrício Rojas</b><span>Candidato · RavenStack</span></div>
          </div>
        </div>
      </aside>
    </>
  );
}
