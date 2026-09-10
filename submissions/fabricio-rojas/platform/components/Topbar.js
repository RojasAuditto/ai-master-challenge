'use client';
import { useState } from 'react';
import { Link as LinkIc, Check } from './Icons';

/** Cabeçalho de página: breadcrumb à esquerda, tokens de contexto e ações à direita. */
export default function Topbar({ titulo, chips = [], acoes = null }) {
  const [ok, setOk] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setOk(true); setTimeout(() => setOk(false), 1600);
    } catch { /* clipboard bloqueado: sem feedback falso */ }
  };
  return (
    <div className="top">
      <div className="crumb">
        <span>RavenStack</span>
        <span style={{ opacity: .5 }}>/</span>
        <b>{titulo}</b>
      </div>
      <div className="top-r">
        {chips.map((c, i) => <span key={i} className={`chip ${c.tom || 'soft'}`}>{c.txt}</span>)}
        {acoes}
        <button className="btn sm" onClick={copiar} title="Copiar link desta página">
          {ok ? <Check size={14} /> : <LinkIc size={14} />}
          {ok ? 'Copiado' : 'Copiar link'}
        </button>
      </div>
    </div>
  );
}
