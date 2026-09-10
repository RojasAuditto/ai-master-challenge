// Graficos em SVG puro. Sem biblioteca: o volume de dados e pequeno e o
// controle tipografico importa mais aqui do que qualquer default de charting lib.
import { num } from '@/lib/fmt';

const GOLD = '#b9915b';
const GOLD_SOFT = '#d4b183';
const MUTED = '#6b8494';
const LINE = '#14384c';
const ALERT = '#c2553f';
const OK = '#4e9e7f';

const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** Serie temporal compacta. `destaque` pinta de dourado quem carrega o sinal. */
export function Sparkline({ dados, chave, titulo, sufixo = '', destaque = false, dominio }) {
  const W = 300, H = 116, P = { t: 16, r: 8, b: 22, l: 8 };
  const vals = dados.map((d) => d[chave]).filter((v) => v != null);
  const min = dominio ? dominio[0] : Math.min(...vals);
  const max = dominio ? dominio[1] : Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, dados.length - 1);
  const y = (v) => P.t + (1 - (v - min) / span) * (H - P.t - P.b);
  const pts = dados.map((d, i) => [x(i), y(d[chave])]);
  const cor = destaque ? ALERT : MUTED;
  const primeiro = dados[0][chave], ultimo = dados[dados.length - 1][chave];
  const varia = primeiro ? ((ultimo - primeiro) / primeiro) * 100 : 0;

  return (
    <div className="card" style={{ padding: '18px 18px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cfdae1' }}>{titulo}</div>
        <div className={`tag ${destaque ? 'no' : 'flat'}`}>
          {varia >= 0 ? '+' : ''}{num(varia, 0)}%
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${titulo}: ${varia.toFixed(0)}% no período`}>
        <path d={`${path(pts)} L${x(dados.length - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`} fill={cor} opacity="0.09" />
        <path d={path(pts)} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(dados.length - 1)} cy={y(ultimo)} r="3.5" fill={cor} />
        <text x={P.l} y={H - 6} fontSize="9.5" fill={MUTED} fontFamily="ui-monospace, monospace">{dados[0].mes}</text>
        <text x={W - P.r} y={H - 6} fontSize="9.5" fill={MUTED} textAnchor="end" fontFamily="ui-monospace, monospace">
          {dados[dados.length - 1].mes}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: MUTED, borderTop: `1px solid ${LINE}`, paddingTop: 9, marginTop: 2 }}>
        {num(primeiro, Number.isInteger(primeiro) ? 0 : 2)}{sufixo} <span style={{ opacity: 0.5 }}>→</span> <strong style={{ color: destaque ? '#dd8570' : '#cfdae1' }}>{num(ultimo, Number.isInteger(ultimo) ? 0 : 2)}{sufixo}</strong>
      </div>
    </div>
  );
}

/**
 * O grafico central: churn na MESMA idade, por safra de entrada.
 * Barras agrupadas, nao linhas — cada safra tem janela de observacao diferente,
 * e em linhas a safra mais antiga (com mais tempo para churnar) aparecia no topo,
 * sugerindo o oposto da conclusao. Barras no mesmo horizonte comparam o comparavel.
 */
export function CoorteChart({ coortes }) {
  const W = 720, H = 340, P = { t: 52, r: 20, b: 56, l: 50 };
  const series = [
    { chave: 'm3', rotulo: '90 dias', cor: ALERT, op: 1 },
    { chave: 'm6', rotulo: '6 meses', cor: GOLD, op: 0.85 },
    { chave: 'm12', rotulo: '12 meses', cor: '#5d7f92', op: 0.85 },
  ];
  const maxY = 80;
  const gw = (W - P.l - P.r) / coortes.length;
  const bw = Math.min(34, (gw - 26) / series.length);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Churn acumulado por safra de entrada, medido na mesma idade de conta. Em 90 dias: ${coortes.map((c) => `${c.coorte} ${c.m3 ? num(c.m3.pct) + '%' : 'sem dado'}`).join(', ')}.`}>
      {series.map((s, i) => (
        <g key={s.chave}>
          <rect x={P.l + i * 96} y={16} width={11} height={11} rx="2.5" fill={s.cor} opacity={s.op} />
          <text x={P.l + i * 96 + 17} y={25.5} fontSize="11" fill={MUTED}>{s.rotulo}</text>
        </g>
      ))}
      {[0, 20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '2 5' : ''} />
          <text x={P.l - 10} y={y(v) + 3.5} fontSize="10.5" fill={MUTED} textAnchor="end"
            fontFamily="ui-monospace, monospace">{v}%</text>
        </g>
      ))}
      {coortes.map((c, ci) => {
        const x0 = P.l + ci * gw + (gw - bw * series.length) / 2;
        return (
          <g key={c.coorte}>
            {series.map((s, si) => {
              const v = c[s.chave];
              const bx = x0 + si * bw;
              if (!v) {
                return (
                  <text key={s.chave} x={bx + bw / 2} y={y(0) - 7} fontSize="9" fill="#3d5c6e"
                    textAnchor="middle" transform={`rotate(-90 ${bx + bw / 2} ${y(0) - 7})`}>
                    ainda sem {s.rotulo}
                  </text>
                );
              }
              return (
                <g key={s.chave}>
                  <rect x={bx + 2} y={y(v.pct)} width={bw - 4} height={y(0) - y(v.pct)}
                    fill={s.cor} opacity={s.op} rx="2.5" />
                  <text x={bx + bw / 2} y={y(v.pct) - 6} fontSize="10" fill={s.cor}
                    textAnchor="middle" fontWeight="700">{num(v.pct, 0)}%</text>
                </g>
              );
            })}
            <text x={P.l + ci * gw + gw / 2} y={H - 32} fontSize="12" fill="#cfdae1"
              textAnchor="middle" fontWeight="600">{c.coorte}</text>
            <text x={P.l + ci * gw + gw / 2} y={H - 19} fontSize="9.5" fill={MUTED} textAnchor="middle">
              {c.contas} contas
            </text>
          </g>
        );
      })}
      <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke={LINE} />
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="10" fill={MUTED} textAnchor="middle"
        letterSpacing="0.12em">SAFRA DE ENTRADA</text>
    </svg>
  );
}

/** Curva de sobrevivencia Kaplan-Meier. */
export function SobrevivenciaChart({ km }) {
  const W = 720, H = 260, P = { t: 20, r: 20, b: 42, l: 46 };
  const maxX = km[km.length - 1].mes;
  const x = (m) => P.l + ((m - 1) * (W - P.l - P.r)) / (maxX - 1);
  const y = (v) => P.t + (1 - v / 100) * (H - P.t - P.b);
  const pts = km.map((k) => [x(k.mes), y(k.sobrevivencia)]);
  const meio = km.find((k) => k.sobrevivencia <= 50);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Curva de sobrevivência: metade das contas sai até o mês ${meio?.mes}.`}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray={v ? '2 5' : ''} />
          <text x={P.l - 9} y={y(v) + 3.5} fontSize="10.5" fill={MUTED} textAnchor="end" fontFamily="ui-monospace, monospace">{v}%</text>
        </g>
      ))}
      <path d={`${path(pts)} L${x(maxX)} ${y(0)} L${x(1)} ${y(0)} Z`} fill={GOLD} opacity="0.08" />
      <path d={path(pts)} fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinejoin="round" />
      {meio && (
        <g>
          <line x1={x(meio.mes)} x2={x(meio.mes)} y1={y(50)} y2={y(0)} stroke={ALERT} strokeWidth="1.2" strokeDasharray="4 4" />
          <circle cx={x(meio.mes)} cy={y(meio.sobrevivencia)} r="4.5" fill={ALERT} />
          <text x={x(meio.mes) + 10} y={y(meio.sobrevivencia) - 8} fontSize="11.5" fill={ALERT} fontWeight="700">
            metade da base sai até o mês {meio.mes}
          </text>
        </g>
      )}
      {km.filter((k) => k.mes % 3 === 0 || k.mes === 1).map((k) => (
        <text key={k.mes} x={x(k.mes)} y={H - 20} fontSize="10.5" fill={MUTED} textAnchor="middle">{k.mes}</text>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 4} fontSize="10" fill={MUTED} textAnchor="middle"
        letterSpacing="0.12em">MESES DESDE A ASSINATURA</text>
    </svg>
  );
}

/** Hazard por mes — mostra que o risco e concentrado no inicio. */
export function HazardChart({ km }) {
  const W = 720, H = 190, P = { t: 18, r: 20, b: 40, l: 46 };
  const maxY = Math.max(...km.map((k) => k.hazard)) * 1.1;
  const bw = (W - P.l - P.r) / km.length;
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const media = km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Risco mensal de churn por tempo de casa: muito alto nos primeiros meses, estável depois.">
      <line x1={P.l} x2={W - P.r} y1={y(media)} y2={y(media)} stroke={MUTED} strokeWidth="1" strokeDasharray="4 4" />
      <text x={W - P.r} y={y(media) - 6} fontSize="10" fill={MUTED} textAnchor="end">
        patamar após o 5º mês: {num(media)}%
      </text>
      {km.map((k, i) => {
        const alto = k.mes <= 3;
        return (
          <g key={k.mes}>
            <rect x={P.l + i * bw + 3} y={y(k.hazard)} width={bw - 6} height={y(0) - y(k.hazard)}
              fill={alto ? ALERT : GOLD} opacity={alto ? 0.95 : 0.42} rx="2.5" />
            {alto && (
              <text x={P.l + i * bw + bw / 2} y={y(k.hazard) - 6} fontSize="10.5" fill={ALERT}
                textAnchor="middle" fontWeight="700">{num(k.hazard)}%</text>
            )}
            <text x={P.l + i * bw + bw / 2} y={H - 22} fontSize="9.5" fill={MUTED} textAnchor="middle">{k.mes}</text>
          </g>
        );
      })}
      <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke={LINE} />
      <text x={(P.l + W - P.r) / 2} y={H - 5} fontSize="10" fill={MUTED} textAnchor="middle"
        letterSpacing="0.12em">MÊS DE VIDA DA CONTA</text>
    </svg>
  );
}

/** Os 36 testes contra o limiar de significancia. Um olhar, uma conclusao. */
export function PreditorChart({ testes }) {
  const W = 720, H = 312, P = { t: 26, r: 24, b: 62, l: 172 };
  const x = (p) => P.l + Math.min(1, p) * (W - P.l - P.r);
  const step = (H - P.t - P.b) / testes.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Nenhuma das 18 variáveis comportamentais atinge significância estatística.">
      <rect x={P.l} y={P.t - 8} width={x(0.05) - P.l} height={H - P.t - P.b + 14} fill={OK} opacity="0.07" />
      <line x1={x(0.05)} x2={x(0.05)} y1={P.t - 8} y2={H - P.b + 6} stroke={OK} strokeWidth="1.4" strokeDasharray="4 3" />
      <text x={x(0.05)} y={P.t - 14} fontSize="10.5" fill={OK} textAnchor="middle" fontWeight="700">
        p = 0,05
      </text>
      <text x={x(0.05) + 8} y={H - 50} fontSize="10" fill={OK}>
        ← só aqui haveria sinal real
      </text>

      {testes.map((t, i) => {
        const cy = P.t + i * step + step / 2;
        return (
          <g key={t.chave}>
            <text x={P.l - 12} y={cy + 3.5} fontSize="11" fill="#a8bcc8" textAnchor="end">{t.variavel}</text>
            <line x1={P.l} x2={x(t.p)} y1={cy} y2={cy} stroke={LINE} strokeWidth="1" />
            <circle cx={x(t.p)} cy={cy} r="4" fill={GOLD} opacity="0.85" />
            <text x={x(t.p) + 9} y={cy + 3.5} fontSize="9.5" fill={MUTED} fontFamily="ui-monospace, monospace">
              {num(t.p, 2)}
            </text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text key={v} x={x(v)} y={H - 34} fontSize="9.5" fill={MUTED} textAnchor="middle"
          fontFamily="ui-monospace, monospace">{v.toFixed(2).replace('.', ',')}</text>
      ))}
      <text x={(P.l + W - P.r) / 2} y={H - 8} fontSize="10" fill={MUTED} textAnchor="middle"
        letterSpacing="0.12em">VALOR-P — PROBABILIDADE DE A DIFERENÇA SER ACASO</text>
    </svg>
  );
}

/** Deterioracao dentro de cada canal — mata a hipotese de mix de aquisicao. */
export function CanalChart({ dados, coortes }) {
  const W = 720, H = 230, P = { t: 22, r: 96, b: 40, l: 74 };
  const cs = coortes.map((c) => c.coorte);
  const maxY = 85;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (cs.length - 1);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const cores = [GOLD_SOFT, '#8aa6b5', OK, ALERT, '#a884b5'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="A deterioração acontece em todos os cinco canais de aquisição.">
      {[0, 25, 50, 75].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={LINE} strokeDasharray="2 5" />
          <text x={P.l - 9} y={y(v) + 3.5} fontSize="10" fill={MUTED} textAnchor="end" fontFamily="ui-monospace, monospace">{v}%</text>
        </g>
      ))}
      {cs.map((c, i) => (
        <text key={c} x={x(i)} y={H - 18} fontSize="10.5" fill={MUTED} textAnchor="middle">{c}</text>
      ))}
      {(() => {
        const linhas = dados.map((d, i) => {
          const pts = cs.map((c, j) => [j, d[c]]).filter(([, v]) => v != null).map(([j, v]) => [x(j), y(v)]);
          const fim = cs.map((c) => d[c]).filter((v) => v != null).pop();
          return pts.length < 2 ? null : { d, i, pts, fim, ry: pts[pts.length - 1][1] };
        }).filter(Boolean).sort((a, b) => a.ry - b.ry);
        // Empurra rotulos que ficariam sobrepostos — sem isso "ads" e "event" colidem.
        const MIN = 13;
        linhas.forEach((l, k) => { if (k && l.ry - linhas[k - 1].ry < MIN) l.ry = linhas[k - 1].ry + MIN; });
        return linhas.map(({ d, i, pts, fim, ry }) => {
          const cor = cores[i % cores.length];
          const px = pts[pts.length - 1][0], py = pts[pts.length - 1][1];
          return (
            <g key={d.canal}>
              <path d={path(pts)} fill="none" stroke={cor} strokeWidth="1.9" strokeLinecap="round" opacity="0.9" />
              {pts.map((p, j) => <circle key={j} cx={p[0]} cy={p[1]} r="3" fill={cor} />)}
              <path d={`M${px + 4} ${py} L${px + 9} ${ry}`} stroke={cor} strokeWidth="1" opacity="0.5" fill="none" />
              <text x={px + 12} y={ry + 3.5} fontSize="10.5" fill={cor} fontWeight="600">{d.canal} · {fim}%</text>
            </g>
          );
        });
      })()}
      <text x={(P.l + W - P.r) / 2} y={H - 3} fontSize="10" fill={MUTED} textAnchor="middle"
        letterSpacing="0.12em">CHURN EM 90 DIAS, POR SAFRA DE ENTRADA</text>
    </svg>
  );
}
