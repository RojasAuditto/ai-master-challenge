'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usdK, num } from '@/lib/fmt';
import { acaoSugerida } from '@/lib/explain';
import { Search, Layers, Building, Users, X, ChevD, Clock, ArrowR, FileText, Download, Grid, Book, Database } from '@/components/ui/Icons';
import Avatar from '@/components/ui/Avatar';

const COR_FILA = { fechar: 'var(--green)', acompanhar: 'var(--blue)', decidir: 'var(--red)', engajar: 'var(--purple)' };
const TIPOS = [{ k: 'deals', label: 'Deals', Ic: Layers }, { k: 'contas', label: 'Contas', Ic: Building }, { k: 'vendedores', label: 'Vendedores', Ic: Users }];
const ACOES = [
  { k: 'seg', label: 'Abrir Segunda-feira', href: '/', tecla: 'S', Ic: Grid },
  { k: 'eq', label: 'Abrir Equipe', href: '/equipe', tecla: 'E', Ic: Users },
  { k: 'met', label: 'Como o score funciona', href: '/metodo', tecla: 'C', Ic: Book },
  { k: 'dad', label: 'Dados do CRM', href: '/dados', tecla: 'D', Ic: Database },
];
const lerRecentes = () => { try { return JSON.parse(localStorage.getItem('ls-recentes') || '[]'); } catch { return []; } };

/** Paleta de comandos (⌘K ou /): filtros por tipo, últimas buscas, resultados, ações rápidas e arquivos. */
export default function Cmdk({ itens, vendedores, janelas, cicloMax }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [tipos, setTipos] = useState({ deals: true, contas: true, vendedores: true });
  const [mais, setMais] = useState(false);
  const [fila, setFila] = useState('');
  const [recentes, setRecentes] = useState([]);
  const inp = useRef(null);

  useEffect(() => {
    const abrir = () => { setOn(true); setQ(''); setSel(0); setRecentes(lerRecentes()); };
    const onKey = (e) => {
      const emTexto = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !emTexto)) { e.preventDefault(); abrir(); }
      if (e.key === 'Escape') setOn(false);
    };
    window.addEventListener('keydown', onKey); window.addEventListener('ls:busca', abrir);
    // ?k=1 abre a paleta pela URL: link compartilhável de "buscar" (e captura em headless).
    try { if (new URLSearchParams(window.location.search).get('k') === '1') abrir(); } catch { /* ignora */ }
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('ls:busca', abrir); };
  }, []);
  useEffect(() => { if (on) setTimeout(() => inp.current?.focus(), 20); }, [on]);

  const contas = useMemo(() => {
    const m = {};
    for (const d of itens) { if (!d.account) continue; (m[d.account] ??= { nome: d.account, n: 0, ev: 0 }); m[d.account].n++; m[d.account].ev += d.ev; }
    return Object.values(m).sort((a, b) => b.ev - a.ev);
  }, [itens]);

  const s = q.trim().toLowerCase();
  const deals = useMemo(() => itens.filter((d) => (!fila || d.acao === fila) && (!s || (d.account ?? '').toLowerCase().includes(s) || d.id.toLowerCase().includes(s) || d.product.toLowerCase().includes(s) || d.agent.toLowerCase().includes(s))).slice(0, s ? 6 : 0), [itens, s, fila]);
  const contasR = useMemo(() => (s ? contas.filter((c) => c.nome.toLowerCase().includes(s)).slice(0, 4) : []), [contas, s]);
  const vendR = useMemo(() => (s ? vendedores.filter((v) => v.agent.toLowerCase().includes(s) || v.office.toLowerCase().includes(s) || v.manager.toLowerCase().includes(s)).slice(0, 4) : []), [vendedores, s]);
  const rec = useMemo(() => (s ? [] : recentes.map((r) => itens.find((d) => d.id === r.id)).filter(Boolean).slice(0, 3)), [recentes, itens, s]);

  // Lista plana do que está visível, na ordem da tela, para ↑↓ e Enter.
  const linhas = useMemo(() => {
    const l = [];
    rec.forEach((d) => l.push({ t: 'deal', d }));
    if (tipos.deals) deals.forEach((d) => l.push({ t: 'deal', d }));
    if (tipos.contas) contasR.forEach((c) => l.push({ t: 'conta', c }));
    if (tipos.vendedores) vendR.forEach((v) => l.push({ t: 'vend', v }));
    if (!s) ACOES.forEach((a) => l.push({ t: 'acao', a }));
    l.push({ t: 'arq' });
    return l;
  }, [rec, deals, contasR, vendR, tipos, s]);
  useEffect(() => { setSel(0); }, [q, fila, tipos]);

  const fechar = () => setOn(false);
  const ir = (href) => { fechar(); router.push(href); };
  const baixar = () => {
    const lista = itens.filter((d) => d.acao === 'fechar');
    const linhasCsv = [['id', 'conta', 'produto', 'vendedor', 'dias', 'p_ganhar', 'ticket', 'valor_esperado', 'score', 'acao_sugerida'].join(';'),
      ...lista.map((d) => [d.id, d.account ?? '', d.product, d.agent, d.dias ?? '', d.p, d.ticket, d.ev, d.score, `"${acaoSugerida(d, { ciclo_max: cicloMax }).replace(/"/g, "'")}"`].join(';'))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + linhasCsv.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'briefing-fechar.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const ativar = (x) => {
    if (!x) return;
    if (x.t === 'deal') ir(`/deal/${x.d.id}`);
    else if (x.t === 'conta') { setQ(x.c.nome); setTipos({ deals: true, contas: false, vendedores: false }); }
    else if (x.t === 'vend') ir(`/?agente=${encodeURIComponent(x.v.agent)}`);
    else if (x.t === 'acao') ir(x.a.href);
    else if (x.t === 'arq') baixar();
  };
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((k) => Math.min(linhas.length - 1, k + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((k) => Math.max(0, k - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); ativar(linhas[sel]); }
    else if (e.altKey) { const a = ACOES.find((x) => x.tecla.toLowerCase() === e.key.toLowerCase()); if (a) { e.preventDefault(); ir(a.href); } }
  };
  const nFechar = itens.filter((d) => d.acao === 'fechar').length;
  let idx = -1;
  const Row = ({ children, onClick }) => { idx += 1; const i = idx; return <button className="ck-row" data-sel={sel === i} onMouseEnter={() => setSel(i)} onClick={onClick}>{children}</button>; };

  if (!on) return null;
  return (
    <div className="cmdk" onClick={fechar} role="dialog" aria-label="Buscar e agir">
      <div className="ck" onClick={(e) => e.stopPropagation()}>
        <div className="ck-in">
          <span className="ic"><Search size={19} /></span>
          <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey} placeholder="Buscar deals, contas, vendedores…" aria-label="Buscar" />
          <kbd>⌘K</kbd>
        </div>

        <div className="ck-body">
          <div className="ck-sec">Estou procurando…</div>
          <div className="ck-chips">
            {TIPOS.map(({ k, label, Ic }) => (
              <button key={k} className="ck-chip" data-on={tipos[k]} onClick={() => setTipos((t) => ({ ...t, [k]: !t[k] }))} aria-pressed={tipos[k]}>
                <span className="ic"><Ic size={16} /></span>{label}{tipos[k] && <span className="x"><X size={13} /></span>}
              </button>
            ))}
            <button className="ck-chip more" onClick={() => setMais((m) => !m)} aria-expanded={mais}>{fila ? janelas[fila].rotulo : 'Mais'}<ChevD size={15} style={{ transform: mais ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></button>
          </div>
          {mais && (
            <div className="ck-chips" style={{ paddingTop: 0 }}>
              {Object.keys(janelas).map((k) => (
                <button key={k} className="ck-chip" data-on={fila === k} onClick={() => setFila((f) => (f === k ? '' : k))} style={{ height: 32, fontSize: 13 }}>
                  <span className="ck-dot" style={{ background: COR_FILA[k] }} />{janelas[k].rotulo}{fila === k && <span className="x"><X size={13} /></span>}
                </button>
              ))}
            </div>
          )}

          {rec.length > 0 && (<>
            <div className="ck-sec">Últimas buscas <b>{rec.length}</b></div>
            {rec.map((d) => (
              <Row key={d.id} onClick={() => ir(`/deal/${d.id}`)}>
                <Avatar nome={d.account ?? d.id} size={24} />
                <span className="nm">{d.account ?? 'Conta não atribuída'}<span>{d.product} · {d.agent}</span></span>
                <span className="rt">{d.dias != null && <span className="ic"><Clock size={14} />{d.dias}</span>}<span className="ck-dot" style={{ background: COR_FILA[d.acao] }} title={janelas[d.acao].rotulo} /></span>
              </Row>
            ))}
          </>)}

          {s && tipos.deals && deals.length > 0 && (<>
            <div className="ck-sec">Deals <b>{deals.length}</b></div>
            {deals.map((d) => (
              <Row key={d.id} onClick={() => ir(`/deal/${d.id}`)}>
                <Avatar nome={d.account ?? d.id} size={24} />
                <span className="nm">{d.account ?? 'Conta não atribuída'}<span>{d.product} · {d.agent}</span></span>
                <span className="rt">{d.dias != null && <span className="ic"><Clock size={14} />{d.dias}</span>}<span style={{ color: 'var(--t1)' }}>{usdK(d.ev)}</span><span className="ck-dot" style={{ background: COR_FILA[d.acao] }} title={janelas[d.acao].rotulo} /></span>
              </Row>
            ))}
          </>)}
          {s && tipos.contas && contasR.length > 0 && (<>
            <div className="ck-sec">Contas <b>{contasR.length}</b></div>
            {contasR.map((c) => (
              <Row key={c.nome} onClick={() => { setQ(c.nome); setTipos({ deals: true, contas: false, vendedores: false }); }}>
                <span className="ck-sq"><Building size={13} /></span>
                <span className="nm">{c.nome}<span>{c.n} {c.n === 1 ? 'deal aberto' : 'deals abertos'}</span></span>
                <span className="rt"><span style={{ color: 'var(--t1)' }}>{usdK(c.ev)}</span><ArrowR size={14} /></span>
              </Row>
            ))}
          </>)}
          {s && tipos.vendedores && vendR.length > 0 && (<>
            <div className="ck-sec">Vendedores <b>{vendR.length}</b></div>
            {vendR.map((v) => (
              <Row key={v.agent} onClick={() => ir(`/?agente=${encodeURIComponent(v.agent)}`)}>
                <Avatar nome={v.agent} size={24} />
                <span className="nm">{v.agent}<span>{v.office} · {v.manager}</span></span>
                <span className="rt"><span className="ic"><Layers size={14} />{v.abertos}</span><span style={{ color: 'var(--green)' }}>{v.fechar} p/ fechar</span></span>
              </Row>
            ))}
          </>)}
          {s && !deals.length && !contasR.length && !vendR.length && <div className="ck-empty">Nada para “{q}”.</div>}

          {!s && (<>
            <div className="ck-sec">Ações rápidas</div>
            {ACOES.map((a) => (
              <Row key={a.k} onClick={() => ir(a.href)}>
                <span className="ck-sq"><a.Ic size={13} /></span>
                <span className="nm">{a.label}</span>
                <span className="rt"><kbd>⌥{a.tecla}</kbd></span>
              </Row>
            ))}
          </>)}

          <div className="ck-sec">Arquivos <b>1</b></div>
          <Row onClick={baixar}>
            <span className="ck-sq"><FileText size={13} /></span>
            <span className="nm">briefing-fechar<span style={{ marginLeft: 0 }}>.csv</span><span>· {nFechar} deals · {num(100 * nFechar / itens.length, 0)}% do aberto</span></span>
            <span className="rt"><span className="ic" style={{ color: 'var(--t1)' }}><Download size={15} />Baixar</span></span>
          </Row>
        </div>
        <div className="ck-ft"><span><kbd>↑↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span><kbd>esc</kbd> fechar</span><span style={{ marginLeft: 'auto' }}>{itens.length} deals abertos</span></div>
      </div>
    </div>
  );
}
