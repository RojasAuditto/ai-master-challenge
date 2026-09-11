'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { usd, num, int } from '@/lib/fmt';
import { ORDEM } from '@/lib/explain';
import { Curva, Auc, CORES_FILA } from '@/components/charts/Charts';
import { Check, ArrowR } from '@/components/ui/Icons';

const PASSOS = [
  { k: 'ticket', t: 'Ticket típico' }, { k: 'prob', t: 'Probabilidade' }, { k: 'janela', t: 'Janela de ação' }, { k: 'score', t: 'Score' },
];

/** Stepper Untitled UI: cada passo do score explicado, com o card "Summary" da validação ao lado. */
export default function Steps({ validacao: v, curva, cicloMax, janelas, base, tickets, ciclo, corte }) {
  const [i, setI] = useState(0);
  const refs = useRef([]);
  const [ind, setInd] = useState(null);
  useLayoutEffect(() => {
    const medir = () => { const el = refs.current[i]; if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth - 18 }); };
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, [i]);
  const idade = v.aucs.find((a) => a.usado), melhorQuem = v.aucs.filter((a) => !a.usado).sort((a, b) => Math.abs(b.auc - 0.5) - Math.abs(a.auc - 0.5))[0];
  const cal = v.calibracao.every((c) => c.observado == null || Math.abs(c.previsto - c.observado) <= 0.03);
  const ticketsOrd = Object.entries(tickets).sort((a, b) => b[1].ticket - a[1].ticket);

  return (
    <div className="two">
      <section className="card" style={{ padding: 24 }}>
        <div className="steps">
          {PASSOS.map((p, k) => (
            <button key={p.k} ref={(el) => { refs.current[k] = el; }} className="step" data-on={k === i} data-done={k < i} onClick={() => setI(k)}>
              <span className="num">{k < i ? <Check size={12} /> : k + 1}</span>{p.t}
            </button>
          ))}
          {ind && <span className="ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden="true" />}
        </div>

        <div key={i} style={{ paddingTop: 22, animation: 'fadeUp .32s var(--ease)' }}>
          {i === 0 && (<>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>O que está em jogo</h2>
            <p className="lead" style={{ marginTop: 8, maxWidth: 62 + 'ch' }}>O ticket é a <b style={{ color: 'var(--t1)' }}>mediana do que o produto fechou quando ganhou</b>, não o preço de tabela. Diz quanto entra se o deal fechar. "GTXPro" e "GTX Pro" eram o mesmo produto com dois nomes; sem juntar, 1.480 deals ficariam sem ticket.</p>
            <div className="tbl-wrap" style={{ marginTop: 18 }}><table>
              <thead><tr><th>Produto</th><th className="n">Ganhos</th><th className="n">Ticket típico</th><th className="n">Catálogo</th></tr></thead>
              <tbody>{ticketsOrd.map(([p, t], k) => <tr key={p} className="row" style={{ '--i': k, cursor: 'default' }}><td style={{ color: 'var(--t1)', fontWeight: 500 }}>{p}</td><td className="n">{int(t.n_won)}</td><td className="n" style={{ color: 'var(--t1)', fontWeight: 600 }}>{usd(t.ticket)}</td><td className="n">{t.catalogo != null ? usd(t.catalogo) : '—'}</td></tr>)}</tbody>
            </table></div>
          </>)}
          {i === 1 && (<>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>Quem chega longe, fecha mais</h2>
            <p className="lead" style={{ marginTop: 8, maxWidth: '62ch' }}>Dos deals que chegaram ao dia <i>t</i> ainda abertos, que fração acabou ganha? Perdas são rápidas (média {ciclo.find((c) => c.stage === 'Lost').media} dias); vitórias demoram ({ciclo.find((c) => c.stage === 'Won').media}). É a <b style={{ color: 'var(--t1)' }}>única variável com sinal fora da amostra</b> — e inverte a intuição de que "deal parado é deal ruim", até o dia {cicloMax}.</p>
            <div style={{ marginTop: 14 }}><Curva curva={curva} cicloMax={cicloMax} imediato /></div>
            <div className="tbl-wrap" style={{ marginTop: 10 }}><table>
              <thead><tr><th>Chegou ao dia</th><th className="n">Previsto (treino)</th><th className="n">Observado (teste)</th><th className="n">n</th></tr></thead>
              <tbody>{v.calibracao.map((c, k) => <tr key={c.faixa} className="row" style={{ '--i': k, cursor: 'default' }}><td style={{ color: 'var(--t1)', fontWeight: 500 }}>{c.faixa.split('–')[0]}</td><td className="n">{num(c.previsto * 100, 0)}%</td><td className="n"><span className={`pill ${Math.abs(c.previsto - c.observado) <= 0.03 ? 'green' : 'amber'}`}>{c.observado != null ? num(c.observado * 100, 0) + '%' : '—'}</span></td><td className="n">{c.n}</td></tr>)}</tbody>
            </table></div>
          </>)}
          {i === 2 && (<>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>Onde a hora do vendedor rende</h2>
            <p className="lead" style={{ marginTop: 8, maxWidth: '62ch' }}>Cada deal cai numa fila pela fase do ciclo. O multiplicador codifica onde uma hora de vendedor muda mais o resultado. São <b style={{ color: 'var(--t1)' }}>heurísticas declaradas</b>, não saem de ajuste estatístico — estão em <span className="mono">score.mjs</span>.</p>
            <div className="grid g2" style={{ marginTop: 18 }}>
              {ORDEM.map((k) => (
                <div key={k} className="card" style={{ background: 'var(--card-2)' }}>
                  <div className="card-h"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: CORES_FILA[k], display: 'inline-block' }} />{janelas[k].rotulo}</span><span className="pill accent">× {num(janelas[k].mult, 1)}</span></div>
                  <p className="hint" style={{ marginTop: 8 }}>{janelas[k].desc}.</p>
                </div>
              ))}
            </div>
          </>)}
          {i === 3 && (<>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>Score = posição entre os abertos</h2>
            <p className="lead" style={{ marginTop: 8, maxWidth: '62ch' }}>Ticket × P(ganhar | idade) × janela dá um valor ponderado. O score é a posição desse valor entre todos os deals abertos da empresa: <b style={{ color: 'var(--t1)' }}>100 é o deal mais valioso para trabalhar hoje</b>. E o que ficou de fora — porque não prevê nada:</p>
            <div style={{ marginTop: 14 }}><Auc itens={v.aucs} /></div>
            <p className="hint" style={{ marginTop: 6 }}>Agente, produto, setor e histórico da conta parecem informativos no treino (win rate de 55% a 70% entre vendedores) mas não sustentam a previsão um mês depois. Um modelo com eles teria cara de precisão e conteúdo de acaso.</p>
          </>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <button className="btn" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>Anterior</button>
          {i < 3 ? <button className="btn white" onClick={() => setI((k) => k + 1)}>Próximo passo <ArrowR size={16} /></button> : <a className="btn white" href="#limites">Ver os limites <ArrowR size={16} /></a>}
        </div>
      </section>

      <aside className="side">
        <div className="card summary">
          <div className="card-h"><h3>Validação</h3><span className="pill line">split temporal</span></div>
          <div className="field" style={{ marginTop: 14 }}><span>Treino até {corte.split('-').reverse().join('/')}</span><span className="ok"><Check size={16} /></span></div>
          <div style={{ marginTop: 10 }}>
            <div className="li"><span>Deals no treino</span><b>{int(v.treino)}</b></div>
            <div className="li"><span>Deals no teste</span><b>{int(v.teste)}</b></div>
            <div className="li"><span>Win rate base</span><b>{num(base * 100)}%</b></div>
            <div className="li"><span>AUC · idade do deal</span><b><span className="pill accent">{num(idade.auc, 2)}</span></b></div>
            <div className="li"><span>AUC · melhor "quem"</span><b><span className="pill line">{num(melhorQuem.auc, 2)}</span></b></div>
            <div className="li"><span>Calibração (≤ 3 pp)</span><b>{cal ? <span className="pill green">ok</span> : <span className="pill amber">ver</span>}</b></div>
          </div>
          <div className="due"><span>Confiança</span><b>modesta, honesta</b></div>
          <a className="btn" href="#limites" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>Continuar para os limites</a>
        </div>
      </aside>
    </div>
  );
}
