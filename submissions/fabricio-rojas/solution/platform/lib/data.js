// Fonte de dados do app. A narrativa vem do findings.json (gerado por
// analysis/findings.mjs, reproduzivel). A fila do CS consulta o SQLite ao vivo,
// para cobrir as 148 contas ativas e nao so o recorte salvo no JSON.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { usd, pct, num } from './fmt.js';

const DATA = join(process.cwd(), '..', 'data');

export function findings() {
  return JSON.parse(readFileSync(join(DATA, 'findings.json'), 'utf8'));
}

/** Fila completa de contas ativas, com hazard empirico por tempo de casa. */
export function filaCompleta() {
  const f = findings();
  const db = new DatabaseSync(join(DATA, 'ravenstack.db'), { readOnly: true });
  const rows = db.prepare(`
    WITH prim AS (SELECT account_id, MIN(churn_date) d FROM churn_events GROUP BY 1),
    ult AS (SELECT account_id, mrr_amount, plan_tier, billing_frequency,
         ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY start_date DESC) rn FROM subscriptions),
    sub AS (SELECT account_id, AVG(auto_renew_flag) auto_renew,
         AVG(CASE WHEN billing_frequency='annual' THEN 1.0 ELSE 0 END) pct_anual FROM subscriptions GROUP BY 1),
    tk AS (SELECT account_id, COUNT(*) tickets, AVG(satisfaction_score) csat FROM support_tickets GROUP BY 1),
    uso AS (SELECT s.account_id, SUM(u.usage_count) usos, MAX(u.usage_date) ultimo_uso
         FROM feature_usage u JOIN subscriptions s ON s.subscription_id=u.subscription_id GROUP BY 1)
    SELECT a.account_id, a.account_name conta, a.industry, a.country, a.referral_source canal,
      COALESCE(ult.plan_tier, a.plan_tier) plano, COALESCE(ult.mrr_amount,0) mrr,
      COALESCE(sub.pct_anual,0) pct_anual, COALESCE(sub.auto_renew,0) auto_renew,
      COALESCE(tk.tickets,0) tickets, tk.csat, COALESCE(uso.usos,0) usos, uso.ultimo_uso,
      a.signup_date, (julianday(?)-julianday(a.signup_date))/30.44 meses
    FROM accounts a
      LEFT JOIN ult ON ult.account_id=a.account_id AND ult.rn=1
      LEFT JOIN sub ON sub.account_id=a.account_id
      LEFT JOIN tk  ON tk.account_id=a.account_id
      LEFT JOIN uso ON uso.account_id=a.account_id
      LEFT JOIN prim p ON p.account_id=a.account_id
    WHERE p.account_id IS NULL`).all(f.asof);
  db.close();

  const hazard = Object.fromEntries(f.sobrevivencia.map((k) => [k.mes, k.hazard]));
  const ultimo = f.sobrevivencia[f.sobrevivencia.length - 1];
  const risco = (m) => hazard[Math.max(1, Math.min(ultimo.mes, Math.ceil(m) || 1))] ?? ultimo.hazard;
  const coorteNova = f.coortes[f.coortes.length - 1];
  const coorteBase = f.coortes[0];
  const semestre = (c) => (c < '2023-07' ? '2023-H1' : c < '2024-01' ? '2023-H2' : c < '2024-07' ? '2024-H1' : '2024-H2');

  return rows.map((r) => {
    const h = risco(r.meses);
    const coorte = semestre(r.signup_date.slice(0, 7));
    const motivos = [];
    if (r.meses <= 3) {
      motivos.push(`Está na janela crítica: ${num(r.meses)} meses de casa, fase em que ${pct(h)} das contas saem por mês`);
    } else {
      motivos.push(`${num(r.meses, 0)} meses de casa — risco mensal já estabilizado em ${pct(h)}`);
    }
    if (r.mrr >= 5000) motivos.push(`Conta de alto valor: ${usd(r.mrr)} por mês`);
    if (coorte === coorteNova.coorte && coorteNova.m3) {
      motivos.push(`Entrou na safra ${coorte}, que perde ${pct(coorteNova.m3.pct)} em 90 dias contra ${pct(coorteBase.m3.pct)} da safra ${coorteBase.coorte}`);
    }
    if (r.pct_anual < 0.3) motivos.push('Contrato majoritariamente mensal — pode sair sem fricção contratual');
    if (r.auto_renew < 0.5) motivos.push('Auto-renovação desligada na maioria das assinaturas');
    return {
      ...r,
      coorte,
      mrr: Math.round(r.mrr),
      meses: +r.meses.toFixed(1),
      risco_mensal_pct: h,
      arr_em_risco: Math.round(r.mrr * 12 * h / 100),
      csat: r.csat ? +r.csat.toFixed(1) : null,
      motivos,
    };
  }).sort((a, b) => b.arr_em_risco - a.arr_em_risco);
}

