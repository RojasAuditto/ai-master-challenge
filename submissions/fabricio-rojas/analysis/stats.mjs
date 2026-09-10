// Testes nao-parametricos por permutacao. Sem dependencias — evita "confie no p-valor da lib".
// PRNG com semente fixa (mulberry32). Sem isso, cada execucao daria um p-valor
// ligeiramente diferente e "reproduzivel" viraria figura de linguagem.
let _seed = 20260910;
export const semente = (n) => { _seed = n >>> 0; };
function rnd() {
  _seed = (_seed + 0x6d2b79f5) >>> 0;
  let t = _seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const mean = x => x.reduce((s, v) => s + v, 0) / x.length;
const sd = x => { const m = mean(x); return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1)); };

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } }

/** Qui-quadrado de uma tabela grupo x binario. */
function chi2Groups(labels, y, groups) {
  const N = y.length, C = y.reduce((s, v) => s + v, 0), p = C / N;
  let s = 0;
  for (const g of groups) {
    let n = 0, c = 0;
    for (let i = 0; i < N; i++) if (labels[i] === g) { n++; c += y[i]; }
    if (!n) continue;
    const e1 = n * p, e0 = n * (1 - p);
    s += (c - e1) ** 2 / e1 + ((n - c) - e0) ** 2 / e0;
  }
  return s;
}

/** H0: a taxa do desfecho binario e igual entre os grupos. */
export function permChi2(labels, y, iters = 20000) {
  const groups = [...new Set(labels)];
  const obs = chi2Groups(labels, y, groups);
  const z = y.slice();
  let ge = 0;
  for (let it = 0; it < iters; it++) { shuffle(z); if (chi2Groups(labels, z, groups) >= obs) ge++; }
  return { chi2: +obs.toFixed(2), p: +((ge + 1) / (iters + 1)).toFixed(5), groups: groups.length, n: y.length };
}

/** H0: a media da variavel e igual entre quem churnou e quem ficou. Retorna Cohen's d. */
export function permMeans(values, group, iters = 20000) {
  const pairs = values.map((v, i) => [v, group[i]]).filter(([v]) => v !== null && v !== undefined && !Number.isNaN(v));
  const a = pairs.filter(p => p[1] === 1).map(p => p[0]);
  const b = pairs.filter(p => p[1] === 0).map(p => p[0]);
  if (a.length < 5 || b.length < 5) return null;
  const obs = Math.abs(mean(a) - mean(b));
  const all = pairs.map(p => p[0]), na = a.length;
  let ge = 0;
  for (let it = 0; it < iters; it++) {
    shuffle(all);
    if (Math.abs(mean(all.slice(0, na)) - mean(all.slice(na))) >= obs) ge++;
  }
  const pooled = Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / 2) || 1;
  return { churn: +mean(a).toFixed(2), stayed: +mean(b).toFixed(2),
    d: +((mean(a) - mean(b)) / pooled).toFixed(3), p: +((ge + 1) / (iters + 1)).toFixed(4), nA: a.length, nB: b.length };
}

/** H0: as duas variaveis categoricas sao independentes. */
export function permIndependence(xs, ys, iters = 20000) {
  const X = [...new Set(xs)], Y = [...new Set(ys)], N = xs.length;
  const nX = Object.fromEntries(X.map(x => [x, xs.filter(v => v === x).length]));
  const nY = Object.fromEntries(Y.map(y => [y, ys.filter(v => v === y).length]));
  const stat = (as, bs) => {
    const o = {};
    for (let i = 0; i < N; i++) { const k = as[i] + '\u0000' + bs[i]; o[k] = (o[k] || 0) + 1; }
    let s = 0;
    for (const x of X) for (const y of Y) { const e = nX[x] * nY[y] / N; s += ((o[x + '\u0000' + y] || 0) - e) ** 2 / e; }
    return s;
  };
  const obs = stat(xs, ys), z = ys.slice();
  let ge = 0;
  for (let it = 0; it < iters; it++) { shuffle(z); if (stat(xs, z) >= obs) ge++; }
  return { chi2: +obs.toFixed(2), df: (X.length - 1) * (Y.length - 1), p: +((ge + 1) / (iters + 1)).toFixed(4), n: N };
}
