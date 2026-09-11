'use client';
import { useMemo, useState } from 'react';
import { num, usd } from '@/lib/fmt';
import { Calc, Info } from './Icons';

/**
 * Calculadora de risco de 90 dias. Modelo: hazard empírico por tempo de casa
 * (curva KM da base), multiplicado pelo fator da safra. Nada de variável
 * comportamental — nenhuma delas previu churn nos testes.
 */
export default function Calculadora({ km, fatores, coortes, rotuloProx, projecao }) {
  const opcoes = [...coortes.map((c) => c.coorte), 'proxima'];
  const [safra, setSafra] = useState(coortes[coortes.length - 1].coorte);
  const [meses, setMeses] = useState(0);
  const [mrr, setMrr] = useState(2300);

  const hz = Object.fromEntries(km.map((k) => [k.mes, k.hazard / 100]));
  const ultimo = km[km.length - 1];
  const h = (m) => hz[Math.max(1, Math.min(ultimo.mes, m))] ?? ultimo.hazard / 100;

  const r = useMemo(() => {
    const f = fatores[safra] ?? 1;
    let sobre = 1;
    const passos = [];
    for (let k = 1; k <= 3; k++) {
      const hk = Math.min(0.95, h(meses + k) * f);
      passos.push({ mes: meses + k, hk });
      sobre *= 1 - hk;
    }
    const p = 1 - sobre;
    return { p, passos, f, arr: mrr * 12 * p };
  }, [safra, meses, mrr, fatores]);

  const nivel = r.p >= 0.5 ? 'no' : r.p >= 0.25 ? 'gold' : 'ok';
  const rotulo = { no: 'Risco alto', gold: 'Risco médio', ok: 'Risco baixo' }[nivel];

  return (
    <div className="grid g-12" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-h">
          <div className="ttl"><span className="isq gold"><Calc /></span><div><h3>Simular uma conta</h3><span>Só entra o que prevê</span></div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="in">
            <label htmlFor="safra">Safra de entrada</label>
            <select id="safra" value={safra} onChange={(e) => setSafra(e.target.value)}>
              {opcoes.map((o) => <option key={o} value={o}>{o === 'proxima' ? `${rotuloProx} (projeção)` : o}</option>)}
            </select>
          </div>
          <div className="in">
            <label htmlFor="meses">Tempo de casa hoje <span className="val">· {meses} {meses === 1 ? 'mês' : 'meses'}</span></label>
            <input id="meses" type="range" min="0" max="15" step="1" value={meses} onChange={(e) => setMeses(+e.target.value)} />
          </div>
          <div className="in">
            <label htmlFor="mrr">MRR da conta (US$)</label>
            <input id="mrr" type="number" min="0" step="100" value={mrr} onChange={(e) => setMrr(Math.max(0, +e.target.value || 0))} />
          </div>
        </div>
      </div>

      <div className="card navy" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Próximos 90 dias</span>
          <span className={`chip ${nivel}`} style={{ borderColor: 'transparent' }}>{rotulo}</span>
        </div>
        <div className="grid g-2">
          <div>
            <div style={{ fontSize: 12, color: '#8ea2b3', fontWeight: 600, marginBottom: 6 }}>Probabilidade de sair</div>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1, color: '#fff' }}>{num(r.p * 100)}<small style={{ fontSize: 18, color: '#8ea2b3', marginLeft: 3 }}>%</small></div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8ea2b3', fontWeight: 600, marginBottom: 6 }}>Receita anual exposta</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.1, color: 'var(--gold)' }}>{usd(r.arr)}</div>
            <div style={{ fontSize: 11.5, color: '#8ea2b3', marginTop: 4 }}>MRR × 12 × probabilidade</div>
          </div>
        </div>
        <div className="bar" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'transparent' }}>
          <i className={nivel === 'no' ? 'no' : ''} style={{ width: `${Math.min(100, r.p * 100)}%`, background: nivel === 'ok' ? 'var(--ok)' : nivel === 'gold' ? 'var(--gold)' : 'var(--alert)' }} />
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8ea2b3', fontWeight: 700, marginBottom: 10 }}>Como chegou nesse número</div>
          <div className="rows">
            {r.passos.map((s) => (
              <div key={s.mes} className="row-i" style={{ borderColor: 'rgba(255,255,255,.08)', padding: '8px 0' }}>
                <div className="tx"><b style={{ color: '#fff', fontSize: 13 }}>Mês {s.mes} de vida</b><span style={{ color: '#8ea2b3' }}>risco base da idade × fator da safra ({num(r.f, 2)}×)</span></div>
                <div className="rt"><b style={{ color: 'var(--gold)' }}>{num(s.hk * 100)}%</b></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, fontSize: 11.5, color: '#8ea2b3', lineHeight: 1.5 }}>
            <Info size={14} style={{ flex: 'none', marginTop: 2 }} />
            <span>Tickets, CSAT e uso não entram — nenhum previu churn (AUC ≈ 0,5). {safra === 'proxima' ? `A safra ${rotuloProx} usa a tendência projetada de ${num(projecao)}% em 90 dias.` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
