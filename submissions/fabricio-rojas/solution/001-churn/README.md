# Submissão — Fabrício Rojas — Challenge 001

## Sobre mim

- **Nome:** Fabrício Rojas
- **LinkedIn:** _(preencher)_
- **Challenge escolhido:** 001 — Diagnóstico de Churn (RavenStack)

---

## Executive Summary

O churn da RavenStack não é um problema de retenção — é um problema de onboarding, e ele está piorando de forma contínua. Metade das contas some antes do 6º mês, e **cada safra sai mais rápido que a anterior na mesma idade de conta**: quem entrou em 2024-H2 perde 59,7% em 90 dias, contra 15,6% de quem entrou em 2023-H1 (χ²=46,09, p<0,0001, com censura tratada). Ninguém tinha visto porque o CEO, o CS e o Produto estão todos certos ao mesmo tempo: uso e satisfação agregados são dominados pelas safras sobreviventes, e a média esconde o colapso das novas.

Testei 18 variáveis comportamentais contra duas definições de churn — **36 testes, zero significativos**. Não existe forma de prever qual conta vai sair, e esse resultado negativo é o que define a estratégia: a causa não é específica de cliente nenhum, é sistêmica. Também descobri que a instrumentação está quebrada — 312 contas com flag de churn contradizendo os eventos, e o campo de motivo de saída é estatisticamente independente do que o cliente escreveu (p=0,957).

**Recomendação principal:** parar de investir em playbooks de salvamento conta a conta, concentrar tudo nos primeiros 90 dias e consertar a instrumentação. Voltar à retenção de 90 dias que a empresa já teve em 2023-H1 vale **US$ 307K de ARR por ano**.

---

## Solução

O deliverable é uma aplicação web com sidebar escura no navy da marca e conteúdo claro, organizada por quem vai usar cada tela:

| Rota | Para quem | O que tem |
|---|---|---|
| `/` **Visão geral** | CEO | A resposta, o prêmio, 4 KPIs, o gráfico de safras interativo, o plano em 3 linhas. Decide-se sem rolar. |
| `/evidencias` | Quem vai defender o número | 5 blocos expansíveis: afirmação visível, teste sob demanda. |
| `/modelo` **Modelo de risco** | RevOps / CS | Calculadora de risco de 90 dias + AUC do que prevê e do que não + projeção da próxima safra. |
| `/fila` **Fila do CS** | Analista de CS | 148 contas por ARR exposto, motivo por conta, roteiro de abordagem, exporta CSV. |
| `/dados` **Dados quebrados** | Time de dados | Auditoria de integridade e o que instrumentar. |
| `/metodo` | Avaliador | Pipeline, testes, censura, limitações, comandos. |

### Os quatro diferenciais do brief

| Pedido no challenge | Onde está | Observação |
|---|---|---|
| **Modelo preditivo que funcione** | `/modelo` | Data de entrada + idade da conta: AUC **0,72** para churn em 90 dias. A melhor variável comportamental dá 0,42 — moeda ao ar. O modelo funciona justamente porque *não* usa comportamento. |
| **Dashboard / visualização interativa** | todas as rotas | Hover com tooltip em cada gráfico, troca de horizonte (90d / 6m / 12m) no gráfico central, animação de entrada, sidebar retrátil. Responsivo até 360px: sidebar vira gaveta, gráficos ganham rolagem lateral, tabela com primeira coluna fixa. |
| **Automação que o CS usa amanhã** | `/fila` | Fila ordenada por exposição, com roteiro de abordagem por conta e exportação CSV. Sem etapa manual entre o dado e a ligação. |
| **Análise que ninguém pediu** | `/dados` | O `reason_code` — a fonte de toda conversa sobre "por que saem" — é estatisticamente independente do que o cliente escreveu (p=0,957). Muda a conversa sobre roadmap. |

```
submissions/fabricio-rojas/
├── analysis/            # A análise, reproduzível com 2 comandos
│   ├── build-db.mjs     # 5 CSVs → SQLite
│   ├── stats.mjs        # testes de permutação (com self-check)
│   └── findings.mjs     # toda a análise → findings.json
├── data/
│   ├── raw/             # os 5 CSVs originais do Kaggle
│   ├── ravenstack.db    # SQLite gerado
│   └── findings.json    # resultados
├── platform/            # o app Next.js
└── process-log/         # como usei IA
```

### Como rodar

```bash
cd analysis && node build-db.mjs && node findings.mjs
cd ../platform && npm install && npm run dev
# abre em http://localhost:3000
```

Requer apenas **Node 22+**. A análise não tem nenhuma dependência: usa `node:sqlite`, que é biblioteca padrão. O app tem só Next e React.

### Abordagem

Comecei pela integridade dos dados, não pela análise. Na primeira hora encontrei que `churn_flag` contradizia `churn_events` em 312 das 500 contas — o que significa que qualquer conclusão tirada da flag estaria errada. Isso mudou todo o resto: passei a rodar cada teste contra **duas** definições de churn e a só reportar o que sobrevivia às duas.

Depois verifiquei as três afirmações do CEO separadamente, em vez de assumir que uma delas estava errada. Todas se confirmaram. Isso descartou a leitura fácil ("alguém está olhando o número errado") e apontou para um problema de composição — que é o que a análise de coorte confirmou.

Antes de afirmar qualquer causa, testei se havia sinal. Usei testes de permutação (20.000 reamostragens, sem premissa de distribuição) porque com ~500 contas e diferenças de 10-15 pontos percentuais, é fácil confundir ruído amostral com insight.

### Resultados / Findings

| # | Achado | Evidência |
|---|--------|-----------|
| 1 | Os três fatos do CEO são verdadeiros | Churn 11→117/mês; uso estável ~10.500/mês; CSAT estável em 3,98 |
| 2 | Churn concentrado na entrada | Hazard de 18,2% no 1º mês, patamar de ~6,8% após o 5º |
| 3 | **Deterioração por safra** | Churn em 90 dias: 15,6% → 22,9% → 38,8% → 59,7% (p<0,0001) |
| 4 | Não é mix de aquisição | A piora aparece nos 5 canais: organic 5%→78%, ads 8%→55% |
| 5 | **Nenhum preditor individual** | 36 testes de permutação, 0 significativos, todos \|d\|<0,17 |
| 6 | `reason_code` é ruído | Independente do feedback do cliente: χ²=3,83, gl=10, p=0,957 |
| 7 | Receita concentrada | O decil superior responde por 46,6% do MRR |

**Hipóteses testadas e rejeitadas:** churn silencioso (só 1,4% saem sem abrir ticket), viés de não-resposta no CSAT (58,4% vs 59,5% de resposta, CSAT 3,98 nos dois grupos), canal de aquisição ruim, e concentração em algum segmento demográfico (nenhuma dimensão significativa).

### Recomendações

1. **Instrumentar a janela de 90 dias** e comparar as safras de 2023 e 2024 em cada etapa de ativação. Vale US$ 307K/ano. Os dados atuais não registram eventos de onboarding, então a causa exata da deterioração não é observável — fechar essa lacuna é o primeiro passo.
2. **Consertar a instrumentação de churn** antes de tomar qualquer decisão baseada nela. Definição única de churn e motivo de saída derivado do texto do cliente.
3. **Cobrir contas novas por exposição de receita**, não por score de risco. São 26 contas ativas na janela crítica, com US$ 98.689 de ARR exposto.

**O que eu não recomendo:** modelo preditivo de churn (não há sinal para treinar), campanha por segmento (nenhuma dimensão é significativa) e programa de satisfação (o CSAT não prevê churn e é genuinamente estável).

### Limitações

- **A causa raiz é inferida por eliminação, não observada.** Os dados não têm eventos de onboarding, ativação ou mudanças de produto. Provo *que* a experiência de entrada piorou e *que* não é composição, canal ou segmento — mas não *o que exatamente* mudou. Seria desonesto afirmar mais que isso.
- **O último mês está parcialmente censurado.** A janela encerra em 2024-12-31 em todas as tabelas.
- **O dataset é sintético.** As inconsistências que reporto no bloco de integridade podem ser artefatos do gerador, não de um sistema real. Tratei-as como reais porque a análise correta é a mesma nos dois casos: se os dados chegam assim, não dá para responder a pergunta com eles.
- Não construí modelo preditivo. Foi decisão, não falta de tempo — está justificada no bloco “Nenhuma variável prevê qual conta vai churnar”.

---

## Process Log — Como usei IA

> Detalhado em [`process-log/README.md`](../../process-log/001-churn/README.md), com o registro dos erros e correções.

### Ferramentas usadas

| Ferramenta | Para que usei |
|------------|--------------|
| Claude Code (Opus 5) | Exploração dos dados via SQL, implementação dos testes de permutação, construção do app, revisão visual por screenshot |
| Headless Edge | Screenshots da própria aplicação, lidos em ciclo para revisar o design |
| SQLite (`node:sqlite`) | Cruzamento das 5 tabelas |

### Workflow

1. **Marca antes de dado.** Extraí a paleta e o logo do G4 direto do SVG oficial do site, antes de abrir os CSVs.
2. **Integridade antes de análise.** A primeira query cruzou `churn_flag` com `churn_events` e achou 312 contas contraditórias. Isso reorientou tudo: passei a rodar cada teste contra duas definições de churn.
3. **Verificar as três afirmações do CEO** separadamente, em vez de assumir que uma estava errada. As três se confirmaram — o que descartou a leitura fácil.
4. **Testar antes de afirmar.** Cada segmento que "parecia" um achado foi a teste de permutação. DevTools 31% vs Cybersecurity 16% morreu em p=0,067.
5. **Coorte com censura correta** — aqui saiu o achado central, depois de eu errar a primeira versão.
6. **Medir o poder preditivo por AUC**, para separar o que prevê (data de entrada, 0,72) do que não prevê (comportamento, 0,42).
7. **Construir por audiência**, não por ordem de raciocínio: uma rota por leitor.
8. **Revisar por screenshot** em ciclo, lendo o resultado renderizado em vez de confiar no dado.

### Onde a IA errou e como corrigi

Cinco erros reais, todos registrados no log com o momento em que apareceram:

1. **Tabela de coorte com 140,3% de churn.** O denominador não tratava censura — contas de 2024-H2 não têm 3 meses de observação. Só peguei porque um percentual acima de 100% é impossível. Foi o erro mais perigoso: qualquer valor abaixo de 100% teria passado despercebido e distorcido a conclusão central.
2. **Gráfico que contradizia a própria conclusão.** A primeira versão do gráfico de coorte usava linhas. Como cada safra tem janela de observação diferente, a safra mais antiga aparecia no topo — um CEO leria exatamente o oposto do achado. Refiz como barras no mesmo horizonte.
3. **Resultados não reproduzíveis.** Os testes de permutação usavam `Math.random()`, então cada execução dava um p-valor diferente (0,9541 → 0,9578). Chamar isso de "reproduzível" seria falso. Troquei por um PRNG com semente fixa.
4. **Parâmetro no lugar errado** em `db.prepare(sql, param)` — deveria ser `.all(param)`. Erro comum de API, pego pelo build.
5. **O formato inteiro estava errado.** A primeira versão era uma dissertação de nove seções em scroll único. Bem executada, e endereçada ao leitor errado: um CEO não desce nove seções. Reconstruí em resposta primeiro com prova sob demanda, e separei a fila do CS em rota própria — são três leitores com necessidades incompatíveis, não um.

### O que eu adicionei que a IA sozinha não faria

**Desconfiar antes de concluir.** A primeira leitura dos dados entrega achados prontos: "DevTools churna 31% contra 16% de Cybersecurity", "canal de evento é o pior". São exatamente as manchetes que uma análise apressada publicaria. Testei as duas e nenhuma resiste (p=0,067 e p=0,079) — são ruído amostral com n≈100 por célula.

**Tratar o resultado nulo como achado, não como fracasso.** Quando 36 testes dão zero significativos, o caminho fácil é ignorar e escrever uma narrativa causal mesmo assim. A leitura correta é o oposto: a ausência de sinal individual, combinada com a enorme significância por safra, é justamente o que prova que a causa é sistêmica. Esse raciocínio é o que muda a recomendação de "monte um modelo de risco" para "conserte o onboarding".

**Recusar o deliverable esperado.** O challenge sugere modelo preditivo como diferencial. Construir um aqui produziria um número com aparência de precisão e conteúdo de acaso. Não entregar — e justificar — vale mais que entregar.

---

## Evidências

- [x] **Narrativa escrita** do processo — [`process-log/README.md`](../../process-log/001-churn/README.md), passo a passo com os erros e as correções
- [x] **Screenshots** da aplicação em cada estágio — [`process-log/screenshots/`](../../process-log/001-churn/screenshots/), incluindo o antes e depois do gráfico que contradizia a própria conclusão
- [x] **Git history** — quatro commits mostrando a evolução: primeira entrega → resposta primeiro → diferenciais do brief → ajustes de acabamento
- [x] **Código comentado** — os comentários em `stats.mjs`, `findings.mjs` e `Charts.js` registram as decisões no ponto em que foram tomadas
- [ ] Screen recording — não gravei; a narrativa e os screenshots cobrem o mesmo terreno

---

_Submissão enviada em: 10/09/2026_

---

_Dataset: [SaaS Subscription & Churn Analytics](https://www.kaggle.com/datasets/rivalytics/saas-subscription-and-churn-analytics-dataset), por River @ Rivalytics (licença MIT)._
