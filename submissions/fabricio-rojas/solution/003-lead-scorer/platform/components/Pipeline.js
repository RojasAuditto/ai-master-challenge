'use client';
import { useEffect, useMemo, useState } from 'react';
import { usd, usdK, num, int } from '@/lib/fmt';
import { Rise, Contador } from './Reveal';
import { Ring, CurvaChart } from './Charts';
import { Target, Clock, Zap, Alert, X, Chevron, Users, Check, Phone, Info, ArrowR } from './Icons';

const TOM = { fechar: 'ok', acompanhar: 'blue', decidir: 'no', engajar: 'violet' };
const ORDEM = ['fechar', 'acompanhar', 'decidir', 'engajar'];
const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

/** Texto de ação, específico do deal — é o "por quê" que o brief pede. */
function oQueFazer(d, curva, cicloMax) {
  const p = num(d.p * 100, 0);
  if (d.acao === 'fechar') return `Está no dia ${d.dias} de Engaging — a faixa em que ${p}% dos deals que chegaram até aqui acabaram ganhos. É onde sua hora rende mais: leve a proposta final para a mesa esta semana.`;
  if (d.acao === 'acompanhar') return `Há ${d.dias} dias em Engaging. Nessa fase as perdas são rápidas e as vitórias demoram — não force o fechamento; garanta que o próximo passo está agendado com a conta.`;
  if (d.acao === 'decidir') return `Há ${d.dias} dias em Engaging. Nenhum deal na história fechou depois de ${cicloMax} dias. Confirme com a conta se ainda existe decisão em curso; se não existir, encerre e tire do pipeline — o número do time agradece.`;
  const h = d.hist ? `A conta já fechou ${d.hist.n} deals conosco (${num(d.hist.win * 100, 0)}% ganhos).` : d.account ? 'Sem histórico com a conta.' : 'Sem conta atribuída — resolva isso no CRM antes de qualquer coisa.';
  return `Prospecting, sem conversa comercial iniciada. Ticket típico de ${usd(d.ticket)}. ${h} Agende o primeiro contato.`;
}

export default function Pipeline({ deals, agentes, janelas, curva, cicloMax, asof, inicial = {} }) {
  const gerentes = useMemo(() => [...new Set(agentes.map((a) => a.manager))].sort(), [agentes]);
  const escritorios = useMemo(() => [...new Set(agentes.map((a) => a.office))].sort(), [agentes]);

  // Persona: por padrão quem tem mais deals na janela de fechamento — a página abre já "de alguém", com trabalho na mesa.
  const [agente, setAgente] = useState(inicial.agente ?? agentes[0]?.agent ?? '');
  const [gerente, setGerente] = useState('');
  const [office, setOffice] = useState('');
  const [acao, setAcao] = useState(inicial.fila ?? 'fechar');
  const [ordem, setOrdem] = useState('score');
  const [limite, setLimite] = useState(25);
  const [selId, setSelId] = useState(inicial.deal ?? null);

  // URL espelha o estado sem passar pelo router: nada re-renderiza no servidor, o link continua compartilhável.
  const setUrl = (patch) => {
    if (typeof window === 'undefined') return;
    const u = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => (v ? u.set(k, v) : u.delete(k)));
    const qs = u.toString();
    window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
  };

  const escopo = useMemo(() => deals.filter((d) =>
    (!agente || d.agent === agente) && (agente || !gerente || d.manager === gerente) && (agente || !office || d.office === office)), [deals, agente, gerente, office]);
  const porAcao = useMemo(() => Object.fromEntries(ORDEM.map((k) => [k, escopo.filter((d) => d.acao === k)])), [escopo]);
  const lista = useMemo(() => {
    const l = acao === 'todos' ? escopo : porAcao[acao] ?? [];
    const f = { score: (a, b) => b.score - a.score, ev: (a, b) => b.ev - a.ev, ticket: (a, b) => b.ticket - a.ticket, dias: (a, b) => (b.dias ?? -1) - (a.dias ?? -1) }[ordem];
    return [...l].sort(f);
  }, [escopo, porAcao, acao, ordem]);
  const sel = useMemo(() => deals.find((d) => d.id === selId) ?? null, [deals, selId]);
  const topo = useMemo(() => [...porAcao.fechar].sort((a, b) => b.score - a.score).slice(0, 3), [porAcao]);
  const ag = agentes.find((a) => a.agent === agente);

  const kTicket = escopo.reduce((s, d) => s + d.ticket, 0), kEv = escopo.reduce((s, d) => s + d.ev, 0);
  const kDecidir = porAcao.decidir.reduce((s, d) => s + d.ticket, 0);

  // Ao trocar de vendedor, se a fila atual ficar vazia, cai para a primeira com deals.
  const trocarAgente = (v) => {
    setAgente(v); setLimite(25);
    const esc = deals.filter((d) => !v || d.agent === v);
    const fila = acao !== 'todos' && !esc.some((d) => d.acao === acao) ? (ORDEM.find((k) => esc.some((d) => d.acao === k)) ?? 'todos') : acao;
    if (fila !== acao) setAcao(fila);
    setUrl({ agente: v, fila: fila === 'fechar' ? null : fila });
  };
  const abrir = (id) => { setSelId(id); setUrl({ deal: id }); };
  const fechar = () => { setSelId(null); setUrl({ deal: null }); };
  // Chegando por URL numa fila vazia (ex.: vendedor sem nada para fechar), cai para a primeira com deals.
  useEffect(() => {
    if (acao === 'todos' || escopo.length === 0 || (porAcao[acao]?.length ?? 0) > 0) return;
    const fila = ORDEM.find((k) => porAcao[k].length > 0) ?? 'todos';
    setAcao(fila); setUrl({ fila: fila === 'fechar' ? null : fila });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!sel) return; const k = (e) => { if (e.key === 'Escape') fechar(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [sel]);

  return (
    <div className="page">
      <div className="top">
        <div>
          <h1>{agente ? `Segunda-feira de ${agente.split(' ')[0]}` : 'Segunda-feira do time'}</h1>
          <div className="sub">
            {agente ? `${ag?.office} · gerente ${ag?.manager} · ` : ''}pipeline em {dataBR(asof)} · {int(escopo.length)} deals abertos
          </div>
        </div>
        <div className="top-r">
          <label className="ctl"><Users size={14} />Ver como
            <select value={agente} onChange={(e) => trocarAgente(e.target.value)}>
              <option value="">Todo o time</option>
              {[...agentes].sort((a, b) => a.agent.localeCompare(b.agent)).map((a) => <option key={a.agent} value={a.agent}>{a.agent}</option>)}
            </select>
          </label>
          {!agente && (
            <>
              <label className="ctl">Gerente<select value={gerente} onChange={(e) => setGerente(e.target.value)}><option value="">todos</option>{gerentes.map((g) => <option key={g}>{g}</option>)}</select></label>
              <label className="ctl">Escritório<select value={office} onChange={(e) => setOffice(e.target.value)}><option value="">todos</option>{escritorios.map((o) => <option key={o}>{o}</option>)}</select></label>
            </>
          )}
        </div>
      </div>

      <div className="grid g-4">
        {[
          { Ic: Target, tom: 'gold', lab: 'Deals abertos', v: <Contador para={escopo.length} formato="int" />, sub: `${porAcao.fechar.length} na janela de fechamento` },
          { Ic: Zap, tom: 'gold', lab: 'Valor em jogo', v: <Contador para={kTicket} formato="usdK" />, sub: 'soma dos tickets típicos', cls: 'gold' },
          { Ic: Check, tom: 'ok', lab: 'Valor esperado', v: <Contador para={kEv} formato="usdK" />, sub: 'ticket × probabilidade condicional', cls: 'ok' },
          { Ic: Alert, tom: 'no', lab: 'Para decidir', v: <><Contador para={porAcao.decidir.length} formato="int" /><small>deals</small></>, sub: `${usdK(kDecidir)} parados além do ciclo histórico`, cls: 'no' },
        ].map((k, i) => (
          <Rise key={k.lab} atraso={i * 60}>
            <div className="card tight kpi">
              <div className="lab"><span>{k.lab}</span><span className={`isq ${k.tom}`} style={{ width: 30, height: 30, borderRadius: 9 }}><k.Ic size={15} /></span></div>
              <div className={`big ${k.cls || ''}`}>{k.v}</div>
              <div className="sub">{k.sub}</div>
            </div>
          </Rise>
        ))}
      </div>

      {topo.length === 0 && escopo.length > 0 && (() => {
        const maior = ORDEM.filter((k) => k !== 'fechar').sort((x, y) => porAcao[y].length - porAcao[x].length)[0];
        const semConta = escopo.filter((d) => d.flags.includes('sem_conta')).length;
        return (
          <Rise>
            <div className="card" style={{ borderColor: 'var(--gold-line)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span className="isq gold"><Alert /></span>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Nada na janela de fechamento hoje</h3>
                  <p className="lead" style={{ fontSize: 13, marginTop: 4 }}>
                    {agente ? `${agente.split(' ')[0]} tem` : 'O time tem'} {int(porAcao.decidir.length)} deals parados além do ciclo histórico e {int(porAcao.engajar.length)} em prospecting{semConta ? `, dos quais ${int(semConta)} sem conta atribuída` : ''}. A hora de hoje rende mais limpando o que está morto e abrindo o que ainda não começou.
                  </p>
                </div>
                <button className="btn gold" onClick={() => { setAcao(maior); setUrl({ fila: maior }); }}>Ir para {janelas[maior].rotulo} ({porAcao[maior].length}) <ArrowR size={14} /></button>
              </div>
            </div>
          </Rise>
        );
      })()}
      {topo.length > 0 && (
        <Rise>
          <div className="card gold">
            <div className="card-h">
              <div className="ttl"><span className="isq gold"><Zap /></span><div><h3>Comece por aqui</h3><span>Os deals com maior retorno para a sua hora hoje</span></div></div>
              <span className="tag gold">janela de fechamento</span>
            </div>
            <div className="grid g-3">
              {topo.map((d, i) => (
                <button key={d.id} onClick={() => abrir(d.id)} className="card tight" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', background: 'var(--surface-2)', boxShadow: 'none', animation: `fade .3s ease ${i * 80}ms both` }}>
                  <Ring v={d.score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.account ?? 'Conta não atribuída'}</div>
                    <div className="hint">{d.product} · dia {d.dias}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}><span className="tag gold">{usdK(d.ticket)}</span><span className="tag ok">{num(d.p * 100, 0)}% ganha</span></div>
                  </div>
                  <ArrowR size={16} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                </button>
              ))}
            </div>
          </div>
        </Rise>
      )}

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div className="seg" role="tablist">
              {ORDEM.map((k) => (
                <button key={k} role="tab" aria-pressed={acao === k} onClick={() => { setAcao(k); setLimite(25); setUrl({ fila: k }); }}>
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${TOM[k] === 'ok' ? 'ok' : TOM[k] === 'no' ? 'no' : TOM[k]})` }} />
                  {janelas[k].rotulo}<span className="n">{porAcao[k].length}</span>
                </button>
              ))}
              <button role="tab" aria-pressed={acao === 'todos'} onClick={() => { setAcao('todos'); setLimite(25); setUrl({ fila: 'todos' }); }}>Todos<span className="n">{escopo.length}</span></button>
            </div>
            <label className="ctl">Ordenar<select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
              <option value="score">score</option><option value="ev">valor esperado</option><option value="ticket">ticket</option><option value="dias">idade</option>
            </select></label>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }} className="fade" key={acao}>
            <Info size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
            <span className="hint">{acao === 'todos' ? 'Todas as filas, ordenadas pelo score.' : janelas[acao].desc}.</span>
          </div>
          <div className="tw">
            <table>
              <thead><tr><th>Score</th><th>Deal</th><th>Produto</th><th className="n">Idade</th><th className="n">P(ganhar)</th><th className="n">Ticket</th><th className="n">Valor esperado</th><th>Ação</th><th aria-label="abrir" /></tr></thead>
              <tbody key={acao + agente + ordem} className="fade">
                {lista.slice(0, limite).map((d) => (
                  <tr key={d.id} className="click" data-sel={d.id === selId} onClick={() => abrir(d.id)}>
                    <td><div className="sbar"><div className="tr"><i style={{ width: `${d.score}%` }} /></div><b>{d.score}</b></div></td>
                    <td>
                      <div style={{ fontWeight: 700, color: d.account ? 'var(--ink)' : 'var(--ink-3)' }}>{d.account ?? 'Conta não atribuída'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.id}{!agente ? ` · ${d.agent}` : ''}{d.sector ? ` · ${d.sector}` : ''}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{d.product}</td>
                    <td className="n">{d.dias != null ? <span className={`tag ${d.flags.includes('fora_do_historico') ? 'no' : 'ghost'}`}>{d.dias}d</span> : <span className="tag ghost">—</span>}</td>
                    <td className="n" style={{ fontWeight: 700 }}>{num(d.p * 100, 0)}%</td>
                    <td className="n">{usd(d.ticket)}</td>
                    <td className="n" style={{ fontWeight: 800, color: 'var(--gold-soft)' }}>{usd(d.ev)}</td>
                    <td><span className={`tag ${TOM[d.acao]}`}><i className="dot" />{janelas[d.acao].rotulo}</span></td>
                    <td style={{ color: 'var(--ink-3)' }}><Chevron size={15} style={{ transform: 'rotate(-90deg)' }} /></td>
                  </tr>
                ))}
                {lista.length === 0 && <tr><td colSpan={9} className="empty">Nenhum deal nesta fila para o filtro atual.</td></tr>}
              </tbody>
            </table>
          </div>
          {lista.length > limite && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
              <span className="hint">{limite} de {int(lista.length)}</span>
              <button className="btn sm" onClick={() => setLimite((l) => l + 25)}>Mostrar mais 25</button>
            </div>
          )}
        </div>
      </Rise>

      {/* ── Gaveta do deal ─────────────────────────────────────── */}
      <div className="veil" data-on={!!sel} onClick={fechar} aria-hidden="true" />
      <aside className="drawer" data-on={!!sel} aria-label="Detalhe do deal">
        {sel && (
          <>
            <div className="drawer-h">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`tag ${TOM[sel.acao]}`}><i className="dot" />{janelas[sel.acao].rotulo}</span>
                  <span className="tag">{sel.stage}</span>
                  {sel.flags.includes('conta_quente') && <span className="tag gold">conta quente</span>}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.015em', marginTop: 8 }}>{sel.account ?? 'Conta não atribuída'}</h2>
                <div className="hint">{sel.id} · {sel.product} · {sel.agent} · {sel.office}</div>
              </div>
              <button className="btn icon" onClick={fechar} aria-label="Fechar"><X size={15} /></button>
            </div>
            <div className="drawer-b">
              <div className="card tight" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Ring v={sel.score} size={66} stroke={6} />
                <div className="grid g-3" style={{ flex: 1, gap: 10 }}>
                  <div><div className="hint">Valor esperado</div><div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold-soft)' }}>{usd(sel.ev)}</div></div>
                  <div><div className="hint">P(ganhar)</div><div style={{ fontSize: 17, fontWeight: 800 }}>{num(sel.p * 100, 0)}%</div></div>
                  <div><div className="hint">Ticket</div><div style={{ fontSize: 17, fontWeight: 800 }}>{usd(sel.ticket)}</div></div>
                </div>
              </div>

              <div className="card gold tight">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="isq gold" style={{ width: 30, height: 30, borderRadius: 9 }}><Phone size={14} /></span>
                  <div><b style={{ fontSize: 13.5 }}>O que fazer</b><p className="lead" style={{ fontSize: 13, marginTop: 4 }}>{oQueFazer(sel, curva, cicloMax)}</p></div>
                </div>
              </div>

              <div>
                <div className="hint" style={{ fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 10.5, marginBottom: 6 }}>Como o score foi montado</div>
                <div className="timeline">
                  <div className="tl"><span className="dot gold"><Zap size={13} /></span><div className="tx"><b>Ticket típico do produto</b><span>Mediana do que {sel.product} fechou quando ganhou. Não é o preço de tabela.</span></div><span className="v">{usd(sel.ticket)}</span></div>
                  <div className="tl"><span className="dot blue"><Clock size={13} /></span><div className="tx"><b>Probabilidade condicional à idade</b><span>{sel.dias != null ? `Dos deals que chegaram ao dia ${Math.min(sel.dias, cicloMax)} ainda abertos, ${num(sel.p * 100, 0)}% acabaram ganhos.` : 'Sem data de engajamento: usa a taxa base do time.'}{sel.flags.includes('fora_do_historico') ? ` Além do dia ${cicloMax} não há histórico — o número é o da última faixa observada.` : ''}</span></div><span className="v">× {num(sel.p * 100, 0)}%</span></div>
                  <div className="tl"><span className={`dot ${TOM[sel.acao]}`}><Target size={13} /></span><div className="tx"><b>Janela de ação: {janelas[sel.acao].rotulo}</b><span>{janelas[sel.acao].desc}.</span></div><span className="v">× {num(sel.mult, 1)}</span></div>
                  <div className="tl"><span className="dot"><Check size={13} /></span><div className="tx"><b>Score</b><span>Posição do valor ponderado entre todos os {int(deals.length)} deals abertos da empresa.</span></div><span className="v" style={{ color: 'var(--gold-soft)' }}>{sel.score} / 100</span></div>
                </div>
              </div>

              {sel.dias != null && (
                <div className="card flat tight">
                  <div className="hint" style={{ fontWeight: 700, marginBottom: 4 }}>Onde este deal está na curva</div>
                  <CurvaChart curva={curva} cicloMax={cicloMax} marcador={Math.min(sel.dias, cicloMax)} imediato />
                </div>
              )}

              <div className="card flat tight">
                <div className="hint" style={{ fontWeight: 700, marginBottom: 10 }}>Conta</div>
                {sel.account ? (
                  <dl className="kv">
                    <dt>Setor</dt><dd>{sel.sector ?? '—'}</dd>
                    <dt>Receita</dt><dd>{sel.revenue != null ? `US$ ${num(sel.revenue, 0)} mi` : '—'}</dd>
                    <dt>Funcionários</dt><dd>{sel.employees != null ? int(sel.employees) : '—'}</dd>
                    <dt>Sede</dt><dd>{sel.pais ?? '—'}</dd>
                    <dt>Histórico</dt><dd>{sel.hist ? `${sel.hist.n} deals · ${num(sel.hist.win * 100, 0)}% ganhos` : 'nenhum deal fechado'}</dd>
                    <dt>Engaging desde</dt><dd>{dataBR(sel.engage_date)}</dd>
                  </dl>
                ) : (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="isq no" style={{ width: 30, height: 30, borderRadius: 9 }}><Alert size={14} /></span>
                    <p className="hint" style={{ color: 'var(--ink-2)' }}>Este deal não tem conta no CRM. Sem conta não há setor, porte nem histórico — e nenhum deal sem conta jamais foi fechado. Atribuir a conta é a primeira ação.</p>
                  </div>
                )}
              </div>
              <p className="hint" style={{ fontStyle: 'italic' }}>Agente, produto e setor não entram no score: no teste temporal nenhum deles previu fechamento (AUC ≈ 0,5). Detalhes em <a href="/metodo" style={{ color: 'var(--gold-soft)', fontWeight: 700 }}>Como funciona</a>.</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
