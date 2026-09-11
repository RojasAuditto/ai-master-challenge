'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Grid, Layers, Users, Database, Book, Search, Panel, ChevD, X, MoreV } from '@/components/ui/Icons';
import { iniciais } from '@/components/ui/Avatar';

const TITULO = { '/': 'Segunda-feira', '/equipe': 'Equipe', '/metodo': 'Como funciona', '/dados': 'Dados do CRM' };

/** Sidebar mínima: marca, busca, cinco destinos, usuário. Preferências e atalhos ficam no ⋮. */
export default function Sidebar({ gerentes = [], agentes = [] }) {
  const rota = usePathname();
  const [min, setMin] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [arvore, setArvore] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [motion, setMotion] = useState(true);
  const [persona, setPersona] = useState('');
  const [gerenteAtivo, setGerenteAtivo] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem('ls-sb') === 'min') setMin(true);
      const m = localStorage.getItem('ls-motion') !== 'off'; setMotion(m); document.documentElement.dataset.motion = m ? 'on' : 'off';
      setPersona(localStorage.getItem('ls-persona') ?? '');
    } catch { /* sem storage */ }
  }, []);
  useEffect(() => {
    setGaveta(false); setPrefs(false);
    if (rota === '/equipe') setArvore(true);
    try { setGerenteAtivo(new URLSearchParams(window.location.search).get('gerente') ?? ''); } catch { /* ignora */ }
  }, [rota]);
  useEffect(() => {
    if (!gaveta) return;
    const ant = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const k = (e) => { if (e.key === 'Escape') setGaveta(false); };
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ant; window.removeEventListener('keydown', k); };
  }, [gaveta]);

  const toggleMin = () => setMin((m) => { try { localStorage.setItem('ls-sb', m ? 'max' : 'min'); } catch { /* ignora */ } return !m; });
  const toggleMotion = () => { const v = !motion; setMotion(v); document.documentElement.dataset.motion = v ? 'on' : 'off'; try { localStorage.setItem('ls-motion', v ? 'on' : 'off'); } catch { /* ignora */ } };
  const salvarPersona = (v) => { setPersona(v); try { v ? localStorage.setItem('ls-persona', v) : localStorage.removeItem('ls-persona'); } catch { /* ignora */ } };
  const busca = () => window.dispatchEvent(new CustomEvent('ls:busca'));

  const Item = ({ href, Ic, txt, on }) => (
    <Link href={href} className="sb-item" data-on={on} title={txt}><span className="ic"><Ic size={16} /></span><span className="txt">{txt}</span></Link>
  );

  return (
    <>
      <header className="mtop">
        <button className="ibtn" onClick={() => setGaveta(true)} aria-label="Abrir menu"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
        <span className="brand-logo"><img src="/g4-branca.svg" alt="G4" /></span>
        <span className="mtop-t">{TITULO[rota] ?? (rota.startsWith('/deal') ? 'Deal' : 'Lead Scorer')}</span>
        <button className="ibtn" onClick={busca} aria-label="Buscar"><Search size={17} /></button>
      </header>
      <div className="sb-veil" data-on={gaveta} onClick={() => setGaveta(false)} aria-hidden="true" />

      <aside className="sb" data-min={min} data-gaveta={gaveta}>
        <div className="sb-head">
          <Link href="/" className="brand" title="Lead Scorer">
            {/* Logo oficial do G4 — o único elemento da marca. */}
            <span className="brand-logo"><img src="/g4-branca.svg" alt="G4 Educação" /></span>
            <span className="brand-t"><b>Lead Scorer</b><small>Pipeline · RevOps</small></span>
          </Link>
          <button className="ibtn sb-so-desktop" onClick={toggleMin} aria-label={min ? 'Expandir menu' : 'Recolher menu'} title={min ? 'Expandir' : 'Recolher'}><Panel size={16} /></button>
          <button className="ibtn sb-so-mobile" onClick={() => setGaveta(false)} aria-label="Fechar menu"><X size={17} /></button>
        </div>

        <button className="sb-search" onClick={busca}><Search size={15} /><span>Buscar…</span><kbd>⌘K</kbd></button>

        <nav className="sb-nav">
          <Item href="/" Ic={Grid} txt="Segunda-feira" on={rota === '/'} />
          <Item href="/?agente=&fila=todos" Ic={Layers} txt="Todos os deals" on={false} />
          <div className="sb-gap" />
          <button className="sb-item" aria-expanded={arvore} onClick={() => setArvore((a) => !a)} data-on={rota === '/equipe' && !gerenteAtivo} title="Equipe">
            <span className="ic"><Users size={16} /></span><span className="txt">Equipe</span><ChevD size={14} className="sb-chev" />
          </button>
          <div className="sb-tree" data-open={arvore}><div>
            <Link href="/equipe" className="sb-sub" data-on={rota === '/equipe' && !gerenteAtivo}>Todos os gerentes</Link>
            {gerentes.map((g) => <Link key={g.nome} href={`/equipe?gerente=${encodeURIComponent(g.nome)}`} className="sb-sub" data-on={rota === '/equipe' && gerenteAtivo === g.nome} title={`${g.nome} · ${g.n} vendedores`}>{g.nome}</Link>)}
          </div></div>
          <Item href="/dados" Ic={Database} txt="Dados do CRM" on={rota === '/dados'} />
          <div className="sb-gap" />
          <Item href="/metodo" Ic={Book} txt="Como funciona" on={rota === '/metodo'} />
        </nav>

        <div className="sb-foot">
          {prefs && (
            <div className="pop" role="dialog" aria-label="Preferências">
              <h4>Preferências</h4>
              <div className="row"><span>Animações</span><button className="switch" role="switch" aria-checked={motion} onClick={toggleMotion} aria-label="Animações" /></div>
              <div className="row"><span>Vendedor padrão</span>
                <select value={persona} onChange={(e) => salvarPersona(e.target.value)}><option value="">automático</option>{agentes.map((a) => <option key={a}>{a}</option>)}</select>
              </div>
              <Link href="/metodo#api" className="row" onClick={() => setPrefs(false)}><span>API do score</span><span style={{ color: 'var(--t3)' }}>GET /api/score/:id</span></Link>
              <Link href="/metodo#limites" className="row" onClick={() => setPrefs(false)}><span>Limites do score</span><span style={{ color: 'var(--t3)' }}>→</span></Link>
            </div>
          )}
          <div className="sb-user">
            <span className="avatar" style={{ background: 'var(--lime)', color: 'var(--bg)' }}>{iniciais('Fabrício Rojas')}</span>
            <div className="u"><b>Fabrício Rojas</b><span>Challenge 003 · G4</span></div>
            <button className="ibtn more" aria-label="Preferências" aria-expanded={prefs} onClick={() => setPrefs((p) => !p)}><MoreV size={16} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}
