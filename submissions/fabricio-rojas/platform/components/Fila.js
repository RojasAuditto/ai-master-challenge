'use client';
import { useMemo, useState } from 'react';
import { usd, num, int } from '@/lib/fmt';

export default function Fila({ contas, coorteNova }) {
  const [filtro, setFiltro] = useState('criticas');
  const [aberta, setAberta] = useState(null);

  const filtros = [
    { id: 'criticas', label: 'Janela crítica (≤3 meses)', teste: (c) => c.meses <= 3 },
    { id: 'valor', label: 'Alto valor (≥US$ 5K/mês)', teste: (c) => c.mrr >= 5000 },
    { id: 'safra', label: `Safra ${coorteNova}`, teste: (c) => c.coorte === coorteNova },
    { id: 'todas', label: 'Todas as contas ativas', teste: () => true },
  ];

  const lista = useMemo(() => {
    const f = filtros.find((x) => x.id === filtro);
    return contas.filter(f.teste);
  }, [filtro, contas]);

  const totalRisco = lista.reduce((s, c) => s + c.arr_em_risco, 0);

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        {filtros.map((f) => {
          const n = contas.filter(f.teste).length;
          return (
            <button
              key={f.id}
              onClick={() => { setFiltro(f.id); setAberta(null); }}
              aria-pressed={filtro === f.id}
              style={{
                padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                background: filtro === f.id ? '#b9915b' : 'transparent',
                color: filtro === f.id ? '#001f35' : '#9db2bf',
                border: `1px solid ${filtro === f.id ? '#b9915b' : '#14384c'}`,
              }}
            >
              {f.label} <span style={{ opacity: 0.65 }}>· {n}</span>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '14px 18px' }}>
        <span style={{ fontSize: 13, color: '#9db2bf' }}>
          <strong style={{ color: '#d4b183', fontSize: 15 }}>{int(lista.length)} contas</strong> nesta fila ·
          exposição combinada de <strong style={{ color: '#d4b183', fontSize: 15 }}>{usd(totalRisco)}</strong> de ARR
          ponderado pelo risco da fase em que cada uma está.
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.slice(0, 25).map((c) => (
              <FilaLinha key={c.account_id} c={c} aberta={aberta === c.account_id}
                toggle={() => setAberta(aberta === c.account_id ? null : c.account_id)} />
            ))}
          </tbody>
        </table>
      </div>
      {lista.length > 25 && (
        <p className="note" style={{ marginTop: 10 }}>
          Mostrando as 25 de maior exposição, de {lista.length}. A lista completa sai do mesmo
          <span className="mono"> SELECT</span> — é o que o CS trabalharia na segunda-feira.
        </p>
      )}
    </>
  );
}

function FilaLinha({ c, aberta, toggle }) {
  const critica = c.meses <= 3;
  return (
    <>
      <tr onClick={toggle} style={{ cursor: 'pointer' }}>
        <td>
          <div style={{ fontWeight: 600, color: '#f5f4f3' }}>{c.conta}</div>
          <div style={{ fontSize: 11, color: '#6b8494' }}>{c.account_id} · {c.plano} · {c.canal}</div>
        </td>
        <td style={{ fontSize: 12 }}>{c.industry}<div style={{ fontSize: 11, color: '#6b8494' }}>{c.country}</div></td>
        <td className="num">
          <span className={`tag ${critica ? 'no' : 'flat'}`}>{num(c.meses)}</span>
        </td>
        <td className="num">{usd(c.mrr)}</td>
        <td className="num" style={{ color: critica ? '#dd8570' : '#cfdae1' }}>{num(c.risco_mensal_pct)}%</td>
        <td className="num" style={{ color: '#d4b183', fontWeight: 700 }}>{usd(c.arr_em_risco)}</td>
        <td className="num" style={{ color: '#6b8494', fontSize: 11 }}>{aberta ? '▲' : '▼'}</td>
      </tr>
      {aberta && (
        <tr>
          <td colSpan={7} style={{ background: '#03151f', padding: '18px 20px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#b9915b', fontWeight: 700, marginBottom: 11 }}>
              Por que esta conta está na fila
            </div>
            <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 13, lineHeight: 1.75, color: '#cfdae1' }}>
              {c.motivos.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            <div className="row" style={{ gap: 22, fontSize: 12, color: '#6b8494', borderTop: '1px solid #0f2f42', paddingTop: 12 }}>
              <span>Tickets: <strong style={{ color: '#cfdae1' }}>{c.tickets}</strong></span>
              <span>CSAT: <strong style={{ color: '#cfdae1' }}>{c.csat ? num(c.csat) : 'sem nota'}</strong></span>
              <span>Uso acumulado: <strong style={{ color: '#cfdae1' }}>{int(c.usos)}</strong></span>
              <span>Entrou em: <strong style={{ color: '#cfdae1' }}>{c.signup_date}</strong></span>
            </div>
            <p className="note" style={{ margin: '14px 0 0', fontSize: 11.5, fontStyle: 'italic' }}>
              Tickets, CSAT e uso aparecem como contexto para a conversa — não entram no score.
              Nenhum deles previu churn nos testes (seção 05), e usá-los daria uma falsa sensação de precisão.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
