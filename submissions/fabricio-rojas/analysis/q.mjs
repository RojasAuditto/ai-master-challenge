// Helper de exploração: node q.mjs "SELECT ..."
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const db = new DatabaseSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ravenstack.db'), { readOnly: true });
export const q = (sql, ...p) => db.prepare(sql).all(...p);
export const one = (sql, ...p) => db.prepare(sql).get(...p);
export function table(rows, title) {
  if (title) console.log(`\n--- ${title} ---`);
  if (!rows.length) return console.log('(vazio)');
  console.table(rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) =>
    [k, typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(3) : v]))));
}
if (process.argv[2]) table(q(process.argv[2]));
