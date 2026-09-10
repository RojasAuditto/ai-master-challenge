'use client';
import { useEffect, useState } from 'react';

const SECOES = [
  { id: 'diagnostico', n: '01', label: 'Diagnóstico' },
  { id: 'paradoxo', n: '02', label: 'O paradoxo' },
  { id: 'causa', n: '03', label: 'A causa raiz' },
  { id: 'descartado', n: '04', label: 'O que descartei' },
  { id: 'preditor', n: '05', label: 'Quem vai sair?' },
  { id: 'acao', n: '06', label: 'Plano de ação' },
  { id: 'fila', n: '07', label: 'Fila do CS' },
  { id: 'dados', n: '08', label: 'Dados quebrados' },
  { id: 'metodo', n: '09', label: 'Método' },
];

export default function Sidebar({ asof, linhas }) {
  const [ativo, setAtivo] = useState('diagnostico');

  useEffect(() => {
    const alvos = SECOES.map((s) => document.getElementById(s.id)).filter(Boolean);
    // A secao "ativa" e a ultima cujo topo ja passou do terco superior da tela.
    const obs = new IntersectionObserver(
      (entradas) => {
        const visiveis = entradas.filter((e) => e.isIntersecting);
        if (visiveis.length) {
          setAtivo(visiveis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id);
        }
      },
      { rootMargin: '-12% 0px -70% 0px', threshold: 0 }
    );
    alvos.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        {/* Logo oficial, versao branca — g4business.com/wp-content/uploads/2026/01/logo-g4-completa-branca.svg */}
        <img src="/g4-branca.svg" alt="G4 Educação" />
        <div>
          <div className="kicker">AI Master Challenge</div>
          <div className="sub">
            Challenge 001 · Diagnóstico de Churn
            <br />
            RavenStack — SaaS B2B
          </div>
        </div>
      </div>

      <nav className="navgroup">
        <div className="label">Diagnóstico</div>
        {SECOES.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="navitem" data-active={ativo === s.id}>
            <span className="n">{s.n}</span>
            {s.label}
          </a>
        ))}
      </nav>

      <div className="sidefoot">
        <strong>{linhas.toLocaleString('pt-BR')} linhas</strong> analisadas nas 5 tabelas.
        <br />
        Dados até <strong>{asof}</strong>.
        <br />
        <span style={{ opacity: 0.75 }}>Todo número desta página sai de uma query versionada.</span>
      </div>
    </aside>
  );
}
