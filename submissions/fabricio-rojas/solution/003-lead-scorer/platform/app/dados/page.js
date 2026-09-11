import Link from 'next/link';
import { Rise, Counter } from '@/components/ui/Reveal';
import { Database, Alert, Layers, ArrowUR } from '@/components/ui/Icons';
import { scores } from '@/lib/data';
import { num, int, usdK } from '@/lib/fmt';

export const metadata = { title: 'Dados do CRM — Lead Scorer' };

export default function Dados() {
  const s = scores();
  const tom = { critico: 'red', alto: 'amber', baixo: 'blue', info: 'line' };
  const rot = { critico: 'Crítico', alto: 'Alto', baixo: 'Baixo', info: 'Info' };
  const semConta = s.integridade.find((p) => p.problema.includes('sem conta associada'));
  const zumbis = s.integridade.find((p) => p.problema.includes('além do ciclo'));
  return (
    <div className="page">
      <header className="ph">
        <div><h1>Dados do CRM</h1><p className="ph-sub"><b>{int(s.base.total)} oportunidades</b>, <b>{int(s.base.fechados)}</b> fechadas com win rate de <b>{num(s.base.base_win * 100)}%</b> e <b>{int(s.base.abertos)}</b> abertas. Três problemas de dado teriam quebrado o score em silêncio.</p></div>
        <div className="ph-r"><Link href="/?agente=&fila=decidir" className="btn white">Ver os deals parados</Link></div>
      </header>

      <section className="hl">
        {[
          { Ic: Database, lab: 'Abertos sem conta', v: <Counter para={semConta.n} formato="int" />, pill: <span className="pill red"><i className="tri down" />{num((100 * semConta.n) / s.base.abertos, 0)}% do aberto</span>, stripe: true },
          { Ic: Alert, lab: `Além do ciclo (${s.ciclo_max}d)`, v: <Counter para={zumbis.n} formato="int" />, pill: <span className="pill red">{usdK(s.base.por_acao.decidir.ev)} nominal</span> },
          { Ic: Layers, lab: 'Produto com dois nomes', v: <Counter para={s.integridade[0].n} formato="int" />, pill: <span className="pill amber">normalizado</span> },
        ].map((c, i) => (
          <Rise key={c.lab} atraso={i * 70}>
            <div className={`card ${c.stripe ? 'stripe' : ''}`}>
              <div className="card-h"><span className="lab"><span className="ic"><c.Ic size={15} /></span>{c.lab}</span></div><div className="sep" />
              <div className="hl-body"><span className="nm" style={{ fontSize: 22, fontWeight: 600 }}>{c.v}</span><span className="tk">deals</span>{c.pill}</div>
            </div>
          </Rise>
        ))}
      </section>

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-h" style={{ padding: '16px 16px 4px' }}><div><h3>Integridade</h3><span className="sub">Cada linha mudou algo no score ou virou uma flag no deal</span></div></div>
          <div className="tbl-wrap"><table>
            <thead><tr><th className="idx">#</th><th>Problema</th><th className="n">Registros</th><th>Consequência</th><th>Gravidade</th></tr></thead>
            <tbody>{s.integridade.map((p, i) => <tr key={i} className="row" style={{ '--i': i, cursor: 'default' }}><td className="idx">{i + 1}</td><td style={{ color: 'var(--t1)', fontWeight: 500 }}>{p.problema}</td><td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>{int(p.n)}</td><td style={{ fontSize: 13 }}>{p.impacto}</td><td><span className={`pill ${tom[p.severidade]} dot`}>{rot[p.severidade]}</span></td></tr>)}</tbody>
          </table></div>
        </div>
      </Rise>

      <div className="grid g2">
        <Rise>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-h" style={{ padding: '16px 16px 4px' }}><div><h3>Ticket típico por produto</h3><span className="sub">Mediana dos ganhos vs. preço de catálogo</span></div></div>
            <div className="tbl-wrap"><table>
              <thead><tr><th>Produto</th><th className="n">Ganhos</th><th className="n">Ticket típico</th><th className="n">Catálogo</th></tr></thead>
              <tbody>{Object.entries(s.ticket).sort((a, b) => b[1].ticket - a[1].ticket).map(([p, t], i) => <tr key={p} className="row" style={{ '--i': i, cursor: 'default' }}><td style={{ color: 'var(--t1)', fontWeight: 500 }}>{p}</td><td className="n">{int(t.n_won)}</td><td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>US$ {int(t.ticket)}</td><td className="n">{t.catalogo != null ? `US$ ${int(t.catalogo)}` : '—'}</td></tr>)}</tbody>
            </table></div>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card" style={{ padding: 24 }}>
            <div className="card-h"><div><h3>Os dois problemas que definem o pipeline</h3><span className="sub">Não são detalhes: são 84% dos deals abertos</span></div></div>
            <div className="tl" style={{ marginTop: 10 }}>
              <div className="tl-i"><span className="tl-ic red"><Alert size={14} /></span><span className="tl-tx"><b>{int(semConta.n)} deals abertos sem conta</b><span>Nenhum deal sem conta jamais foi fechado. Ou a conta é preenchida só no fechamento, ou esses deals nunca foram trabalhados. Nos dois casos, a primeira ação é atribuir a conta no CRM.</span></span></div>
              <div className="tl-i"><span className="tl-ic red"><Alert size={14} /></span><span className="tl-tx"><b>{int(zumbis.n)} deals além do ciclo máximo histórico</b><span>Nenhum deal na história fechou depois de {s.ciclo_max} dias. Estes estão há mais tempo que isso em Engaging. O pipeline carrega deals mortos sem baixa — e o número do time está inflado.</span></span></div>
              <div className="tl-i"><span className="tl-ic green"><ArrowUR size={14} /></span><span className="tl-tx"><b>O que fazer com isso</b><span>A fila <Link href="/?agente=&fila=decidir" style={{ color: 'var(--lime)' }}>Decidir</Link> lista os {int(zumbis.n)} para confirmar ou encerrar; a flag "sem conta" aparece em cada deal e na composição por vendedor em Equipe.</span></span></div>
            </div>
          </div>
        </Rise>
      </div>
    </div>
  );
}
