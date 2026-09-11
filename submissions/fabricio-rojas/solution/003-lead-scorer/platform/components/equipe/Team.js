'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usdK, num, int } from '@/lib/fmt';
import { ORDEM } from '@/lib/explain';
import { Rise } from '@/components/ui/Reveal';
import Seg from '@/components/ui/Seg';
import Avatar from '@/components/ui/Avatar';
import { Stack, CORES_FILA } from '@/components/charts/Charts';
import { ArrowUR, TrendUp, Alert, ChevD, ChevR } from '@/components/ui/Icons';

export default function Team({ agentes, janelas, base, inicial = {} }) {
  const router = useRouter();
  const [office, setOffice] = useState('todos');
  const [gerente, setGerente] = useState(inicial.gerente ?? '');
  const [ordem, setOrdem] = useState('ev');
  const gerentes = useMemo(() => [...new Set(agentes.map((a) => a.manager))].sort(), [agentes]);
  const offices = useMemo(() => [...new Set(agentes.map((a) => a.office))].sort(), [agentes]);
  const lista = useMemo(() => {
    const f = { ev: (a, b) => b.ev - a.ev, fechar: (a, b) => b.por_acao.fechar - a.por_acao.fechar, decidir: (a, b) => b.por_acao.decidir - a.por_acao.decidir, win: (a, b) => (b.win ?? 0) - (a.win ?? 0), receita: (a, b) => b.receita - a.receita }[ordem];
    return agentes.filter((a) => (office === 'todos' || a.office === office) && (!gerente || a.manager === gerente)).sort(f);
  }, [agentes, office, gerente, ordem]);
  const maxAb = Math.max(...agentes.map((a) => a.abertos));
  const top = { ev: [...lista].sort((a, b) => b.ev - a.ev)[0], fechar: [...lista].sort((a, b) => b.por_acao.fechar - a.por_acao.fechar)[0], sujo: [...lista].filter((a) => a.abertos >= 20).sort((a, b) => b.por_acao.decidir / b.abertos - a.por_acao.decidir / a.abertos)[0] };
  const totalEv = lista.reduce((s, a) => s + a.ev, 0), totalAb = lista.reduce((s, a) => s + a.abertos, 0), totalDec = lista.reduce((s, a) => s + a.por_acao.decidir, 0);
  const trocarGerente = (g) => { setGerente(g); window.history.replaceState(null, '', g ? `/equipe?gerente=${encodeURIComponent(g)}` : '/equipe'); };

  return (
    <div className="page">
      <header className="ph">
        <div>
          <h1>Equipe{gerente ? ` de ${gerente.split(' ')[0]}` : ''}</h1>
          <p className="ph-sub"><b>{lista.length} vendedores</b> com <b>{int(totalAb)} deals</b> abertos e <b>{usdK(totalEv)}</b> em valor esperado. <b>{num(totalAb ? (100 * totalDec) / totalAb : 0, 0)}%</b> do pipeline está parado além do ciclo histórico.</p>
        </div>
        <div className="ph-r">
          <label className="sel-pill" style={{ position: 'relative' }}>{gerente || 'Todos os gerentes'} <ChevD size={14} /><select value={gerente} onChange={(e) => trocarGerente(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }} aria-label="Gerente"><option value="">Todos os gerentes</option>{gerentes.map((g) => <option key={g}>{g}</option>)}</select></label>
          <label className="sel-pill" style={{ position: 'relative' }}>Ordenar: {{ ev: 'valor esperado', fechar: 'para fechar', decidir: 'parados', win: 'win rate', receita: 'receita' }[ordem]} <ChevD size={14} /><select value={ordem} onChange={(e) => setOrdem(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }} aria-label="Ordenar"><option value="ev">valor esperado</option><option value="fechar">para fechar</option><option value="decidir">parados</option><option value="win">win rate</option><option value="receita">receita fechada</option></select></label>
        </div>
      </header>

      <section className="hl">
        {[
          { Ic: ArrowUR, lab: 'Maior valor esperado', a: top.ev, pill: top.ev && <span className="pill green"><i className="tri up" />{usdK(top.ev.ev)}</span>, stripe: true },
          { Ic: TrendUp, lab: 'Mais deals para fechar', a: top.fechar, pill: top.fechar && <span className="pill accent">{top.fechar.por_acao.fechar} deals</span> },
          { Ic: Alert, lab: 'Pipeline mais parado', a: top.sujo, pill: top.sujo && <span className="pill red"><i className="tri down" />{num((100 * top.sujo.por_acao.decidir) / top.sujo.abertos, 0)}%</span> },
        ].map((c, i) => (
          <Rise key={c.lab} atraso={i * 70}>
            {c.a ? (
              <Link href={`/?agente=${encodeURIComponent(c.a.agent)}`} className={`card hover ${c.stripe ? 'stripe' : ''}`} style={{ display: 'block' }}>
                <div className="card-h"><span className="lab"><span className="ic"><c.Ic size={15} /></span>{c.lab}</span></div><div className="sep" />
                <div className="hl-body"><Avatar nome={c.a.agent} size={28} /><span className="nm">{c.a.agent}</span><span className="tk">{c.a.office}</span>{c.pill}</div>
              </Link>
            ) : <div className="card"><div className="card-h"><span className="lab">{c.lab}</span></div><div className="sep" /><div className="hl-body"><span className="tk">—</span></div></div>}
          </Rise>
        ))}
      </section>

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '14px 16px' }}>
            <Seg valor={office} onChange={setOffice} ariaLabel="Escritório" itens={[{ k: 'todos', label: 'Todos', n: agentes.filter((a) => !gerente || a.manager === gerente).length }, ...offices.map((o) => ({ k: o, label: o, n: agentes.filter((a) => a.office === o && (!gerente || a.manager === gerente)).length }))]} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{ORDEM.map((k) => <span key={k} className="hint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: CORES_FILA[k], display: 'inline-block' }} />{janelas[k].rotulo}</span>)}</div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th className="idx">#</th><th>Vendedor</th><th>Escritório</th><th className="n">Abertos</th><th>Composição do pipeline</th><th className="n">Valor esperado</th><th className="n">Win rate</th><th className="n">Receita fechada</th><th aria-label="abrir" style={{ width: 36 }} /></tr></thead>
              <tbody key={office + gerente + ordem}>
                {lista.map((a, i) => (
                  <tr key={a.agent} className="row" style={{ '--i': Math.min(i, 12) }} onClick={() => router.push(`/?agente=${encodeURIComponent(a.agent)}`)}>
                    <td className="idx">{i + 1}</td>
                    <td><div className="asset"><Avatar nome={a.agent} size={30} /><div style={{ minWidth: 0 }}><div className="nm">{a.agent}</div><div className="tk">gerente {a.manager}</div></div></div></td>
                    <td><span className="pill line">{a.office}</span></td>
                    <td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>{a.abertos}</td>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ width: `${Math.max(24, (100 * a.abertos) / maxAb)}%` }}><Stack partes={ORDEM.map((k) => ({ k, label: janelas[k].rotulo, n: a.por_acao[k], cor: CORES_FILA[k] }))} total={a.abertos} /></div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11.5, color: 'var(--t3)' }}><span style={{ color: 'var(--green)' }}>{a.por_acao.fechar} fechar</span><span style={{ color: 'var(--red)' }}>{a.por_acao.decidir} decidir</span><span>{a.sem_conta} sem conta</span></div>
                    </td>
                    <td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>{usdK(a.ev)}</td>
                    <td className="n">{a.win != null ? <span className={`pill ${a.win_ic[0] > base ? 'green' : a.win_ic[1] < base ? 'red' : 'line'}`} title={`IC 95%: ${num(a.win_ic[0] * 100, 0)}–${num(a.win_ic[1] * 100, 0)}%`}>{num(a.win * 100, 0)}%</span> : '—'}</td>
                    <td className="n">{usdK(a.receita)}</td>
                    <td style={{ color: 'var(--t3)' }}><ChevR size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot"><span>Win rate em cinza cruza a média do time ({num(base * 100)}%) dentro do IC 95% — a diferença cabe no erro amostral.</span></div>
        </div>
      </Rise>
    </div>
  );
}
