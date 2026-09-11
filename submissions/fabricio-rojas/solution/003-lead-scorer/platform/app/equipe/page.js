import Link from 'next/link';
import { Rise, Contador } from '@/components/Reveal';
import { WinCIChart } from '@/components/Charts';
import Equipe from '@/components/Equipe';
import { Users, Zap, Alert, Target } from '@/components/Icons';
import { scores } from '@/lib/data';
import { usdK, num, int } from '@/lib/fmt';

export const metadata = { title: 'Equipe — Lead Scorer' };

export default function EquipePage() {
  const s = scores();
  const a = s.agentes;
  const decidir = s.base.por_acao.decidir;
  return (
    <div className="page">
      <div className="top">
        <div><h1>Equipe</h1><div className="sub">{s.base.agentes} vendedores · {s.base.gerentes} gerentes · {s.base.escritorios} escritórios · pipeline em {s.asof.split('-').reverse().join('/')}</div></div>
        <div className="top-r"><Link href="/" className="btn sm">Ver a segunda-feira de um vendedor →</Link></div>
      </div>

      <div className="grid g-4">
        {[
          { Ic: Users, tom: 'gold', lab: 'Deals abertos', v: <Contador para={s.base.abertos} formato="int" />, sub: `${s.base.engaging} engaging · ${s.base.prospecting} prospecting` },
          { Ic: Zap, tom: 'gold', lab: 'Valor em jogo', v: <Contador para={s.base.pipeline_valor} formato="usdK" />, sub: 'soma dos tickets típicos', cls: 'gold' },
          { Ic: Target, tom: 'ok', lab: 'Valor esperado', v: <Contador para={s.base.pipeline_ev} formato="usdK" />, sub: 'ticket × probabilidade condicional', cls: 'ok' },
          { Ic: Alert, tom: 'no', lab: 'Parado além do ciclo', v: <>{num(100 * decidir.n / s.base.abertos, 0)}<small>%</small></>, sub: `${int(decidir.n)} deals · ${usdK(decidir.ev)} de valor esperado nominal`, cls: 'no' },
        ].map((k, i) => (
          <Rise key={k.lab} atraso={i * 60}>
            <div className="card tight kpi">
              <div className="lab"><span>{k.lab}</span><span className={`isq ${k.tom}`} style={{ width: 30, height: 30, borderRadius: 9 }}><k.Ic size={15} /></span></div>
              <div className={`big ${k.cls || ''}`}>{k.v}</div>
              <div className="sub">{k.sub}</div>
            </div>
          </Rise>
        ))}
      </div>

      <Rise><Equipe agentes={a} janelas={s.janelas} /></Rise>

      <Rise>
        <div className="card">
          <div className="card-h">
            <div className="ttl"><span className="isq blue"><Users /></span><div><h3>Win rate por vendedor, com intervalo de confiança</h3><span>Por que o score não usa "quem é o vendedor"</span></div></div>
            <span className="tag">IC 95% · Wilson</span>
          </div>
          <WinCIChart agentes={a} base={s.base.base_win} />
          <p className="hint" style={{ marginTop: 8 }}>
            A faixa de cada vendedor é o que o histórico dele permite afirmar. Quase todas cruzam a média do time ({num(s.base.base_win * 100)}%) — e, no teste temporal, o win rate histórico do agente prevê o próximo fechamento com AUC {num(s.validacao.aucs.find((x) => x.fator.startsWith('Agente')).auc, 2)}: moeda ao ar. Ranquear vendedores por isso seria ranquear ruído.
          </p>
        </div>
      </Rise>
    </div>
  );
}
