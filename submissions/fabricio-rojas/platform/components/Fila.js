'use client';
import { useMemo, useState } from 'react';
import { usd, num, int } from '@/lib/fmt';

export default function Fila({ contas, coorteNova }) {
  const [filtro, setFiltro] = useState('criticas');
  const [aberta, setAberta] = useState(null);
  const [limite, setLimite] = useState(25);

  const filtros = [
    { id: 'criticas', label: 'Janela crítica (≤3 meses)', teste: (c) => c.meses <= 3 },
    { id: 'valor', label: 'Alto valor (≥US$ 5K/mês)', teste: (c) => c.mrr >= 5000 },
    { id: 'safra', label: `Safra ${coorteNova}`, teste: (c) => c.coorte === coorteNova },
    { id: 'todas', label: 'Todas as ativas', teste: () => true },
  ];

  const lista = useMemo(
    () => contas.filter(filtros.find((x) => x.id === filtro).teste),
    [filtro, contas]
  );
  const totalRisco = lista.reduce((s, c) => s + c.arr_em_risco, 0);

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        {filtros.map((f) => (
          <button key={f.id} className="pill" aria-pressed={filtro === f.id}
            onClick={() => { setFiltro(f.id); setAberta(null); setLimite(25); }}>
            {f.label} <span style={{ opacity: 0.6 }}>· {contas.filter(f.teste).length}</span>
          </button>
        ))}
      </div>

      <div className="card gold" style={{ marginBottom: 12, padding: '13px 18px' }}>
        <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>
          <strong style={{ fontSize: 15 }}>{int(lista.length)} contas</strong> nesta fila · exposição combinada de{' '}
          <strong style={{ fontSize: 15, color: 'var(--gold-ink)' }}>{usd(totalRisco)}</strong> de ARR ponderado
          pelo risco da fase em que cada uma está.
        </span>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Conta</th>
              <th>Setor</th>
              <th className="num">Casa (meses)</th>
              <th className="num">MRR</th>
              <th className="num">Risco/mês</th>
              <th className="num">ARR em risco</th>
              <th aria-label="Expandir" />
            </tr>
          </thead>
          <tbody>
            {lista.slice(0, limite).map((c) => (
              <Linha key={c.account_id} c={c} aberta={aberta === c.account_id}
                toggle={() => setAberta(aberta === c.account_id ? null : c.account_id)} />
            ))}
          </tbody>
        </table>
      </div>

      {lista.length > limite && (
        <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <p className="note" style={{ margin: 0 }}>
            Mostrando {limite} de {int(lista.length)}, por ordem de exposição.
          </p>
          <button className="pill" onClick={() => setLimite((l) => l + 25)}>Mostrar mais 25</button>
        </div>
      )}
    </>
  );
}

function Linha({ c, aberta, toggle }) {
  const critica = c.meses <= 3;
  return (
    <>
      <tr onClick={toggle} style={{ cursor: 'pointer' }}>
        <td>
          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.conta}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.account_id} · {c.plano} · {c.canal}</div>
        </td>
        <td style={{ fontSize: 12.5 }}>
          {c.industry}
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.country}</div>
        </td>
        <td className="num"><span className={`tag ${critica ? 'no' : 'flat'}`}>{num(c.meses)}</span></td>
        <td className="num">{usd(c.mrr)}</td>
        <td className="num" style={{ color: critica ? 'var(--alert)' : 'var(--ink-2)', fontWeight: 600 }}>
          {num(c.risco_mensal_pct)}%
        </td>
        <td className="num" style={{ color: 'var(--gold-ink)', fontWeight: 800 }}>{usd(c.arr_em_risco)}</td>
        <td className="num" style={{ color: 'var(--ink-3)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ transform: aberta ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </td>
      </tr>
      {aberta && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--surface-2)', padding: '18px 20px' }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase',
              color: 'var(--gold-ink)', fontWeight: 800, marginBottom: 10,
            }}>
              Por que esta conta está na fila
            </div>
            <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, lineHeight: 1.75, color: 'var(--ink-2)' }}>
              {c.motivos.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            <div className="row" style={{ gap: 22, fontSize: 12, color: 'var(--ink-3)', borderTop: '1px solid var(--line)', paddingTop: 11 }}>
              <span>Tickets: <strong style={{ color: 'var(--ink-2)' }}>{c.tickets}</strong></span>
              <span>CSAT: <strong style={{ color: 'var(--ink-2)' }}>{c.csat ? num(c.csat) : 'sem nota'}</strong></span>
              <span>Uso acumulado: <strong style={{ color: 'var(--ink-2)' }}>{int(c.usos)}</strong></span>
              <span>Entrou em: <strong style={{ color: 'var(--ink-2)' }}>{c.signup_date}</strong></span>
            </div>
            <p className="note" style={{ margin: '12px 0 0', fontSize: 11.5, fontStyle: 'italic' }}>
              Tickets, CSAT e uso aparecem como contexto para a conversa — não entram no score. Nenhum deles previu
              churn nos testes, e usá-los daria uma falsa sensação de precisão.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
