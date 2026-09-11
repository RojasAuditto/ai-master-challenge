import Topbar from '@/components/Topbar';
import Calculadora from '@/components/Calculadora';
import { Rise } from '@/components/Reveal';
import { AucChart, TendenciaChart } from '@/components/Charts';
import { Target, Trend, Sparkle } from '@/components/Icons';
import { findings } from '@/lib/data';
import { num, pct } from '@/lib/fmt';

export const metadata = { title: 'Modelo de risco — RavenStack | G4 AI Master' };

export default function Modelo() {
  const f = findings();
  const m = f.modelo;
  return (
    <div className="page">
      <Topbar titulo="Modelo de risco" chips={[{ txt: 'Modelo preditivo', tom: 'gold' }, { txt: `validado em ${m.n} contas · churn em 90 dias` }]} />

      <div className="grid g-3">
        {[
          { Ic: Target, tom: 'gold', lab: 'AUC · data de entrada', v: num(m.auc_data_entrada, 2), sub: 'quando a conta entrou prevê se ela sai' },
          { Ic: Sparkle, tom: 'soft', lab: 'AUC · melhor variável comportamental', v: num(m.melhor_comportamental.auc, 2), sub: `${m.melhor_comportamental.variavel} — indistinguível de moeda ao ar` },
          { Ic: Trend, tom: 'no', lab: `Projeção · safra ${m.tendencia.rotulo_proxima}`, v: pct(m.tendencia.projecao_proxima_safra_pct), sub: `em 90 dias, se a tendência de +${num(m.tendencia.pp_por_semestre)} pp/semestre continuar`, cls: 'no' },
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

      <Rise>
        <Calculadora km={f.sobrevivencia} fatores={m.fator_coorte} coortes={f.coortes} rotuloProx={m.tendencia.rotulo_proxima} projecao={m.tendencia.projecao_proxima_safra_pct} />
      </Rise>

      <div className="grid g-2">
        <Rise>
          <div className="card">
            <div className="card-h">
              <div className="ttl"><span className="isq gold"><Target /></span><div><h3>O que prevê e o que não</h3><span>AUC no mesmo desfecho e na mesma amostra</span></div></div>
            </div>
            <AucChart entrada={m.auc_data_entrada} comportamentais={m.comportamentais} />
            <p className="hint" style={{ marginTop: 8 }}>Por isso o modelo usa só idade da conta e safra. Adicionar as 18 variáveis comportamentais daria aparência de precisão sem conteúdo.</p>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card">
            <div className="card-h">
              <div className="ttl"><span className="isq no"><Trend /></span><div><h3>Se nada mudar</h3><span>Ajuste linear nas quatro safras</span></div></div>
              <span className="chip no">+{num(m.tendencia.pp_por_semestre)} pp / semestre</span>
            </div>
            <TendenciaChart pontos={m.tendencia.pontos} projecao={m.tendencia.projecao_proxima_safra_pct} rotuloProx={m.tendencia.rotulo_proxima} />
            <p className="hint" style={{ marginTop: 8 }}>Projeção, não previsão: assume que a causa continua agindo. É o custo de não agir, em uma frase para o CEO.</p>
          </div>
        </Rise>
      </div>
    </div>
  );
}
