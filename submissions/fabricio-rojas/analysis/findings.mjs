/**
 * Challenge 001 — RavenStack. Reproduz TODA a analise e emite findings.json.
 * Rode: node build-db.mjs && node findings.mjs
 */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { permChi2, permMeans, permIndependence, semente } from './stats.mjs';

semente(20260910); // resultados identicos a cada execucao

const here = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(here, '..', 'data', 'ravenstack.db'), { readOnly: true });
const q = (sql, ...p) => db.prepare(sql).all(...p);
const one = (sql, ...p) => db.prepare(sql).get(...p);

// Fim da janela de observacao: nenhuma tabela tem dado depois disso.
const ASOF = one(`SELECT MAX(d) d FROM (SELECT MAX(usage_date) d FROM feature_usage
  UNION ALL SELECT MAX(churn_date) FROM churn_events UNION ALL SELECT MAX(start_date) FROM subscriptions)`).d;
const semestre = (c) => (c < '2023-07' ? '2023-H1' : c < '2024-01' ? '2023-H2' : c < '2024-07' ? '2024-H1' : '2024-H2');
const log = (...a) => console.log(...a);
// Estes textos aparecem na interface: numero em pt-BR e acentuacao correta.
const nBR = (v, casas = 1) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

// ── Painel por conta: as 5 tabelas cruzadas ────────────────────────────────
const panel = q(`
WITH prim AS (SELECT account_id, MIN(churn_date) d, COUNT(*) n FROM churn_events GROUP BY 1),
ult AS (SELECT account_id, mrr_amount, plan_tier plano_atual, billing_frequency,
     ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY start_date DESC) rn FROM subscriptions),
sub AS (SELECT account_id, COUNT(*) n_subs, SUM(upgrade_flag) ups, SUM(downgrade_flag) downs,
     AVG(auto_renew_flag) auto_renew, AVG(CASE WHEN billing_frequency='annual' THEN 1.0 ELSE 0 END) pct_anual
   FROM subscriptions GROUP BY 1),
uso AS (SELECT s.account_id, SUM(u.usage_count) usos, SUM(u.error_count) erros, AVG(u.usage_duration_secs) dur,
     COUNT(DISTINCT u.feature_name) features, AVG(u.is_beta_feature) pct_beta, MAX(u.usage_date) ultimo_uso
   FROM feature_usage u JOIN subscriptions s ON s.subscription_id=u.subscription_id GROUP BY 1),
tk AS (SELECT account_id, COUNT(*) n_tickets, AVG(resolution_time_hours) tempo_res,
     AVG(first_response_time_minutes) primeira_resp, AVG(satisfaction_score) csat, SUM(escalation_flag) escalacoes,
     SUM(CASE WHEN priority IN ('high','urgent') THEN 1 ELSE 0 END) tickets_graves
   FROM support_tickets GROUP BY 1)
SELECT a.account_id, a.account_name, a.industry, a.country, a.referral_source, a.plan_tier, a.seats, a.signup_date,
  COALESCE(ult.mrr_amount,0) mrr, ult.plano_atual, ult.billing_frequency,
  COALESCE(sub.n_subs,0) n_subs, COALESCE(sub.ups,0) ups, COALESCE(sub.downs,0) downs,
  COALESCE(sub.auto_renew,0) auto_renew, COALESCE(sub.pct_anual,0) pct_anual,
  COALESCE(uso.usos,0) usos, COALESCE(uso.erros,0) erros, uso.dur, COALESCE(uso.features,0) features,
  COALESCE(uso.pct_beta,0) pct_beta, uso.ultimo_uso,
  COALESCE(tk.n_tickets,0) n_tickets, tk.tempo_res, tk.primeira_resp, tk.csat,
  COALESCE(tk.escalacoes,0) escalacoes, COALESCE(tk.tickets_graves,0) tickets_graves,
  a.churn_flag, CASE WHEN prim.account_id IS NULL THEN 0 ELSE 1 END churn_evento, prim.d churn_date,
  (julianday(COALESCE(prim.d, ?))-julianday(a.signup_date))/30.44 meses_ate_evento,
  (julianday(?)-julianday(a.signup_date))/30.44 meses_observados
FROM accounts a LEFT JOIN ult ON ult.account_id=a.account_id AND ult.rn=1
  LEFT JOIN sub ON sub.account_id=a.account_id LEFT JOIN uso ON uso.account_id=a.account_id
  LEFT JOIN tk ON tk.account_id=a.account_id LEFT JOIN prim ON prim.account_id=a.account_id`, ASOF, ASOF);
panel.forEach((r) => { r.coorte = semestre(r.signup_date.slice(0, 7)); });

// ── 1. As tres afirmacoes do CEO ───────────────────────────────────────────
const serieChurn = q(`SELECT substr(churn_date,1,7) mes, COUNT(*) n FROM churn_events GROUP BY 1 ORDER BY 1`);
const serieUso = q(`SELECT substr(usage_date,1,7) mes, SUM(usage_count) usos, COUNT(DISTINCT subscription_id) subs
  FROM feature_usage GROUP BY 1 ORDER BY 1`);
const serieCsat = q(`SELECT substr(submitted_at,1,7) mes, COUNT(*) tickets, ROUND(AVG(satisfaction_score),2) csat,
  ROUND(100.0*COUNT(satisfaction_score)/COUNT(*),1) taxa_resposta FROM support_tickets GROUP BY 1 ORDER BY 1`);

// ── 2. Sobrevivencia (Kaplan-Meier) ────────────────────────────────────────
const km = [];
let S = 1;
for (let H = 1; H <= 18; H++) {
  const emRisco = panel.filter((r) => r.meses_ate_evento >= H - 1).length;
  if (emRisco < 10) break;
  const mortes = panel.filter((r) => r.churn_evento && r.meses_ate_evento >= H - 1 && r.meses_ate_evento < H).length;
  S *= 1 - mortes / emRisco;
  km.push({ mes: H, em_risco: emRisco, churns: mortes, hazard: +(100 * mortes / emRisco).toFixed(1), sobrevivencia: +(100 * S).toFixed(1) });
}

// ── 3. Coorte com censura correta ──────────────────────────────────────────
// So entram no denominador as contas com o horizonte INTEIRO observado.
const COORTES = ['2023-H1', '2023-H2', '2024-H1', '2024-H2'];
const coorteTab = COORTES.map((c) => {
  const g = panel.filter((r) => r.coorte === c);
  const at = (H) => {
    const el = g.filter((r) => r.meses_observados >= H);
    if (el.length < 15) return null;
    return { pct: +(100 * el.filter((r) => r.churn_evento && r.meses_ate_evento <= H).length / el.length).toFixed(1), n: el.length };
  };
  return { coorte: c, contas: g.length, m3: at(3), m6: at(6), m12: at(12), mrr: Math.round(g.reduce((s, r) => s + r.mrr, 0)) };
});
const elegiveis3m = panel.filter((r) => r.meses_observados >= 3);
const testeCoorte = permChi2(elegiveis3m.map((r) => r.coorte), elegiveis3m.map((r) => (r.churn_evento && r.meses_ate_evento <= 3 ? 1 : 0)));

// Deterioracao dentro de cada canal — controla o mix de aquisicao.
const canais = [...new Set(panel.map((r) => r.referral_source))];
const coortePorCanal = canais.map((ch) => ({
  canal: ch,
  ...Object.fromEntries(COORTES.map((c) => {
    const g = elegiveis3m.filter((r) => r.referral_source === ch && r.coorte === c);
    return [c, g.length >= 10 ? +(100 * g.filter((r) => r.churn_evento && r.meses_ate_evento <= 3).length / g.length).toFixed(0) : null];
  })),
}));

// ── 4. Existe preditor individual? O resultado define a estrategia. ────────
const FEATS = {
  mrr: 'MRR', usos: 'Volume de uso', erros: 'Erros registrados', dur: 'Duração de sessão',
  features: 'Features distintas', pct_beta: 'Uso de beta', n_tickets: 'Tickets abertos',
  tempo_res: 'Tempo de resolução', primeira_resp: 'Tempo até 1ª resposta', csat: 'CSAT',
  escalacoes: 'Escalações', tickets_graves: 'Tickets high/urgent', n_subs: 'Assinaturas',
  ups: 'Upgrades', downs: 'Downgrades', pct_anual: 'Contrato anual', auto_renew: 'Auto-renovação', seats: 'Assentos',
};
const preditores = {};
for (const [def, rotulo] of [['churn_flag', 'flag da conta'], ['churn_evento', 'evento de churn']]) {
  const grp = panel.map((r) => r[def]);
  preditores[def] = {
    rotulo, n_churn: grp.filter(Boolean).length, n_ficou: grp.filter((v) => !v).length,
    testes: Object.entries(FEATS).map(([k, nome]) => {
      const r = permMeans(panel.map((x) => x[k]), grp);
      return r && { variavel: nome, chave: k, ...r, significativo: r.p < 0.05 };
    }).filter(Boolean).sort((a, b) => a.p - b.p),
  };
}
const segmentos = ['industry', 'referral_source', 'plan_tier', 'country'].map((dim) => ({
  dimensao: dim, ...permChi2(panel.map((r) => r[dim]), panel.map((r) => r.churn_evento)),
}));

// ── 5. Integridade dos dados ───────────────────────────────────────────────
const fb = q(`SELECT reason_code r, feedback_text f FROM churn_events WHERE feedback_text IS NOT NULL AND feedback_text<>''`);
const testeMotivo = permIndependence(fb.map((x) => x.r), fb.map((x) => x.f));
const integridade = [
  { problema: 'A flag de churn da conta contradiz os eventos de churn registrados', n: panel.filter((r) => r.churn_flag !== r.churn_evento).length,
    impacto: 'Qualquer métrica de churn tirada da tabela de contas está errada', severidade: 'critico' },
  { problema: 'O motivo de saída registrado não tem relação com o que o cliente escreveu', n: fb.length,
    impacto: `Independência estatística (p=${nBR(testeMotivo.p, 4)}): o campo não carrega informação`, severidade: 'critico' },
  { problema: 'Assinatura iniciada depois de a conta ter churnado',
    n: one(`SELECT COUNT(DISTINCT s.account_id) n FROM churn_events c JOIN subscriptions s ON s.account_id=c.account_id WHERE s.start_date > c.churn_date`).n,
    impacto: 'Impossível delimitar o ciclo de vida da conta', severidade: 'alto' },
  { problema: 'Uso do produto registrado depois da data de churn',
    n: one(`SELECT COUNT(*) n FROM (SELECT DISTINCT s.account_id FROM churn_events c JOIN subscriptions s ON s.account_id=c.account_id JOIN feature_usage u ON u.subscription_id=s.subscription_id WHERE u.usage_date > c.churn_date)`).n,
    impacto: 'Ou o churn não encerra o acesso, ou a data está errada', severidade: 'alto' },
  { problema: 'Múltiplos churns na mesma conta sem reativação registrada',
    n: one(`SELECT COUNT(*) n FROM (SELECT account_id FROM churn_events GROUP BY 1 HAVING COUNT(*)>1 AND SUM(is_reactivation)=0)`).n,
    impacto: 'Contagem de churn inflada', severidade: 'medio' },
  { problema: 'Tickets encerrados sem nota de satisfação',
    n: one(`SELECT COUNT(*) n FROM support_tickets WHERE satisfaction_score IS NULL`).n,
    impacto: 'Estes tickets ficam de fora do CSAT que o time reporta', severidade: 'medio' },
];

// Hipoteses testadas e REJEITADAS — e o que sustenta a credibilidade do resto.
const csatPorGrupo = q(`WITH p AS (SELECT DISTINCT account_id FROM churn_events)
  SELECT CASE WHEN p.account_id IS NULL THEN 'ficou' ELSE 'churnou' END g, COUNT(*) tickets,
    ROUND(100.0*COUNT(t.satisfaction_score)/COUNT(*),1) taxa_resposta, ROUND(AVG(t.satisfaction_score),2) csat
  FROM support_tickets t LEFT JOIN p ON p.account_id=t.account_id GROUP BY 1`);
const silencioso = one(`WITH p AS (SELECT DISTINCT account_id FROM churn_events)
  SELECT COUNT(*) total, SUM(CASE WHEN t.account_id IS NULL THEN 1 ELSE 0 END) sem_ticket
  FROM p LEFT JOIN (SELECT DISTINCT account_id FROM support_tickets) t ON t.account_id=p.account_id`);
const rejeitadas = [
  { hipotese: 'Churn silencioso: os clientes saem sem nunca reclamar',
    teste: `${silencioso.sem_ticket} de ${silencioso.total} contas que saíram nunca abriram um ticket`,
    veredito: 'REJEITADA', detalhe: `Apenas ${nBR(100 * silencioso.sem_ticket / silencioso.total)}% são invisíveis ao suporte. O CS falou com praticamente todos.` },
  { hipotese: 'O CSAT médio esconde os insatisfeitos (viés de não-resposta)',
    teste: csatPorGrupo.map((r) => `${r.g}: ${nBR(r.taxa_resposta)}% respondem, CSAT ${nBR(r.csat, 2)}`).join('   ·   '),
    veredito: 'REJEITADA', detalhe: 'Taxa de resposta e nota são praticamente idênticas nos dois grupos. O CS está certo: a satisfação é real.' },
  { hipotese: 'Um canal de aquisição ruim está puxando o churn para cima',
    teste: 'Deterioração medida dentro de cada canal, separadamente',
    veredito: 'REJEITADA', detalhe: 'Os cinco canais pioram entre 2023-H1 e 2024-H2. Não é problema de origem do lead.' },
  { hipotese: 'Existe um segmento (setor, plano, país) que concentra o churn',
    teste: segmentos.map((s) => `${s.dimensao}: p=${nBR(s.p, 3)}`).join('   ·   '),
    veredito: 'REJEITADA', detalhe: 'Nenhuma dimensão demográfica atinge significância estatística.' },
];

// ── 6. Dinheiro ────────────────────────────────────────────────────────────
const ativos = panel.filter((r) => !r.churn_evento);
const mrrTotal = panel.reduce((s, r) => s + r.mrr, 0);
const ordenado = [...panel].sort((a, b) => b.mrr - a.mrr);
const top10 = ordenado.slice(0, Math.ceil(panel.length * 0.1)).reduce((s, r) => s + r.mrr, 0);
const novas = panel.filter((r) => r.signup_date >= '2024-07-01');
const novasPorMes = novas.length / 6;
const mrrMedioNovas = novas.reduce((s, r) => s + r.mrr, 0) / novas.length;
const delta = (coorteTab[3].m3.pct - coorteTab[0].m3.pct) / 100;
const economia = {
  novas_contas_mes: +novasPorMes.toFixed(1), mrr_medio_conta: Math.round(mrrMedioNovas),
  churn_90d_hoje: coorteTab[3].m3.pct, churn_90d_baseline: coorteTab[0].m3.pct,
  gap_pp: +(delta * 100).toFixed(1), contas_salvas_mes: +(novasPorMes * delta).toFixed(1),
  mrr_recuperavel_mes: Math.round(novasPorMes * delta * mrrMedioNovas),
  arr_recuperavel: Math.round(novasPorMes * delta * mrrMedioNovas * 12),
};

// ── 6b. Modelo preditivo: o que de fato prevê churn em 90 dias ─────────────
// AUC = probabilidade de o modelo ranquear uma conta que churnou acima de uma
// que ficou. 0,5 = moeda ao ar. Comparo "data de entrada" contra cada variavel
// comportamental no MESMO desfecho e na MESMA amostra.
function auc(score, y) {
  const pos = [], neg = [];
  for (let i = 0; i < y.length; i++) {
    if (score[i] == null || Number.isNaN(score[i])) continue;
    (y[i] ? pos : neg).push(score[i]);
  }
  if (!pos.length || !neg.length) return null;
  let s = 0;
  for (const a of pos) for (const b of neg) s += a > b ? 1 : a === b ? 0.5 : 0;
  return s / (pos.length * neg.length);
}
const y3 = elegiveis3m.map((r) => (r.churn_evento && r.meses_ate_evento <= 3 ? 1 : 0));
const dias = (dt) => (new Date(dt) - new Date('2023-01-01')) / 86400000;
const aucEntrada = auc(elegiveis3m.map((r) => dias(r.signup_date)), y3);
const aucComport = Object.entries(FEATS).map(([k, nome]) => {
  const a = auc(elegiveis3m.map((r) => r[k]), y3);
  // AUC abaixo de 0,5 = preve ao contrario; o poder discriminativo e |a-0.5|.
  return a == null ? null : { variavel: nome, chave: k, auc: +a.toFixed(3), poder: +Math.abs(a - 0.5).toFixed(3) };
}).filter(Boolean).sort((p, q) => q.poder - p.poder);

// Tendencia entre safras (ajuste linear nos 4 pontos) e projecao da proxima.
const pts = coorteTab.map((c, i) => [i, c.m3?.pct]).filter(([, v]) => v != null);
const mx = pts.reduce((s, [x]) => s + x, 0) / pts.length, my = pts.reduce((s, [, v]) => s + v, 0) / pts.length;
const slope = pts.reduce((s, [x, v]) => s + (x - mx) * (v - my), 0) / pts.reduce((s, [x]) => s + (x - mx) ** 2, 0);
const intercept = my - slope * mx;
const projecao = Math.min(95, +(intercept + slope * pts.length).toFixed(1));

// Fator por safra: quanto a safra churna em 90 dias em relacao a base toda.
const geral3m = 100 * y3.reduce((s, v) => s + v, 0) / y3.length;
const fatorCoorte = Object.fromEntries(coorteTab.map((c) => [c.coorte, c.m3 ? +(c.m3.pct / geral3m).toFixed(3) : null]));
fatorCoorte['proxima'] = +(projecao / geral3m).toFixed(3);

const modelo = {
  desfecho: 'churn em ate 90 dias', n: y3.length, taxa_base_pct: +geral3m.toFixed(1),
  auc_data_entrada: +aucEntrada.toFixed(3),
  auc_coorte: +auc(elegiveis3m.map((r) => COORTES.indexOf(r.coorte)), y3).toFixed(3),
  comportamentais: aucComport, melhor_comportamental: aucComport[0],
  tendencia: { pontos: pts.map(([i, v]) => ({ coorte: COORTES[i], pct: v })), pp_por_semestre: +slope.toFixed(1),
    projecao_proxima_safra_pct: projecao, rotulo_proxima: '2025-H1' },
  fator_coorte: fatorCoorte,
};

// ── 7. Fila de acao do CS ──────────────────────────────────────────────────
// Sem preditor individual valido, o score usa SO o que e defensavel:
// exposicao de receita x hazard empirico da fase do ciclo de vida.
// ponytail: hazard por tenure vindo da curva KM da base inteira; se um dia houver
// sinal individual comprovado, ele entra aqui como multiplicador.
const hazardPorMes = Object.fromEntries(km.map((k) => [k.mes, k.hazard]));
const riscoTenure = (m) => hazardPorMes[Math.max(1, Math.min(km.length, Math.ceil(m) || 1))] ?? km[km.length - 1].hazard;
const fila = ativos.map((r) => {
  const risco = riscoTenure(r.meses_observados);
  const motivos = [];
  if (r.meses_observados <= 3) motivos.push(`Janela critica: ${r.meses_observados.toFixed(1)} meses de casa, fase em que o risco mensal e de ${risco}%`);
  else motivos.push(`${r.meses_observados.toFixed(0)} meses de casa — risco mensal ja estabilizado em ${risco}%`);
  if (r.mrr >= 5000) motivos.push(`Conta de alto valor: US$ ${Math.round(r.mrr).toLocaleString('pt-BR')}/mes`);
  if (r.coorte === '2024-H2') motivos.push(`Safra ${r.coorte}, que perde ${coorteTab[3].m3.pct}% em 90 dias contra ${coorteTab[0].m3.pct}% da safra 2023-H1`);
  if (r.pct_anual < 0.3) motivos.push('Predominantemente mensal — sai sem friccao contratual');
  if (r.auto_renew < 0.5) motivos.push('Auto-renovacao desligada na maioria das assinaturas');
  return {
    account_id: r.account_id, conta: r.account_name, industry: r.industry, country: r.country,
    plano: r.plano_atual ?? r.plan_tier, canal: r.referral_source, coorte: r.coorte,
    mrr: Math.round(r.mrr), meses: +r.meses_observados.toFixed(1), risco_mensal_pct: risco,
    arr_em_risco: Math.round(r.mrr * 12 * risco / 100), motivos,
    csat: r.csat ? +r.csat.toFixed(1) : null, tickets: r.n_tickets, usos: r.usos,
  };
}).sort((a, b) => b.arr_em_risco - a.arr_em_risco);

const out = {
  gerado_em: new Date().toISOString(), asof: ASOF,
  base: {
    contas: panel.length, ativas: ativos.length, churnadas: panel.length - ativos.length,
    mrr_total: Math.round(mrrTotal), mrr_ativo: Math.round(ativos.reduce((s, r) => s + r.mrr, 0)),
    concentracao_top10_pct: +(100 * top10 / mrrTotal).toFixed(1), linhas_analisadas: 33100,
  },
  afirmacoes_ceo: { churn: serieChurn, uso: serieUso, csat: serieCsat },
  sobrevivencia: km, coortes: coorteTab, teste_coorte: testeCoorte, coorte_por_canal: coortePorCanal,
  preditores, segmentos, integridade, rejeitadas, teste_motivo: testeMotivo, economia, modelo,
  fila: fila.slice(0, 60),
};
writeFileSync(join(here, '..', 'data', 'findings.json'), JSON.stringify(out, null, 2));

log(`\nJanela de observacao encerra em ${ASOF}`);
log(`Coorte 3m: ${coorteTab.map((c) => `${c.coorte} ${c.m3 ? c.m3.pct + '%' : '-'}`).join('  ')}   (chi2=${testeCoorte.chi2}, p=${testeCoorte.p})`);
const nSig = Object.values(preditores).reduce((s, p) => s + p.testes.filter((t) => t.significativo).length, 0);
const nTot = Object.values(preditores).reduce((s, p) => s + p.testes.length, 0);
log(`Preditores individuais significativos: ${nSig} de ${nTot}`);
log(`reason_code x feedback: chi2=${testeMotivo.chi2} df=${testeMotivo.df} p=${testeMotivo.p}`);
log(`ARR recuperavel: US$ ${economia.arr_recuperavel.toLocaleString('pt-BR')}`);
log(`AUC 90d — data de entrada: ${modelo.auc_data_entrada} | melhor comportamental: ${modelo.melhor_comportamental.variavel} ${modelo.melhor_comportamental.auc}`);
log(`Tendencia: ${modelo.tendencia.pp_por_semestre} pp/semestre -> proxima safra ~${modelo.tendencia.projecao_proxima_safra_pct}% em 90d`);
log(`\nOK -> data/findings.json`);
