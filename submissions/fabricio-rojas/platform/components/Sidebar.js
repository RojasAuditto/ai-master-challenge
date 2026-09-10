'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const SECOES = [
  { id: 'resposta', label: 'A resposta' },
  { id: 'paradoxo', label: 'Por que ninguém viu' },
  { id: 'causa', label: 'A causa raiz' },
  { id: 'prova', label: 'A prova' },
  { id: 'acao', label: 'O que fazer' },
];

const Ico = ({ children }) => (
  <span className="ic" aria-hidden="true">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  </span>
);

export default function Sidebar({ asof, linhas, contasFila }) {
  const rota = usePathname();
  const [fechada, setFechada] = useState(false);
  const [secao, setSecao] = useState('resposta');

  // Preferência de sidebar sobrevive à navegação e ao reload.
  useEffect(() => {
    try {
      if (localStorage.getItem('g4-sidebar') === 'fechada') setFechada(true);
    } catch { /* modo privado bloqueia storage; segue aberta */ }
  }, []);
  const alternar = () => {
    setFechada((f) => {
      try { localStorage.setItem('g4-sidebar', f ? 'aberta' : 'fechada'); } catch { /* ignora */ }
      return !f;
    });
  };

  useEffect(() => {
    if (rota !== '/') return;
    const alvos = SECOES.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!alvos.length) return;
    const obs = new IntersectionObserver(
      (ents) => {
        const vis = ents.filter((e) => e.isIntersecting);
        if (vis.length) setSecao(vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id);
      },
      { rootMargin: '-12% 0px -70% 0px' }
    );
    alvos.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [rota]);

  return (
    <aside className="sidebar" data-fechada={fechada}>
      <div className="sbtop">
        <div className="sblogo">
          {/* Logo oficial do G4, versão branca sobre o navy da própria marca. */}
          <span style={{
            background: '#001f35', borderRadius: 9, padding: '8px 10px',
            display: 'grid', placeItems: 'center', flex: 'none',
          }}>
            <img src="/g4-branca.svg" alt="G4 Educação" />
          </span>
        </div>
        <button className="sbtoggle" onClick={alternar}
          aria-label={fechada ? 'Expandir menu' : 'Recolher menu'} title={fechada ? 'Expandir menu' : 'Recolher menu'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: fechada ? 'rotate(180deg)' : 'none', transition: 'transform .22s' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {!fechada && (
        <div style={{ padding: '0 4px', marginTop: -10 }}>
          <div className="sbkicker">AI Master Challenge</div>
          <div className="sbsub">Challenge 001 · RavenStack</div>
        </div>
      )}

      <nav className="navgroup">
        <div className="navlabel">Entregável</div>

        <Link href="/" className="navitem" data-active={rota === '/'} title="Diagnóstico">
          <Ico><path d="M3 3v18h18" /><path d="M18 9l-5 5-3-3-4 4" /></Ico>
          <span className="navtxt">Diagnóstico</span>
        </Link>
        {rota === '/' && !fechada && SECOES.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="navsub" data-active={secao === s.id}>{s.label}</a>
        ))}

        <Link href="/fila" className="navitem" data-active={rota === '/fila'} title="Fila do CS"
          style={{ marginTop: rota === '/' ? 8 : 0 }}>
          <Ico><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></Ico>
          <span className="navtxt">Fila do CS</span>
          {!fechada && (
            <span className="tag gold" style={{ marginLeft: 'auto', fontSize: 9.5 }}>{contasFila}</span>
          )}
        </Link>
      </nav>

      <div className="sbfoot">
        <strong>{linhas.toLocaleString('pt-BR')} linhas</strong> analisadas nas 5 tabelas.<br />
        Dados até <strong>{asof}</strong>.<br />
        <span style={{ opacity: 0.8 }}>Todo número sai de uma query versionada.</span>
      </div>
    </aside>
  );
}
