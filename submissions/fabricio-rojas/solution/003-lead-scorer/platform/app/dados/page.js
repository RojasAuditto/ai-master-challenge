import { Rise } from '@/components/Reveal';
import { Database, Alert, Zap } from '@/components/Icons';
import { scores } from '@/lib/data';
import { usd, num, int } from '@/lib/fmt';

export const metadata = { title: 'Dados do CRM — Lead Scorer' };

export default function Dados() {
  const s = scores();
  const tom = (x) => ({ critico: 'no', alto: 'gold', baixo: 'blue', info: 'ghost' }[x] ?? 'ghost');
  const rot = { critico: 'Crítico', alto: 'Alto', baixo: 'Baixo', info: 'Info' };
  const tickets = Object.entries(s.ticket).sort((a, b) => b[1].ticket - a[1].ticket);
  return (
    <div className="page">
      <div className="top">
        <div><h1>Dados do CRM</h1><div className="sub">{int(s.base.total)} oportunidades · {int(s.base.fechados)} fechadas · {int(s.base.abertos)} abertas · o que precisou ser tratado antes de pontuar</div></div>
        <div className="top-r"><span className="tag">4 tabelas</span><span className="tag gold">win rate base {num(s.base.base_win * 100)}%</span></div>
      </div>

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-h" style={{ padding: '16px 18px 0', marginBottom: 12 }}><div className="ttl"><span className="isq no"><Database /></span><div><h3>Integridade</h3><span>Cada linha mudou algo no score ou virou uma flag no deal</span></div></div></div>
          <div className="tw"><table>
            <thead><tr><th>Problema</th><th className="n">Registros</th><th>Consequência</th><th>Gravidade</th></tr></thead>
            <tbody>{s.integridade.map((p, i) => (
              <tr key={i}><td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.problema}</td><td className="n" style={{ fontWeight: 800, color: 'var(--gold-soft)' }}>{int(p.n)}</td><td style={{ fontSize: 12.5 }}>{p.impacto}</td><td><span className={`tag ${tom(p.severidade)}`}><i className="dot" />{rot[p.severidade]}</span></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </Rise>

      <div className="grid g-2">
        <Rise>
          <div className="card">
            <div className="card-h"><div className="ttl"><span className="isq gold"><Zap /></span><div><h3>Ticket típico por produto</h3><span>Mediana dos deals ganhos vs. preço de catálogo</span></div></div></div>
            <div className="tw"><table>
              <thead><tr><th>Produto</th><th className="n">Ganhos</th><th className="n">Ticket típico</th><th className="n">Catálogo</th></tr></thead>
              <tbody>{tickets.map(([p, t]) => (
                <tr key={p}><td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p}</td><td className="n">{int(t.n_won)}</td><td className="n" style={{ fontWeight: 800, color: 'var(--gold-soft)' }}>{usd(t.ticket)}</td><td className="n" style={{ color: 'var(--ink-3)' }}>{t.catalogo != null ? usd(t.catalogo) : '—'}</td></tr>
              ))}</tbody>
            </table></div>
            <p className="hint" style={{ marginTop: 10 }}>"GTXPro" e "GTX Pro" eram o mesmo produto com dois nomes. Sem juntar, 1.480 deals ficariam sem ticket. O que está em jogo num deal é o que o produto de fato fecha, não o preço de tabela.</p>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card" style={{ height: '100%' }}>
            <div className="card-h"><div className="ttl"><span className="isq no"><Alert /></span><div><h3>Os dois problemas que definem o pipeline</h3><span>Não são detalhes: são 84% dos deals abertos</span></div></div></div>
            <div className="rows">
              <div className="row-i" style={{ alignItems: 'flex-start' }}><span className="isq no" style={{ width: 28, height: 28, borderRadius: 8 }}><Alert size={14} /></span><div className="tx"><b>{int(s.integridade[1].n)} deals abertos sem conta</b><span style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>Nenhum deal sem conta jamais foi fechado. Ou a conta é preenchida só no fechamento, ou esses deals nunca foram trabalhados. Nos dois casos, a primeira ação é atribuir a conta no CRM.</span></div></div>
              <div className="row-i" style={{ alignItems: 'flex-start' }}><span className="isq no" style={{ width: 28, height: 28, borderRadius: 8 }}><Alert size={14} /></span><div className="tx"><b>{int(s.integridade[2].n)} deals além do ciclo máximo histórico</b><span style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>Nenhum deal na história fechou depois de {s.ciclo_max} dias. Estes estão há mais tempo que isso em Engaging. O pipeline provavelmente carrega deals mortos sem baixa — e o número do time está inflado.</span></div></div>
            </div>
          </div>
        </Rise>
      </div>
    </div>
  );
}
