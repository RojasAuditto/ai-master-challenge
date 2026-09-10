import Topbar from '@/components/Topbar';
import { Rise } from '@/components/Reveal';
import { Database, Alert, Check, Shield } from '@/components/Icons';
import { findings } from '@/lib/data';
import { num, int } from '@/lib/fmt';

export const metadata = { title: 'Dados quebrados — RavenStack | G4 AI Master' };

export default function Dados() {
  const f = findings();
  const flag = f.integridade[0], csat = f.integridade.find((p) => p.problema.toLowerCase().includes('satisfa'));
  const tom = (s) => (s === 'critico' ? 'no' : s === 'alto' ? 'gold' : 'soft');
  const rotulo = { critico: 'Crítico', alto: 'Alto', medio: 'Médio' };
  return (
    <div className="page">
      <Topbar titulo="Dados quebrados" chips={[{ txt: 'A análise que ninguém pediu', tom: 'gold' }, { txt: 'problemas de captura, não de query' }]} />
      <Rise>
        <p className="lead" style={{ maxWidth: 780 }}>Encontrado antes de qualquer insight — e é por isso que o CEO estava sem resposta. Com a instrumentação atual, a RavenStack não consegue dizer quantos clientes perdeu nem por quê.</p>
      </Rise>

      <div className="grid g-3">
        {[
          { Ic: Database, tom: 'no', lab: 'Contas com churn contraditório', v: int(flag.n), sub: 'flag da conta diz uma coisa, eventos dizem outra', cls: 'no' },
          { Ic: Alert, tom: 'no', lab: 'reason_code × feedback', v: `p = ${num(f.teste_motivo.p, 2)}`, sub: 'independentes: o motivo registrado não informa nada', cls: 'no' },
          { Ic: Shield, tom: 'gold', lab: 'Tickets sem nota de CSAT', v: int(csat?.n ?? 0), sub: 'fora da satisfação que o time reporta' },
        ].map((k, i) => (
          <Rise key={k.lab} atraso={i * 60}>
            <div className="card tight kpi">
              <div className="lab"><span>{k.lab}</span><span className={`isq ${k.tom}`} style={{ width: 30, height: 30, borderRadius: 9 }}><k.Ic size={15} /></span></div>
              <div className={`big ${k.cls || ''}`} style={{ fontSize: 30 }}>{k.v}</div>
              <div className="sub">{k.sub}</div>
            </div>
          </Rise>
        ))}
      </div>

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-h" style={{ padding: '16px 18px 0', marginBottom: 12 }}>
            <div className="ttl"><span className="isq no"><Database /></span><div><h3>Auditoria de integridade</h3><span>Cada linha vira uma tarefa para o time de dados</span></div></div>
          </div>
          <div className="tw" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead><tr><th>Problema</th><th className="n">Registros</th><th>Consequência</th><th>Gravidade</th></tr></thead>
              <tbody>
                {f.integridade.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.problema}</td>
                    <td className="n" style={{ fontWeight: 800, color: 'var(--gold-ink)' }}>{int(p.n)}</td>
                    <td style={{ fontSize: 12.5 }}>{p.impacto}</td>
                    <td><span className={`chip ${tom(p.severidade)}`}><i className="dot" />{rotulo[p.severidade] ?? p.severidade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Rise>

      <div className="grid g-2">
        <Rise>
          <div className="card" style={{ background: 'var(--alert-bg)', borderColor: 'var(--alert-line)', boxShadow: 'none' }}>
            <div className="card-h"><div className="ttl"><span className="isq no"><Alert /></span><div><h3>O detalhe mais grave</h3><span>reason_code é ruído</span></div></div></div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              O campo que alimenta toda conversa interna sobre “por que os clientes saem” é <b>estatisticamente independente</b> do que o cliente escreveu no feedback. Saber o código não diz nada sobre a reclamação real. Toda priorização de roadmap feita a partir dele foi feita sobre ruído.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <span className="chip no">χ² = {num(f.teste_motivo.chi2, 2)}</span>
              <span className="chip no">gl = {f.teste_motivo.df}</span>
              <span className="chip no">p = {num(f.teste_motivo.p, 4)}</span>
              <span className="chip no">n = {int(f.teste_motivo.n)}</span>
            </div>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card">
            <div className="card-h"><div className="ttl"><span className="isq ok"><Check /></span><div><h3>O que instrumentar</h3><span>Antes da próxima decisão sobre churn</span></div></div></div>
            <div className="rows">
              {[
                ['Uma definição única de churn', 'Aplicada em todos os sistemas. Hoje a tabela de contas e a de eventos discordam em 62% dos casos.'],
                ['Motivo de saída a partir do texto', 'Classificar o feedback escrito, não uma lista suspensa que o CS preenche sem relação com o caso.'],
                ['Eventos de onboarding', 'Time-to-first-value, setup concluído e primeiro marco de uso — é a lacuna que impede fechar a causa raiz.'],
              ].map(([t, s], i) => (
                <div key={t} className="row-i">
                  <span className="isq ok" style={{ width: 28, height: 28, borderRadius: 8, fontWeight: 800, fontSize: 12 }}>{i + 1}</span>
                  <div className="tx"><b>{t}</b><span>{s}</span></div>
                </div>
              ))}
            </div>
          </div>
        </Rise>
      </div>
    </div>
  );
}
