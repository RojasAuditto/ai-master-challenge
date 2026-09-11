import { Rise } from '@/components/Reveal';
import { CurvaChart, AucChart } from '@/components/Charts';
import { Zap, Clock, Target, Check, Book, Info, Alert } from '@/components/Icons';
import { scores } from '@/lib/data';
import { usd, num, int } from '@/lib/fmt';

export const metadata = { title: 'Como funciona o score — Lead Scorer' };

export default function Metodo() {
  const s = scores();
  const v = s.validacao;
  const idade = v.aucs.find((a) => a.usado);
  return (
    <div className="page">
      <div className="top">
        <div><h1>Como o score funciona</h1><div className="sub">Regras que dá para explicar numa frase, validadas em split temporal. Sem caixa-preta.</div></div>
        <div className="top-r"><span className="tag gold">treino até {s.corte_validacao.split('-').reverse().join('/')}</span><span className="tag">teste: {int(v.teste)} deals fechados depois</span></div>
      </div>

      <Rise>
        <div className="card">
          <div className="card-h"><div className="ttl"><span className="isq gold"><Book /></span><div><h3>Quatro passos, um deal por vez</h3><span>Tudo que aparece na gaveta de um deal vem daqui</span></div></div></div>
          <div className="grid g-4">
            {[
              { Ic: Zap, tom: 'gold', t: '1 · Ticket típico', s: 'Mediana do que o produto fechou quando ganhou. Diz o que está em jogo, não o preço de tabela.' },
              { Ic: Clock, tom: 'blue', t: '2 · P(ganhar | idade)', s: 'Dos deals que chegaram ao dia t ainda abertos, que fração acabou ganha? É a única variável com sinal fora da amostra.' },
              { Ic: Target, tom: 'ok', t: '3 · Janela de ação', s: 'Multiplicador pela fase: Fechar ×1,2 · Acompanhar ×0,9 · Engajar ×0,7 · Decidir ×0,6. É onde a hora do vendedor rende.' },
              { Ic: Check, tom: 'gold', t: '4 · Score 0–100', s: `Posição do valor ponderado entre os ${int(s.base.abertos)} deals abertos. 100 = o deal mais valioso da empresa para trabalhar hoje.` },
            ].map((c) => (
              <div key={c.t} className="card flat tight">
                <span className={`isq ${c.tom}`} style={{ marginBottom: 10 }}><c.Ic /></span>
                <b style={{ fontSize: 13.5 }}>{c.t}</b>
                <p className="hint" style={{ marginTop: 5 }}>{c.s}</p>
              </div>
            ))}
          </div>
        </div>
      </Rise>

      <div className="grid g-32">
        <Rise>
          <div className="card">
            <div className="card-h"><div className="ttl"><span className="isq blue"><Clock /></span><div><h3>Quem chega longe, fecha mais</h3><span>P(ganhar) dado que o deal ainda está aberto no dia t</span></div></div><span className="tag ok">AUC {num(idade.auc, 2)}</span></div>
            <CurvaChart curva={s.curva} cicloMax={s.ciclo_max} />
            <p className="hint" style={{ marginTop: 6 }}>Perdas são rápidas (média {s.ciclo_por_desfecho.find((c) => c.stage === 'Lost').media} dias); vitórias demoram (média {s.ciclo_por_desfecho.find((c) => c.stage === 'Won').media}). Por isso um deal que sobreviveu 90 dias vale mais atenção do que a intuição de "está parado" sugere — até o dia {s.ciclo_max}, o máximo já visto.</p>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card" style={{ height: '100%' }}>
            <div className="card-h"><div className="ttl"><span className="isq gold"><Target /></span><div><h3>Calibração no teste</h3><span>Previsto pelo treino vs. observado depois</span></div></div></div>
            <div className="tw"><table>
              <thead><tr><th>Chegou ao dia</th><th className="n">Previsto</th><th className="n">Observado</th><th className="n">n</th></tr></thead>
              <tbody>{v.calibracao.map((c) => (
                <tr key={c.faixa}><td style={{ color: 'var(--ink)', fontWeight: 600 }}>{c.faixa.split('–')[0]}</td><td className="n">{num(c.previsto * 100, 0)}%</td><td className="n" style={{ fontWeight: 800, color: Math.abs(c.previsto - c.observado) < 0.03 ? 'var(--ok)' : 'var(--gold-soft)' }}>{c.observado != null ? num(c.observado * 100, 0) + '%' : '—'}</td><td className="n" style={{ color: 'var(--ink-3)' }}>{c.n}</td></tr>
              ))}</tbody>
            </table></div>
            <p className="hint" style={{ marginTop: 10 }}>A curva ajustada só com deals fechados até {s.corte_validacao.split('-').reverse().join('/')} continua valendo nos {int(v.teste)} fechados depois. Modesta, mas honesta.</p>
          </div>
        </Rise>
      </div>

      <Rise>
        <div className="card">
          <div className="card-h"><div className="ttl"><span className="isq no"><Alert /></span><div><h3>O que não prevê nada — e por isso ficou de fora</h3><span>AUC no mesmo desfecho, na mesma amostra de teste</span></div></div></div>
          <AucChart itens={v.aucs} />
          <div className="grid g-2" style={{ marginTop: 10 }}>
            <p className="hint">Produto, agente, setor e histórico da conta parecem informativos no treino — o win rate entre agentes vai de 55% a 70% — mas não sustentam a previsão fora da amostra. A diferença cabe no erro amostral. Um modelo que os usasse entregaria um número com cara de precisão e conteúdo de acaso.</p>
            <p className="hint">Por isso o score é <b style={{ color: 'var(--ink)' }}>priorizador de atenção</b>, não preditor de fechamento: combina o que está em jogo com o único sinal que existe (a idade do deal) e com a fase em que uma hora de vendedor rende mais. O vendedor sabe exatamente por que cada deal está onde está.</p>
          </div>
        </div>
      </Rise>

      <Rise>
        <div className="card" id="limites">
          <div className="card-h"><div className="ttl"><span className="isq"><Info /></span><div><h3>O que o score não faz</h3><span>Limites que importam para usar direito</span></div></div></div>
          <div className="rows">
            {[
              ['Não prevê quem ganha', 'Nenhum deal aberto tem probabilidade individual confiável: o melhor AUC é 0,56. O score ordena onde investir tempo, não quem vai fechar.'],
              ['Não conhece o que aconteceu no deal', 'Não há e-mails, reuniões ou propostas nos dados. Um deal "Decidir" pode estar vivo — por isso a ação é confirmar, não encerrar às cegas.'],
              [`Não sabe o que acontece depois do dia ${s.ciclo_max}`, `${int(s.base.por_acao.decidir.n)} deals abertos estão além de qualquer ciclo já observado. Para eles, a probabilidade mostrada é a da última faixa conhecida, e o multiplicador ×0,6 sinaliza a incerteza.`],
              ['Os pesos das janelas são heurísticos', 'Os multiplicadores (1,2 / 0,9 / 0,7 / 0,6) codificam onde a hora do vendedor rende mais; não saem de um ajuste estatístico. Estão em score.mjs, prontos para calibrar quando houver dado de esforço.'],
              ['O dataset é uma fotografia', `Pipeline em ${s.asof.split('-').reverse().join('/')}. Em produção, o score recalcula a cada carga do CRM: node build-db.mjs && node score.mjs.`],
            ].map(([t, d], i) => (
              <div key={t} className="row-i" style={{ alignItems: 'flex-start' }}>
                <span className="isq" style={{ width: 28, height: 28, borderRadius: 8, fontWeight: 800, fontSize: 12 }}>{i + 1}</span>
                <div className="tx"><b>{t}</b><span style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>{d}</span></div>
              </div>
            ))}
          </div>
        </div>
      </Rise>

      <Rise>
        <div className="card" style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.9, color: 'var(--ink-2)' }}>
          <div style={{ color: 'var(--gold-soft)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Reproduzir · só Node 22+</div>
          <div><span style={{ color: 'var(--ink-3)' }}>$</span> cd analysis && node build-db.mjs && node score.mjs</div>
          <div><span style={{ color: 'var(--ink-3)' }}>$</span> cd ../platform && npm install && npm run dev</div>
        </div>
      </Rise>
    </div>
  );
}
