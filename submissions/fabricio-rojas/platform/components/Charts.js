'use client';
// Graficos em SVG puro. Sem biblioteca: o controle tipografico e de animacao
// importa mais aqui do que qualquer default de charting lib.
// Animam ao entrar na tela, uma vez, e respeitam prefers-reduced-motion.
import { num } from '@/lib/fmt';
import { useInView } from './Reveal';

const GOLD = '#b9915b';
const GOLD_INK = '#87642f';
const INK = '#001f35';
const INK3 = '#85929b';
const LINE = '#e6e2db';
const ALERT = '#a8382a';
const OK = '#2c7355';
const AZUL = '#4a7fa5';

const d = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** Comprimento aproximado da polilinha — para animar o traco com dasharray. */
const comprimento = (pts) =>
  pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/* ── Série temporal compacta ─────────────────────────────────── */
export function Sparkline({ dados, chave, titulo, sufixo = '', destaque = false, dominio, casas = 0 }) {
  const [ref, on] = useInView();
  const W = 300, H = 108, P = { t: 14, r: 8, b: 20, l: 8 };
  const vals = dados.map((x) => x[chave]).filter((v) => v != null);
  const min = dominio ? dominio[0] : Math.min(...vals);
  const max = dominio ? dominio[1] : Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, dados.length - 1);
  const y = (v) => P.t + (1 - (v - min) / span) * (H - P.t - P.b);
  const pts = dados.map((r, i) => [x(i), y(r[chave])]);
  const cor = destaque ? ALERT : AZUL;
  const primeiro = dados[0][chave], ultimo = dados[dados.length - 1][chave];
  const varia = primeiro ? ((ultimo - primeiro) / primeiro) * 100 : 0;
  const L = comprimento(pts);

  return (
    <div className="card" ref={ref} style={{ padding: '16px 16px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{titulo}</div>
        <div className={`tag ${destaque ? 'no' : 'flat'}`}>{varia >= 0 ? '+' : ''}{num(varia, 0)}%</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${titulo}: variação de ${num(varia, 0)}% no período.`}>
        <path d={`${d(pts)} L${x(dados.length - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`}
          fill={cor} opacity={on ? 0.1 : 0} style={{ transition: 'opacity .7s ease .4s' }} />
        <path d={d(pts)} fill="none" stroke={cor} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={L} strokeDashoffset={on ? 0 : L}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }} />
        <circle cx={x(dados.length - 1)} cy={y(ultimo)} r="3.5" fill={cor}
          opacity={on ? 1 : 0} style={{ transition: 'opacity .3s ease 1s' }} />
        <text x={P.l} y={H - 5} fontSize="9" fill={INK3}>{dados[0].mes}</text>
        <text x={W - P.r} y={H - 5} fontSize="9" fill={INK3} textAnchor="end">{dados[dados.length - 1].mes}</text>
      </svg>
      <div style={{ fontSize: 12, color: INK3, borderTop: `1px solid ${LINE}`, paddingTop: 8, marginTop: 2 }}>
        {num(primeiro, casas)}{sufixo} <span style={{ opacity: 0.5 }}>→</span>{' '}
        <strong style={{ color: destaque ? ALERT : INK }}>{num(ultimo, casas)}{sufixo}</strong>
      </div>
    </div>
  );
}

/* ── O gráfico central: churn na mesma idade, por safra ─────────
   Barras e não linhas: cada safra tem janela de observação diferente, e em
   linhas a safra mais antiga (com mais tempo para churnar) aparecia no topo,
   sugerindo o oposto da conclusão. Barras comparam o comparável. */
export function CoorteChart({ coortes }) {
  const [ref, on] = useInView();
  const W = 720, H = 336, P = { t: 54, r: 20, b: 58, l: 50 };
  const series = [
    { chave: 'm3', rotulo: '90 dias', cor: ALERT },
    { chave: 'm6', rotulo: '6 meses', cor: GOLD },
    { chave: 'm12', rotulo: '12 meses', cor: AZUL },
  ];
  const maxY = 80;
  const gw = (W - P.l - P.r) / coortes.length;
  const bw = Math.min(34, (gw - 26) / series.length);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const base = y(0);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Churn por safra de entrada, medido na mesma idade de conta. Em 90 dias: ${coortes.map((c) => `${c.coorte} ${c.m3 ? num(c.m3.pct) + '%' : 'sem dado'}`).join('; ')}.`}>
      {series.map((s, i) => (
        <g key={s.chave}>
          <rect x={P.l + i * 96} y={16} width={11} height={11} rx="3" fill={s.cor} />
          <text x={P.l + i * 96 + 17} y={25.5} fontSize="11" fill={INK3} fontWeight="600">{s.rotulo}</text>
        </g>
      ))}
      {[0, 20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '3 5' : ''} />
          <text x={P.l - 10} y={y(v) + 3.5} fontSize="10.5" fill={INK3} textAnchor="end">{v}%</text>
        </g>
      ))}
      {coortes.map((c, ci) => {
        const x0 = P.l + ci * gw + (gw - bw * series.length) / 2;
        return (
          <g key={c.coorte}>
            {series.map((s, si) => {
              const v = c[s.chave];
              const bx = x0 + si * bw;
              const atraso = ci * 110 + si * 55;
              if (!v) {
                return (
                  <text key={s.chave} x={bx + bw / 2} y={base - 8} fontSize="8.5" fill="#bdb6ab"
                    textAnchor="start" transform={`rotate(-90 ${bx + bw / 2} ${base - 8})`}
                    opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${atraso + 300}ms` }}>
                    sem {s.rotulo} ainda
                  </text>
                );
              }
              return (
                <g key={s.chave}>
                  <rect x={bx + 2} width={bw - 4} rx="3" fill={s.cor}
                    y={on ? y(v.pct) : base} height={on ? base - y(v.pct) : 0}
                    style={{ transition: `y .75s cubic-bezier(.22,1,.36,1) ${atraso}ms, height .75s cubic-bezier(.22,1,.36,1) ${atraso}ms` }} />
                  <text x={bx + bw / 2} y={y(v.pct) - 7} fontSize="10.5" fill={s.cor}
                    textAnchor="middle" fontWeight="800"
                    opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${atraso + 500}ms` }}>
                    {num(v.pct, 0)}%
                  </text>
                </g>
              );
            })}
            <text x={P.l + ci * gw + gw / 2} y={H - 32} fontSize="12" fill={INK} textAnchor="middle" fontWeight="700">
              {c.coorte}
            </text>
            <text x={P.l + ci * gw + gw / 2} y={H - 19} fontSize="9.5" fill={INK3} textAnchor="middle">
              {c.contas} contas
            </text>
          </g>
        );
      })}
      <line x1={P.l} x2={W - P.r} y1={base} y2={base} stroke={LINE} />
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="9.5" fill={INK3} textAnchor="middle"
        letterSpacing="0.12em" fontWeight="700">SAFRA DE ENTRADA</text>
    </svg>
  );
}

/* ── Curva de sobrevivência ──────────────────────────────────── */
export function SobrevivenciaChart({ km }) {
  const [ref, on] = useInView();
  const W = 720, H = 250, P = { t: 18, r: 20, b: 42, l: 44 };
  const maxX = km[km.length - 1].mes;
  const x = (m) => P.l + ((m - 1) * (W - P.l - P.r)) / (maxX - 1);
  const y = (v) => P.t + (1 - v / 100) * (H - P.t - P.b);
  const pts = km.map((k) => [x(k.mes), y(k.sobrevivencia)]);
  const meio = km.find((k) => k.sobrevivencia <= 50);
  const L = comprimento(pts);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Curva de sobrevivência das contas: metade sai até o mês ${meio?.mes}.`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '3 5' : ''} />
          <text x={P.l - 9} y={y(v) + 3.5} fontSize="10.5" fill={INK3} textAnchor="end">{v}%</text>
        </g>
      ))}
      <path d={`${d(pts)} L${x(maxX)} ${y(0)} L${x(1)} ${y(0)} Z`} fill={GOLD}
        opacity={on ? 0.11 : 0} style={{ transition: 'opacity .8s ease .5s' }} />
      <path d={d(pts)} fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinejoin="round"
        strokeDasharray={L} strokeDashoffset={on ? 0 : L}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
      {meio && (
        <g opacity={on ? 1 : 0} style={{ transition: 'opacity .5s ease 1.2s' }}>
          <line x1={x(meio.mes)} x2={x(meio.mes)} y1={y(50)} y2={y(0)} stroke={ALERT} strokeWidth="1.3" strokeDasharray="4 4" />
          <circle cx={x(meio.mes)} cy={y(meio.sobrevivencia)} r="4.5" fill={ALERT} />
          <text x={x(meio.mes) + 11} y={y(meio.sobrevivencia) - 9} fontSize="11.5" fill={ALERT} fontWeight="800">
            metade da base sai até o mês {meio.mes}
          </text>
        </g>
      )}
      {km.filter((k) => k.mes % 3 === 0 || k.mes === 1).map((k) => (
        <text key={k.mes} x={x(k.mes)} y={H - 20} fontSize="10.5" fill={INK3} textAnchor="middle">{k.mes}</text>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="9.5" fill={INK3} textAnchor="middle"
        letterSpacing="0.12em" fontWeight="700">MESES DESDE A ASSINATURA</text>
    </svg>
  );
}

/* ── Risco mensal por idade da conta ─────────────────────────── */
export function HazardChart({ km }) {
  const [ref, on] = useInView();
  const W = 720, H = 186, P = { t: 20, r: 20, b: 40, l: 44 };
  const maxY = Math.max(...km.map((k) => k.hazard)) * 1.14;
  const bw = (W - P.l - P.r) / km.length;
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const base = y(0);
  const media = km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Risco mensal de churn por idade da conta: alto nos primeiros meses, estável depois.">
      <line x1={P.l} x2={W - P.r} y1={y(media)} y2={y(media)} stroke={INK3} strokeWidth="1" strokeDasharray="4 4"
        opacity={on ? 0.7 : 0} style={{ transition: 'opacity .5s ease 1s' }} />
      <text x={W - P.r} y={y(media) - 6} fontSize="10" fill={INK3} textAnchor="end" fontWeight="600"
        opacity={on ? 1 : 0} style={{ transition: 'opacity .5s ease 1.1s' }}>
        patamar após o 5º mês: {num(media)}%
      </text>
      {km.map((k, i) => {
        const alto = k.mes <= 3;
        const atraso = i * 40;
        return (
          <g key={k.mes}>
            <rect x={P.l + i * bw + 3} width={bw - 6} rx="3" fill={alto ? ALERT : GOLD} opacity={alto ? 1 : 0.4}
              y={on ? y(k.hazard) : base} height={on ? base - y(k.hazard) : 0}
              style={{ transition: `y .6s cubic-bezier(.22,1,.36,1) ${atraso}ms, height .6s cubic-bezier(.22,1,.36,1) ${atraso}ms` }} />
            {alto && (
              <text x={P.l + i * bw + bw / 2} y={y(k.hazard) - 6} fontSize="10.5" fill={ALERT}
                textAnchor="middle" fontWeight="800"
                opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${atraso + 400}ms` }}>
                {num(k.hazard)}%
              </text>
            )}
            <text x={P.l + i * bw + bw / 2} y={H - 22} fontSize="9.5" fill={INK3} textAnchor="middle">{k.mes}</text>
          </g>
        );
      })}
      <line x1={P.l} x2={W - P.r} y1={base} y2={base} stroke={LINE} />
      <text x={(P.l + W - P.r) / 2} y={H - 5} fontSize="9.5" fill={INK3} textAnchor="middle"
        letterSpacing="0.12em" fontWeight="700">MÊS DE VIDA DA CONTA</text>
    </svg>
  );
}

/* ── Os 36 testes contra o limiar de significância ───────────── */
export function PreditorChart({ testes }) {
  const [ref, on] = useInView();
  const W = 720, H = 312, P = { t: 26, r: 24, b: 62, l: 168 };
  const x = (p) => P.l + Math.min(1, p) * (W - P.l - P.r);
  const step = (H - P.t - P.b) / testes.length;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Nenhuma das 18 variáveis comportamentais atinge significância: todos os valores-p ficam acima de 0,05.">
      <rect x={P.l} y={P.t - 8} width={x(0.05) - P.l} height={H - P.t - P.b + 14} fill={OK} opacity="0.09" />
      <line x1={x(0.05)} x2={x(0.05)} y1={P.t - 8} y2={H - P.b + 6} stroke={OK} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={x(0.05)} y={P.t - 14} fontSize="10.5" fill={OK} textAnchor="middle" fontWeight="800">p = 0,05</text>
      <text x={x(0.05) + 8} y={H - 50} fontSize="10" fill={OK} fontWeight="600">← só aqui haveria sinal real</text>

      {testes.map((t, i) => {
        const cy = P.t + i * step + step / 2;
        const atraso = i * 45;
        return (
          <g key={t.chave}>
            <text x={P.l - 12} y={cy + 3.5} fontSize="10.5" fill={INK} textAnchor="end" fontWeight="600">{t.variavel}</text>
            <line x1={P.l} y1={cy} y2={cy} stroke={LINE} strokeWidth="1"
              x2={on ? x(t.p) : P.l} style={{ transition: `x2 .7s cubic-bezier(.22,1,.36,1) ${atraso}ms` }} />
            <circle cy={cy} r="4.5" fill={GOLD} cx={on ? x(t.p) : P.l}
              style={{ transition: `cx .7s cubic-bezier(.22,1,.36,1) ${atraso}ms` }} />
            <text y={cy + 3.5} fontSize="9.5" fill={INK3} x={on ? x(t.p) + 10 : P.l + 10}
              opacity={on ? 1 : 0}
              style={{ transition: `x .7s cubic-bezier(.22,1,.36,1) ${atraso}ms, opacity .3s ease ${atraso + 500}ms` }}>
              {num(t.p, 2)}
            </text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text key={v} x={x(v)} y={H - 34} fontSize="9.5" fill={INK3} textAnchor="middle">
          {v.toFixed(2).replace('.', ',')}
        </text>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 8} fontSize="9.5" fill={INK3} textAnchor="middle"
        letterSpacing="0.12em" fontWeight="700">VALOR-P — PROBABILIDADE DE A DIFERENÇA SER ACASO</text>
    </svg>
  );
}

/* ── Deterioração dentro de cada canal ───────────────────────── */
export function CanalChart({ dados, coortes }) {
  const [ref, on] = useInView();
  const W = 720, H = 236, P = { t: 20, r: 100, b: 42, l: 46 };
  const cs = coortes.map((c) => c.coorte);
  const maxY = 85;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (cs.length - 1);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const cores = [GOLD_INK, AZUL, OK, ALERT, '#7a5ea8'];

  const linhas = dados.map((r, i) => {
    const pts = cs.map((c, j) => [j, r[c]]).filter(([, v]) => v != null).map(([j, v]) => [x(j), y(v)]);
    const fim = cs.map((c) => r[c]).filter((v) => v != null).pop();
    return pts.length < 2 ? null : { r, i, pts, fim, ry: pts[pts.length - 1][1] };
  }).filter(Boolean).sort((a, b) => a.ry - b.ry);
  // Empurra rótulos que ficariam sobrepostos — sem isso "ads" e "event" colidem.
  const MIN = 14;
  linhas.forEach((l, k) => { if (k && l.ry - linhas[k - 1].ry < MIN) l.ry = linhas[k - 1].ry + MIN; });

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="A deterioração do churn em 90 dias acontece dentro de todos os cinco canais de aquisição.">
      {[0, 25, 50, 75].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray="3 5" />
          <text x={P.l - 9} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{v}%</text>
        </g>
      ))}
      {cs.map((c, i) => (
        <text key={c} x={x(i)} y={H - 20} fontSize="10.5" fill={INK3} textAnchor="middle" fontWeight="600">{c}</text>
      ))}
      {linhas.map(({ r, i, pts, fim, ry }) => {
        const cor = cores[i % cores.length];
        const px = pts[pts.length - 1][0], py = pts[pts.length - 1][1];
        const L = comprimento(pts);
        const atraso = i * 130;
        return (
          <g key={r.canal}>
            <path d={d(pts)} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={L} strokeDashoffset={on ? 0 : L}
              style={{ transition: `stroke-dashoffset 1s cubic-bezier(.4,0,.2,1) ${atraso}ms` }} />
            {pts.map((p, j) => (
              <circle key={j} cx={p[0]} cy={p[1]} r="3" fill={cor}
                opacity={on ? 1 : 0} style={{ transition: `opacity .3s ease ${atraso + j * 180}ms` }} />
            ))}
            <g opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${atraso + 900}ms` }}>
              <path d={`M${px + 4} ${py} L${px + 9} ${ry}`} stroke={cor} strokeWidth="1" opacity="0.45" fill="none" />
              <text x={px + 12} y={ry + 3.5} fontSize="10.5" fill={cor} fontWeight="700">{r.canal} · {fim}%</text>
            </g>
          </g>
        );
      })}
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="9.5" fill={INK3} textAnchor="middle"
        letterSpacing="0.12em" fontWeight="700">CHURN EM 90 DIAS, POR SAFRA DE ENTRADA</text>
    </svg>
  );
}
