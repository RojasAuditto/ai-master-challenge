'use client';
import { useMemo, useState } from 'react';
import { usd, num, int } from '@/lib/fmt';
import { Chevron, Copy, Download, Check, Phone } from './Icons';

const CSV_COLS = ['account_id', 'conta', 'industry', 'country', 'plano', 'canal', 'coorte', 'meses', 'mrr', 'risco_mensal_pct', 'arr_em_risco'];
const toCsv = (rows) => [CSV_COLS.join(';'), ...rows.map((r) => CSV_COLS.map((c) => String(r[c] ?? '').replace(/;/g, ',')).join(';'))].join('\n');

/** Roteiro de abordagem: o que o CS fala com esta conta, derivado do que se sabe dela. */
function roteiro(c) {
  const itens = [];
  if (c.meses <= 3) itens.push('Confirmar que o time da conta concluiu o setup e já usou a feature principal. É aqui que a maioria desiste.');
  if (c.meses <= 1) itens.push('Agendar uma sessão de ativação de 30 min nesta semana — o 1º mês tem o maior risco de toda a vida do cliente.');
  if (c.tickets === 0) itens.push('Nunca abriu ticket: perguntar diretamente se travou em algo. Silêncio não é sinal de saúde nesta fase.');
  if (c.tickets > 0 && c.csat && c.csat < 3.5) itens.push(`CSAT médio ${num(c.csat)}: revisar os tickets antes de ligar e abrir a conversa reconhecendo o problema.`);
  if (c.pct_anual < 0.3) itens.push('Contrato mensal: se a ativação for bem, oferecer a migração para anual com desconto — reduz a fricção de saída.');
  if (c.mrr >= 5000) itens.push('Conta de alto valor: envolver o gerente de contas, não só o suporte.');
  if (!itens.length) itens.push('Check-in de rotina: uso, dúvidas e o que falta para o time da conta extrair mais valor.');
  return itens;
}

export default function Fila({ contas, coorteNova }) {
  const [filtro, setFiltro] = useState('criticas');
  const [aberta, setAberta] = useState(null);
  const [limite, setLimite] = useState(20);
  const [copiado, setCopiado] = useState(false);

  const filtros = [
    { id: 'criticas', label: 'Janela crítica', sub: '≤ 3 meses', teste: (c) => c.meses <= 3 },
    { id: 'valor', label: 'Alto valor', sub: '≥ US$ 5K/mês', teste: (c) => c.mrr >= 5000 },
    { id: 'safra', label: `Safra ${coorteNova}`, sub: 'mais recente', teste: (c) => c.coorte === coorteNova },
    { id: 'todas', label: 'Todas', sub: 'ativas', teste: () => true },
  ];
  const lista = useMemo(() => contas.filter(filtros.find((x) => x.id === filtro).teste), [filtro, contas]);
  const total = lista.reduce((s, c) => s + c.arr_em_risco, 0);

  const copiar = async () => {
    try { await navigator.clipboard.writeText(toCsv(lista)); setCopiado(true); setTimeout(() => setCopiado(false), 1600); } catch { /* sem clipboard */ }
  };
  const baixar = () => {
    const blob = new Blob(['﻿' + toCsv(lista)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `fila-cs-${filtro}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="grid g-4">
        {filtros.map((f) => {
          const g = contas.filter(f.teste); const on = filtro === f.id;
          return (
            <button key={f.id} onClick={() => { setFiltro(f.id); setAberta(null); setLimite(20); }} aria-pressed={on}
              className="card tight" style={{ textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--gold)' : 'var(--line)', background: on ? 'var(--gold-bg)' : 'var(--surface)', boxShadow: on ? 'none' : 'var(--sh)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{f.sub}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.03em', color: on ? 'var(--gold-ink)' : 'var(--ink)' }}>{g.length}</div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8, fontWeight: 600 }}>{usd(g.reduce((s, c) => s + c.arr_em_risco, 0))} expostos</div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            <b style={{ color: 'var(--ink)' }}>{int(lista.length)} contas</b> · <b style={{ color: 'var(--gold-ink)' }}>{usd(total)}</b> de ARR ponderado pelo risco
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm" onClick={copiar}>{copiado ? <Check size={14} /> : <Copy size={14} />}{copiado ? 'Copiado' : 'Copiar CSV'}</button>
            <button className="btn sm dark" onClick={baixar}><Download size={14} />Baixar CSV</button>
          </div>
        </div>
        <div className="tw" style={{ border: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Conta</th><th>Setor</th><th className="n">Casa (meses)</th><th className="n">MRR</th><th className="n">Risco/mês</th><th className="n">ARR em risco</th><th aria-label="Abrir" /></tr>
            </thead>
            <tbody>
              {lista.slice(0, limite).map((c) => (
                <Linha key={c.account_id} c={c} aberta={aberta === c.account_id} toggle={() => setAberta(aberta === c.account_id ? null : c.account_id)} />
              ))}
            </tbody>
          </table>
        </div>
        {lista.length > limite && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
            <span className="hint">{limite} de {int(lista.length)}, por exposição</span>
            <button className="btn sm" onClick={() => setLimite((l) => l + 20)}>Mostrar mais 20</button>
          </div>
        )}
      </div>
    </>
  );
}

function Linha({ c, aberta, toggle }) {
  const critica = c.meses <= 3;
  return (
    <>
      <tr className="click" onClick={toggle}>
        <td><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.conta}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.account_id} · {c.plano} · {c.canal}</div></td>
        <td style={{ fontSize: 12.5 }}>{c.industry}<div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.country}</div></td>
        <td className="n"><span className={`chip ${critica ? 'no' : 'soft'}`}>{num(c.meses)}</span></td>
        <td className="n">{usd(c.mrr)}</td>
        <td className="n" style={{ color: critica ? 'var(--alert)' : 'var(--ink-2)', fontWeight: 700 }}>{num(c.risco_mensal_pct)}%</td>
        <td className="n" style={{ color: 'var(--gold-ink)', fontWeight: 800 }}>{usd(c.arr_em_risco)}</td>
        <td className="n" style={{ color: 'var(--ink-3)' }}><Chevron size={15} style={{ transform: aberta ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></td>
      </tr>
      {aberta && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--surface-2)', padding: '16px 18px' }}>
            <div className="grid g-2" style={{ gap: 18 }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-ink)', fontWeight: 800, marginBottom: 8 }}>Por que está na fila</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{c.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul>
                <dl className="kv" style={{ marginTop: 12 }}>
                  <dt>Tickets</dt><dd>{c.tickets}</dd>
                  <dt>CSAT</dt><dd>{c.csat ? num(c.csat) : 'sem nota'}</dd>
                  <dt>Uso acumulado</dt><dd>{int(c.usos)}</dd>
                  <dt>Entrou em</dt><dd>{c.signup_date}</dd>
                </dl>
              </div>
              <div className="card tight" style={{ boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="isq navy" style={{ width: 28, height: 28, borderRadius: 8 }}><Phone size={14} /></span>
                  <b style={{ fontSize: 13 }}>Roteiro de abordagem</b>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{roteiro(c).map((m, i) => <li key={i}>{m}</li>)}</ol>
                <p className="hint" style={{ marginTop: 10, fontStyle: 'italic' }}>Tickets, CSAT e uso são contexto da conversa. Não entram no score: nenhum previu churn.</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
