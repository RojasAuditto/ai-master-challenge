# Process Log — Challenge 001

Registro de como a análise foi feita, na ordem em que aconteceu, incluindo os caminhos que não deram em nada e os erros que precisei corrigir.

**Ferramenta principal:** Claude Code (Opus 5), em sessão única de terminal.
**Tempo:** ~5h.
**Evidência complementar:** o histórico de commits mostra a evolução; os screenshots em [`screenshots/`](./screenshots/) mostram o app em cada estágio.

---

## Por que quase nenhuma dependência

A decisão de stack veio antes da análise. Node 22+ trouxe `node:sqlite` para a biblioteca padrão, o que significa que 5 CSVs viram um banco relacional consultável sem `pip install`, sem venv, sem lockfile. Para um avaliador, isso é a diferença entre `node findings.mjs` funcionar de primeira ou virar uma sessão de depuração de ambiente.

O mesmo raciocínio vale para os testes estatísticos: implementei permutação à mão em ~60 linhas em vez de importar scipy. Não é purismo — é que o revisor consegue ler o teste inteiro e verificar que ele faz o que eu digo que faz. Com uma lib, ele teria que confiar no meu uso da API.

Os gráficos são SVG escrito à mão pelo mesmo motivo, mais um: nenhuma charting library entrega o controle tipográfico que um relatório executivo precisa.

---

## A sequência

### 1. Marca antes de dado

Antes de abrir os CSVs, extraí a identidade visual do G4 direto do SVG oficial do site (`logo-g4-completa-branca.svg`): `#F5F4F3`, `#B9915B` (o dourado editorial), `#001F35` (navy) e `#842E20` (tijolo). O dourado puro tem ~2,6:1 de contraste sobre branco — baixo demais para texto —, então onde ele precisa ser lido usei uma variante escurecida a ~5,6:1. A marca fica intacta; a legibilidade também.

### 2. O README do dataset mudou o plano

O dataset se descreve como *"fully synthetic, scripted in Python using pandas, numpy"*, com distribuições exponenciais e de Poisson. Isso levantou a pergunta que guiou todo o resto: **se as colunas foram geradas de forma independente, pode não haver sinal causal nenhum.** Um candidato que ignora isso escreve um diagnóstico causal sobre ruído.

Não assumi que não havia sinal — isso seria o mesmo erro na direção oposta. Fui testar.

### 3. Primeira query, primeiro problema

A consulta inicial de sanidade cruzou `accounts.churn_flag` com a existência de `churn_events`:

```
churn_flag=0, com evento : 277
churn_flag=0, sem evento : 113
churn_flag=1, com evento :  75
churn_flag=1, sem evento :  35
```

312 das 500 contas se contradizem. Isso reorientou a análise: passei a rodar **todo** teste contra as duas definições e só reportar o que sobrevivesse a ambas.

### 4. Os segmentos que pareciam achados

A primeira tabela de segmentos parecia um relatório pronto:

| Segmento | Churn |
|---|---|
| DevTools | 31,0% |
| Cybersecurity | 16,0% |
| Canal "event" | 30,2% |
| Canal "partner" | 14,6% |

É exatamente o que uma análise apressada publicaria. Teste de permutação com 20.000 embaralhamentos: **p=0,067 e p=0,079**. Não significativos — e isso antes de qualquer correção para múltiplas comparações, que com 5 dimensões testadas tornaria o limiar ainda mais rigoroso.

O sinal mais forte de que era ruído veio de `plan_tier`: 22,1% / 22,0% / 21,9%. χ²=0,00, p=1,0. Independência perfeita não acontece em dados reais.

### 5. Onde a IA errou — os quatro erros

**Erro 1 — censura ignorada (o mais grave).** A primeira tabela de coorte retornou:

```
2024-H2   churn_ate_3m: 140.3%
```

Impossível. O numerador contava todas as contas que churnaram em até 3 meses; o denominador só as que tinham 3 meses de observação — e contas que entraram em dezembro de 2024 não têm. Corrigi restringindo os dois ao mesmo conjunto.

Só peguei porque passou de 100%. **Se o viés tivesse produzido 65% em vez de 140%, teria passado batido** e distorcido o achado central. Foi o que me fez adicionar checagens de plausibilidade em cada tabela nova, não só na última.

**Erro 2 — o gráfico contradizia a conclusão.** A primeira versão do gráfico de coorte usava linhas, uma por safra, com o tempo de casa no eixo X. Ao revisar por screenshot, vi que 2023-H2 aparecia como a linha mais alta — porque teve mais tempo para acumular churn. Um CEO olhando 5 segundos concluiria que a safra antiga é a pior, o oposto exato do achado. Refiz como barras agrupadas, onde os 90 dias comparam as quatro safras no mesmo pé: 16% → 23% → 39% → 60%.

Esse erro não era de código nem de estatística — o número estava certo. Era de comunicação, e só apareceu quando olhei o resultado renderizado em vez de confiar no dado.

**Erro 3 — "reproduzível" que não reproduzia.** Os testes usavam `Math.random()`. Duas execuções seguidas davam p=0,9541 e p=0,9578. Para uma análise que se apresenta como verificável, isso é um defeito, não um detalhe. Troquei por um PRNG com semente fixa (mulberry32). Hoje duas execuções dão saída idêntica byte a byte.

**Erro 4 — `db.prepare(sql, param)`** em vez de `db.prepare(sql).all(param)`. O segundo argumento de `prepare` é options, daí o erro `The "options" argument must be an object`. Pego no build.

### 6. Hipóteses que testei e joguei fora

| Hipótese | Como testei | Resultado |
|---|---|---|
| Churn silencioso | Contas que saíram sem nunca abrir ticket | **5 de 352** (1,4%). Rejeitada. |
| CSAT com viés de não-resposta | Taxa de resposta e nota, churnados vs. ativos | 58,4% / 3,98 vs 59,5% / 3,98. Rejeitada. |
| Canal de aquisição ruim | Deterioração medida dentro de cada canal | Piora nos 5. Rejeitada. |
| Segmento concentrador | Permutação em setor, plano, país, canal | Nenhum p<0,05. Rejeitada. |

A hipótese do CSAT era a que eu mais esperava confirmar — é a explicação clássica para "satisfação boa, churn alto". Os dados não sustentam, e o CS da RavenStack está certo.

### 7. O achado

Análise de coorte com censura corrigida, comparando safras na mesma idade:

```
Churn em 90 dias    2023-H1: 15,6%  (n=109)
                    2023-H2: 22,9%  (n=118)
                    2024-H1: 38,8%  (n=121)
                    2024-H2: 59,7%  (n=72)

Permutação: χ²=46,09, p=0,00005 (0 de 20.000 embaralhamentos)
```

Composição da base praticamente estável entre as safras, e a piora acontece dentro de cada canal separadamente — o que elimina mix de aquisição como explicação.

### 8. O resultado nulo como decisão de estratégia

36 testes (18 variáveis × 2 definições de churn), zero significativos, maior efeito |d|=0,17.

A tentação aqui é omitir e escrever uma narrativa causal mesmo assim. Fiz o contrário: a **combinação** de "nenhum sinal individual" com "deterioração por safra altamente significativa" é logicamente informativa. Se a causa fosse específica de cliente, apareceria nas variáveis de conta. Como não aparece, e como o momento de entrada prevê fortemente, a causa é sistêmica e variou no tempo.

Isso muda a recomendação de "monte um modelo de risco e um playbook de salvamento" para "conserte a entrada". São orçamentos e times diferentes.

Por isso também não construí modelo preditivo, apesar de ser sugerido como diferencial: treinado nesses dados, teria performance de moeda ao ar, com aparência de rigor.

### 9. O formato errado, e a reconstrução

A primeira versão do app era uma dissertação: nove seções em ordem argumentativa, num scroll único, tema escuro. Estava bem executada e estava errada.

O erro foi projetar para quem lê do começo ao fim. O leitor real é um CEO não-técnico que já declarou estar sem resposta — ele não desce nove seções. E não é um leitor só: são três, com necessidades incompatíveis.

| Quem | Precisa de | Tempo real |
|---|---|---|
| CEO | A resposta, a confiança e o que fazer | ~3 min |
| Head de CS/Dados, a quem ele encaminha | Verificar se o número aguenta questionamento | ~20 min |
| Analista de CS | A fila de contas | Todo dia |

Servir os três com o mesmo scroll linear atende mal os três. Reconstruí em **resposta primeiro, prova sob demanda**:

- A primeira tela entrega o diagnóstico, os quatro números e as três frentes de ação. O CEO decide ali.
- A evidência que sustenta cada afirmação — hipóteses rejeitadas, os 36 testes, sobrevivência, integridade, método — virou blocos expansíveis. A afirmação fica sempre visível; o teste abre ao clicar. Quem duvida verifica; quem não duvida não paga o custo de rolar.
- A fila do CS saiu para uma **rota própria** (`/fila`), porque é outra pessoa em outro dia, e porque assim tem URL própria para mandar direto ao time.

O que mantive foi a sequência paradoxo → resolução. Ela não é enfeite narrativo: é o que derruba a objeção "mas o produto disse que o uso subiu" antes de ela ser feita.

### 10. Segunda reconstrução: de relatório para produto

A versão "resposta primeiro" resolveu a ordem, mas ainda parecia um relatório com cards — muito texto, layout uniforme, cara de coisa gerada. Duas mudanças:

**Seguir o brief ao pé da letra nos diferenciais.** Eu havia justificado *não* construir modelo preditivo. A justificativa era correta, mas incompleta: existe um modelo que funciona — data de entrada + idade da conta — e ele é a forma mais honesta de mostrar que o comportamento não prevê. Medi por AUC no mesmo desfecho e na mesma amostra: 0,72 contra 0,42 da melhor variável comportamental. Virou a calculadora de `/modelo`, com a tendência entre safras projetada para a próxima (71% em 90 dias, se nada mudar). Os outros três diferenciais — interatividade, automação para o CS e a análise não pedida — ganharam rota própria.

**Refazer o visual a partir das referências, não do template mental de dashboard.** Sidebar escura no navy da marca com o logo branco oficial, conteúdo claro, números grandes com rótulo pequeno, tokens em pill, ícones em quadrado arredondado, listas densas no padrão "transações". A prosa virou UI: onde havia um parágrafo, hoje há uma linha com pill e valor. O texto que sobrou é o que um executivo lê em uma passada.

O que mantive: a ordem paradoxo → causa, o gráfico de safras como centro, e as três redes de segurança da animação.

### 11. Construção do app

Nove seções em ordem argumentativa, não em ordem de dashboard: paradoxo → resolução → o que descartei → por que não dá para prever → o que fazer → a fila → dados quebrados → método.

Tema claro sobre a paleta da marca, Montserrat, sidebar retrátil com estado persistido, e animação de entrada em todos os gráficos — barras crescem da base, linhas se desenham, contadores sobem. Não é enfeite: a animação escalonada faz o olho ler o gráfico na ordem em que o argumento acontece.

A revisão visual foi feita com screenshots em headless Edge, lidos e corrigidos em ciclo. Isso pegou coisas que o código não denuncia: o gráfico de linhas invertendo a mensagem, rótulos de canal sobrepostos, eixo colidindo com o título, "6,8%depois" sem espaço, decimais com ponto em vez de vírgula, e uma coluna "2,4M" que lia como "2,4 milhões" em vez de "2,4 meses".

**Um risco que a animação criou e que precisei fechar:** se a entrada depende de JavaScript, uma falha do IntersectionObserver deixa a página em branco. Conteúdo invisível é pior que animação perdida. Coloquei três redes: `prefers-reduced-motion` entrega tudo estático, um `<noscript>`-equivalente mostra o conteúdo sem JS, e um timeout de 2,5s revela qualquer bloco que o observer não tenha alcançado.

---

## O que eu faria com mais tempo

- Cruzar a deterioração com datas de release do produto, se existissem. É a lacuna que impede fechar a causa raiz.
- Análise de sobrevivência com covariáveis dependentes do tempo (Cox), em vez de KM agregado.
- Bootstrap de intervalo de confiança em torno dos US$ 307K, que hoje é estimativa pontual.
