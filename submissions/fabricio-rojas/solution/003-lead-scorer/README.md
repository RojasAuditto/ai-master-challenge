# Submissão — Fabrício Rojas — Challenge 003

## Sobre mim

- **Nome:** Fabrício Rojas
- **LinkedIn:** _(preencher)_
- **Challenge escolhido:** 003 — Lead Scorer (Vendas / RevOps)

---

## Executive Summary

Construí o **Lead Scorer**, uma aplicação web em Next.js que abre na segunda-feira do vendedor: o pipeline dele ordenado por onde a hora rende mais, dividido em quatro filas por verbo — **Fechar, Acompanhar, Decidir, Engajar** — com o motivo de cada deal em quatro linhas, uma ação escrita para aquele deal e um lugar para registrar o próximo passo. Gerentes trocam de persona ou veem o time com filtros de gerente e escritório; busca ⌘K indexa os 2.089 deals abertos; a mesma explicação sai por API.

Antes de escolher o que entra no score, medi em split temporal o que prevê fechamento. **Nenhuma característica de "quem" prevê**: agente, produto, setor e histórico da conta dão AUC ≈ 0,5 no teste. O único sinal é a idade do deal — e é contraintuitivo: quem chega longe fecha mais (57% em < 30 dias → 75% em 120+). Por isso o score não finge prever quem ganha; ele prioriza atenção: **ticket típico × P(ganhar | idade) × janela de ação**, e mostra cada fator.

O achado que muda a conversa do time: **1.291 dos 1.589 deals Engaging (81%) estão além do ciclo máximo já observado** (138 dias). Nenhum deal na história fechou depois disso. O pipeline carrega deals mortos sem baixa e o número está inflado — a fila **Decidir** existe para isso.

---

## Solução

Aplicação escura no vocabulário das referências de produto (Coinstax, Riter, Untitled UI, invoice, Monthly Budget, paleta de comandos): carvão neutro (`#0A0A0A`), cinzas puros nos cards, bordas a 5–9% de branco, acento em cinza claro, gradiente roxo→azul no card de valor esperado, botões brancos em pill, Inter. Cor saturada só onde é informação: as quatro filas, a variação e os alertas. Sidebar mínima (cinco destinos + ⋮ com preferências), sem topbar, busca ⌘K com filtros por tipo, últimas buscas, ações rápidas e arquivos. Da marca G4 entra só o logo, aplicado inteiro e sem recolorir.

| Rota | Para quem | O que tem |
|---|---|---|
| `/` **Segunda-feira** | Vendedor | Persona ("ver como"), frase-resumo com os números, 3 destaques, filas por verbo com indicador deslizante, tabela com score, card de valor esperado com barra em gradiente, atividade recente, exportar briefing em CSV; `?k=1` abre a busca ⌘K |
| `/deal/[id]` | Vendedor | Folha do deal: status, vendedor, datas, tags, conta, o que fazer, posição na curva; card do valor esperado; linha do tempo de como o score foi montado; registrar próxima ação |
| `/equipe` | Gerente / RevOps | Vendedores por valor esperado, composição do pipeline por fila, win rate com IC 95%; filtro por gerente (árvore na sidebar) e escritório |
| `/metodo` | Quem defende o número | Stepper com os 4 passos do score, card de validação, AUC do que prevê e do que não, limites, API, reprodução |
| `/dados` | Time de dados | Integridade do CRM, tickets típicos, os dois problemas que definem o pipeline |
| `GET /api/score/[id]` | CRM / bot | Score e explicação de um deal, pela mesma função que a interface usa |

```
solution/003-lead-scorer/
├── README.md
├── analysis/
│   ├── build-db.mjs                 # 4 CSVs → SQLite (node:sqlite, zero deps)
│   └── score.mjs                    # normalização, split temporal, curva, filas, score → scores.json
├── data/  raw/ · scores.json        # o .db é gerado, não versionado
└── platform/                        # Next.js 15
    ├── app/  page · deal/[id] · equipe · metodo · dados · api/score/[id]
    ├── components/
    │   ├── layout/   Sidebar (mínima; árvore de gerentes, ⋮ preferências) · Cmdk (⌘K: filtros, recentes, ações, arquivos)
    │   ├── ui/       Icons · Reveal (entrada + contador SSR-first) · Seg (indicador deslizante) · Avatar
    │   ├── charts/   Curva · WinCI · Auc · Ring · Stack — todos animados
    │   ├── pipeline/ Pipeline (home)
    │   ├── deal/     Deal (folha + card + linha do tempo + notas)
    │   ├── equipe/   Team
    │   └── metodo/   Steps (stepper)
    └── lib/  data.js · explain.js (explicação compartilhada UI/API) · fmt.js

process-log/003-lead-scorer/         # narrativa + screenshots
```

### Como rodar

```bash
cd analysis && node build-db.mjs && node score.mjs
cd ../platform && npm install && npm run dev
# http://localhost:3000  ·  API: http://localhost:3000/api/score/<id>
```

Requer **Node 22+**. A análise não tem dependências; o app tem só Next e React.

### Lógica de scoring

| Passo | Fonte | Exemplo (deal 1LY8CAXD) |
|---|---|---|
| Ticket típico do produto | mediana dos ganhos | GTK 500 → US$ 25.897 |
| P(ganhar \| idade) | curva condicional, 5 faixas | dia 95 → 71% |
| Janela de ação | fase do ciclo | Fechar → × 1,2 |
| Score | posição entre os 2.089 abertos | 100 / 100 |

Filas: **Fechar** (Engaging 60–138 d, ×1,2) · **Acompanhar** (< 60 d, ×0,9) · **Engajar** (Prospecting, ×0,7) · **Decidir** (> 138 d, ×0,6). Os multiplicadores são heurísticas declaradas em `score.mjs`.

### Checklist do brief — o que foi pedido, o que foi entregue

| Pedido | Status | Onde |
|---|---|---|
| Precisa **rodar** | ✅ | `npm run dev`; 7 rotas + API respondendo |
| Usar os **dados reais** | ✅ | 8.800 oportunidades, 4 tabelas, normalizadas |
| **Lógica de scoring**, não só ordenar por valor | ✅ | Ticket × P(idade) × janela; validada em split temporal |
| Vendedor entende **por que** | ✅ | Linha do tempo do score + ação escrita em cada deal; explicação também na API |
| **Setup** documentado | ✅ | Acima |
| **Lógica** documentada | ✅ | Acima + `/metodo` no app |
| **Limitações** documentadas | ✅ | Abaixo + `/metodo#limites` |
| **Process log** | ✅ | `process-log/003-lead-scorer/` |
| Bonus: filtro por **vendedor / manager / região** | ✅ | Persona, gerente (árvore), escritório |
| Interface **ajuda a decidir**, não só mostra dados | ✅ | Filas por verbo, "Comece por aqui", ação por deal, exportar briefing |
| "API que recebe um deal e retorna score + explicação" (exemplo válido no brief) | ✅ | `GET /api/score/[id]` |
| Modelo de ML (XGBoost etc.) | ⛔ deliberado | Não há sinal fora da amostra para treinar; ver `/metodo` passo 4 |
| Bot Slack/e-mail | ➖ não feito | A API deixa pronto: uma chamada por vendedor. Fora do tempo |
| Escrita no CRM | ➖ não feito | Notas ficam no navegador; app é read-only sobre o snapshot |

### Resultados / Findings

| # | Achado | Evidência |
|---|---|---|
| 1 | "Quem" não prevê fechamento | AUC no teste: agente 0,51 · produto 0,49 · setor 0,49 · conta 0,48 |
| 2 | Idade prevê, ao contrário da intuição | P(ganhar) de 63% (dia 0) a 75% (dia 120+); AUC 0,56; calibração dentro de 3 pp |
| 3 | 81% do Engaging está além do ciclo máximo | 1.291 deals com mais de 138 dias; nenhum deal fechou depois disso |
| 4 | 68% do pipeline aberto não tem conta | 1.425 deals; zero fechados sem conta |
| 5 | O vendedor de maior "valor esperado" tem zero para fechar | Darcel Schlecht: 194 abertos, 83 zumbis, 134 sem conta |
| 6 | Diferenças de win rate entre vendedores cabem no erro | IC 95% de quase todos cruza a média |

### Recomendações

1. **Trabalhar por fila, não por valor.** Segunda: os 3 de "Comece por aqui", depois Fechar. Decidir é limpeza semanal.
2. **Higiene do CRM antes de meta.** Baixa (ou confirmação) nos 1.291 além do ciclo; conta nos 1.425 sem conta.
3. **Não ranquear vendedores por win rate.** Ranquear pela composição do pipeline diz mais.
4. **Registrar o que acontece no deal.** Sem isso nenhum score passa de AUC 0,56 — o limite é do dado.

### Limitações

- **Não prevê quem ganha.** AUC 0,56 é modesto; o score ordena onde investir tempo.
- **Além do dia 138 não há histórico.** Para 1.291 deals a probabilidade é a da última faixa, com ×0,6 sinalizando incerteza.
- **Multiplicadores heurísticos.** Declarados, não ajustados.
- **Snapshot, não CRM vivo.** Notas ficam no navegador; em produção gravariam no CRM e `node score.mjs` recalcularia a cada carga.
- **Payload.** Os 2.089 deals vão ao cliente para filtrar sem ida ao servidor (~300 KB). Em produção, paginar no servidor.

---

## Process Log — Como usei IA

> Narrativa completa em [`process-log/003-lead-scorer/README.md`](../../process-log/003-lead-scorer/README.md).

### Ferramentas usadas

| Ferramenta | Para que usei |
|---|---|
| Claude Code (Fable 5.1) | Exploração via SQL, validação temporal e AUC, construção e reconstrução do app, revisão por screenshot |
| SQLite (`node:sqlite`) | Cruzamento das 4 tabelas |
| Headless Edge | Screenshots em desktop e mobile (via iframe) para revisar o próprio design |

### Workflow

1. Integridade primeiro: produto duplicado, setor com typo, deals sem conta.
2. Split temporal e AUC por fator antes de escolher features.
3. Curva P(ganhar | idade), calibração, filas por verbo.
4. Primeiro app, no vocabulário da marca. Revisão: persona padrão abria vazia; "carregando" no mobile; contadores em zero.
5. **Reconstrução completa** a partir das referências de produto: cores, estrutura de pastas, componentes, rota de deal, API, notas, preferências.
6. Revisão por screenshot e ajuste de colunas, ellipsis e mobile.

### Onde a IA errou e como corrigi

1. **Página abrindo vazia** — persona por valor esperado escolhia o vendedor com zero deals para fechar. Padrão passou a ser quem tem mais na janela; fila cai para a primeira não vazia; herói alternativo explica o pipeline sujo.
2. **"Carregando…" no mobile** — `useSearchParams` forçava render no cliente. Parâmetros lidos no servidor.
3. **Contadores em zero** — HTML já traz o valor; a animação parte dele.
4. **Gráfico em branco em painel fixo** — IntersectionObserver frágil sob `transform`; prop `imediato`.
5. **Tabela com coluna cortada** na home redesenhada — oito colunas em 760 px. Ticket migrou para o subtítulo do deal; coluna de seta removida; largura da página e da coluna lateral reajustadas.
6. **`git add -A` sem `-f`** deixou arquivos novos fora de um commit (o `.gitignore` da raiz ignora `submissions/`). Pego na conferência final.

### O que eu adicionei que a IA sozinha não faria

Recusar o modelo que o brief sugere depois de provar que não há sinal para ele; transformar o resultado negativo na tela Equipe; ler 62% do pipeline como deals mortos, não como "idade alta é bom sinal"; escrever a ação por deal em vez de mostrar um número; e reconstruir o produto inteiro quando a primeira versão estava certa no dado e errada na experiência.

---

## Evidências

- [x] Narrativa — [`process-log/003-lead-scorer/README.md`](../../process-log/003-lead-scorer/README.md)
- [x] Screenshots — [`process-log/003-lead-scorer/screenshots/`](../../process-log/003-lead-scorer/screenshots/), incluindo a primeira versão
- [x] Git history — branch `submission/fabricio-rojas`
- [x] Código comentado — `score.mjs` e `lib/explain.js`

---

_Submissão enviada em: 10/09/2026_

_Dataset: [CRM Sales Predictive Analytics](https://www.kaggle.com/datasets/agungpambudi/crm-sales-predictive-analytics) (licença CC0)._
