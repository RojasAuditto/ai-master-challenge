'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usd, usdK, num, int } from '@/lib/fmt';
import { TOM, ORDEM, acaoSugerida } from '@/lib/explain';
import { Rise, Counter, useInView } from '@/components/ui/Reveal';
import Seg from '@/components/ui/Seg';
import Avatar from '@/components/ui/Avatar';
import { CORES_FILA } from '@/components/charts/Charts';
import { ArrowUR, Clock, Alert, Download, ChevD, Pencil, TrendUp, Info } from '@/components/ui/Icons';

const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const quando = (iso) => { const m = (Date.now() - new Date(iso)) / 60000; if (m < 60) return `há ${Math.max(1, Math.round(m))} min`; if (m < 1440) return `há ${Math.round(m / 60)} h`; return `há ${Math.round(m / 1440)} d`; };
const lerNotas = () => { try { return JSON.parse(localStorage.getItem('ls-notas') || '{}'); } catch { return {}; } };

function GBar({ pct, lime = false }) {
  const [ref, on] = useInView();
  return <div ref={ref} className="gbar"><i className={lime ? 'lime' : ''} style={{ width: on ? `${Math.min(100, pct)}%` : 0 }} /></div>;
}

export default function Pipeline({ deals, agentes, janelas, cicloMax, asof, inicial = {}, totalAbertos }) {
  const router = useRouter();
  const [agente, setAgente] = useState(inicial.agente ?? agentes[0]?.agent ?? '');
  const [gerente, setGerente] = useState('');
  const [office, setOffice] = useState('');
  const [acao, setAcao] = useState(inicial.fila ?? 'fechar');
  const [ordem, setOrdem] = useState('score');
  const [limite, setLimite] = useState(20);
  const [detalhes, setDetalhes] = useState(false);
  const [notas, setNotas] = useState([]);

  const gerentes = useMemo(() => [...new Set(agentes.map((a) => a.manager))].sort(), [agentes]);
  const offices = useMemo(() => [...new Set(agentes.map((a) => a.office))].sort(), [agentes]);

  const setUrl = (patch) => {
    if (typeof window === 'undefined') return;
    const u = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => (v != null && v !== '' ? u.set(k, v) : u.delete(k)));
    const qs = u.toString(); window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
  };

  // Vendedor padrão salvo nas preferências vale quando a URL não diz quem é.
  useEffect(() => {
    if (inicial.agente != null) return;
    try { const p = localStorage.getItem('ls-persona'); if (p && agentes.some((a) => a.agent === p)) { setAgente(p); setUrl({ agente: p }); } } catch { /* ignora */ }
    const n = lerNotas(); setNotas(Object.entries(n).flatMap(([id, arr]) => arr.map((x) => ({ ...x, id }))).sort((a, b) => b.t.localeCompare(a.t)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const escopo = useMemo(() => deals.filter((d) => (!agente || d.agent === agente) && (agente || !gerente || d.manager === gerente) && (agente || !office || d.office === office)), [deals, agente, gerente, office]);
  const porAcao = useMemo(() => Object.fromEntries(ORDEM.map((k) => [k, escopo.filter((d) => d.acao === k)])), [escopo]);
  const lista = useMemo(() => {
    const l = acao === 'todos' ? escopo : porAcao[acao] ?? [];
    const f = { score: (a, b) => b.score - a.score, ev: (a, b) => b.ev - a.ev, ticket: (a, b) => b.ticket - a.ticket, dias: (a, b) => (b.dias ?? -1) - (a.dias ?? -1) }[ordem];
    return [...l].sort(f);
  }, [escopo, porAcao, acao, ordem]);

  // Fila vazia (ex.: vendedor sem nada para fechar) cai para a primeira com deals.
  useEffect(() => {
    if (acao === 'todos' || escopo.length === 0 || (porAcao[acao]?.length ?? 0) > 0) return;
    const fila = ORDEM.find((k) => porAcao[k].length > 0) ?? 'todos'; setAcao(fila); setUrl({ fila: fila === 'fechar' ? null : fila });
  }, [agente]); // eslint-disable-line react-hooks/exhaustive-deps

  const ag = agentes.find((a) => a.agent === agente);
  const kEv = escopo.reduce((s, d) => s + d.ev, 0), evFechar = porAcao.fechar.reduce((s, d) => s + d.ev, 0);
  const kDecidir = porAcao.decidir.reduce((s, d) => s + d.ticket, 0);
  const topo = [...porAcao.fechar].sort((a, b) => b.score - a.score);
  const maisAntigo = [...porAcao.fechar].sort((a, b) => b.dias - a.dias)[0];
  const pctFechar = kEv ? (100 * evFechar) / kEv : 0;
  const asofD = new Date(asof);

  const trocarAgente = (v) => { setAgente(v); setLimite(20); setUrl({ agente: v }); };
  const trocarFila = (k) => { setAcao(k); setLimite(20); setUrl({ fila: k === 'fechar' ? null : k }); };
  const exportar = () => {
    const ctx = { ciclo_max: cicloMax };
    const linhas = [['id', 'conta', 'produto', 'vendedor', 'fila', 'dias', 'p_ganhar', 'ticket', 'valor_esperado', 'score', 'acao_sugerida'].join(';'),
      ...lista.map((d) => [d.id, d.account ?? '', d.product, d.agent, janelas[d.acao].rotulo, d.dias ?? '', d.p, d.ticket, d.ev, d.score, `"${acaoSugerida(d, ctx).replace(/"/g, "'")}"`].join(';'))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `briefing-${(agente || 'time').replace(/\s+/g, '-').toLowerCase()}-${acao}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page">
      <header className="ph">
        <div>
          <h1>{agente ? `Segunda-feira de ${agente.split(' ')[0]}` : 'Segunda-feira do time'}</h1>
          <p className="ph-sub">
            {agente ? 'Você tem' : 'O time tem'} <b>{int(escopo.length)} deals</b> abertos. <b>{porAcao.fechar.length}</b> {porAcao.fechar.length === 1 ? 'está' : 'estão'} na janela de fechamento e {porAcao.fechar.length === 1 ? 'vale' : 'valem'} <b>{usdK(evFechar)}</b> em valor esperado; <b>{porAcao.decidir.length}</b> {porAcao.decidir.length === 1 ? 'está parado' : 'estão parados'} além do ciclo histórico.
          </p>
        </div>
        <div className="ph-r">
          <label className="persona" title="Ver o pipeline como">
            <Avatar nome={agente || 'Todo o time'} size={28} />
            <span><span className="n">{agente || 'Todo o time'}</span><span className="s">{agente ? `${ag?.office} · ${ag?.manager}` : `${agentes.length} vendedores`}</span></span>
            <ChevD size={15} className="chev" />
            <select value={agente} onChange={(e) => trocarAgente(e.target.value)} aria-label="Ver como">
              <option value="">Todo o time</option>{[...agentes].sort((a, b) => a.agent.localeCompare(b.agent)).map((a) => <option key={a.agent} value={a.agent}>{a.agent}</option>)}
            </select>
          </label>
          {!agente && (<>
            <label className="sel-pill" style={{ position: 'relative' }}>{gerente || 'Gerente'} <ChevD size={14} /><select value={gerente} onChange={(e) => setGerente(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }} aria-label="Gerente"><option value="">Todos os gerentes</option>{gerentes.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label className="sel-pill" style={{ position: 'relative' }}>{office || 'Escritório'} <ChevD size={14} /><select value={office} onChange={(e) => setOffice(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }} aria-label="Escritório"><option value="">Todos os escritórios</option>{offices.map((o) => <option key={o}>{o}</option>)}</select></label>
          </>)}
          <button className="btn white" onClick={exportar} disabled={!lista.length}><Download size={16} />Exportar briefing</button>
        </div>
      </header>

      <section className="hl">
        <Rise>
          {topo[0] ? (
            <Link href={`/deal/${topo[0].id}`} className="card stripe hover" style={{ display: 'block' }}>
              <div className="card-h"><span className="lab"><span className="ic"><ArrowUR size={15} /></span>Maior retorno hoje</span></div>
              <div className="sep" />
              <div className="hl-body"><Avatar nome={topo[0].account ?? topo[0].id} size={28} /><span className="nm">{topo[0].account ?? 'Conta não atribuída'}</span><span className="tk">{topo[0].product}</span><span className="pill green"><i className="tri up" />{usdK(topo[0].ev)}</span></div>
            </Link>
          ) : (
            <div className="card stripe">
              <div className="card-h"><span className="lab"><span className="ic"><ArrowUR size={15} /></span>Nada para fechar hoje</span></div>
              <div className="sep" />
              <div className="hl-body"><span className="tk" style={{ whiteSpace: 'normal' }}>A hora rende mais em <b style={{ color: 'var(--t1)' }}>Decidir</b> ({porAcao.decidir.length}) e <b style={{ color: 'var(--t1)' }}>Engajar</b> ({porAcao.engajar.length}).</span></div>
            </div>
          )}
        </Rise>
        <Rise atraso={70}>
          {maisAntigo ? (
            <Link href={`/deal/${maisAntigo.id}`} className="card hover" style={{ display: 'block' }}>
              <div className="card-h"><span className="lab"><span className="ic"><Clock size={15} /></span>Mais tempo na janela</span></div>
              <div className="sep" />
              <div className="hl-body"><Avatar nome={maisAntigo.account ?? maisAntigo.id} size={28} /><span className="nm">{maisAntigo.account ?? 'Conta não atribuída'}</span><span className="tk">{maisAntigo.product}</span><span className="pill amber">dia {maisAntigo.dias}</span></div>
            </Link>
          ) : (
            <div className="card"><div className="card-h"><span className="lab"><span className="ic"><TrendUp size={15} /></span>Para engajar</span></div><div className="sep" /><div className="hl-body"><span className="nm">{porAcao.engajar.length} deals</span><span className="tk">em prospecting</span><span className="pill purple">{usdK(porAcao.engajar.reduce((s, d) => s + d.ev, 0))}</span></div></div>
          )}
        </Rise>
        <Rise atraso={140}>
          <button className="card hover" style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => trocarFila('decidir')}>
            <div className="card-h"><span className="lab"><span className="ic"><Alert size={15} /></span>Para decidir</span></div>
            <div className="sep" />
            <div className="hl-body"><span className="nm">{porAcao.decidir.length} deals</span><span className="tk">{usdK(kDecidir)} parados</span><span className="pill red"><i className="tri down" />além do ciclo</span></div>
          </button>
        </Rise>
      </section>

      <div className="two">
        <Rise>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '14px 16px' }}>
              <Seg valor={acao} onChange={trocarFila} ariaLabel="Fila" itens={[...ORDEM.map((k) => ({ k, label: janelas[k].rotulo, n: porAcao[k].length, cor: CORES_FILA[k] })), { k: 'todos', label: 'Todos', n: escopo.length }]} />
              <label className="sel-pill" style={{ position: 'relative' }}>Ordenar: {{ score: 'score', ev: 'valor esperado', ticket: 'ticket', dias: 'idade' }[ordem]} <ChevD size={14} /><select value={ordem} onChange={(e) => setOrdem(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }} aria-label="Ordenar"><option value="score">score</option><option value="ev">valor esperado</option><option value="ticket">ticket</option><option value="dias">idade</option></select></label>
            </div>
            <div key={acao} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 16px 12px', animation: 'fadeUp .3s var(--ease)' }}><Info size={14} style={{ color: 'var(--t3)' }} /><span className="hint">{acao === 'todos' ? 'Todas as filas, ordenadas pelo score.' : `${janelas[acao].desc}.`}</span></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th className="idx">#</th><th>Deal</th><th className="n">P(ganhar)</th><th className="n">Idade</th><th className="n">Valor esperado</th><th className="n">Score</th></tr></thead>
                <tbody key={acao + agente + ordem + gerente + office}>
                  {lista.slice(0, limite).map((d, i) => (
                    <tr key={d.id} className="row" style={{ '--i': Math.min(i, 12) }} onClick={() => router.push(`/deal/${d.id}`)}>
                      <td className="idx">{i + 1}</td>
                      <td><div className="asset"><Avatar nome={d.account ?? d.id} size={30} /><div style={{ minWidth: 0 }}><div className="nm" style={{ color: d.account ? 'var(--t1)' : 'var(--t3)' }}>{d.account ?? 'Conta não atribuída'}</div><div className="tk">{d.product} · {usd(d.ticket)}{!agente ? ` · ${d.agent}` : ''}</div></div></div></td>
                      <td className="n"><span className={`pill ${d.p >= 0.7 ? 'green' : 'blue'}`}><i className="tri up" />{num(d.p * 100, 0)}%</span></td>
                      <td className="n">{d.dias != null ? <span className={`pill ${d.flags.includes('fora_do_historico') ? 'red' : 'line'}`}>{d.dias}d</span> : <span className="pill line">—</span>}</td>
                      <td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>{usd(d.ev)}</td>
                      <td className="n"><span className="score"><span className="tr"><i style={{ width: `${d.score}%` }} /></span><b>{d.score}</b></span></td>
                    </tr>
                  ))}
                  {lista.length === 0 && <tr><td colSpan={6} className="empty">Nenhum deal nesta fila para o filtro atual.</td></tr>}
                </tbody>
              </table>
            </div>
            {lista.length > limite && <div className="tbl-foot"><span>{limite} de {int(lista.length)} deals</span><button className="btn sm" onClick={() => setLimite((l) => l + 20)}>Mostrar mais</button></div>}
          </div>
        </Rise>

        <aside className="side">
          <Rise atraso={60}>
            <div className="budget">
              <div className="card-h"><span className="lab">Valor esperado</span><span className="sel-pill" style={{ cursor: 'default' }}>{MES[asofD.getUTCMonth()]} {asofD.getUTCFullYear()}<ChevD size={14} /></span></div>
              <div className="big"><Counter para={kEv} formato="usdK" /></div>
              <div className="lab2">Na janela de fechamento</div>
              <GBar pct={pctFechar} />
              <div className="split">
                <div>Fechar<b>{usdK(evFechar)} <span className="pill" style={{ marginLeft: 6 }}>{num(pctFechar, 0)}%</span></b></div>
                <div className="r">Restante<b>{usdK(kEv - evFechar)}</b></div>
              </div>
              <button className="btn" onClick={() => setDetalhes((v) => !v)} aria-expanded={detalhes}>{detalhes ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
              {detalhes && (
                <div className="stack" style={{ marginTop: 16, animation: 'fadeUp .3s var(--ease)' }}>
                  {ORDEM.map((k) => (
                    <div key={k}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--t2)', marginBottom: 6 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: CORES_FILA[k], display: 'inline-block' }} />{janelas[k].rotulo} · {porAcao[k].length}</span><b style={{ color: 'var(--t1)' }}>{usdK(porAcao[k].reduce((s, d) => s + d.ev, 0))}</b></div>
                      <GBar pct={kEv ? (100 * porAcao[k].reduce((s, d) => s + d.ev, 0)) / kEv : 0} lime />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Rise>

          <Rise atraso={120}>
            <div className="card">
              <div className="card-h"><h3>Atividade</h3><span className="pill line">{notas.length ? `${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}` : 'sugestões'}</span></div>
              <div className="tl" style={{ marginTop: 10 }}>
                {notas.length ? notas.slice(0, 6).map((n, i) => {
                  const d = deals.find((x) => x.id === n.id);
                  return (
                    <Link key={n.t + i} href={`/deal/${n.id}`} className="tl-i">
                      <span className="tl-ic purple"><Pencil size={14} /></span>
                      <span className="tl-tx"><b>{d?.account ?? n.id}<small>{quando(n.t)}</small></b><span>{n.txt}</span></span>
                    </Link>
                  );
                }) : topo.slice(0, 3).map((d) => (
                  <Link key={d.id} href={`/deal/${d.id}`} className="tl-i">
                    <span className="tl-ic green"><TrendUp size={14} /></span>
                    <span className="tl-tx"><b>{d.account ?? 'Conta não atribuída'}<small>dia {d.dias}</small></b><span>{janelas[d.acao].rotulo} · {d.product} · {num(d.p * 100, 0)}% de chance</span></span>
                    <span className="tl-v">{usdK(d.ev)}</span>
                  </Link>
                ))}
                {!notas.length && !topo.length && <div className="empty" style={{ padding: '20px 0' }}>Registre a próxima ação de um deal e ela aparece aqui.</div>}
              </div>
              <p className="hint" style={{ marginTop: 12 }}>Notas ficam neste navegador. Em produção, gravariam no CRM.</p>
            </div>
          </Rise>
        </aside>
      </div>
    </div>
  );
}
