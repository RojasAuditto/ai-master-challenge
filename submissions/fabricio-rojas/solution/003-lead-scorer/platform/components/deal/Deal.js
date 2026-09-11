'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usd, num, int } from '@/lib/fmt';
import { TOM } from '@/lib/explain';
import Avatar from '@/components/ui/Avatar';
import { Curva, Ring } from '@/components/charts/Charts';
import { ArrowL, ArrowR, Copy, Check, Code, Send, Target, User, Calendar, Tag, Building, FileText, Zap, Clock, Pencil, Wallet } from '@/components/ui/Icons';

const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const quando = (iso) => { const m = (Date.now() - new Date(iso)) / 60000; if (m < 60) return `há ${Math.max(1, Math.round(m))} min`; if (m < 1440) return `há ${Math.round(m / 60)} h`; return `há ${Math.round(m / 1440)} d`; };
const ICONE = { ticket: [Zap, 'lime'], prob: [Clock, 'blue'], janela: [Target, 'green'], score: [Check, 'purple'] };

export default function Deal({ d, ctx, curva, explicacao, asof, agenteInfo }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [notas, setNotas] = useState([]);
  const [txt, setTxt] = useState('');
  const ta = useRef(null);
  const tomJanela = TOM[d.acao];

  useEffect(() => {
    try {
      setNotas((JSON.parse(localStorage.getItem('ls-notas') || '{}')[d.id]) ?? []);
      // Alimenta "Últimas buscas" da paleta ⌘K.
      const rec = (JSON.parse(localStorage.getItem('ls-recentes') || '[]')).filter((r) => r.id !== d.id);
      localStorage.setItem('ls-recentes', JSON.stringify([{ id: d.id, t: new Date().toISOString() }, ...rec].slice(0, 6)));
    } catch { /* sem storage */ }
  }, [d.id]);
  const salvar = () => {
    const t = txt.trim(); if (!t) return;
    const nova = [{ t: new Date().toISOString(), txt: t }, ...notas]; setNotas(nova); setTxt('');
    try { const all = JSON.parse(localStorage.getItem('ls-notas') || '{}'); all[d.id] = nova; localStorage.setItem('ls-notas', JSON.stringify(all)); } catch { /* ignora */ }
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(location.href); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* sem clipboard */ } };
  const voltar = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <div className="page">
      <div className="ph" style={{ alignItems: 'center', paddingTop: 14 }}>
        <button className="btn" onClick={voltar}><ArrowL size={16} />Voltar</button>
        <div className="ph-r">
          <button className="btn" onClick={copiar}>{ok ? <Check size={16} /> : <Copy size={16} />}{ok ? 'Copiado' : 'Copiar URL'}</button>
          <a className="btn" href={`/api/score/${d.id}`} target="_blank" rel="noreferrer"><Code size={16} />JSON</a>
          <button className="btn white" onClick={() => ta.current?.focus()}><Send size={16} />Registrar ação</button>
        </div>
      </div>

      <div className="two">
        <section className="card" style={{ padding: 24 }}>
          <div className="sheet-h">
            <Avatar nome={d.account ?? d.id} size={56} quadrado />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className={`pill ${tomJanela} dot`}>{ctx.janelas[d.acao].rotulo}</span><span className="pill line">{d.stage}</span>
                {explicacao.flags.map((f) => <span key={f.flag} className={`pill ${f.tom}`} title={f.desc}>{f.label}</span>)}
              </div>
              <h1>{d.account ?? 'Conta não atribuída'}</h1>
              <div className="hint" style={{ marginTop: 4 }}>{d.id} · {d.product} · {d.agent}</div>
            </div>
          </div>

          <div className="kvs">
            <div className="kv"><div className="k"><span className="ic"><Target size={16} /></span>Status</div><div className="v"><span className={`pill ${tomJanela} dot`}>{ctx.janelas[d.acao].rotulo}</span><span className="hint">{ctx.janelas[d.acao].desc}</span></div></div>
            <div className="kv"><div className="k"><span className="ic"><User size={16} /></span>Vendedor</div><div className="v"><span className="chip"><Avatar nome={d.agent} size={22} />{d.agent}</span><span className="pill line">{agenteInfo?.office} · {agenteInfo?.manager}</span></div></div>
            <div className="kv"><div className="k"><span className="ic"><Calendar size={16} /></span>Datas</div><div className="v">{d.engage_date ? <>{dataBR(d.engage_date)}<ArrowR size={14} style={{ color: 'var(--t3)' }} />{dataBR(asof)}<span className={`pill ${d.flags.includes('fora_do_historico') ? 'red' : 'amber'}`}>dia {d.dias}</span></> : <span className="hint">sem data de engajamento — ainda em prospecting</span>}</div></div>
            <div className="kv"><div className="k"><span className="ic"><Tag size={16} /></span>Tags</div><div className="v"><span className="pill blue">{d.product}</span>{d.sector && <span className="pill purple">{d.sector}</span>}<span className="pill line">ticket {usd(d.ticket)}</span></div></div>
            <div className="kv"><div className="k"><span className="ic"><Building size={16} /></span>Conta</div><div className="v">{d.account ? <>{d.revenue != null && <span className="pill line">US$ {num(d.revenue, 0)} mi</span>}{d.employees != null && <span className="pill line">{int(d.employees)} funcionários</span>}{d.pais && <span className="pill line">{d.pais}</span>}<span className="pill line">{d.hist ? `${d.hist.n} deals · ${num(d.hist.win * 100, 0)}% ganhos` : 'sem histórico'}</span></> : <span className="hint">Sem conta no CRM. Nenhum deal sem conta jamais foi fechado — atribuir a conta é a primeira ação.</span>}</div></div>
            <div className="kv" style={{ alignItems: 'start' }}><div className="k" style={{ paddingTop: 12 }}><span className="ic"><FileText size={16} /></span>O que fazer</div><div className="v" style={{ display: 'block' }}><div className="desc">{explicacao.acao}</div></div></div>
          </div>

          {d.dias != null && (<>
            <div className="sep" style={{ margin: '22px 0 16px' }} />
            <div className="card-h" style={{ marginBottom: 6 }}><h3>Onde este deal está na curva</h3><span className="pill line">P(ganhar | idade)</span></div>
            <Curva curva={curva} cicloMax={ctx.ciclo_max} marcador={Math.min(d.dias, ctx.ciclo_max)} imediato alt={230} />
          </>)}
        </section>

        <aside className="side">
          <div className="card amount">
            <div className="card-h"><span className="lab">Valor esperado</span><span className={`pill ${tomJanela} dot`}>{ctx.janelas[d.acao].rotulo}</span></div>
            <div className="big">{usd(d.ev)}</div>
            <div className="rows">
              <div className="rw"><span className="ic"><Ring v={d.score} size={22} stroke={3} /></span>Score {d.score} de 100</div>
              <div className="rw"><span className="ic"><Wallet size={12} /></span>Ticket típico {usd(d.ticket)}</div>
              <div className="rw"><span className="ic"><Clock size={12} /></span>{num(d.p * 100, 0)}% de chance{d.dias != null ? ` no dia ${Math.min(d.dias, ctx.ciclo_max)}` : ''}</div>
            </div>
            <a className="link" href="#composicao">Como o score foi montado <ArrowR size={18} /></a>
          </div>

          <div className="card" id="composicao">
            <div className="card-h"><h3>Atividade</h3><span className="pill line">{notas.length ? `${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}` : 'composição'}</span></div>
            <div className="tl" style={{ marginTop: 8 }}>
              {explicacao.passos.map((p) => { const [Ic, tom] = ICONE[p.k]; return (
                <div key={p.k} className="tl-i"><span className={`tl-ic ${tom}`}><Ic size={14} /></span><span className="tl-tx"><b>{p.titulo}</b><span>{p.desc}</span></span><span className="tl-v">{p.valor}</span></div>
              ); })}
              {notas.map((n, i) => (
                <div key={n.t + i} className="tl-i"><span className="tl-ic purple"><Pencil size={14} /></span><span className="tl-tx"><b>Você<small>{quando(n.t)}</small></b><span>{n.txt}</span></span></div>
              ))}
            </div>
            <div className="compose">
              <textarea ref={ta} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Registrar próxima ação…" rows={2} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') salvar(); }} />
              <div className="bar"><small>Guardado neste navegador · ⌘↵ envia</small><button className="btn sm white" onClick={salvar} disabled={!txt.trim()}><Send size={14} />Enviar</button></div>
            </div>
          </div>
          <p className="hint">Agente, produto e setor não entram no score: no teste temporal nenhum previu fechamento (AUC ≈ 0,5). <a href="/metodo" style={{ color: 'var(--lime)' }}>Como funciona →</a></p>
        </aside>
      </div>
    </div>
  );
}
