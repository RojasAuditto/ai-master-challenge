# Submissão — Fabrício Rojas — Challenges 001 e 003

## Sobre mim

- **Nome:** Fabrício Rojas
- **LinkedIn:** [linkedin.com/in/fabricio-silva-rojas](https://www.linkedin.com/in/fabricio-silva-rojas/)
- **Portfólio:** [rojascode.com](https://rojascode.com)
- **Challenges escolhidos:** 001 — Diagnóstico de Churn · 003 — Lead Scorer

---

## Executive Summary

Dois challenges, uma postura: **medir antes de afirmar**. Nos dois, testei em split temporal e por permutação o que os dados sustentam antes de escolher o que construir — e nos dois o resultado negativo virou o produto.

**001 — Churn (RavenStack).** O churn não é problema de retenção, é de onboarding, e piora a cada safra: 15,6% → 59,7% em 90 dias na mesma idade de conta (p < 0,0001). Nenhuma das 18 variáveis comportamentais prevê quem sai (36 testes, zero significativos). US$ 307K de ARR/ano recuperáveis. → [`solution/001-churn/`](./solution/001-churn/README.md)

**003 — Lead Scorer (CRM).** Agente, produto, setor e histórico da conta não prevêm fechamento (AUC ≈ 0,5); só a idade do deal prevê, e ao contrário da intuição. 81% do pipeline Engaging está além do ciclo máximo histórico — deals mortos sem baixa. O app prioriza atenção por filas de ação, com o porquê de cada deal. → [`solution/003-lead-scorer/`](./solution/003-lead-scorer/README.md)

---

## Como está organizado

O CONTRIBUTING define a árvore para um challenge; com dois, mantive a árvore e dividi por challenge dentro dela:

```
submissions/fabricio-rojas/
├── README.md                     # este índice
├── solution/
│   ├── 001-churn/                # README (template) · analysis · data · platform
│   └── 003-lead-scorer/          # README (template) · analysis · data · platform
└── process-log/
    ├── 001-churn/                # narrativa + screenshots
    └── 003-lead-scorer/          # narrativa + screenshots
```

Cada `solution/<challenge>/README.md` segue o template oficial na íntegra. Cada app roda com `node build-db.mjs && node <analise>.mjs` e `npm install && npm run dev`, só com Node 22+.

## Solução

| | 001 — Churn | 003 — Lead Scorer |
|---|---|---|
| Pergunta | Por que o churn subiu se uso e satisfação estão estáveis? | Onde o vendedor coloca as horas na segunda-feira? |
| Método | Coorte com censura, permutação (20.000), AUC | Split temporal, AUC por fator, curva condicional, calibração |
| Achado central | Deterioração por safra, 3,8× na mesma idade | Quem chega longe fecha mais; 81% do pipeline é zumbi |
| Resultado negativo | 0/36 preditores individuais | "Quem" não prevê fechamento |
| Entrega | App claro, 6 rotas: resposta primeiro, prova sob demanda, fila do CS, modelo de risco | App escuro no vocabulário das refs de produto: filas por verbo, página do deal com o porquê e notas, equipe com IC, stepper do método, API do score |
| Diferenciais do brief | Modelo (AUC 0,72), interativo, automação CS, análise não pedida | Roda, dados reais, score explicável, filtro por vendedor/gerente/região, API que retorna score + explicação |

### Abordagem · Resultados · Recomendações · Limitações

Estão completos, por challenge, em [`solution/001-churn/README.md`](./solution/001-churn/README.md) e [`solution/003-lead-scorer/README.md`](./solution/003-lead-scorer/README.md).

---

## Process Log — Como usei IA

### Ferramentas usadas

| Ferramenta | Para que usei |
|------------|--------------|
| Claude Code (Opus 5 / Fable 5.1) | Exploração via SQL, testes estatísticos, construção dos apps, revisão visual por screenshot |
| SQLite (`node:sqlite`) | Cruzamento das tabelas, sem dependências |
| Headless Edge | Screenshots dos apps em desktop, gaveta aberta e mobile (via iframe) |

### Workflow

Nos dois challenges: (1) integridade dos dados antes da análise; (2) testar se há sinal antes de modelar; (3) construir por audiência, não por ordem de raciocínio; (4) revisar por screenshot e corrigir em ciclo. Detalhe passo a passo em cada process log.

### Onde a IA errou e como corrigi

Registrados com o momento em que apareceram: censura ignorada (churn de 140%), gráfico que contradizia a conclusão, `Math.random()` numa análise "reproduzível", instrumento de medição errado no mobile, persona padrão que abria a tela vazia, `git mv` travado pelo servidor. Cada um em [`process-log/001-churn/`](./process-log/001-churn/README.md) e [`process-log/003-lead-scorer/`](./process-log/003-lead-scorer/README.md).

### O que eu adicionei que a IA sozinha não faria

Desconfiar do achado pronto e testá-lo; tratar o resultado nulo como achado que define estratégia; recusar o entregável sugerido quando os dados não o sustentam — e explicar por quê na interface, não só no README.

---

## Evidências

- [x] Narrativa escrita — os dois process logs
- [x] Screenshots — em cada `process-log/<challenge>/screenshots/`
- [x] Git history — branch `submission/fabricio-rojas`
- [x] Código comentado — decisões registradas no ponto em que são tomadas
- [x] Reprodução verificada — bancos apagados e análises refeitas do zero nos dois challenges; JSON gerado idêntico ao versionado

---

_Submissão enviada em: 11/09/2026_
