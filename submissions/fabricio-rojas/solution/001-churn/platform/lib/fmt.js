// Formatacao pt-BR. Relatorio executivo em portugues nao mostra "15.6%".
export const num = (n, casas = 1) =>
  Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
export const pct = (n, casas = 1) => num(n, casas) + '%';
export const int = (n) => Math.round(Number(n)).toLocaleString('pt-BR');
export const usd = (n) => 'US$ ' + int(n);
export const usdK = (n) =>
  Math.abs(n) >= 1000 ? 'US$ ' + num(n / 1000, Math.abs(n) >= 100000 ? 0 : 1) + 'K' : usd(n);
