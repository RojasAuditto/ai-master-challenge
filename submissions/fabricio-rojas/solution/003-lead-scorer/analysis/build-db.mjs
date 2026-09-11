// CSV -> SQLite. Zero deps: node:sqlite (stdlib, Node 22+). Challenge 003 — CRM.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, '..', 'data', 'raw');
const OUT = join(here, '..', 'data', 'crm.db');

// RFC4180-ish parser: handles quoted fields, embedded commas/newlines, "" escapes.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false, i = 0;
  if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// "False"/"True" -> 0/1, "" -> null, numeric strings -> number.
const BOOL = { True: 1, False: 0, TRUE: 1, FALSE: 0, true: 1, false: 0 };
function coerce(v) {
  if (v === '' || v === 'NA' || v === 'nan' || v === 'null') return null;
  if (v in BOOL) return BOOL[v];
  if (/^-?\d+$/.test(v)) { const n = Number(v); return Number.isSafeInteger(n) ? n : v; }
  if (/^-?\d*\.\d+$/.test(v)) return Number(v);
  return v;
}

rmSync(OUT, { force: true });
mkdirSync(dirname(OUT), { recursive: true });
const db = new DatabaseSync(OUT);
db.exec('PRAGMA journal_mode = WAL');

const TABLES = {
  accounts: 'accounts.csv', products: 'products.csv', sales_teams: 'sales_teams.csv', sales_pipeline: 'sales_pipeline.csv',
};
const _old = {
  accounts: 'ravenstack_accounts.csv',
  subscriptions: 'ravenstack_subscriptions.csv',
  feature_usage: 'ravenstack_feature_usage.csv',
  support_tickets: 'ravenstack_support_tickets.csv',
  churn_events: 'ravenstack_churn_events.csv',
};

for (const [table, file] of Object.entries(TABLES)) {
  const rows = parseCSV(readFileSync(join(RAW, file), 'utf8'));
  const header = rows.shift();
  const body = rows.filter((r) => r.length === header.length);
  if (rows.length !== body.length) {
    console.warn(`  ! ${table}: ${rows.length - body.length} linha(s) com contagem de colunas divergente, descartada(s)`);
  }
  db.exec(`CREATE TABLE ${table} (${header.map((c) => `"${c}"`).join(', ')})`);
  const ins = db.prepare(
    `INSERT INTO ${table} VALUES (${header.map(() => '?').join(', ')})`
  );
  db.exec('BEGIN');
  for (const r of body) ins.run(...r.map(coerce));
  db.exec('COMMIT');
  console.log(`  ${table.padEnd(16)} ${String(body.length).padStart(6)} linhas  (${header.length} colunas)`);
}

// Índices nas chaves de join.
for (const ix of [
  'CREATE INDEX ix_pipe_agent ON sales_pipeline(sales_agent)', 'CREATE INDEX ix_pipe_acct ON sales_pipeline(account)', 'CREATE INDEX ix_pipe_prod ON sales_pipeline(product)', 'CREATE INDEX ix_pipe_stage ON sales_pipeline(deal_stage)',
]) db.exec(ix);

console.log(`\nOK -> ${OUT}`);
db.close();
