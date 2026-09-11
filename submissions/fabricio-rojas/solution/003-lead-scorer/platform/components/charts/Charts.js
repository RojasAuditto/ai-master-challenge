'use client';
// SVG puro, tudo animado ao entrar na tela (traço que se desenha, barras que crescem, anel que fecha).
import { useState } from 'react';
import { num } from '@/lib/fmt';
import { useInView } from '@/components/ui/Reveal';

const LIME = '#c9f55b', LIME2 = '#8af2a2', T1 = '#f4f4f5', T3 = '#6e6e78', LINE = 'rgba(255,255,255,.08)';
const GREEN = '#4ade80', RED = '#f26d6d', BLUE = '#5b9cff', PURPLE = '#8b5cf6', TIP = '#1e2129';
const EASE = 'cubic-bezier(.22,1,.36,1)';
const d = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

function Tip({ x, y, w = 170, linhas, W }) {
  const px = Math.min(Math.max(x - w / 2, 6), W - w - 6), h = 14 + linhas.length * 15, py = y - h - 10 < 0 ? y + 14 : y - h - 10;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={px} y={py} width={w} height={h} rx="8" fill={TIP} stroke="rgba(255,255,255,.12)" />
      {linhas.map((l, i) => <text key={i} x={px + 10} y={py + 19 + i * 15} fontSize="10.5" fill={i ? '#a1a1aa' : T1} fontWeight={i ? 500 : 600}>{l}</text>)}
    </g>
  );
}

/* P(ganhar | ainda aberto no dia t) — degraus, com marcador do deal atual. */
export function Curva({ curva, cicloMax, marcador, imediato = false, alt = 240 }) {
  const [ref, vis] = useInView(); const on = imediato || vis;
  const [hov, setHov] = useState(null);
  const W = 720, H = alt, P = { t: 26, r: 20, b: 42, l: 44 };
  const x = (t) => P.l + (Math.min(t, cicloMax) / cicloMax) * (W - P.l - P.r);
  const y = (p) => P.t + (1 - (p - 0.4) / 0.45) * (H - P.t - P.b);
  const pts = []; curva.forEach((c) => { pts.push([x(c.ini), y(c.p)]); pts.push([x(Math.min(c.fim + 1, cicloMax)), y(c.p)]); });
  const L = len(pts);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label={`Probabilidade de ganhar dado que o deal ainda está aberto: ${curva.map((c) => `dia ${c.ini}: ${num(c.p * 100, 0)}%`).join(', ')}.`}>
      <defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stopColor="#b6ff5c" /><stop offset="1" stopColor="#8af5a0" /></linearGradient>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={LIME} stopOpacity=".22" /><stop offset="1" stopColor={LIME} stopOpacity="0" /></linearGradient></defs>
      {[0.45, 0.55, 0.65, 0.75, 0.85].map((v) => <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray="3 5" /><text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={T3} textAnchor="end">{num(v * 100, 0)}%</text></g>)}
      <path d={`${d(pts)} L${pts[pts.length - 1][0]} ${y(0.4)} L${pts[0][0]} ${y(0.4)} Z`} fill="url(#ga)" opacity={on ? 1 : 0} style={{ transition: 'opacity .9s ease .5s' }} />
      <path d={d(pts)} fill="none" stroke="url(#gl)" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1.4s ${EASE}` }} />
      {curva.map((c, i) => (
        <g key={c.ini} onMouseEnter={() => setHov(c)} opacity={on ? 1 : 0} style={{ transition: `opacity .3s ease ${450 + i * 140}ms` }}>
          <rect x={x(c.ini)} y={P.t} width={x(Math.min(c.fim + 1, cicloMax)) - x(c.ini)} height={H - P.t - P.b} fill="transparent" />
          <circle cx={x(c.ini)} cy={y(c.p)} r={hov === c ? 6 : 4.5} fill={LIME} stroke="#0b0d11" strokeWidth="2.5" />
          <text x={x(c.ini) + 8} y={y(c.p) - 10} fontSize="11" fill={LIME} fontWeight="700">{num(c.p * 100, 0)}%</text>
        </g>
      ))}
      {marcador != null && (
        <g opacity={on ? 1 : 0} style={{ transition: 'opacity .4s ease 1.2s' }}>
          <line x1={x(marcador)} x2={x(marcador)} y1={P.t - 4} y2={y(0.4)} stroke={BLUE} strokeDasharray="4 4" />
          <rect x={x(marcador) - 44} y={P.t - 22} width={88} height={18} rx="6" fill={BLUE} opacity=".18" />
          <text x={x(marcador)} y={P.t - 9} fontSize="10.5" fill={BLUE} textAnchor="middle" fontWeight="700">este deal · dia {marcador}</text>
        </g>
      )}
      {[0, 30, 60, 90, 120, cicloMax].map((t) => <text key={t} x={x(t)} y={H - 20} fontSize="10" fill={T3} textAnchor="middle">{t}</text>)}
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="10" fill={T3} textAnchor="middle" fontWeight="500">dias desde o início do Engaging</text>
      {hov && <Tip W={W} x={x(hov.ini)} y={y(hov.p)} w={215} linhas={[`Chegou ao dia ${hov.ini} ainda aberto`, `${num(hov.p * 100)}% acabaram ganhos`, `${hov.n} deals fechados nessa condição`]} />}
    </svg>
  );
}

/* Win rate por vendedor com IC 95% — quase todos cruzam a média. */
export function WinCI({ agentes, base }) {
  const [ref, on] = useInView(); const [hov, setHov] = useState(null);
  const lista = [...agentes].filter((a) => a.fechados >= 20).sort((a, b) => b.win - a.win);
  const W = 720, rowH = 22, P = { t: 28, r: 24, b: 34, l: 150 }, H = P.t + P.b + lista.length * rowH;
  const x = (p) => P.l + ((p - 0.4) / 0.45) * (W - P.l - P.r);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)} aria-label="Win rate por vendedor com intervalo de confiança; quase todos os intervalos cruzam a média do time.">
      {[0.45, 0.55, 0.65, 0.75, 0.85].map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={P.t - 6} y2={H - P.b + 6} stroke={LINE} strokeDasharray="3 5" /><text x={x(v)} y={H - P.b + 20} fontSize="10" fill={T3} textAnchor="middle">{num(v * 100, 0)}%</text></g>)}
      <line x1={x(base)} x2={x(base)} y1={P.t - 12} y2={H - P.b + 6} stroke={LIME} strokeWidth="1.5" opacity={on ? 1 : 0} style={{ transition: 'opacity .5s ease .3s' }} />
      <text x={x(base)} y={P.t - 16} fontSize="10.5" fill={LIME} textAnchor="middle" fontWeight="700">time · {num(base * 100)}%</text>
      {lista.map((a, i) => {
        const cy = P.t + i * rowH + rowH / 2; const [lo, hi] = a.win_ic; const cruza = lo <= base && hi >= base;
        return (
          <g key={a.agent} onMouseEnter={() => setHov({ a, cy })} opacity={on ? 1 : 0} style={{ transition: `opacity .3s ease ${i * 28}ms` }}>
            <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill="transparent" />
            <text x={P.l - 10} y={cy + 3.5} fontSize="10.5" fill={hov?.a === a ? T1 : '#a1a1aa'} textAnchor="end" fontWeight={hov?.a === a ? 700 : 500}>{a.agent}</text>
            <line x1={x(lo)} y1={cy} y2={cy} stroke={cruza ? '#3a3d47' : RED} strokeWidth="2" strokeLinecap="round" x2={on ? x(hi) : x(lo)} style={{ transition: `x2 .8s ${EASE} ${i * 28}ms` }} />
            <circle cx={x(a.win)} cy={cy} r={hov?.a === a ? 5.5 : 4} fill={cruza ? BLUE : RED} />
          </g>
        );
      })}
      {hov && <Tip W={W} x={x(hov.a.win)} y={hov.cy} w={235} linhas={[hov.a.agent, `${num(hov.a.win * 100)}% em ${hov.a.fechados} deals fechados`, `IC 95%: ${num(hov.a.win_ic[0] * 100, 0)}–${num(hov.a.win_ic[1] * 100, 0)}%`]} />}
    </svg>
  );
}

/* AUC por fator — barras a partir de 0,50. */
export function Auc({ itens }) {
  const [ref, on] = useInView();
  const W = 720, H = 22 + itens.length * 32, P = { l: 232, r: 60 };
  const x = (a) => P.l + Math.max(0, Math.min(1, (a - 0.3) / 0.5)) * (W - P.l - P.r);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`AUC no teste temporal: ${itens.map((i) => `${i.fator} ${num(i.auc, 2)}`).join('; ')}.`}>
      <line x1={x(0.5)} x2={x(0.5)} y1={4} y2={H - 14} stroke={T3} strokeDasharray="3 3" />
      <text x={x(0.5)} y={H - 2} fontSize="10" fill={T3} textAnchor="middle">0,50 = moeda ao ar</text>
      {itens.map((it, i) => {
        const cy = 18 + i * 32, w = Math.abs(x(it.auc) - x(0.5)), x0 = Math.min(x(0.5), x(it.auc));
        const cor = it.usado ? 'url(#gl2)' : Math.abs(it.auc - 0.5) < 0.03 ? '#2b2e37' : BLUE;
        return (
          <g key={it.fator}>
            <defs><linearGradient id="gl2" x1="0" x2="1"><stop offset="0" stopColor="#b6ff5c" /><stop offset="1" stopColor="#8af5a0" /></linearGradient></defs>
            <text x={P.l - 12} y={cy + 4} fontSize="11.5" fill={it.usado ? T1 : '#a1a1aa'} textAnchor="end" fontWeight={it.usado ? 700 : 500}>{it.fator}</text>
            <rect x={on ? x0 : x(0.5)} y={cy - 9} height={18} rx="6" fill={cor} width={on ? w : 0} style={{ transition: `width .9s ${EASE} ${i * 70}ms, x .9s ${EASE} ${i * 70}ms` }} />
            <text x={x(it.auc) + (it.auc >= 0.5 ? 9 : -9)} y={cy + 4} fontSize="11.5" fill={it.usado ? LIME : T3} fontWeight="700" textAnchor={it.auc >= 0.5 ? 'start' : 'end'} opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${i * 70 + 500}ms` }}>{num(it.auc, 2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Anel de score 0–100 em gradiente lima. */
export function Ring({ v, size = 56, stroke = 5 }) {
  const [ref, on] = useInView();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, id = `rg${size}`;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score ${v} de 100`}>
      <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor="#b6ff5c" /><stop offset="1" stopColor="#8af5a0" /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={on ? c * (1 - v / 100) : c} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: `stroke-dashoffset 1.1s ${EASE}` }} />
      <text x="50%" y="50%" dy="4.5" textAnchor="middle" fontSize={size * 0.3} fontWeight="700" fill={T1}>{v}</text>
    </svg>
  );
}

/* Barra empilhada da composição do pipeline por fila. */
export function Stack({ partes, total, alt = 8 }) {
  const [ref, on] = useInView();
  return (
    <div ref={ref} style={{ display: 'flex', height: alt, borderRadius: 999, overflow: 'hidden', background: '#1e2129', width: '100%' }}>
      {partes.map((p) => <i key={p.k} style={{ width: on ? `${(100 * p.n) / (total || 1)}%` : 0, background: p.cor, transition: `width .9s ${EASE}` }} title={`${p.label}: ${p.n}`} />)}
    </div>
  );
}

export const CORES_FILA = { fechar: GREEN, acompanhar: BLUE, decidir: RED, engajar: '#b79cff' };
