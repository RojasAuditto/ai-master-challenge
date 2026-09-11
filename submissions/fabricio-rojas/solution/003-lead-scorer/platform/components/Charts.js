'use client';
// SVG puro, animado ao entrar na tela. Paleta do tema escuro.
import { useState } from 'react';
import { num, usd } from '@/lib/fmt';
import { useInView } from './Reveal';

const GOLD = '#b9915b', GOLD_SOFT = '#dcc094', INK = '#f5f4f3', INK3 = '#6e7f8d', LINE = 'rgba(255,255,255,.08)';
const OK = '#4fb286', NO = '#e0705f', BLUE = '#6a9ed6', TIP = '#182a3b';
const EASE = 'cubic-bezier(.22,1,.36,1)';
const d = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

function Tip({ x, y, w = 160, linhas, W }) {
  const px = Math.min(Math.max(x - w / 2, 6), W - w - 6);
  const h = 14 + linhas.length * 15;
  const py = y - h - 10 < 0 ? y + 14 : y - h - 10;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={px} y={py} width={w} height={h} rx="8" fill={TIP} stroke="rgba(255,255,255,.12)" />
      {linhas.map((l, i) => <text key={i} x={px + 10} y={py + 19 + i * 15} fontSize="10.5" fill={i ? '#aab6c0' : INK} fontWeight={i ? 500 : 700}>{l}</text>)}
    </g>
  );
}

/* ── P(ganhar | ainda aberto no dia t) — a única curva com sinal ── */
export function CurvaChart({ curva, cicloMax, marcador, imediato = false }) {
  const [ref, vis] = useInView();
  // Dentro de painel fixo/transformado o IntersectionObserver pode não disparar: força.
  const on = imediato || vis;
  const [hov, setHov] = useState(null);
  const W = 720, H = 250, P = { t: 22, r: 20, b: 44, l: 46 };
  const x = (t) => P.l + (Math.min(t, cicloMax) / cicloMax) * (W - P.l - P.r);
  const y = (p) => P.t + (1 - (p - 0.4) / 0.45) * (H - P.t - P.b);
  // degraus: cada faixa vale de ini a fim
  const pts = [];
  curva.forEach((c) => { pts.push([x(c.ini), y(c.p)]); pts.push([x(c.fim + 1 > cicloMax ? cicloMax : c.fim + 1), y(c.p)]); });
  const L = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label={`Probabilidade de ganhar dado que o deal ainda está aberto: ${curva.map((c) => `≥${c.ini} dias ${num(c.p * 100, 0)}%`).join(', ')}.`}>
      {[0.45, 0.55, 0.65, 0.75, 0.85].map((v) => (
        <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray="3 5" /><text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{num(v * 100, 0)}%</text></g>
      ))}
      <path d={`${d(pts)} L${pts[pts.length - 1][0]} ${y(0.4)} L${pts[0][0]} ${y(0.4)} Z`} fill={GOLD} opacity={on ? .12 : 0} style={{ transition: 'opacity .8s ease .5s' }} />
      <path d={d(pts)} fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1.3s ${EASE}` }} />
      {curva.map((c, i) => (
        <g key={c.ini} onMouseEnter={() => setHov(c)} opacity={on ? 1 : 0} style={{ transition: `opacity .3s ease ${400 + i * 150}ms` }}>
          <rect x={x(c.ini)} y={P.t} width={x(Math.min(c.fim + 1, cicloMax)) - x(c.ini)} height={H - P.t - P.b} fill="transparent" />
          <circle cx={x(c.ini)} cy={y(c.p)} r={hov === c ? 6 : 4.5} fill={GOLD_SOFT} stroke="#070d14" strokeWidth="2" />
          <text x={x(c.ini) + 8} y={y(c.p) - 10} fontSize="11" fill={GOLD_SOFT} fontWeight="800">{num(c.p * 100, 0)}%</text>
        </g>
      ))}
      {marcador != null && (
        <g opacity={on ? 1 : 0} style={{ transition: 'opacity .4s ease 1.2s' }}>
          <line x1={x(marcador)} x2={x(marcador)} y1={P.t} y2={y(0.4)} stroke={BLUE} strokeDasharray="4 4" />
          <text x={x(marcador)} y={P.t - 8} fontSize="10.5" fill={BLUE} textAnchor="middle" fontWeight="700">este deal · dia {marcador}</text>
        </g>
      )}
      {[0, 30, 60, 90, 120, cicloMax].map((t) => <text key={t} x={x(t)} y={H - 22} fontSize="10" fill={INK3} textAnchor="middle">{t}</text>)}
      <text x={(P.l + W - P.r) / 2} y={H - 5} fontSize="9.5" fill={INK3} textAnchor="middle" letterSpacing=".1em" fontWeight="700">DIAS DESDE O INÍCIO DO ENGAGING</text>
      {hov && <Tip W={W} x={x(hov.ini)} y={y(hov.p)} w={210} linhas={[`Chegou ao dia ${hov.ini} ainda aberto`, `${num(hov.p * 100)}% acabaram ganhos`, `${hov.n} deals fechados nessa condição`]} />}
    </svg>
  );
}

/* ── Win rate por agente com intervalo de confiança ──────────── */
export function WinCIChart({ agentes, base }) {
  const [ref, on] = useInView();
  const [hov, setHov] = useState(null);
  const lista = [...agentes].filter((a) => a.fechados >= 20).sort((a, b) => b.win - a.win);
  const W = 720, rowH = 22, P = { t: 26, r: 24, b: 36, l: 150 }, H = P.t + P.b + lista.length * rowH;
  const x = (p) => P.l + ((p - 0.4) / 0.45) * (W - P.l - P.r);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label="Win rate histórico por agente com intervalo de confiança de 95%. Quase todos os intervalos cruzam a média do time.">
      {[0.45, 0.55, 0.65, 0.75, 0.85].map((v) => (
        <g key={v}><line x1={x(v)} x2={x(v)} y1={P.t - 6} y2={H - P.b + 6} stroke={LINE} strokeDasharray="3 5" /><text x={x(v)} y={H - P.b + 20} fontSize="10" fill={INK3} textAnchor="middle">{num(v * 100, 0)}%</text></g>
      ))}
      <line x1={x(base)} x2={x(base)} y1={P.t - 10} y2={H - P.b + 6} stroke={GOLD} strokeWidth="1.5" />
      <text x={x(base)} y={P.t - 14} fontSize="10.5" fill={GOLD_SOFT} textAnchor="middle" fontWeight="800">time · {num(base * 100)}%</text>
      {lista.map((a, i) => {
        const cy = P.t + i * rowH + rowH / 2; const [lo, hi] = a.win_ic; const cruza = lo <= base && hi >= base;
        return (
          <g key={a.agent} onMouseEnter={() => setHov({ a, cy })} opacity={on ? 1 : 0} style={{ transition: `opacity .35s ease ${i * 30}ms` }}>
            <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" />
            <text x={P.l - 10} y={cy + 3.5} fontSize="10.5" fill={hov?.a === a ? INK : '#aab6c0'} textAnchor="end" fontWeight={hov?.a === a ? 800 : 600}>{a.agent}</text>
            <line x1={x(lo)} x2={x(hi)} y1={cy} y2={cy} stroke={cruza ? '#4a5d6e' : NO} strokeWidth="2" strokeLinecap="round" />
            <circle cx={x(a.win)} cy={cy} r={hov?.a === a ? 5.5 : 4} fill={cruza ? BLUE : NO} />
          </g>
        );
      })}
      {hov && <Tip W={W} x={x(hov.a.win)} y={hov.cy} w={230} linhas={[hov.a.agent, `${num(hov.a.win * 100)}% em ${hov.a.fechados} deals fechados`, `IC 95%: ${num(hov.a.win_ic[0] * 100, 0)}–${num(hov.a.win_ic[1] * 100, 0)}%`]} />}
    </svg>
  );
}

/* ── AUC: o que prevê e o que não ────────────────────────────── */
export function AucChart({ itens }) {
  const [ref, on] = useInView();
  const W = 720, H = 24 + itens.length * 30, P = { l: 230, r: 60 };
  const x = (a) => P.l + Math.max(0, Math.min(1, (a - 0.3) / 0.5)) * (W - P.l - P.r);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`AUC no teste temporal: ${itens.map((i) => `${i.fator} ${num(i.auc, 2)}`).join('; ')}.`}>
      <line x1={x(0.5)} x2={x(0.5)} y1={6} y2={H - 14} stroke={INK3} strokeDasharray="3 3" />
      <text x={x(0.5)} y={H - 2} fontSize="9.5" fill={INK3} textAnchor="middle" fontWeight="600">0,50 = moeda ao ar</text>
      {itens.map((it, i) => {
        const cy = 18 + i * 30; const w = Math.abs(x(it.auc) - x(0.5)); const x0 = Math.min(x(0.5), x(it.auc));
        const cor = it.usado ? GOLD : Math.abs(it.auc - 0.5) < 0.03 ? '#3a4a59' : BLUE;
        return (
          <g key={it.fator}>
            <text x={P.l - 12} y={cy + 4} fontSize="11" fill={it.usado ? INK : '#8b98a2'} textAnchor="end" fontWeight={it.usado ? 800 : 600}>{it.fator}</text>
            <rect x={on ? x0 : x(0.5)} y={cy - 8} height={16} rx="5" fill={cor} width={on ? w : 0} style={{ transition: `width .8s ${EASE} ${i * 70}ms, x .8s ${EASE} ${i * 70}ms` }} />
            <text x={x(it.auc) + (it.auc >= 0.5 ? 8 : -8)} y={cy + 4} fontSize="11" fill={it.usado ? GOLD_SOFT : INK3} fontWeight="800" textAnchor={it.auc >= 0.5 ? 'start' : 'end'} opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${i * 70 + 500}ms` }}>{num(it.auc, 2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Anel de score (0–100) ───────────────────────────────────── */
export function Ring({ v, size = 52, stroke = 5, cor = GOLD }) {
  const [ref, on] = useInView();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score ${v}`} role="img">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cor} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={on ? c * (1 - v / 100) : c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: `stroke-dashoffset 1s ${EASE}` }} />
      <text x="50%" y="50%" dy="4.5" textAnchor="middle" fontSize={size * 0.3} fontWeight="800" fill={INK}>{v}</text>
    </svg>
  );
}

export { usd };
