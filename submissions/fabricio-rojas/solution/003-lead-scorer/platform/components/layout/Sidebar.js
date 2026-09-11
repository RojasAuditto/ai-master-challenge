'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Grid, Layers, Users, Database, Book, Code, Search, Panel, ChevD, X, LifeBuoy, Gear, MoreV } from '@/components/ui/Icons';
import { iniciais } from '@/components/ui/Avatar';

const TITULO = { '/': 'Segunda-feira', '/equipe': 'Equipe', '/metodo': 'Como funciona', '/dados': 'Dados do CRM' };

export default function Sidebar({ badges = {}, gerentes = [], agentes = [] }) {
  const rota = usePathname();
  const [min, setMin] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [arvore, setArvore] = useState(rota === '/equipe');
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
    const abrirPrefs = () => setPrefs(true);
    window.addEventListener('ls:prefs', abrirPrefs);
    return () => window.removeEventListener('ls:prefs', abrirPrefs);
  }, []);
  useEffect(() => { setGaveta(false); setPrefs(false); if (rota === '/equipe') setArvore(true); try { setGerenteAtivo(new URLSearchParams(window.location.search).get('gerente') ?? ''); } catch { /* ignora */ } }, [rota]);
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

  const Item = ({ href, Ic, txt, badge, novo }) => (
    <Link href={href} className="sb-item" data-on={rota === href.split('?')[0] && (href === '/' ? !href.includes('fila') : true)} title={txt}>
      <span className="ic"><Ic size={17} /></span><span className="txt">{txt}</span>
      {badge != null && <span className="sb-badge">{badge}</span>}
      {novo && <span className="sb-badge new">Novo</span>}
    </Link>
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
            {/* Logo oficial do G4 (único elemento da marca), em preto sobre o quadrado lima. */}
            <span className="brand-logo"><img src="/g4-branca.svg" alt="G4 Educação" /></span>
            <span className="brand-t"><b>Lead Scorer</b><small>Pipeline · RevOps</small></span>
          </Link>
          <button className="ibtn sb-so-desktop" onClick={toggleMin} aria-label={min ? 'Expandir menu' : 'Recolher menu'} title={min ? 'Expandir' : 'Recolher'}><Panel size={17} /></button>
          <button className="ibtn sb-so-mobile" onClick={() => setGaveta(false)} aria-label="Fechar menu"><X size={17} /></button>
        </div>

        <button className="sb-search" onClick={busca}><Search size={16} /><span>Buscar deal, conta…</span><kbd>⌘K</kbd></button>

        <nav className="sb-nav">
          <div className="sb-label">Pipeline</div>
          <Item href="/" Ic={Grid} txt="Segunda-feira" badge={badges.fechar} />
          <Link href="/?agente=&fila=todos" className="sb-item" title="Todos os deals"><span className="ic"><Layers size={17} /></span><span className="txt">Todos os deals</span><span className="sb-badge">{badges.abertos}</span></Link>

          <div className="sb-label">Gestão</div>
          <button className="sb-item" aria-expanded={arvore} onClick={() => setArvore((a) => !a)} data-on={rota === '/equipe' && !gerenteAtivo} title="Equipe">
            <span className="ic"><Users size={17} /></span><span className="txt">Equipe</span><span className="sb-badge">{gerentes.length}</span><ChevD size={15} className="sb-chev" />
          </button>
          <div className="sb-tree" data-open={arvore}><div>
            <Link href="/equipe" className="sb-sub" data-on={rota === '/equipe' && !gerenteAtivo}>Todos os gerentes</Link>
            {gerentes.map((g) => <Link key={g.nome} href={`/equipe?gerente=${encodeURIComponent(g.nome)}`} className="sb-sub" data-on={rota === '/equipe' && gerenteAtivo === g.nome} title={`${g.nome} · ${g.n} vendedores`}>{g.nome}</Link>)}
          </div></div>
          <Item href="/dados" Ic={Database} txt="Dados do CRM" badge={badges.decidir} />

          <div className="sb-label">Outros</div>
          <Item href="/metodo" Ic={Book} txt="Como funciona" />
          <Item href="/metodo#api" Ic={Code} txt="API do score" novo />
        </nav>

        <div className="sb-foot">
          <Link href="/metodo#limites" className="sb-item" title="Limites do score"><span className="ic"><LifeBuoy size={17} /></span><span className="txt">Limites do score</span><span className="sb-badge new">Leia</span></Link>
          <button className="sb-item boxed" onClick={() => setPrefs((p) => !p)} aria-expanded={prefs} title="Configurações"><span className="ic"><Gear size={17} /></span><span className="txt">Configurações</span></button>
          {prefs && (
            <div className="pop" role="dialog" aria-label="Configurações">
              <h4>Preferências</h4>
              <div className="row"><span>Animações</span><button className="switch" role="switch" aria-checked={motion} onClick={toggleMotion} aria-label="Animações" /></div>
              <div className="row"><span>Vendedor padrão</span>
                <select value={persona} onChange={(e) => salvarPersona(e.target.value)} style={{ font: 'inherit', fontSize: 13, color: 'var(--t1)', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '4px 8px', maxWidth: 150 }}>
                  <option value="">automático</option>{agentes.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>Guardado só neste navegador.</p>
            </div>
          )}
          <div className="sb-user">
            <span className="avatar" style={{ background: 'var(--lime)', color: 'var(--bg)' }}>{iniciais('Fabrício Rojas')}</span>
            <div className="u"><b>Fabrício Rojas</b><span>Challenge 003 · G4 AI Master</span></div>
            <button className="ibtn more" aria-label="Mais opções" onClick={() => setPrefs((p) => !p)}><MoreV size={16} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}
