/**
 * Challenge 003 — Lead Scorer. Toda a lógica de priorização, reproduzível.
 * Rode: node build-db.mjs && node score.mjs   → data/scores.json
 *
 * O que os dados sustentam (validado em split temporal):
 *  - Produto, agente e histórico da conta NÃO prevêm fechamento fora da amostra (AUC ≈ 0,5).
 *  - A idade do deal prevê: quem chega longe fecha mais (perdas são rápidas). AUC ≈ 0,57.
 * Portanto o score não finge prever "quem ganha". Ele prioriza ATENÇÃO:
 *  valor em jogo × probabilidade condicional à idade × janela de ação.
 */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(here, '..', 'data', 'crm.db'), { readOnly: true });
const q = (sql, ...p) => db.prepare(sql).all(...p);
const one = (sql, ...p) => db.prepare(sql).get(...p);
const log = (...a) => console.log(...a);

// ── Normalização: dois nomes para o mesmo produto, um setor com typo ────────
const PRODUTO = { GTXPro: 'GTX Pro' };
const SETOR = { technolgy: 'technology' };
const np = (p) => PRODUTO[p] ?? p;
const ns = (s) => (s == null ? null : SETOR[s] ?? s);

const ASOF = one(`SELECT MAX(close_date) d FROM sales_pipeline`).d;
const dias = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const pipeline = q(`
  SELECT p.opportunity_id id, p.sales_agent agent, t.manager, t.regional_office office,
         p.account, a.sector, a.revenue, a.employees, a.office_location pais, a.subsidiary_of matriz,
         p.product, p.deal_stage stage, p.engage_date, p.close_date, p.close_value
  FROM sales_pipeline p
  JOIN sales_teams t ON t.sales_agent = p.sales_agent
  LEFT JOIN accounts a ON a.account = p.account`);
for (const r of pipeline) { r.produto_original = r.product; r.product = np(r.product); r.sector = ns(r.sector); }

const fechados = pipeline.filter((r) => r.stage === 'Won' || r.stage === 'Lost')
  .map((r) => ({ ...r, y: r.stage === 'Won' ? 1 : 0, dur: dias(r.engage_date, r.close_date) }));
const abertos = pipeline.filter((r) => r.stage === 'Engaging' || r.stage === 'Prospecting');
const baseWin = fechados.reduce((s, r) => s + r.y, 0) / fechados.length;
const cicloMax = Math.max(...fechados.map((r) => r.dur));

// ── Ticket por produto: mediana do que foi ganho (catálogo como fallback) ───
const catalogo = Object.fromEntries(q(`SELECT product, sales_price FROM products`).map((r) => [np(r.product), r.sales_price]));
const mediana = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const ticket = {};
for (const prod of new Set(pipeline.map((r) => r.product))) {
  const won = fechados.filter((r) => r.product === prod && r.y).map((r) => r.close_value);
  ticket[prod] = { ticket: won.length >= 5 ? Math.round(mediana(won)) : catalogo[prod] ?? 0, n_won: won.length, catalogo: catalogo[prod] ?? null };
}

// ── Probabilidade condicional à idade: P(ganhar | ainda aberto no dia t) ────
// Entre os fechados que chegaram ao dia t sem fechar, que fração ganhou?
const FAIXAS = [[0, 29], [30, 59], [60, 89], [90, 119], [120, cicloMax]];
function curva(base) {
  return FAIXAS.map(([ini, fim]) => {
    const el = base.filter((r) => r.dur >= ini);
    const p = el.length ? el.reduce((s, r) => s + r.y, 0) / el.length : baseWin;
    return { ini, fim, n: el.length, p: +p.toFixed(3) };
  });
}
const pCond = (curvaRef, t) => {
  const f = curvaRef.find((x) => t >= x.ini && t <= x.fim) ?? curvaRef[curvaRef.length - 1];
  return f.p;
};

// ── Validação em split temporal ────────────────────────────────────────────
const CORTE = '2017-08-31';
const treino = fechados.filter((r) => r.close_date <= CORTE), teste = fechados.filter((r) => r.close_date > CORTE);
const curvaTreino = curva(treino);
const auc = (score, y) => { const pos = [], neg = []; score.forEach((s, i) => (y[i] ? pos : neg).push(s));
  let c = 0; for (const a of pos) for (const b of neg) c += a > b ? 1 : a === b ? 0.5 : 0; return c / (pos.length * neg.length); };
const baseTreino = treino.reduce((s, r) => s + r.y, 0) / treino.length;
const taxa = (key, k) => { const m = {}; for (const r of treino) { const g = r[key] ?? '∅'; (m[g] ??= { w: 0, n: 0 }); m[g].n++; m[g].w += r.y; }
  return (g) => { const s = m[g ?? '∅']; return s ? (s.w + k * baseTreino) / (s.n + k) : baseTreino; }; };
const fAg = taxa('agent', 50), fAc = taxa('account', 30), fPr = taxa('product', 50), fSe = taxa('sector', 50);
const yT = teste.map((r) => r.y);
const aucs = [
  { fator: 'Idade do deal (curva condicional)', auc: auc(teste.map((r) => pCond(curvaTreino, r.dur)), yT), usado: true },
  { fator: 'Agente (win rate histórico)', auc: auc(teste.map((r) => fAg(r.agent)), yT), usado: false },
  { fator: 'Produto', auc: auc(teste.map((r) => fPr(r.product)), yT), usado: false },
  { fator: 'Setor da conta', auc: auc(teste.map((r) => fSe(r.sector)), yT), usado: false },
  { fator: 'Histórico da conta', auc: auc(teste.map((r) => fAc(r.account)), yT), usado: false },
].map((x) => ({ ...x, auc: +x.auc.toFixed(3) }));
// Calibração: dentro de cada faixa, o previsto pelo treino bate com o observado no teste?
const calibracao = FAIXAS.map(([ini, fim]) => {
  const el = teste.filter((r) => r.dur >= ini);
  return { faixa: `${ini}–${fim} dias`, previsto: pCond(curvaTreino, ini), observado: el.length ? +(el.reduce((s, r) => s + r.y, 0) / el.length).toFixed(3) : null, n: el.length };
});

// ── Curva final (todos os fechados) e histórico por conta / agente ─────────
const curvaFinal = curva(fechados);
const porConta = {};
for (const r of fechados) { if (!r.account) continue; (porConta[r.account] ??= { n: 0, won: 0, valor: 0 }); porConta[r.account].n++; porConta[r.account].won += r.y; porConta[r.account].valor += r.y ? r.close_value : 0; }

// Intervalo de Wilson: mostra que a diferença entre agentes cabe no erro amostral.
const wilson = (w, n, z = 1.96) => { if (!n) return [0, 0]; const p = w / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [+((c - s) / d).toFixed(3), +((c + s) / d).toFixed(3)]; };

// ── Score por deal aberto ──────────────────────────────────────────────────
// Janela de ação: onde a hora do vendedor rende mais.
const JANELA = {
  engajar:    { mult: 0.7, rotulo: 'Engajar',    desc: 'Prospecting: ainda não começou a conversa comercial' },
  acompanhar: { mult: 0.9, rotulo: 'Acompanhar', desc: 'Engaging há menos de 60 dias: deixar amadurecer, manter contato' },
  fechar:     { mult: 1.2, rotulo: 'Fechar',     desc: 'Engaging entre 60 e 138 dias: a janela em que a taxa de fechamento é maior' },
  decidir:    { mult: 0.6, rotulo: 'Decidir',    desc: `Engaging há mais de ${cicloMax} dias: nenhum deal na história fechou depois disso — confirmar se está vivo ou encerrar` },
};
const deals = abertos.map((r) => {
  const t = r.engage_date ? dias(r.engage_date, ASOF) : null;
  const acao = r.stage === 'Prospecting' ? 'engajar' : t <= 59 ? 'acompanhar' : t <= cicloMax ? 'fechar' : 'decidir';
  const p = r.stage === 'Prospecting' ? baseWin : pCond(curvaFinal, Math.min(t, cicloMax));
  const tk = ticket[r.product]?.ticket ?? 0;
  const ev = p * tk;
  const h = r.account ? porConta[r.account] : null;
  const flags = [];
  if (!r.account) flags.push('sem_conta');
  if (t != null && t > cicloMax) flags.push('fora_do_historico');
  if (h && h.n >= 20 && h.won / h.n >= 0.68) flags.push('conta_quente');
  if (r.produto_original !== r.product) flags.push('produto_renomeado');
  return {
    id: r.id, agent: r.agent, manager: r.manager, office: r.office,
    account: r.account, sector: r.sector, revenue: r.revenue, employees: r.employees, pais: r.pais,
    product: r.product, stage: r.stage, engage_date: r.engage_date, dias: t,
    p: +p.toFixed(3), ticket: tk, ev: Math.round(ev), acao, mult: JANELA[acao].mult,
    bruto: ev * JANELA[acao].mult, flags,
    conta_hist: h ? { n: h.n, won: h.won, win: +(h.won / h.n).toFixed(2) } : null,
  };
});
// Score 0–100 = posição percentual do valor ponderado entre todos os abertos.
const ordenado = [...deals].sort((a, b) => a.bruto - b.bruto);
ordenado.forEach((d, i) => { d.score = Math.round((100 * (i + 1)) / ordenado.length); });
deals.sort((a, b) => b.bruto - a.bruto);
for (const d of deals) delete d.bruto;

// ── Agregados por agente / gerente / escritório ────────────────────────────
const agentes = q(`SELECT sales_agent agent, manager, regional_office office FROM sales_teams`).map((a) => {
  const meus = deals.filter((d) => d.agent === a.agent);
  const fech = fechados.filter((r) => r.agent === a.agent);
  const won = fech.reduce((s, r) => s + r.y, 0);
  const [lo, hi] = wilson(won, fech.length);
  const porAcao = Object.fromEntries(Object.keys(JANELA).map((k) => [k, meus.filter((d) => d.acao === k).length]));
  return {
    ...a, abertos: meus.length, pipeline: meus.reduce((s, d) => s + d.ticket, 0), ev: meus.reduce((s, d) => s + d.ev, 0),
    fechados: fech.length, won, win: fech.length ? +(won / fech.length).toFixed(3) : null, win_ic: [lo, hi],
    receita: fech.reduce((s, r) => s + (r.y ? r.close_value : 0), 0), por_acao: porAcao,
    sem_conta: meus.filter((d) => d.flags.includes('sem_conta')).length,
  };
}).sort((a, b) => b.ev - a.ev);

// ── Integridade ────────────────────────────────────────────────────────────
const integridade = [
  { problema: 'Produto com dois nomes no pipeline ("GTXPro" e "GTX Pro")', n: pipeline.filter((r) => r.produto_original === 'GTXPro').length,
    impacto: 'Sem normalizar, 1.480 deals ficam sem preço de catálogo e sem ticket histórico', severidade: 'alto' },
  { problema: 'Deals abertos sem conta associada', n: abertos.filter((r) => !r.account).length,
    impacto: `${Math.round(100 * abertos.filter((r) => !r.account).length / abertos.length)}% do pipeline aberto não pode ser trabalhado por conta nem enriquecido`, severidade: 'critico' },
  { problema: `Deals Engaging além do ciclo máximo histórico (${cicloMax} dias)`, n: deals.filter((d) => d.flags.includes('fora_do_historico')).length,
    impacto: 'Nenhum deal na história fechou depois desse prazo; provavelmente mortos sem baixa no CRM', severidade: 'critico' },
  { problema: 'Setor com grafia errada ("technolgy")', n: q(`SELECT COUNT(*) n FROM accounts WHERE sector='technolgy'`)[0].n,
    impacto: 'Quebra agrupamentos por setor', severidade: 'baixo' },
  { problema: 'Deals fechados sem conta', n: fechados.filter((r) => !r.account).length,
    impacto: 'Zero: todo deal sem conta está aberto — sugere que a conta é preenchida só no fechamento', severidade: 'info' },
];

const out = {
  gerado_em: new Date().toISOString(), asof: ASOF, corte_validacao: CORTE, ciclo_max: cicloMax,
  base: {
    total: pipeline.length, fechados: fechados.length, won: fechados.filter((r) => r.y).length, base_win: +baseWin.toFixed(3),
    abertos: abertos.length, engaging: abertos.filter((r) => r.stage === 'Engaging').length, prospecting: abertos.filter((r) => r.stage === 'Prospecting').length,
    agentes: agentes.length, gerentes: new Set(agentes.map((a) => a.manager)).size, escritorios: new Set(agentes.map((a) => a.office)).size,
    pipeline_valor: deals.reduce((s, d) => s + d.ticket, 0), pipeline_ev: deals.reduce((s, d) => s + d.ev, 0),
    por_acao: Object.fromEntries(Object.keys(JANELA).map((k) => [k, { n: deals.filter((d) => d.acao === k).length, ev: deals.filter((d) => d.acao === k).reduce((s, d) => s + d.ev, 0) }])),
  },
  janelas: JANELA, curva: curvaFinal, ticket,
  validacao: { treino: treino.length, teste: teste.length, base_treino: +baseTreino.toFixed(3), aucs, calibracao },
  ciclo_por_desfecho: q(`SELECT deal_stage stage, ROUND(AVG(julianday(close_date)-julianday(engage_date)),1) media FROM sales_pipeline WHERE deal_stage IN ('Won','Lost') GROUP BY 1`),
  integridade, agentes, deals,
};
writeFileSync(join(here, '..', 'data', 'scores.json'), JSON.stringify(out));

log(`As-of ${ASOF} · ${fechados.length} fechados (win ${(100 * baseWin).toFixed(1)}%) · ${abertos.length} abertos · ciclo máx ${cicloMax}d`);
log('Curva condicional:', curvaFinal.map((c) => `≥${c.ini}d ${(100 * c.p).toFixed(0)}%`).join('  '));
log('AUC teste:', aucs.map((a) => `${a.fator.split(' ')[0]} ${a.auc}`).join(' · '));
log('Filas:', Object.entries(out.base.por_acao).map(([k, v]) => `${k} ${v.n}`).join(' · '));
log(`OK -> data/scores.json (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
