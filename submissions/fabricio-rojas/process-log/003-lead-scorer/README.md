# Process Log — Challenge 003 · Lead Scorer

Como o Lead Scorer foi construído, na ordem em que aconteceu, com os becos sem saída e as correções.

**Ferramenta principal:** Claude Code (Fable 5.1), sessão única de terminal.
**Evidência complementar:** commits na branch; screenshots em [`screenshots/`](./screenshots/).

---

## 1. Antes de qualquer código: o que os dados sustentam?

O brief pede "lógica de scoring, não só ordenar por valor" e diz que "explainability ganha". A tentação é montar features óbvias — agente, produto, setor, porte da conta — e treinar um classificador. Fiz o oposto: antes de escolher features, medi se cada uma prevê fechamento **fora da amostra**, com split temporal (treino: deals fechados até 31/08/2017; teste: os 2.620 fechados depois).

| Fator | AUC no teste |
|---|---|
| Idade do deal (P condicional) | **0,56** |
| Agente (win rate histórico) | 0,51 |
| Setor da conta | 0,49 |
| Produto | 0,49 |
| Histórico da conta | 0,48 |

Só a idade do deal carrega sinal. Tudo que é "quem" fica em 0,5: moeda ao ar. O win rate entre agentes varia de 55% a 70% no histórico — parece um driver — mas não se sustenta um mês depois: é ruído amostral. A validação por intervalo de confiança (Wilson, 95%) confirma: quase todas as faixas cruzam a média do time.

**Isso mudou o produto.** Um "preditor de fechamento" seria uma fraude educada. O que dá para construir com honestidade é um **priorizador de atenção**: o que está em jogo × a única probabilidade que existe × a fase em que a hora do vendedor rende mais.

## 2. O achado contraintuitivo que define as filas

Cruzando duração do ciclo com desfecho:

```
< 30 dias   57% ganhos
30–59       66%
60–89       66%
90–119      71%
120–138     75%
```

**Quem chega longe, fecha mais.** Perdas são rápidas (média 41 dias); vitórias demoram (52). A heurística padrão de CRM — "deal parado é deal ruim" — está invertida neste pipeline até o dia 138. Isso virou a curva P(ganhar | ainda aberto no dia t), o núcleo do score.

Mas com um limite duro: **nenhum deal na história fechou depois de 138 dias**, e 1.291 dos 1.589 deals Engaging estão além disso. Para eles não há base histórica — são, muito provavelmente, deals mortos sem baixa no CRM. Não faz sentido dar a eles uma probabilidade fingida; faz sentido colocá-los numa fila própria, **Decidir**, com a ação "confirmar se está vivo ou encerrar".

Daí as quatro filas por verbo, cada uma com um multiplicador que codifica onde a hora do vendedor rende:

| Fila | Critério | × |
|---|---|---|
| Fechar | Engaging, 60–138 dias | 1,2 |
| Acompanhar | Engaging, < 60 dias | 0,9 |
| Engajar | Prospecting | 0,7 |
| Decidir | Engaging, > 138 dias | 0,6 |

Os multiplicadores são heurísticos e estão declarados como tal no app e no código.

## 3. Dados: três problemas que teriam quebrado o score em silêncio

- **`GTXPro` vs `GTX Pro`**: o mesmo produto com dois nomes. Sem juntar, 1.480 deals ficam sem preço de catálogo e sem ticket histórico — e o score deles seria zero.
- **1.425 deals abertos sem conta** (68% do pipeline aberto). Zero deals fechados sem conta. Ou a conta é preenchida só no fechamento, ou esses deals nunca foram trabalhados. Vira flag no deal e uma ação explícita: "atribuir conta".
- `technolgy` no setor. Cosmético, mas quebra agrupamentos.

A tela **Dados do CRM** lista tudo isso com o impacto de cada item.

## 4. Onde a IA errou e como corrigi

**Erro 1 — a página abria vazia.** A persona padrão era o vendedor com maior valor esperado (Darcel Schlecht). Só que o pipeline dele é 83 deals zumbis e 134 sem conta: zero na fila "Fechar". A primeira tela do produto era uma tabela vazia. Troquei o padrão para o vendedor com mais deals na janela de fechamento, e fiz a fila cair automaticamente para a primeira não vazia ao trocar de persona. Também criei um "herói alternativo": quando não há nada para fechar, o app diz isso e aponta para a fila que tem trabalho.

O erro é bom de contar porque a métrica que eu tinha escolhido para "quem mostrar primeiro" era exatamente a que o score existe para desmentir: valor nominal inflado por deals mortos.

**Erro 2 — gráfico dentro da gaveta sem desenhar.** A curva dentro do painel lateral (`position: fixed` + `transform`) ficou em branco na captura. Já tinha visto o sintoma no challenge 001 como artefato de headless, mas aqui o IntersectionObserver dentro de um ancestral transformado é genuinamente frágil. Adicionei um `imediato` que força a renderização em contextos assim. Não custa nada e elimina uma classe de bug.

**Erro 3 — `git mv` recusado.** O servidor Next rodando em `platform/` mantinha `.next/` travado; a reestruturação de pastas falhou pela metade. Matar os processos node antes de mover resolveu; o log registra porque "permission denied" no Windows raramente é permissão.

## 5. UI: seguir as referências, não o template mental de dashboard

Todas as referências enviadas eram escuras: sidebar Riter com busca ⌘K e grupos, tabela Coinstax com pills de variação, painel de detalhe do invoice com linha do tempo de atividades. Segui-las:

- **Sidebar** no navy da marca com o logo branco oficial no quadrado, busca ⌘K real (indexa os 2.089 deals abertos; setas + Enter abrem o deal), grupos, badge com a contagem da fila "Fechar", trilho de ícones ao recolher, card do usuário no rodapé.
- **Tabela** com barra de score, pills por fila, valor esperado em dourado, hover, linha selecionada com filete dourado.
- **Gaveta do deal** no padrão do invoice: cabeçalho com pills, anel de score, "O que fazer" escrito para aquele deal, e a **linha do tempo do score** — ticket → probabilidade → janela → posição — cada passo com o número que contribuiu. É o "por quê" que o brief pede, em quatro linhas.
- **Ver como**: o seletor de persona no topo. O vendedor abre e vê o pipeline dele; o gerente troca e vê o de qualquer um, ou o time inteiro com filtros de gerente e escritório.

Animações: contadores, barras que crescem, gaveta que desliza, tabela com fade ao trocar de fila, anéis de score. Tudo respeita `prefers-reduced-motion`.

## 6. O que eu adicionei que a IA sozinha não faria

**Recusar o modelo esperado.** O brief menciona XGBoost e pede explainability. A saída fácil é treinar um modelo com dez features e explicar com SHAP. Testei primeiro se as features prevêm algo — não prevêem — e construí a ferramenta em cima do único sinal real, dizendo isso na cara do usuário ("Como funciona" e o rodapé de cada gaveta).

**Transformar o resultado negativo em produto.** "Agente não prevê fechamento" vira a tela Equipe com intervalos de confiança — um gerente que ranqueia vendedores por win rate está ranqueando ruído, e a tela mostra isso.

**Ler o pipeline como pipeline, não como dataset.** 62% dos deals abertos estão além do ciclo máximo já observado. Um modelo trataria isso como "idade alta = ótimo sinal". Um vendedor sabe que é um pipeline sujo. A fila "Decidir" é a diferença entre as duas leituras.

## 7. O que eu faria com mais tempo

- Um botão "confirmar vivo / encerrar" que grava a decisão e recalcula o pipeline — hoje o app é read-only sobre um snapshot.
- Calibrar os multiplicadores das janelas com dado de esforço (horas por deal), se existisse.
- Curva condicional por produto, se a amostra permitisse; hoje é única para não fragmentar demais.
