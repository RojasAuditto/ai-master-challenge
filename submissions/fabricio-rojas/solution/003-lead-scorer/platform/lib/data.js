// Fonte única: data/scores.json, gerado por analysis/score.mjs. Toda a lógica vive lá; o app apresenta.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cache;
export function scores() {
  if (!cache) cache = JSON.parse(readFileSync(join(process.cwd(), '..', 'data', 'scores.json'), 'utf8'));
  return cache;
}

const leve = (d) => ({
  id: d.id, agent: d.agent, manager: d.manager, office: d.office,
  account: d.account, sector: d.sector, revenue: d.revenue, employees: d.employees, pais: d.pais,
  product: d.product, stage: d.stage, engage_date: d.engage_date, dias: d.dias,
  p: d.p, ticket: d.ticket, ev: d.ev, acao: d.acao, mult: d.mult, score: d.score, flags: d.flags, hist: d.conta_hist,
});

export const dealsLeves = () => scores().deals.map(leve);
export const dealPorId = (id) => { const d = scores().deals.find((x) => x.id === id); return d ? leve(d) : null; };

/** Vendedores ordenados por quem tem mais deals na janela de fechamento — a persona padrão. */
export const agentesResumo = () => [...scores().agentes]
  .map((a) => ({ agent: a.agent, manager: a.manager, office: a.office, ev: a.ev, abertos: a.abertos, fechar: a.por_acao.fechar, decidir: a.por_acao.decidir, sem_conta: a.sem_conta }))
  .sort((x, y) => y.fechar - x.fechar || y.ev - x.ev);

export const gerentes = () => {
  const m = {};
  for (const a of scores().agentes) { (m[a.manager] ??= { nome: a.manager, n: 0, office: a.office }); m[a.manager].n++; }
  return Object.values(m).sort((a, b) => a.nome.localeCompare(b.nome));
};

export const ctxExplicacao = () => { const s = scores(); return { janelas: s.janelas, ciclo_max: s.ciclo_max, totalAbertos: s.base.abertos }; };
export const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
