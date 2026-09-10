import Sidebar from '@/components/Sidebar';
import Fila from '@/components/Fila';
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
  const nTestes = f.preditores.churn_evento.testes.length + f.preditores.churn_flag.testes.length;
  const ult12 = (arr) => arr.slice(-14);
  const criticas = contas.filter((c) => c.meses <= 3);

  return (
    <div className="shell">
      <Sidebar asof={f.asof} linhas={f.base.linhas_analisadas} />

      <main className="main">
        <div className="wrap">

          {/* ─── 01 ─────────────────────────────────────────────── */}
          <section id="diagnostico">
            <div className="eyebrow">Diagnóstico · RavenStack</div>
            <h1>
              O churn da RavenStack não é<br />um problema de retenção.<br />
              <em className="g">É um problema de onboarding.</em>
            </h1>
            <p className="lead" style={{ maxWidth: 700 }}>
              Metade das contas que a RavenStack assina desaparece antes do <strong>mês {meio?.mes}</strong>.
              E cada safra nova sai mais rápido que a anterior: as contas que entraram em {cN.coorte} perdem{' '}
              <strong>{pct(cN.m3.pct)} em 90 dias</strong>, contra {pct(c0.m3.pct)} das que entraram em {c0.coorte}.
              A empresa não está perdendo clientes antigos — está falhando em ativar os novos,
              e o problema piora a cada trimestre.
            </p>
            <p style={{ maxWidth: 700 }}>
              Ninguém viu isso porque todo mundo olha para a média. No agregado, o uso do produto está estável
              e a satisfação está boa — as duas coisas são verdade. O colapso está inteiramente na estrutura de safras,
              e a média o esconde.
            </p>

            <div className="grid g4c" style={{ marginTop: 30 }}>
              <div className="card gold stat">
                <div className="k">Prêmio anual</div>
                <div className="v gold">{usdK(f.economia.arr_recuperavel)}</div>
                <div className="d">de ARR recuperável ao voltar à retenção de 90 dias que a empresa já teve em {c0.coorte}</div>
              </div>
              <div className="card stat">
                <div className="k">Deterioração</div>
                <div className="v alert">{num(cN.m3.pct / c0.m3.pct)}×</div>
                <div className="d">mais churn em 90 dias hoje do que em {c0.coorte}, na mesma idade de conta (p&lt;0,0001)</div>
              </div>
              <div className="card stat">
                <div className="k">Risco no 1º mês</div>
                <div className="v">{pct(km[0].hazard)}</div>
                <div className="d">das contas saem já no primeiro mês — o maior risco de toda a vida do cliente</div>
              </div>
              <div className="card stat">
                <div className="k">Preditores válidos</div>
                <div className="v">0<span style={{ fontSize: 20, color: '#6b8494' }}> / {nTestes}</span></div>
                <div className="d">nenhuma variável de uso, suporte ou contrato prevê quem vai sair</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 14, borderColor: 'rgba(185,145,91,0.3)' }}>
              <h3 style={{ color: '#d4b183' }}>A recomendação em uma frase</h3>
              <p style={{ margin: 0 }}>
                Pare de investir em playbooks de salvamento de contas em risco — os dados provam que não há
                como identificar quem vai sair. Concentre tudo nos <strong>primeiros 90 dias</strong>, que é onde
                o risco está e onde a deterioração aconteceu, e conserte a instrumentação de churn,
                que hoje reporta números contraditórios.
              </p>
            </div>
          </section>

          {/* ─── 02 ─────────────────────────────────────────────── */}
          <section id="paradoxo">
            <div className="eyebrow">02 · O paradoxo</div>
            <h2>Os três times estão certos. E é exatamente por isso que ninguém achou o problema.</h2>
            <blockquote className="quote">
              “Os números mostram que o churn subiu, mas o time de CS diz que a satisfação está ok.
              O time de produto diz que o uso da plataforma cresceu. Algo não bate.”
              <span className="who">CEO da RavenStack</span>
            </blockquote>
            <p style={{ maxWidth: 720 }}>
              Verifiquei as três afirmações separadamente. Todas se sustentam nos dados.
              O que não bate não é nenhum dos fatos — é a suposição de que eles deveriam se contradizer.
            </p>

            <div className="grid g3" style={{ marginTop: 22 }}>
              <Sparkline dados={ult12(f.afirmacoes_ceo.churn)} chave="n" titulo="Churns por mês" destaque />
              <Sparkline dados={ult12(f.afirmacoes_ceo.uso)} chave="usos" titulo="Uso do produto" />
              <Sparkline dados={ult12(f.afirmacoes_ceo.csat)} chave="csat" titulo="Satisfação (CSAT)" dominio={[1, 5]} />
            </div>

            <div className="card" style={{ marginTop: 18 }}>
              <h3>Por que os três podem ser verdade ao mesmo tempo</h3>
              <p style={{ margin: 0, maxWidth: 760 }}>
                O uso agregado e o CSAT são dominados pelas contas que <em className="g">sobreviveram</em> —
                as safras antigas, que de fato usam o produto e estão satisfeitas. As contas novas somem
                rápido demais para mover essas médias: entram, ficam poucas semanas e saem, deixando quase
                nenhum rastro nos indicadores agregados. O churn, por outro lado, conta todas as saídas.
                É a média escondendo a composição.
              </p>
            </div>
          </section>

          {/* ─── 03 ─────────────────────────────────────────────── */}
          <section id="causa">
            <div className="eyebrow">03 · A causa raiz</div>
            <h2>Cada safra sai mais rápido que a anterior — na mesma idade de conta.</h2>
            <p style={{ maxWidth: 720 }}>
              Este é o gráfico que resolve o caso. Ele compara safras <strong>na mesma idade</strong>,
              não no mesmo mês do calendário. Sem esse controle, a curva de churn subindo poderia ser só a
              base envelhecendo. Com ele, sobra uma conclusão: a experiência de entrada piorou de forma
              contínua ao longo de 2024.
            </p>

            <div className="card" style={{ padding: '24px 20px 14px' }}>
              <CoorteChart coortes={f.coortes} />
            </div>

            <div className="grid g3" style={{ marginTop: 14 }}>
              <div className="card stat">
                <div className="k">Teste de permutação</div>
                <div className="v" style={{ fontSize: 30 }}>p &lt; 0,0001</div>
                <div className="d">χ²={num(f.teste_coorte.chi2, 2)} em {int(f.teste_coorte.n)} contas com 90 dias completos de observação. Em 20.000 embaralhamentos, nenhum produziu diferença tão grande.</div>
              </div>
              <div className="card stat">
                <div className="k">Composição da base</div>
                <div className="v" style={{ fontSize: 30 }}>estável</div>
                <div className="d">O mix de canal, plano e porte praticamente não mudou entre as safras. A piora não vem de estar vendendo para outro tipo de cliente.</div>
              </div>
              <div className="card stat">
                <div className="k">Canais afetados</div>
                <div className="v" style={{ fontSize: 30 }}>5 de 5</div>
                <div className="d">A deterioração aparece dentro de cada canal separadamente. Não é um canal ruim contaminando o total.</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 14, padding: '22px 20px 12px' }}>
              <h3>A piora é transversal a todos os canais</h3>
              <p className="note" style={{ marginBottom: 6 }}>
                Se um canal ruim estivesse puxando o número, as outras linhas ficariam planas. Nenhuma fica.
              </p>
              <CanalChart dados={f.coorte_por_canal} coortes={f.coortes} />
            </div>

            <hr className="rule" />

            <h3 style={{ fontSize: 19, fontFamily: 'var(--serif)', fontWeight: 400 }}>
              O risco está concentrado nos primeiros 90 dias
            </h3>
            <p style={{ maxWidth: 720 }}>
              A curva de sobrevivência mostra onde a empresa perde dinheiro: não é um vazamento constante,
              é uma queda brusca logo na entrada. Depois do quinto mês, quem ficou tende a ficar.
            </p>
            <div className="card" style={{ padding: '22px 20px 12px', marginBottom: 14 }}>
              <SobrevivenciaChart km={km} />
            </div>
            <div className="card" style={{ padding: '22px 20px 12px' }}>
              <h3>Risco mensal por idade da conta</h3>
              <p className="note" style={{ marginBottom: 8 }}>
                {pct(km[0].hazard)} no primeiro mês contra um patamar de ~{pct(km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length)}{' '}
                depois. É um problema de ativação, não de fidelidade.
              </p>
              <HazardChart km={km} />
            </div>
          </section>

          {/* ─── 04 ─────────────────────────────────────────────── */}
          <section id="descartado">
            <div className="eyebrow">04 · O que descartei</div>
            <h2>Quatro explicações plausíveis que os dados não sustentam.</h2>
            <p style={{ maxWidth: 720 }}>
              Todas as quatro são histórias convincentes, e três delas são o que uma análise apressada
              teria entregado como conclusão. Testei cada uma e nenhuma se sustenta. Registro aqui porque
              a diferença entre um diagnóstico e um chute é justamente o que foi descartado.
            </p>
            <div className="stack">
              {f.rejeitadas.map((r, i) => (
                <div key={i} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    <h3>{r.hipotese}</h3>
                    <p className="note" style={{ margin: '0 0 8px' }}><span className="mono">{r.teste}</span></p>
                    <p style={{ margin: 0, fontSize: 13.5 }}>{r.detalhe}</p>
                  </div>
                  <span className="tag no">{r.veredito}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── 05 ─────────────────────────────────────────────── */}
          <section id="preditor">
            <div className="eyebrow">05 · Quem vai sair?</div>
            <h2>Nenhuma variável prevê qual conta específica vai churnar.</h2>
            <p style={{ maxWidth: 720 }}>
              Testei 18 variáveis de uso, suporte e contrato contra duas definições diferentes de churn —
              36 testes de permutação com 20.000 embaralhamentos cada. <strong>Zero atingiram significância.</strong>{' '}
              Os maiores efeitos ficaram em |d| &lt; 0,17, que é ruído. Volume de uso, erros, tempo de resposta,
              CSAT, escalações, downgrades: nada separa quem fica de quem sai.
            </p>
            <div className="card" style={{ padding: '24px 20px 12px' }}>
              <PreditorChart testes={testes} />
              <p className="note" style={{ marginTop: 4, textAlign: 'center' }}>
                Cada ponto é uma variável testada contra a existência de evento de churn. Todos caem
                fora da faixa de significância.
              </p>
            </div>
            <div className="card gold" style={{ marginTop: 14 }}>
              <h3 style={{ color: '#d4b183' }}>Este resultado negativo é o achado mais valioso da análise</h3>
              <p style={{ margin: 0, maxWidth: 760 }}>
                É o que determina a estratégia. Se houvesse sinal individual, a resposta certa seria montar um
                modelo de risco e um playbook de salvamento conta a conta. Como não há — e a deterioração
                por safra é enorme e altamente significativa — a causa não é específica de cliente nenhum:
                é <strong>sistêmica e mudou ao longo do tempo</strong>. Você não conserta isso ligando para
                contas em risco. Conserta consertando a entrada.
              </p>
              <p style={{ margin: '14px 0 0', fontSize: 13, color: '#9db2bf' }}>
                Um modelo preditivo treinado nesses dados teria performance de moeda ao ar. Não construí um,
                e essa foi uma decisão, não uma limitação de tempo.
              </p>
            </div>
          </section>

          {/* ─── 06 ─────────────────────────────────────────────── */}
          <section id="acao">
            <div className="eyebrow">06 · Plano de ação</div>
            <h2>Três frentes, em ordem de retorno.</h2>
            <div className="stack">
              <Acao
                n="1" prazo="Semana 1" tom="gold"
                titulo="Instrumentar a janela de 90 dias e achar o que quebrou em 2024"
                valor={usdK(f.economia.arr_recuperavel) + ' / ano'}
                corpo={`A deterioração é contínua ao longo de 2024, transversal a todos os canais e concentrada na entrada. Isso aponta para uma mudança no produto, no fluxo de ativação ou na promessa de venda. Os dados atuais não registram eventos de onboarding, então a causa exata não é observável — e essa é a primeira lacuna a fechar. Instrumente time-to-first-value, conclusão de setup e primeiro marco de uso, e compare as safras de 2023 com as de 2024 em cada etapa.`}
                metrica={`Meta: levar o churn de 90 dias de ${pct(cN.m3.pct)} para os ${pct(c0.m3.pct)} que a empresa já entregou em ${c0.coorte}. São ${num(f.economia.contas_salvas_mes)} contas por mês, a ${usd(f.economia.mrr_medio_conta)} de MRR médio.`}
              />
              <Acao
                n="2" prazo="Semana 1-2" tom="alert"
                titulo="Consertar a instrumentação de churn antes de tomar qualquer decisão baseada nela"
                valor="Bloqueia decisões erradas"
                corpo={`${int(f.integridade[0].n)} contas têm a flag de churn contradizendo os eventos registrados, e o campo de motivo de saída não tem relação estatística nenhuma com o que o cliente escreveu (p=${num(f.teste_motivo.p, 4)}). Na prática, a RavenStack não sabe quantos clientes perdeu nem por quê. Qualquer dashboard construído sobre esses campos está errado, e priorizações feitas a partir deles são aleatórias.`}
                metrica="Meta: uma definição única de churn, aplicada em todos os sistemas, e motivo de saída preenchido a partir do texto do cliente — não de uma lista suspensa."
              />
              <Acao
                n="3" prazo="Contínuo" tom="flat"
                titulo="Cobrir as contas novas por exposição de receita, não por score de risco"
                valor={usd(criticas.reduce((s, c) => s + c.arr_em_risco, 0)) + ' expostos hoje'}
                corpo={`Como nenhuma variável prevê churn individual, não existe base para ranquear contas por probabilidade de saída. O que é defensável é ranquear por exposição: quanto de receita está em uma fase de risco conhecido. Hoje há ${int(criticas.length)} contas ativas dentro da janela de 90 dias. A fila da seção 07 é essa lista, ordenada por ARR ponderado pelo risco empírico da fase.`}
                metrica={`Meta: cobertura de 100% das contas novas nos primeiros 90 dias. A concentração de receita torna isso barato — o decil superior da base responde por ${pct(f.base.concentracao_top10_pct)} do MRR.`}
              />
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <h3>O que eu não recomendo, e por quê</h3>
              <p style={{ margin: 0, maxWidth: 760, fontSize: 13.5 }}>
                <strong>Modelo preditivo de churn:</strong> não há sinal para treinar. Entregaria um número
                com aparência de precisão e conteúdo de acaso.{' '}
                <strong>Campanha por segmento:</strong> nenhuma dimensão demográfica é significativa —
                mirar “DevTools” ou “clientes de evento” seria perseguir ruído amostral.{' '}
                <strong>Programa de satisfação:</strong> o CSAT é estável, tem a mesma taxa de resposta entre
                quem fica e quem sai, e não prevê churn. O problema não está aí.
              </p>
            </div>
          </section>

          {/* ─── 07 ─────────────────────────────────────────────── */}
          <section id="fila">
            <div className="eyebrow">07 · Fila do CS</div>
            <h2>As contas para trabalhar na segunda-feira.</h2>
            <p style={{ maxWidth: 720 }}>
              Não é um dashboard: é uma fila de trabalho. Cada conta é uma das{' '}
              {int(f.base.ativas)} contas ativas hoje, ordenada por <strong>ARR exposto</strong> — o MRR anualizado
              multiplicado pelo risco empírico da fase de vida em que ela está. Clique em qualquer linha para ver
              exatamente por que ela está aí.
            </p>
            <Fila contas={contas} coorteNova={cN.coorte} />
          </section>

          {/* ─── 08 ─────────────────────────────────────────────── */}
          <section id="dados">
            <div className="eyebrow">08 · Dados quebrados</div>
            <h2>A RavenStack não consegue responder “por que perdemos clientes” com a instrumentação atual.</h2>
            <p style={{ maxWidth: 720 }}>
              Encontrei isso antes de encontrar qualquer insight, e é o motivo pelo qual o CEO ficou sem
              resposta até agora. São problemas de captura de dado, não de análise — nenhum se resolve
              com uma query melhor.
            </p>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Problema encontrado</th>
                    <th className="num">Registros</th>
                    <th>Consequência prática</th>
                    <th>Gravidade</th>
                  </tr>
                </thead>
                <tbody>
                  {f.integridade.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: '#f5f4f3', fontWeight: 500 }}>{p.problema}</td>
                      <td className="num" style={{ fontWeight: 700, color: '#d4b183' }}>{int(p.n)}</td>
                      <td style={{ fontSize: 12.5 }}>{p.impacto}</td>
                      <td>
                        <span className={`tag ${p.severidade === 'critico' ? 'no' : p.severidade === 'alto' ? 'gold' : 'flat'}`}>
                          {p.severidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card alert" style={{ marginTop: 14 }}>
              <h3 style={{ color: '#dd8570' }}>O detalhe mais grave</h3>
              <p style={{ margin: 0, maxWidth: 760 }}>
                O campo <span className="mono">reason_code</span> — a fonte de toda conversa interna sobre
                “por que os clientes saem” — é <strong>estatisticamente independente</strong> do que o cliente
                escreveu no feedback (χ²={num(f.teste_motivo.chi2, 2)}, {f.teste_motivo.df} graus de liberdade, p={num(f.teste_motivo.p, 4)},
                n={int(f.teste_motivo.n)}). Saber o código de motivo não diz absolutamente nada sobre a reclamação real.
                Toda priorização de roadmap feita a partir desse campo foi feita sobre ruído.
              </p>
            </div>
          </section>

          {/* ─── 09 ─────────────────────────────────────────────── */}
          <section id="metodo">
            <div className="eyebrow">09 · Método</div>
            <h2>Como reproduzir cada número desta página.</h2>
            <div className="grid g2">
              <div className="card">
                <h3>Pipeline</h3>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  5 CSVs ({int(f.base.linhas_analisadas)} linhas) →{' '}
                  <span className="mono">build-db.mjs</span> → SQLite →{' '}
                  <span className="mono">findings.mjs</span> → <span className="mono">findings.json</span> → este app.
                  Zero dependências na análise: só <span className="mono">node:sqlite</span>, que é biblioteca padrão.
                </p>
              </div>
              <div className="card">
                <h3>Testes estatísticos</h3>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  Todos por permutação, 20.000 reamostragens, sem premissa de distribuição.
                  O módulo <span className="mono">stats.mjs</span> tem um self-check que falha se um rótulo
                  aleatório for declarado significativo.
                </p>
              </div>
              <div className="card">
                <h3>Tratamento de censura</h3>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  Nas tabelas de safra, o denominador só inclui contas com o horizonte inteiro observado.
                  Sem isso, a safra {cN.coorte} apareceria com churn acima de 100% — foi exatamente o erro
                  que cometi na primeira versão e que o log de processo registra.
                </p>
              </div>
              <div className="card">
                <h3>Limitações</h3>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  Os dados não têm eventos de onboarding, então a causa exata da deterioração é inferida
                  por eliminação, não observada. O dataset é sintético e a janela encerra em {f.asof},
                  o que torna o último mês parcialmente censurado.
                </p>
              </div>
            </div>
            <p className="note" style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid #0f2f42' }}>
              Fabrício Rojas · G4 AI Master Challenge · Challenge 001 · dados até {f.asof} ·
              dataset RavenStack (River @ Rivalytics, licença MIT) ·
              gerado em {new Date(f.gerado_em).toLocaleDateString('pt-BR')}
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

function Acao({ n, prazo, titulo, valor, corpo, metrica, tom }) {
  return (
    <div className={`card ${tom === 'gold' ? 'gold' : tom === 'alert' ? 'alert' : ''}`}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="row" style={{ gap: 11 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center',
            background: tom === 'gold' ? '#b9915b' : tom === 'alert' ? '#c2553f' : '#14384c',
            color: tom === 'flat' ? '#9db2bf' : '#001f35', fontWeight: 800, fontSize: 12.5,
          }}>{n}</span>
          <span className="tag flat">{prazo}</span>
        </div>
        <span className="tag gold">{valor}</span>
      </div>
      <h3 style={{ fontSize: 16.5 }}>{titulo}</h3>
      <p style={{ fontSize: 13.5, marginBottom: 12 }}>{corpo}</p>
      <p style={{
        margin: 0, fontSize: 12.5, color: '#9db2bf',
        borderLeft: '2px solid #14384c', paddingLeft: 13,
      }}>{metrica}</p>
    </div>
  );
}
