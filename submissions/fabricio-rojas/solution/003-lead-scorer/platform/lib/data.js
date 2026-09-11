// Fonte única: scores.json, gerado por analysis/score.mjs a partir do SQLite.
// Toda a lógica de score vive lá, versionada e reproduzível; o app só apresenta.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cache;
export function scores() {
  if (!cache) cache = JSON.parse(readFileSync(join(process.cwd(), '..', 'data', 'scores.json'), 'utf8'));
  return cache;
}

/** Campos que o cliente precisa; o resto fica no servidor. */
export function dealsLeves() {
  return scores().deals.map((d) => ({
    id: d.id, agent: d.agent, manager: d.manager, office: d.office,
    account: d.account, sector: d.sector, revenue: d.revenue, employees: d.employees, pais: d.pais,
    product: d.product, stage: d.stage, engage_date: d.engage_date, dias: d.dias,
    p: d.p, ticket: d.ticket, ev: d.ev, acao: d.acao, mult: d.mult, score: d.score, flags: d.flags,
    hist: d.conta_hist,
  }));
}

export const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
