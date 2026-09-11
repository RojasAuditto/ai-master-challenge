'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usd, usdK, num, int } from '@/lib/fmt';
import { ArrowR } from './Icons';

const CORES = { fechar: 'ok', acompanhar: 'blue', decidir: 'no', engajar: 'violet' };

export default function Equipe({ agentes, janelas }) {
  const [gerente, setGerente] = useState('');
  const [office, setOffice] = useState('');
  const [ordem, setOrdem] = useState('ev');
  const gerentes = useMemo(() => [...new Set(agentes.map((a) => a.manager))].sort(), [agentes]);
  const offices = useMemo(() => [...new Set(agentes.map((a) => a.office))].sort(), [agentes]);
  const lista = useMemo(() => {
    const f = { ev: (a, b) => b.ev - a.ev, abertos: (a, b) => b.abertos - a.abertos, decidir: (a, b) => b.por_acao.decidir - a.por_acao.decidir, win: (a, b) => (b.win ?? 0) - (a.win ?? 0), receita: (a, b) => b.receita - a.receita }[ordem];
    return agentes.filter((a) => (!gerente || a.manager === gerente) && (!office || a.office === office)).sort(f);
  }, [agentes, gerente, office, ordem]);
  const maxAb = Math.max(...agentes.map((a) => a.abertos));

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="ctl">Gerente<select value={gerente} onChange={(e) => setGerente(e.target.value)}><option value="">todos</option>{gerentes.map((g) => <option key={g}>{g}</option>)}</select></label>
          <label className="ctl">Escritório<select value={office} onChange={(e) => setOffice(e.target.value)}><option value="">todos</option>{offices.map((o) => <option key={o}>{o}</option>)}</select></label>
        </div>
        <label className="ctl">Ordenar<select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
          <option value="ev">valor esperado</option><option value="abertos">deals abertos</option><option value="decidir">parados</option><option value="receita">receita fechada</option><option value="win">win rate</option>
        </select></label>
      </div>
      <div className="tw">
        <table>
          <thead><tr><th>Vendedor</th><th>Escritório</th><th className="n">Abertos</th><th>Composição do pipeline</th><th className="n">Valor em jogo</th><th className="n">Valor esperado</th><th className="n">Win rate</th><th className="n">Receita fechada</th><th aria-label="abrir" /></tr></thead>
          <tbody key={ordem + gerente + office} className="fade">
            {lista.map((a) => (
              <tr key={a.agent} className="click">
                <td><Link href={`/?agente=${encodeURIComponent(a.agent)}`} style={{ display: 'block' }}><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{a.agent}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>gerente {a.manager}</div></Link></td>
                <td><span className="tag ghost">{a.office}</span></td>
                <td className="n" style={{ fontWeight: 700 }}>{a.abertos}</td>
                <td style={{ minWidth: 170 }}>
                  <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)', width: `${Math.max(20, (100 * a.abertos) / maxAb)}%` }} title={Object.entries(a.por_acao).map(([k, v]) => `${janelas[k].rotulo}: ${v}`).join(' · ')}>
                    {['fechar', 'acompanhar', 'decidir', 'engajar'].map((k) => a.por_acao[k] > 0 && <i key={k} style={{ width: `${(100 * a.por_acao[k]) / a.abertos}%`, background: `var(--${CORES[k]})` }} />)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 10.5, color: 'var(--ink-3)' }}>
                    <span style={{ color: 'var(--ok)' }}>{a.por_acao.fechar} fechar</span><span style={{ color: 'var(--no)' }}>{a.por_acao.decidir} decidir</span><span>{a.sem_conta} sem conta</span>
                  </div>
                </td>
                <td className="n">{usdK(a.pipeline)}</td>
                <td className="n" style={{ fontWeight: 800, color: 'var(--gold-soft)' }}>{usdK(a.ev)}</td>
                <td className="n">{a.win != null ? <><b>{num(a.win * 100, 0)}%</b><div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{num(a.win_ic[0] * 100, 0)}–{num(a.win_ic[1] * 100, 0)}%</div></> : '—'}</td>
                <td className="n">{usdK(a.receita)}</td>
                <td style={{ color: 'var(--ink-3)' }}><Link href={`/?agente=${encodeURIComponent(a.agent)}`} aria-label={`Abrir pipeline de ${a.agent}`}><ArrowR size={15} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {['fechar', 'acompanhar', 'decidir', 'engajar'].map((k) => <span key={k} className="hint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: `var(--${CORES[k]})`, display: 'inline-block' }} />{janelas[k].rotulo}</span>)}
      </div>
    </div>
  );
}
