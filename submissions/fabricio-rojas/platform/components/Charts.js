'use client';
// SVG puro, interativo (hover/tooltip/horizonte) e animado ao entrar na tela.
// Sem lib: o controle tipográfico e de animação importa mais que qualquer default.
import { useState } from 'react';
import { num, usd } from '@/lib/fmt';
import { useInView } from './Reveal';

const GOLD = '#b9915b', GOLD_INK = '#87642f', INK = '#0b1f30', INK3 = '#8b98a2', LINE = '#e9e6e0';
const ALERT = '#b3402f', OK = '#2c7355', BLUE = '#3d6f94', NAVY = '#001f35';
const EASE = 'cubic-bezier(.22,1,.36,1)';

const d = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const comprimento = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** Tooltip flutuante dentro do SVG. */
function Tip({ x, y, w = 150, linhas, W }) {
  const px = Math.min(Math.max(x - w / 2, 6), W - w - 6);
  const h = 14 + linhas.length * 15;
  // Sem espaço em cima (barra alta), abre para baixo do ponto.
  const py = y - h - 10 < 0 ? y + 14 : y - h - 10;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={px} y={py} width={w} height={h} rx="8" fill={NAVY} opacity=".96" />
      {linhas.map((l, i) => (
        <text key={i} x={px + 10} y={py + 19 + i * 15} fontSize="10.5" fill={i ? '#c2cfd9' : '#fff'} fontWeight={i ? 500 : 700}>{l}</text>
      ))}
    </g>
  );
}

/* ── Micro sparkline para linhas compactas ─────────────────── */
export function Mini({ dados, chave, cor = BLUE, w = 120, h = 34, dominio }) {
  const [ref, on] = useInView();
  const vals = dados.map((x) => x[chave]);
  const min = dominio ? dominio[0] : Math.min(...vals), max = dominio ? dominio[1] : Math.max(...vals);
  const span = max - min || 1;
  const pts = dados.map((r, i) => [(i * (w - 4)) / (dados.length - 1) + 2, 3 + (1 - (r[chave] - min) / span) * (h - 6)]);
  const L = comprimento(pts);
  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d(pts)} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1s ${EASE}` }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={cor}
        opacity={on ? 1 : 0} style={{ transition: 'opacity .3s ease .9s' }} />
    </svg>
  );
}

/* ── O gráfico central: churn na MESMA idade, por safra ─────────
   Barras, não linhas: cada safra tem janela de observação diferente e em linhas a
   safra antiga aparecia no topo, sugerindo o oposto da conclusão. */
export function CoorteChart({ coortes, compacto = false }) {
  const [ref, on] = useInView();
  const [hz, setHz] = useState('todos');
  const [hov, setHov] = useState(null);
  const W = 720, H = compacto ? 280 : 320, P = { t: 22, r: 16, b: 50, l: 44 };
  const todas = [
    { chave: 'm3', rotulo: '90 dias', cor: ALERT },
    { chave: 'm6', rotulo: '6 meses', cor: GOLD },
    { chave: 'm12', rotulo: '12 meses', cor: BLUE },
  ];
  const series = hz === 'todos' ? todas : todas.filter((s) => s.chave === hz);
  const maxY = 80;
  const gw = (W - P.l - P.r) / coortes.length;
  const bw = Math.min(hz === 'todos' ? 34 : 64, (gw - 30) / series.length);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const base = y(0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {todas.map((s) => (
            <span key={s.chave} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: INK3, fontWeight: 600 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: s.cor, display: 'inline-block' }} />{s.rotulo}
            </span>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Horizonte">
          {[['todos', 'Todos'], ['m3', '90 dias'], ['m6', '6 meses'], ['m12', '12 meses']].map(([k, t]) => (
            <button key={k} aria-pressed={hz === k} onClick={() => setHz(k)}>{t}</button>
          ))}
        </div>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
        aria-label={`Churn por safra, na mesma idade. Em 90 dias: ${coortes.map((c) => `${c.coorte} ${c.m3 ? num(c.m3.pct) + '%' : 'sem dado'}`).join('; ')}.`}>
        {[0, 20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '3 5' : ''} />
            <text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{v}%</text>
          </g>
        ))}
        {coortes.map((c, ci) => {
          const x0 = P.l + ci * gw + (gw - bw * series.length) / 2;
          return (
            <g key={c.coorte}>
              {series.map((s, si) => {
                const v = c[s.chave]; const bx = x0 + si * bw; const atraso = ci * 110 + si * 55;
                const key = `${ci}-${s.chave}`;
                if (!v && compacto) return null;
                if (!v) return (
                  <text key={key} x={bx + bw / 2} y={base - 8} fontSize="8.5" fill="#c9c3b8" textAnchor="start"
                    transform={`rotate(-90 ${bx + bw / 2} ${base - 8})`} opacity={on ? 1 : 0}
                    style={{ transition: `opacity .4s ease ${atraso + 300}ms` }}>sem {s.rotulo} ainda</text>
                );
                const dim = hov && hov.key !== key;
                return (
                  <g key={key} onMouseEnter={() => setHov({ key, x: bx + bw / 2, y: y(v.pct), c, s, v })}>
                    <rect x={bx + 2} width={bw - 4} rx="4" fill={s.cor} opacity={dim ? .45 : 1}
                      y={on ? y(v.pct) : base} height={on ? base - y(v.pct) : 0}
                      style={{ transition: `y .75s ${EASE} ${atraso}ms, height .75s ${EASE} ${atraso}ms, opacity .15s` }} />
                    <text x={bx + bw / 2} y={y(v.pct) - 7} fontSize="10.5" fill={s.cor} textAnchor="middle" fontWeight="800"
                      opacity={on && !dim ? 1 : 0} style={{ transition: `opacity .3s ease ${on ? atraso + 500 : 0}ms` }}>
                      {num(v.pct, 0)}%
                    </text>
                  </g>
                );
              })}
              <text x={P.l + ci * gw + gw / 2} y={H - 28} fontSize="12" fill={INK} textAnchor="middle" fontWeight="700">{c.coorte}</text>
              <text x={P.l + ci * gw + gw / 2} y={H - 14} fontSize="9.5" fill={INK3} textAnchor="middle">{c.contas} contas</text>
            </g>
          );
        })}
        <line x1={P.l} x2={W - P.r} y1={base} y2={base} stroke={LINE} />
        {hov && (
          <Tip W={W} x={hov.x} y={hov.y} w={168}
            linhas={[`${hov.c.coorte} · ${hov.s.rotulo}`, `${num(hov.v.pct)}% churnaram`, `${hov.v.n} contas observadas`]} />
        )}
      </svg>
    </div>
  );
}

/* ── Sobrevivência (Kaplan-Meier) com guia de hover ─────────── */
export function SobrevivenciaChart({ km }) {
  const [ref, on] = useInView();
  const [hov, setHov] = useState(null);
  const W = 720, H = 240, P = { t: 18, r: 18, b: 40, l: 42 };
  const maxX = km[km.length - 1].mes;
  const x = (m) => P.l + ((m - 1) * (W - P.l - P.r)) / (maxX - 1);
  const y = (v) => P.t + (1 - v / 100) * (H - P.t - P.b);
  const pts = km.map((k) => [x(k.mes), y(k.sobrevivencia)]);
  const meio = km.find((k) => k.sobrevivencia <= 50);
  const L = comprimento(pts);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    const m = Math.round(((mx - P.l) / (W - P.l - P.r)) * (maxX - 1)) + 1;
    setHov(km.find((k) => k.mes === Math.max(1, Math.min(maxX, m))));
  };
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseMove={onMove} onMouseLeave={() => setHov(null)}
      aria-label={`Curva de sobrevivência: metade das contas sai até o mês ${meio?.mes}.`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '3 5' : ''} />
          <text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{v}%</text>
        </g>
      ))}
      <path d={`${d(pts)} L${x(maxX)} ${y(0)} L${x(1)} ${y(0)} Z`} fill={GOLD} opacity={on ? .12 : 0} style={{ transition: 'opacity .8s ease .5s' }} />
      <path d={d(pts)} fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinejoin="round"
        strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1.4s ${EASE}` }} />
      {meio && !hov && (
        <g opacity={on ? 1 : 0} style={{ transition: 'opacity .5s ease 1.2s' }}>
          <line x1={x(meio.mes)} x2={x(meio.mes)} y1={y(50)} y2={y(0)} stroke={ALERT} strokeWidth="1.3" strokeDasharray="4 4" />
          <circle cx={x(meio.mes)} cy={y(meio.sobrevivencia)} r="4.5" fill={ALERT} />
          <text x={x(meio.mes) + 10} y={y(meio.sobrevivencia) - 9} fontSize="11.5" fill={ALERT} fontWeight="800">metade da base sai até o mês {meio.mes}</text>
        </g>
      )}
      {hov && (
        <g>
          <line x1={x(hov.mes)} x2={x(hov.mes)} y1={P.t} y2={y(0)} stroke={INK3} strokeDasharray="3 3" />
          <circle cx={x(hov.mes)} cy={y(hov.sobrevivencia)} r="5" fill="#fff" stroke={GOLD_INK} strokeWidth="2.5" />
          <Tip W={W} x={x(hov.mes)} y={y(hov.sobrevivencia)} w={172}
            linhas={[`Mês ${hov.mes}`, `${num(hov.sobrevivencia)}% ainda ativas`, `${num(hov.hazard)}% saem neste mês`, `${hov.em_risco} contas em risco`]} />
        </g>
      )}
      {km.filter((k) => k.mes % 3 === 0 || k.mes === 1).map((k) => (
        <text key={k.mes} x={x(k.mes)} y={H - 18} fontSize="10" fill={INK3} textAnchor="middle">{k.mes}</text>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 3} fontSize="9.5" fill={INK3} textAnchor="middle" letterSpacing=".1em" fontWeight="700">MESES DESDE A ASSINATURA</text>
    </svg>
  );
}

/* ── Risco mensal por idade ──────────────────────────────────── */
export function HazardChart({ km }) {
  const [ref, on] = useInView();
  const [hov, setHov] = useState(null);
  const W = 720, H = 180, P = { t: 22, r: 18, b: 38, l: 42 };
  const maxY = Math.max(...km.map((k) => k.hazard)) * 1.14;
  const bw = (W - P.l - P.r) / km.length;
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const base = y(0);
  const media = km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label="Risco mensal de churn por idade da conta: alto nos primeiros meses, estável depois.">
      <line x1={P.l} x2={W - P.r} y1={y(media)} y2={y(media)} stroke={INK3} strokeDasharray="4 4" opacity={on ? .7 : 0} style={{ transition: 'opacity .5s ease 1s' }} />
      <text x={W - P.r} y={y(media) - 6} fontSize="10" fill={INK3} textAnchor="end" fontWeight="600" opacity={on ? 1 : 0} style={{ transition: 'opacity .5s ease 1.1s' }}>
        patamar após o 5º mês: {num(media)}%
      </text>
      {km.map((k, i) => {
        const alto = k.mes <= 3; const cx = P.l + i * bw + bw / 2;
        return (
          <g key={k.mes} onMouseEnter={() => setHov({ k, cx })}>
            <rect x={P.l + i * bw + 3} width={bw - 6} rx="4" fill={alto ? ALERT : GOLD} opacity={alto ? 1 : .45}
              y={on ? y(k.hazard) : base} height={on ? base - y(k.hazard) : 0}
              style={{ transition: `y .6s ${EASE} ${i * 40}ms, height .6s ${EASE} ${i * 40}ms` }} />
            {alto && <text x={cx} y={y(k.hazard) - 6} fontSize="10.5" fill={ALERT} textAnchor="middle" fontWeight="800" opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${i * 40 + 400}ms` }}>{num(k.hazard)}%</text>}
            <text x={cx} y={H - 20} fontSize="9.5" fill={INK3} textAnchor="middle">{k.mes}</text>
          </g>
        );
      })}
      <line x1={P.l} x2={W - P.r} y1={base} y2={base} stroke={LINE} />
      {hov && <Tip W={W} x={hov.cx} y={y(hov.k.hazard)} w={150} linhas={[`Mês ${hov.k.mes} de vida`, `${num(hov.k.hazard)}% saem`, `${hov.k.churns} de ${hov.k.em_risco} contas`]} />}
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="9.5" fill={INK3} textAnchor="middle" letterSpacing=".1em" fontWeight="700">MÊS DE VIDA DA CONTA</text>
    </svg>
  );
}

/* ── Os 36 testes contra o limiar ────────────────────────────── */
export function PreditorChart({ testes }) {
  const [ref, on] = useInView();
  const [hov, setHov] = useState(null);
  const W = 720, H = 300, P = { t: 24, r: 22, b: 56, l: 160 };
  const x = (p) => P.l + Math.min(1, p) * (W - P.l - P.r);
  const step = (H - P.t - P.b) / testes.length;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label="Nenhuma das 18 variáveis comportamentais atinge significância: todos os valores-p acima de 0,05.">
      <rect x={P.l} y={P.t - 8} width={x(0.05) - P.l} height={H - P.t - P.b + 14} fill={OK} opacity=".09" />
      <line x1={x(0.05)} x2={x(0.05)} y1={P.t - 8} y2={H - P.b + 6} stroke={OK} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={x(0.05)} y={P.t - 13} fontSize="10.5" fill={OK} textAnchor="middle" fontWeight="800">p = 0,05</text>
      <text x={x(0.05) + 8} y={H - 44} fontSize="10" fill={OK} fontWeight="600">← só aqui haveria sinal real</text>
      {testes.map((t, i) => {
        const cy = P.t + i * step + step / 2; const atraso = i * 45;
        return (
          <g key={t.chave} onMouseEnter={() => setHov({ t, cx: x(t.p), cy })}>
            <rect x={0} y={cy - step / 2} width={W} height={step} fill="transparent" />
            <text x={P.l - 12} y={cy + 3.5} fontSize="10.5" fill={hov?.t === t ? INK : '#5c6c78'} textAnchor="end" fontWeight={hov?.t === t ? 800 : 600}>{t.variavel}</text>
            <line x1={P.l} y1={cy} y2={cy} stroke={LINE} x2={on ? x(t.p) : P.l} style={{ transition: `x2 .7s ${EASE} ${atraso}ms` }} />
            <circle cy={cy} r={hov?.t === t ? 6 : 4.5} fill={GOLD} cx={on ? x(t.p) : P.l} style={{ transition: `cx .7s ${EASE} ${atraso}ms, r .12s` }} />
            <text y={cy + 3.5} fontSize="9.5" fill={INK3} x={on ? x(t.p) + 10 : P.l + 10} opacity={on ? 1 : 0}
              style={{ transition: `x .7s ${EASE} ${atraso}ms, opacity .3s ease ${atraso + 500}ms` }}>{num(t.p, 2)}</text>
          </g>
        );
      })}
      {[0, .25, .5, .75, 1].map((v) => <text key={v} x={x(v)} y={H - 28} fontSize="9.5" fill={INK3} textAnchor="middle">{v.toFixed(2).replace('.', ',')}</text>)}
      <text x={(P.l + W - P.r) / 2} y={H - 6} fontSize="9.5" fill={INK3} textAnchor="middle" letterSpacing=".1em" fontWeight="700">VALOR-P — PROBABILIDADE DE A DIFERENÇA SER ACASO</text>
      {hov && <Tip W={W} x={hov.cx} y={hov.cy - 4} w={190} linhas={[hov.t.variavel, `p = ${num(hov.t.p, 3)} · d = ${num(hov.t.d, 2)}`, `churn ${num(hov.t.churn)} vs ficou ${num(hov.t.stayed)}`]} />}
    </svg>
  );
}

/* ── Deterioração dentro de cada canal ───────────────────────── */
export function CanalChart({ dados, coortes }) {
  const [ref, on] = useInView();
  const [hov, setHov] = useState(null);
  const W = 720, H = 220, P = { t: 18, r: 98, b: 38, l: 42 };
  const cs = coortes.map((c) => c.coorte);
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (cs.length - 1);
  const y = (v) => P.t + (1 - v / 85) * (H - P.t - P.b);
  const cores = [GOLD_INK, BLUE, OK, ALERT, '#7a5ea8'];
  const linhas = dados.map((r, i) => {
    const pts = cs.map((c, j) => [j, r[c]]).filter(([, v]) => v != null).map(([j, v]) => [x(j), y(v)]);
    const fim = cs.map((c) => r[c]).filter((v) => v != null).pop();
    return pts.length < 2 ? null : { r, i, pts, fim, ry: pts[pts.length - 1][1] };
  }).filter(Boolean).sort((a, b) => a.ry - b.ry);
  linhas.forEach((l, k) => { if (k && l.ry - linhas[k - 1].ry < 14) l.ry = linhas[k - 1].ry + 14; });
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseLeave={() => setHov(null)}
      aria-label="A deterioração do churn em 90 dias acontece dentro de todos os cinco canais de aquisição.">
      {[0, 25, 50, 75].map((v) => (
        <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray="3 5" /><text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{v}%</text></g>
      ))}
      {cs.map((c, i) => <text key={c} x={x(i)} y={H - 16} fontSize="10.5" fill={INK3} textAnchor="middle" fontWeight="600">{c}</text>)}
      {linhas.map(({ r, i, pts, fim, ry }) => {
        const cor = cores[i % cores.length]; const px = pts[pts.length - 1][0], py = pts[pts.length - 1][1];
        const L = comprimento(pts); const atraso = i * 130; const dim = hov && hov !== r.canal;
        return (
          <g key={r.canal} opacity={dim ? .25 : 1} style={{ transition: 'opacity .15s' }} onMouseEnter={() => setHov(r.canal)}>
            <path d={d(pts)} fill="none" stroke={cor} strokeWidth={hov === r.canal ? 3 : 2} strokeLinecap="round"
              strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1s ${EASE} ${atraso}ms` }} />
            {pts.map((p, j) => <circle key={j} cx={p[0]} cy={p[1]} r="3.2" fill={cor} opacity={on ? 1 : 0} style={{ transition: `opacity .3s ease ${atraso + j * 180}ms` }} />)}
            <g opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${atraso + 900}ms` }}>
              <path d={`M${px + 4} ${py} L${px + 9} ${ry}`} stroke={cor} strokeWidth="1" opacity=".45" fill="none" />
              <text x={px + 12} y={ry + 3.5} fontSize="10.5" fill={cor} fontWeight="700">{r.canal} · {fim}%</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/* ── AUC: o que prevê e o que não ────────────────────────────── */
export function AucChart({ entrada, comportamentais }) {
  const [ref, on] = useInView();
  const itens = [{ variavel: 'Data de entrada', auc: entrada, destaque: true }, ...comportamentais.slice(0, 7)];
  const W = 720, H = 26 + itens.length * 30, P = { l: 170, r: 60 };
  const x = (a) => P.l + Math.max(0, Math.min(1, (a - 0.3) / 0.7)) * (W - P.l - P.r);
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`AUC para churn em 90 dias: data de entrada ${num(entrada, 2)}; melhor variável comportamental ${num(comportamentais[0].auc, 2)}.`}>
      <line x1={x(0.5)} x2={x(0.5)} y1={6} y2={H - 14} stroke={INK3} strokeDasharray="3 3" />
      <text x={x(0.5)} y={H - 2} fontSize="9.5" fill={INK3} textAnchor="middle" fontWeight="600">0,50 = moeda ao ar</text>
      {itens.map((it, i) => {
        const cy = 18 + i * 30; const poder = Math.abs(it.auc - 0.5);
        const cor = it.destaque ? GOLD : poder < 0.1 ? '#cfc9bf' : BLUE;
        const x0 = Math.min(x(0.5), x(it.auc)), w = Math.abs(x(it.auc) - x(0.5));
        return (
          <g key={it.variavel}>
            <text x={P.l - 12} y={cy + 4} fontSize="11" fill={it.destaque ? INK : '#5c6c78'} textAnchor="end" fontWeight={it.destaque ? 800 : 600}>{it.variavel}</text>
            <rect x={on ? x0 : x(0.5)} y={cy - 8} height={16} rx="5" fill={cor} width={on ? w : 0} style={{ transition: `width .8s ${EASE} ${i * 70}ms, x .8s ${EASE} ${i * 70}ms` }} />
            <text x={x(it.auc) + (it.auc >= 0.5 ? 8 : -8)} y={cy + 4} fontSize="11" fill={it.destaque ? GOLD_INK : INK3} fontWeight="800"
              textAnchor={it.auc >= 0.5 ? 'start' : 'end'} opacity={on ? 1 : 0} style={{ transition: `opacity .4s ease ${i * 70 + 500}ms` }}>{num(it.auc, 2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Tendência entre safras + projeção ───────────────────────── */
export function TendenciaChart({ pontos, projecao, rotuloProx }) {
  const [ref, on] = useInView();
  const W = 720, H = 220, P = { t: 22, r: 24, b: 40, l: 42 };
  const todos = [...pontos, { coorte: rotuloProx, pct: projecao, proj: true }];
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (todos.length - 1);
  const y = (v) => P.t + (1 - v / 100) * (H - P.t - P.b);
  const real = pontos.map((p, i) => [x(i), y(p.pct)]);
  const L = comprimento(real);
  const last = real[real.length - 1], prox = [x(todos.length - 1), y(projecao)];
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Churn em 90 dias por safra, com projeção de ${num(projecao)}% para ${rotuloProx} se a tendência continuar.`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '3 5' : ''} /><text x={P.l - 8} y={y(v) + 3.5} fontSize="10" fill={INK3} textAnchor="end">{v}%</text></g>
      ))}
      <rect x={x(todos.length - 1.5)} y={P.t - 6} width={W - P.r - x(todos.length - 1.5)} height={H - P.t - P.b + 6} fill={ALERT} opacity=".05" />
      <path d={d(real)} fill="none" stroke={ALERT} strokeWidth="2.6" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={on ? 0 : L} style={{ transition: `stroke-dashoffset 1.2s ${EASE}` }} />
      <path d={`M${last[0]} ${last[1]} L${prox[0]} ${prox[1]}`} fill="none" stroke={ALERT} strokeWidth="2.2" strokeDasharray="6 5" opacity={on ? .8 : 0} style={{ transition: 'opacity .5s ease 1.2s' }} />
      {todos.map((p, i) => (
        <g key={p.coorte} opacity={on ? 1 : 0} style={{ transition: `opacity .35s ease ${300 + i * 230}ms` }}>
          <circle cx={x(i)} cy={y(p.pct)} r={p.proj ? 6 : 4.5} fill={p.proj ? '#fff' : ALERT} stroke={ALERT} strokeWidth={p.proj ? 2.5 : 0} />
          <text x={x(i)} y={y(p.pct) - 12} fontSize="11.5" fill={ALERT} textAnchor="middle" fontWeight="800">{num(p.pct, 0)}%</text>
          <text x={x(i)} y={H - 18} fontSize="10.5" fill={p.proj ? ALERT : INK3} textAnchor="middle" fontWeight={p.proj ? 800 : 600}>{p.coorte}{p.proj ? ' (proj.)' : ''}</text>
        </g>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 3} fontSize="9.5" fill={INK3} textAnchor="middle" letterSpacing=".1em" fontWeight="700">CHURN EM 90 DIAS, POR SAFRA DE ENTRADA</text>
    </svg>
  );
}

export { usd };
