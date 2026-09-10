'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Chart, Flask, Database, Calc, List, Book, ChevL } from './Icons';

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

export default function Sidebar({ badges = {} }) {
  const rota = usePathname();
  const [min, setMin] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem('g4-sb') === 'min') setMin(true); } catch { /* sem storage */ }
  }, []);
  const toggle = () => setMin((m) => {
    try { localStorage.setItem('g4-sb', m ? 'max' : 'min'); } catch { /* ignora */ }
    return !m;
  });

  return (
    <aside className="sb" data-min={min}>
      <div className="sb-top">
        <div className="sb-brand">
          {/* Logo oficial, versão branca — g4business.com/wp-content/uploads/2026/01/logo-g4-completa-branca.svg */}
          <img src="/g4-branca.svg" alt="G4 Educação" />
          <div className="t"><b>AI Master</b>Challenge 001</div>
        </div>
        <button className="sb-btn" onClick={toggle} aria-label={min ? 'Expandir menu' : 'Recolher menu'}
          title={min ? 'Expandir' : 'Recolher'}>
          <ChevL size={15} style={{ transform: min ? 'rotate(180deg)' : 'none', transition: 'transform .22s' }} />
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
  );
}
