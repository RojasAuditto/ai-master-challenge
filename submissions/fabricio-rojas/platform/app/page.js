import Prova from '@/components/Prova';
import { Rise, Contador } from '@/components/Reveal';
import { Sparkline, CoorteChart, SobrevivenciaChart, HazardChart, PreditorChart, CanalChart } from '@/components/Charts';
import { findings, filaCompleta } from '@/lib/data';
import { usd, usdK, num, pct, int } from '@/lib/fmt';

export default function Page() {
  const f = findings();
  const contas = filaCompleta();
  const c0 = f.coortes[0];
  const cN = f.coortes[f.coortes.length - 1];
  const km = f.sobrevivencia;
  const meio = km.find((k) => k.sobrevivencia <= 50);
  const testes = f.preditores.churn_evento.testes;
  const nTestes = testes.length + f.preditores.churn_flag.testes.length;
  const ult = (a) => a.slice(-14);
  const criticas = contas.filter((c) => c.meses <= 3);
  const arrCriticas = criticas.reduce((s, c) => s + c.arr_em_risco, 0);
  const patamar = km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length;

  return (
    <div className="wrap">

      {/* ─── A RESPOSTA — os 3 minutos do CEO ─────────────────── */}
      <section id="resposta">
        <Rise>
          <div className="eyebrow">Diagnóstico · RavenStack · dados até {f.asof}</div>
          <h1>
            O churn não é um problema de retenção.<br />
            É de <em className="g">onboarding</em> — e piora a cada safra.
          </h1>
          <p className="lead" style={{ maxWidth: 720 }}>
            Metade das contas some antes do <strong>mês {meio?.mes}</strong>. E cada safra nova sai mais
            rápido que a anterior <strong>na mesma idade de conta</strong>: quem entrou em {cN.coorte} perde{' '}
            {pct(cN.m3.pct)} em 90 dias, contra {pct(c0.m3.pct)} de quem entrou em {c0.coorte}.
            A empresa não está perdendo clientes antigos — está falhando em ativar os novos.
          </p>
        </Rise>

        <div className="grid g4c" style={{ marginTop: 26 }}>
          {[
            { k: 'Prêmio anual', v: <Contador para={f.economia.arr_recuperavel} formato="usdK" />, cls: 'gold',
              d: `de ARR recuperável ao voltar à retenção de 90 dias que a empresa já teve em ${c0.coorte}` },
            { k: 'Deterioração', v: <><Contador para={cN.m3.pct / c0.m3.pct} formato="num" />×</>, cls: 'alert',
              d: `mais churn em 90 dias hoje do que em ${c0.coorte}, na mesma idade (p<0,0001)` },
            { k: 'Risco no 1º mês', v: <><Contador para={km[0].hazard} formato="num" />%</>, cls: '',
              d: 'das contas saem já no primeiro mês — o pico de risco de toda a vida do cliente' },
            { k: 'Preditores válidos', v: <>0<span style={{ fontSize: 19, color: 'var(--ink-3)' }}> / {nTestes}</span></>, cls: '',
              d: 'nenhuma variável de uso, suporte ou contrato prevê quem vai sair' },
          ].map((s, i) => (
            <Rise key={s.k} atraso={i * 70}>
              <div className="card stat" style={{ height: '100%' }}>
                <div className="k">{s.k}</div>
                <div className={`v ${s.cls}`}>{s.v}</div>
                <div className="d">{s.d}</div>
              </div>
            </Rise>
          ))}
        </div>

        <Rise atraso={120}>
          <div className="card gold" style={{ marginTop: 12 }}>
            <h3 style={{ color: 'var(--gold-ink)', marginBottom: 12 }}>O que fazer — em ordem de retorno</h3>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.85, color: 'var(--ink)' }}>
              <li><strong>Instrumentar a janela de 90 dias</strong> e achar o que quebrou em 2024 — vale {usdK(f.economia.arr_recuperavel)}/ano.</li>
              <li><strong>Consertar a instrumentação de churn</strong> antes de decidir qualquer coisa com ela — {int(f.integridade[0].n)} contas têm dados contraditórios.</li>
              <li><strong>Cobrir as contas novas por exposição de receita</strong>, não por score de risco — {int(criticas.length)} contas na janela crítica, {usd(arrCriticas)} expostos.</li>
            </ol>
            <p className="note" style={{ margin: '14px 0 0' }}>
              Detalhe de cada frente na seção <a href="#acao" style={{ color: 'var(--gold-ink)', fontWeight: 700 }}>O que fazer</a>.
              A lista de contas está na <a href="/fila" style={{ color: 'var(--gold-ink)', fontWeight: 700 }}>Fila do CS</a>.
            </p>
          </div>
        </Rise>
      </section>

      {/* ─── POR QUE NINGUÉM VIU ──────────────────────────────── */}
      <section id="paradoxo">
        <Rise>
          <div className="eyebrow">Por que ninguém viu</div>
          <h2>Os três times estão certos ao mesmo tempo.</h2>
          <blockquote className="quote">
            “Os números mostram que o churn subiu, mas o time de CS diz que a satisfação está ok.
            O time de produto diz que o uso da plataforma cresceu. Algo não bate.”
            <span className="who">CEO da RavenStack</span>
          </blockquote>
          <p style={{ maxWidth: 720 }}>
            Verifiquei as três afirmações separadamente, em vez de assumir que uma estava errada.
            <strong> Todas se sustentam.</strong> O que não bate é a suposição de que elas deveriam se contradizer.
          </p>
        </Rise>
        <div className="grid g3" style={{ marginTop: 18 }}>
          <Rise><Sparkline dados={ult(f.afirmacoes_ceo.churn)} chave="n" titulo="Churns por mês" destaque /></Rise>
          <Rise atraso={90}><Sparkline dados={ult(f.afirmacoes_ceo.uso)} chave="usos" titulo="Uso do produto" /></Rise>
          <Rise atraso={180}><Sparkline dados={ult(f.afirmacoes_ceo.csat)} chave="csat" titulo="Satisfação (CSAT)" dominio={[1, 5]} casas={2} /></Rise>
        </div>
        <Rise>
          <div className="card plain" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, maxWidth: 780 }}>
              Uso e CSAT agregados são dominados pelas contas que <em className="g">sobreviveram</em> — as safras
              antigas, que de fato usam o produto e estão satisfeitas. As contas novas somem rápido demais para
              mover essas médias: entram, ficam poucas semanas e saem, quase sem rastro nos indicadores agregados.
              O churn, ao contrário, conta todas as saídas. <strong>É a média escondendo a composição.</strong>
            </p>
          </div>
        </Rise>
      </section>

      {/* ─── A CAUSA RAIZ ─────────────────────────────────────── */}
      <section id="causa">
        <Rise>
          <div className="eyebrow">A causa raiz</div>
          <h2>Cada safra sai mais rápido que a anterior — na mesma idade de conta.</h2>
          <p style={{ maxWidth: 720 }}>
            Este é o gráfico que resolve o caso. Ele compara safras <strong>na mesma idade</strong>, não no mesmo
            mês do calendário. Sem esse controle, a curva de churn subindo poderia ser apenas a base envelhecendo.
            Com ele, sobra uma conclusão: a experiência de entrada piorou de forma contínua ao longo de 2024.
          </p>
        </Rise>
        <Rise>
          <div className="card" style={{ padding: '20px 18px 12px' }}>
            <CoorteChart coortes={f.coortes} />
          </div>
        </Rise>

        <div className="grid g3" style={{ marginTop: 12 }}>
          {[
            { k: 'Teste de permutação', v: 'p < 0,0001',
              d: `χ²=${num(f.teste_coorte.chi2, 2)} em ${int(f.teste_coorte.n)} contas com 90 dias completos. Em 20.000 embaralhamentos, nenhum produziu diferença tão grande.` },
            { k: 'Composição da base', v: 'estável',
              d: 'O mix de canal, plano e porte quase não mudou entre as safras. Não é o caso de estar vendendo para outro tipo de cliente.' },
            { k: 'Canais afetados', v: '5 de 5',
              d: 'A piora aparece dentro de cada canal separadamente. Não é um canal ruim contaminando o total.' },
          ].map((s, i) => (
            <Rise key={s.k} atraso={i * 80}>
              <div className="card stat" style={{ height: '100%' }}>
                <div className="k">{s.k}</div>
                <div className="v" style={{ fontSize: 26 }}>{s.v}</div>
                <div className="d">{s.d}</div>
              </div>
            </Rise>
          ))}
        </div>

        <Rise>
          <div className="card" style={{ marginTop: 12, padding: '20px 18px 12px' }}>
            <h3>A piora é transversal a todos os canais</h3>
            <p className="note" style={{ marginBottom: 4 }}>
              Se um canal ruim estivesse puxando o número, as outras linhas ficariam planas. Nenhuma fica.
            </p>
            <CanalChart dados={f.coorte_por_canal} coortes={f.coortes} />
          </div>
        </Rise>
      </section>

      {/* ─── A PROVA — sob demanda ────────────────────────────── */}
      <section id="prova">
        <Rise>
          <div className="eyebrow">A prova</div>
          <h2>Cinco blocos para quem quiser verificar.</h2>
          <p style={{ maxWidth: 720 }}>
            A afirmação de cada bloco está na linha visível. O teste que a sustenta abre ao clicar.
            Se você é o CEO, pode pular — a decisão não muda. Se é quem vai defender o número numa reunião, abra tudo.
          </p>
        </Rise>

        <Rise>
          <Prova n="01" titulo="Quatro explicações plausíveis que os dados não sustentam"
            resumo="Churn silencioso, viés de CSAT, canal ruim e segmento concentrador — todas rejeitadas por teste">
            <p className="note" style={{ marginTop: 12 }}>
              Três delas são o que uma análise apressada teria entregado como conclusão. A diferença entre um
              diagnóstico e um chute é justamente o que foi descartado.
            </p>
            <div className="stack">
              {f.rejeitadas.map((r, i) => (
                <div key={i} className="card plain" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
                  <div>
                    <h3>{r.hipotese}</h3>
                    <p className="note" style={{ margin: '0 0 6px' }}><span className="mono">{r.teste}</span></p>
                    <p style={{ margin: 0, fontSize: 13 }}>{r.detalhe}</p>
                  </div>
                  <span className="tag no">{r.veredito}</span>
                </div>
              ))}
            </div>
          </Prova>

          <Prova n="02" titulo="Nenhuma variável prevê qual conta específica vai churnar"
            resumo={`${nTestes} testes de permutação sobre 18 variáveis × 2 definições de churn — zero significativos`}>
            <p style={{ marginTop: 12, maxWidth: 760 }}>
              Volume de uso, erros, tempo de resposta, CSAT, escalações, downgrades, contrato: nada separa quem
              fica de quem sai. Os maiores efeitos ficaram em |d| &lt; 0,17, que é ruído.
            </p>
            <div className="card plain" style={{ padding: '18px 14px 10px' }}>
              <PreditorChart testes={testes} />
            </div>
            <div className="card gold" style={{ marginTop: 12 }}>
              <h3 style={{ color: 'var(--gold-ink)' }}>Este resultado negativo é o achado mais valioso</h3>
              <p style={{ margin: 0, maxWidth: 780 }}>
                É o que determina a estratégia. Se houvesse sinal individual, a resposta certa seria um modelo de
                risco e um playbook de salvamento conta a conta. Como não há — e a deterioração por safra é enorme
                e altamente significativa — a causa não é específica de cliente nenhum: é{' '}
                <strong>sistêmica e mudou ao longo do tempo</strong>. Não se conserta isso ligando para contas em
                risco; conserta-se consertando a entrada.
              </p>
              <p className="note" style={{ margin: '12px 0 0' }}>
                Um modelo preditivo treinado nesses dados teria performance de moeda ao ar. Não construí um, e isso
                foi decisão, não limitação de tempo.
              </p>
            </div>
          </Prova>

          <Prova n="03" titulo="O risco está concentrado nos primeiros 90 dias"
            resumo={`Metade da base sai até o mês ${meio?.mes}; o risco cai de ${pct(km[0].hazard)} para ~${pct(patamar)} ao mês`}>
            <p style={{ marginTop: 12, maxWidth: 760 }}>
              Não é um vazamento constante: é uma queda brusca logo na entrada. Depois do quinto mês, quem ficou
              tende a ficar. É por isso que o problema é de ativação, não de fidelidade.
            </p>
            <div className="card plain" style={{ padding: '18px 14px 10px', marginBottom: 12 }}>
              <SobrevivenciaChart km={km} />
            </div>
            <div className="card plain" style={{ padding: '18px 14px 10px' }}>
              <HazardChart km={km} />
            </div>
          </Prova>

          <Prova n="04" titulo="A instrumentação de churn está quebrada"
            resumo={`${int(f.integridade[0].n)} contas com dados contraditórios; o motivo de saída não tem relação com o feedback do cliente`}>
            <p style={{ marginTop: 12, maxWidth: 760 }}>
              Encontrei isso antes de qualquer insight, e é o motivo pelo qual o CEO ficou sem resposta até agora.
              São problemas de captura de dado — nenhum se resolve com uma query melhor.
            </p>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr><th>Problema encontrado</th><th className="num">Registros</th><th>Consequência prática</th><th>Gravidade</th></tr>
                </thead>
                <tbody>
                  {f.integridade.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.problema}</td>
                      <td className="num" style={{ fontWeight: 800, color: 'var(--gold-ink)' }}>{int(p.n)}</td>
                      <td style={{ fontSize: 12.5 }}>{p.impacto}</td>
                      <td><span className={`tag ${p.severidade === 'critico' ? 'no' : p.severidade === 'alto' ? 'gold' : 'flat'}`}>{p.severidade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card alert" style={{ marginTop: 12 }}>
              <h3 style={{ color: 'var(--alert)' }}>O detalhe mais grave</h3>
              <p style={{ margin: 0, maxWidth: 780 }}>
                O campo <span className="mono">reason_code</span> — a fonte de toda conversa interna sobre “por que
                os clientes saem” — é <strong>estatisticamente independente</strong> do que o cliente escreveu no
                feedback (χ²={num(f.teste_motivo.chi2, 2)}, {f.teste_motivo.df} graus de liberdade,
                p={num(f.teste_motivo.p, 4)}, n={int(f.teste_motivo.n)}). Saber o código de motivo não diz nada
                sobre a reclamação real. Toda priorização de roadmap feita a partir dele foi feita sobre ruído.
              </p>
            </div>
          </Prova>

          <Prova n="05" titulo="Como reproduzir cada número desta página"
            resumo="Dois comandos, zero dependências na análise, resultados idênticos byte a byte">
            <div className="grid g2" style={{ marginTop: 12 }}>
              <div className="card plain">
                <h3>Pipeline</h3>
                <p style={{ fontSize: 13, margin: 0 }}>
                  5 CSVs ({int(f.base.linhas_analisadas)} linhas) → <span className="mono">build-db.mjs</span> →
                  SQLite → <span className="mono">findings.mjs</span> → <span className="mono">findings.json</span> →
                  este app. A análise não tem dependência nenhuma: só <span className="mono">node:sqlite</span>,
                  que é biblioteca padrão.
                </p>
              </div>
              <div className="card plain">
                <h3>Testes estatísticos</h3>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Todos por permutação, 20.000 reamostragens, sem premissa de distribuição, com PRNG semeado —
                  duas execuções dão saída idêntica. O módulo <span className="mono">stats.mjs</span> tem um
                  self-check que falha se um rótulo aleatório for declarado significativo.
                </p>
              </div>
              <div className="card plain">
                <h3>Tratamento de censura</h3>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Nas tabelas de safra, o denominador só inclui contas com o horizonte inteiro observado. Sem isso,
                  a safra {cN.coorte} apareceria com churn acima de 100% — foi exatamente o erro que cometi na
                  primeira versão, registrado no log de processo.
                </p>
              </div>
              <div className="card plain">
                <h3>Limitações</h3>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Os dados não têm eventos de onboarding, então a causa exata da deterioração é inferida por
                  eliminação, não observada. A janela encerra em {f.asof}, o que deixa o último mês parcialmente
                  censurado.
                </p>
              </div>
            </div>
          </Prova>
        </Rise>
      </section>

      {/* ─── O QUE FAZER ──────────────────────────────────────── */}
      <section id="acao">
        <Rise>
          <div className="eyebrow">O que fazer</div>
          <h2>Três frentes, em ordem de retorno.</h2>
        </Rise>
        <div className="stack">
          <Rise>
            <Acao n="1" prazo="Semana 1" tom="gold" valor={`${usdK(f.economia.arr_recuperavel)} / ano`}
              titulo="Instrumentar a janela de 90 dias e achar o que quebrou em 2024"
              corpo={`A deterioração é contínua ao longo de 2024, transversal a todos os canais e concentrada na entrada. Isso aponta para uma mudança no produto, no fluxo de ativação ou na promessa de venda. Os dados atuais não registram eventos de onboarding, então a causa exata não é observável — e essa é a primeira lacuna a fechar. Instrumente time-to-first-value, conclusão de setup e primeiro marco de uso, e compare as safras de 2023 com as de 2024 em cada etapa.`}
              metrica={`Meta: levar o churn de 90 dias de ${pct(cN.m3.pct)} para os ${pct(c0.m3.pct)} que a empresa já entregou em ${c0.coorte}. São ${num(f.economia.contas_salvas_mes)} contas por mês, a ${usd(f.economia.mrr_medio_conta)} de MRR médio.`} />
          </Rise>
          <Rise atraso={80}>
            <Acao n="2" prazo="Semana 1-2" tom="alert" valor="Bloqueia decisões erradas"
              titulo="Consertar a instrumentação antes de tomar qualquer decisão baseada nela"
              corpo={`${int(f.integridade[0].n)} contas têm a flag de churn contradizendo os eventos registrados, e o campo de motivo de saída não tem relação estatística nenhuma com o que o cliente escreveu (p=${num(f.teste_motivo.p, 4)}). Na prática, a RavenStack não sabe quantos clientes perdeu nem por quê. Qualquer dashboard construído sobre esses campos está errado, e priorizações feitas a partir deles são aleatórias.`}
              metrica="Meta: uma definição única de churn aplicada em todos os sistemas, e motivo de saída preenchido a partir do texto do cliente — não de uma lista suspensa." />
          </Rise>
          <Rise atraso={160}>
            <Acao n="3" prazo="Contínuo" tom="flat" valor={`${usd(arrCriticas)} expostos hoje`}
              titulo="Cobrir as contas novas por exposição de receita, não por score de risco"
              corpo={`Como nenhuma variável prevê churn individual, não existe base para ranquear contas por probabilidade de saída. O que é defensável é ranquear por exposição: quanto de receita está numa fase de risco conhecido. Hoje há ${int(criticas.length)} contas ativas dentro da janela de 90 dias.`}
              metrica={`Meta: cobertura de 100% das contas novas nos primeiros 90 dias. A concentração de receita torna isso barato — o decil superior da base responde por ${pct(f.base.concentracao_top10_pct)} do MRR.`}
              link="/fila" linkTxt="Abrir a fila de contas →" />
          </Rise>
          <Rise atraso={220}>
            <div className="card plain">
              <h3>O que eu não recomendo, e por quê</h3>
              <p style={{ margin: 0, maxWidth: 790, fontSize: 13.5 }}>
                <strong>Modelo preditivo de churn:</strong> não há sinal para treinar. Entregaria um número com
                aparência de precisão e conteúdo de acaso. <strong>Campanha por segmento:</strong> nenhuma dimensão
                demográfica é significativa — mirar “DevTools” ou “clientes de evento” seria perseguir ruído
                amostral. <strong>Programa de satisfação:</strong> o CSAT é estável, tem a mesma taxa de resposta
                entre quem fica e quem sai, e não prevê churn. O problema não está aí.
              </p>
            </div>
          </Rise>
        </div>

        <p className="note" style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          Fabrício Rojas · G4 AI Master Challenge · Challenge 001 · dados até {f.asof} ·
          dataset RavenStack (River @ Rivalytics, licença MIT)
        </p>
      </section>
    </div>
  );
}

function Acao({ n, prazo, titulo, valor, corpo, metrica, tom, link, linkTxt }) {
  const cor = tom === 'gold' ? 'var(--gold)' : tom === 'alert' ? 'var(--alert)' : 'var(--ink)';
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 11 }}>
        <div className="row" style={{ gap: 10 }}>
          <span style={{
            width: 25, height: 25, borderRadius: 8, display: 'grid', placeItems: 'center',
            background: cor, color: '#fff', fontWeight: 800, fontSize: 12,
          }}>{n}</span>
          <span className="tag flat">{prazo}</span>
        </div>
        <span className="tag gold">{valor}</span>
      </div>
      <h3 style={{ fontSize: 16 }}>{titulo}</h3>
      <p style={{ fontSize: 13.5, marginBottom: 11 }}>{corpo}</p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', borderLeft: '2px solid var(--line)', paddingLeft: 12 }}>
        {metrica}
      </p>
      {link && (
        <a href={link} style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--gold-ink)' }}>
          {linkTxt}
        </a>
      )}
    </div>
  );
}
