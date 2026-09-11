# Submissão — Fabrício Rojas — Challenge 003

## Sobre mim

- **Nome:** Fabrício Rojas
- **LinkedIn:** _(preencher)_
- **Challenge escolhido:** 003 — Lead Scorer (Vendas / RevOps)

---

## Executive Summary

Construí o **Lead Scorer**, uma aplicação web em Next.js que abre na segunda-feira do vendedor: o pipeline dele ordenado por onde a hora rende mais, dividido em quatro filas por verbo — **Fechar, Acompanhar, Decidir, Engajar** — com o motivo de cada deal em quatro linhas e uma ação escrita para aquele deal. Gerentes trocam de persona ou veem o time inteiro com filtros de gerente e escritório; busca ⌘K indexa os 2.089 deals abertos.

Antes de escolher o que entra no score, medi em split temporal o que prevê fechamento. **Nenhuma característica de "quem" prevê**: agente, produto, setor e histórico da conta dão AUC ≈ 0,5 no teste. O único sinal é a idade do deal — e é contraintuitivo: quem chega longe fecha mais (57% em < 30 dias → 75% em 120+). Por isso o score não finge prever quem ganha; ele prioriza atenção: **ticket típico × P(ganhar | idade) × janela de ação**, e mostra cada fator.

O achado que muda a conversa do time: **1.291 dos 1.589 deals Engaging (81%) estão além do ciclo máximo já observado** (138 dias). Nenhum deal na história fechou depois disso. O pipeline carrega deals mortos sem baixa, e o número está inflado — a fila **Decidir** existe para isso.

---

## Solução

Aplicação web escura na identidade do G4 (navy, dourado, logo oficial), quatro telas:

| Rota | Para quem | O que tem |
|---|---|---|
| `/` **Minha segunda-feira** | Vendedor | Persona ("Ver como"), 4 KPIs, "Comece por aqui" com os 3 deals de maior retorno, filas por verbo, tabela com score, gaveta do deal com o porquê e a ação |
| `/equipe` | Gerente / RevOps | Vendedores por valor esperado, composição do pipeline por fila, win rate com intervalo de confiança — e por que ele não entra no score |
| `/metodo` | Quem vai defender o número | Os 4 passos do score, a curva condicional, AUC do que prevê e do que não, calibração no teste, limites |
| `/dados` | Time de dados | Integridade do CRM, tickets típicos por produto, os dois problemas que definem o pipeline |

```
solution/003-lead-scorer/
├── README.md                # este arquivo
├── analysis/
│   ├── build-db.mjs         # 4 CSVs → SQLite (node:sqlite, zero deps)
│   └── score.mjs            # normalização, validação temporal, curva, score → scores.json
├── data/
│   ├── raw/                 # os CSVs originais do Kaggle
│   └── scores.json          # saída reproduzível do score (o .db é gerado)
└── platform/                # o app Next.js

process-log/003-lead-scorer/ # como usei IA: narrativa + screenshots
```

### Como rodar

```bash
cd analysis && node build-db.mjs && node score.mjs
cd ../platform && npm install && npm run dev
# abre em http://localhost:3000
```

Requer **Node 22+**. A análise não tem dependências; o app tem só Next e React.

### Abordagem

1. **Medir antes de modelar.** Split temporal (treino até 31/08/2017, teste nos 2.620 deals fechados depois). AUC por fator. Só a idade do deal sobrevive.
2. **Curva condicional.** P(ganhar | ainda aberto no dia t), em cinco faixas. Calibrada: previsto vs. observado no teste dentro de 3 pontos em todas as faixas.
3. **Ticket típico** = mediana do que o produto fechou quando ganhou — não o preço de tabela.
4. **Janelas de ação** com multiplicadores heurísticos declarados (Fechar 1,2 · Acompanhar 0,9 · Engajar 0,7 · Decidir 0,6).
5. **Score 0–100** = posição do valor ponderado entre os 2.089 deals abertos.
6. **Normalização dos dados** antes de tudo: `GTXPro`→`GTX Pro` (1.480 deals que ficariam sem ticket), `technolgy`, deals sem conta como flag e ação.

### Lógica de scoring (o que o vendedor vê na gaveta)

| Passo | Fonte | Exemplo (deal 1LY8CAXD) |
|---|---|---|
| Ticket típico do produto | mediana dos ganhos | GTK 500 → US$ 25.897 |
| P(ganhar \| idade) | curva condicional | dia 95 → 71% |
| Janela de ação | fase do ciclo | Fechar → × 1,2 |
| Score | posição entre os abertos | 100 / 100 |

E um texto de ação específico: *"Está no dia 95 de Engaging — a faixa em que 71% dos deals que chegaram até aqui acabaram ganhos. Leve a proposta final para a mesa esta semana."*

### Resultados / Findings

| # | Achado | Evidência |
|---|---|---|
| 1 | "Quem" não prevê fechamento | AUC no teste: agente 0,51 · produto 0,49 · setor 0,49 · conta 0,48 |
| 2 | Idade prevê, ao contrário da intuição | P(ganhar) sobe de 63% (dia 0) para 75% (dia 120+); AUC 0,56, calibrada |
| 3 | 81% do Engaging está além do ciclo máximo | 1.291 deals com mais de 138 dias; nenhum deal na história fechou depois disso |
| 4 | 68% do pipeline aberto não tem conta | 1.425 deals; zero fechados sem conta |
| 5 | O vendedor de maior "valor esperado" tem zero deals para fechar | Darcel Schlecht: 194 abertos, 83 zumbis, 134 sem conta |
| 6 | Diferenças de win rate entre vendedores cabem no erro | IC 95% de quase todos cruza a média do time |

### Recomendações

1. **Trabalhar por fila, não por valor.** Segunda de manhã: os 3 deals do "Comece por aqui", depois a fila Fechar. Decidir é tarefa de limpeza semanal, não de venda.
2. **Higiene do CRM antes de meta.** Dar baixa nos 1.291 deals além do ciclo (ou confirmar que estão vivos) e atribuir conta aos 1.425 sem conta. O pipeline reportado hoje está inflado.
3. **Não ranquear vendedores por win rate.** A tela Equipe mostra por quê; ranquear por composição do pipeline (quantos em Fechar vs. Decidir) diz mais.
4. **Registrar o que acontece no deal.** Reuniões, propostas, próxima ação. Sem isso, nenhum score vai passar de AUC 0,56 — o limite é do dado, não do modelo.

### Limitações

- **Não prevê quem ganha.** AUC 0,56 é modesto; o score ordena onde investir tempo, não quem vai fechar. Está escrito em toda gaveta.
- **Além do dia 138 não há histórico.** Para 1.291 deals a probabilidade mostrada é a da última faixa observada, com multiplicador 0,6 sinalizando a incerteza.
- **Multiplicadores são heurísticos.** Codificam onde a hora rende; não saem de ajuste estatístico. Estão em `score.mjs`.
- **Snapshot, não CRM vivo.** O app é read-only sobre o pipeline em 31/12/2017. Em produção, `node score.mjs` recalcula a cada carga.
- O dataset é público e, pela estrutura, sintético; o rigor de validação vale para qualquer origem.

---

## Process Log — Como usei IA

> Narrativa completa em [`process-log/003-lead-scorer/README.md`](../../process-log/003-lead-scorer/README.md).

### Ferramentas usadas

| Ferramenta | Para que usei |
|------------|--------------|
| Claude Code (Fable 5.1) | Exploração via SQL, validação temporal e AUC, construção do app, revisão por screenshot |
| SQLite (`node:sqlite`) | Cruzamento das 4 tabelas |
| Headless Edge | Screenshots do app (desktop, gaveta, mobile via iframe) |

### Workflow

1. Schema e integridade primeiro: nomes de produto duplicados, setor com typo, deals sem conta.
2. Split temporal e AUC por fator, antes de escolher features.
3. Curva P(ganhar | idade) e calibração no teste.
4. Filas por verbo com multiplicadores declarados; score como posição.
5. App: sidebar Riter, tabela Coinstax, gaveta invoice — seguindo as referências, não um template.
6. Revisão por screenshot; correção da persona padrão que abria vazia.

### Onde a IA errou e como corrigi

1. **Página abrindo vazia.** Persona padrão por valor esperado escolhia o vendedor cujo pipeline é 83 zumbis + 134 sem conta — zero na fila Fechar. Padrão passou a ser quem tem mais deals na janela de fechamento, com fallback automático de fila e um herói alternativo que explica o pipeline sujo.
2. **Gráfico em branco dentro da gaveta.** IntersectionObserver dentro de ancestral com `transform`. Prop `imediato` força o desenho nesses contextos.
3. **`git mv` negado.** O servidor Next travava `.next/`. Matar os processos node antes de mover.

### O que eu adicionei que a IA sozinha não faria

Recusar o modelo que o brief sugere, depois de provar que não há sinal para ele; transformar o resultado negativo na tela Equipe; ler 62% do pipeline como deals mortos e não como "idade alta = bom sinal"; escrever a ação por deal em vez de mostrar um número.

---

## Evidências

- [x] Narrativa escrita — [`process-log/003-lead-scorer/README.md`](../../process-log/003-lead-scorer/README.md)
- [x] Screenshots — [`process-log/003-lead-scorer/screenshots/`](../../process-log/003-lead-scorer/screenshots/)
- [x] Git history — commits na branch `submission/fabricio-rojas`
- [x] Código comentado — `score.mjs` documenta cada decisão no ponto em que é tomada

---

_Submissão enviada em: 10/09/2026_

_Dataset: [CRM Sales Predictive Analytics](https://www.kaggle.com/datasets/agungpambudi/crm-sales-predictive-analytics) (licença CC0)._
