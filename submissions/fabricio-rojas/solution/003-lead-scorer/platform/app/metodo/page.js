import Steps from '@/components/metodo/Steps';
import { Rise } from '@/components/ui/Reveal';
import { scores } from '@/lib/data';
import { int } from '@/lib/fmt';

export const metadata = { title: 'Como funciona — Lead Scorer' };

export default function Metodo() {
  const s = scores();
  const exemplo = s.deals.find((d) => d.acao === 'fechar' && d.account);
  return (
    <div className="page">
      <header className="ph">
        <div><h1>Como o score funciona</h1><p className="ph-sub">Quatro passos que dá para explicar numa frase, validados em split temporal: treino com deals fechados até <b>{s.corte_validacao.split('-').reverse().join('/')}</b>, teste nos <b>{int(s.validacao.teste)}</b> fechados depois. Sem caixa-preta.</p></div>
      </header>

      <Steps validacao={s.validacao} curva={s.curva} cicloMax={s.ciclo_max} janelas={s.janelas} base={s.base.base_win} tickets={s.ticket} ciclo={s.ciclo_por_desfecho} corte={s.corte_validacao} />

      <Rise>
        <div className="card" id="limites" style={{ padding: 24 }}>
          <div className="card-h"><div><h3>O que o score não faz</h3><span className="sub">Limites que importam para usar direito</span></div></div>
          <div className="tl" style={{ marginTop: 10 }}>
            {[
              ['Não prevê quem ganha', 'Nenhum deal aberto tem probabilidade individual confiável: o melhor AUC é 0,56. O score ordena onde investir tempo, não quem vai fechar.'],
              ['Não conhece o que aconteceu no deal', 'Não há e-mails, reuniões ou propostas nos dados. Um deal em "Decidir" pode estar vivo — por isso a ação é confirmar, não encerrar às cegas.'],
              [`Não sabe o que acontece depois do dia ${s.ciclo_max}`, `${int(s.base.por_acao.decidir.n)} deals abertos estão além de qualquer ciclo já observado. Para eles a probabilidade mostrada é a da última faixa conhecida, e o multiplicador ×0,6 sinaliza a incerteza.`],
              ['Os pesos das janelas são heurísticos', 'Os multiplicadores (1,2 / 0,9 / 0,7 / 0,6) codificam onde a hora rende mais; não saem de ajuste estatístico. Estão em score.mjs, prontos para calibrar quando houver dado de esforço.'],
              ['O dataset é uma fotografia', `Pipeline em ${s.asof.split('-').reverse().join('/')}. Em produção, o score recalcula a cada carga do CRM.`],
            ].map(([t, d], i) => <div key={t} className="tl-i"><span className="tl-ic">{i + 1}</span><span className="tl-tx"><b>{t}</b><span>{d}</span></span></div>)}
          </div>
        </div>
      </Rise>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <Rise>
          <div className="card" id="api" style={{ padding: 24 }}>
            <div className="card-h"><div><h3>API do score</h3><span className="sub">O mesmo score e a mesma explicação, para o CRM ou um bot</span></div><span className="pill accent">GET</span></div>
            <pre className="code" style={{ marginTop: 14 }}><span className="c"># qualquer deal aberto</span>{'\n'}<span className="k">GET</span> /api/score/{exemplo?.id ?? 'ID'}{'\n\n'}<span className="c"># resposta (resumida)</span>{'\n'}{'{'}{'\n'}  <span className="s">"id"</span>: <span className="s">"{exemplo?.id}"</span>, <span className="s">"account"</span>: <span className="s">"{exemplo?.account}"</span>,{'\n'}  <span className="s">"score"</span>: {exemplo?.score}, <span className="s">"p"</span>: {exemplo?.p}, <span className="s">"ev"</span>: {exemplo?.ev},{'\n'}  <span className="s">"acao"</span>: <span className="s">"{exemplo?.acao}"</span>,{'\n'}  <span className="s">"explicacao"</span>: {'{'} <span className="s">"passos"</span>: [ … 4 passos … ], <span className="s">"acao"</span>: <span className="s">"Está no dia …"</span> {'}'}{'\n'}{'}'}</pre>
            <p className="hint" style={{ marginTop: 10 }}>Explicação e ação vêm da mesma função que a interface usa (<span className="mono">lib/explain.js</span>). Um bot de Slack que mande as prioridades da segunda-feira é uma chamada por vendedor.</p>
            <a className="btn sm" href={`/api/score/${exemplo?.id}`} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>Abrir a resposta real</a>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card" style={{ padding: 24 }}>
            <div className="card-h"><div><h3>Reproduzir</h3><span className="sub">Só Node 22+. Nada de pip, venv ou lockfile de análise</span></div></div>
            <pre className="code" style={{ marginTop: 14 }}><span className="c">$</span> cd analysis && node build-db.mjs && node score.mjs{'\n'}<span className="c">$</span> cd ../platform && npm install && npm run dev</pre>
            <p className="hint" style={{ marginTop: 10 }}>build-db.mjs carrega os 4 CSVs no SQLite (node:sqlite, biblioteca padrão). score.mjs normaliza, valida em split temporal, ajusta a curva e emite scores.json — a única fonte do app.</p>
          </div>
        </Rise>
      </div>
    </div>
  );
}
