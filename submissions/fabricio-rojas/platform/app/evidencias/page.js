import Topbar from '@/components/Topbar';
import Acc from '@/components/Acc';
import { Rise } from '@/components/Reveal';
import { CoorteChart, SobrevivenciaChart, HazardChart, PreditorChart, CanalChart } from '@/components/Charts';
import { Flask, Target, Clock, Users, X, Trend } from '@/components/Icons';
import { findings } from '@/lib/data';
import { num, pct, int } from '@/lib/fmt';

export const metadata = { title: 'Evidências — RavenStack | G4 AI Master' };

export default function Evidencias() {
  const f = findings();
  const c0 = f.coortes[0], cN = f.coortes[f.coortes.length - 1];
  const km = f.sobrevivencia;
  const meio = km.find((k) => k.sobrevivencia <= 50);
  const testes = f.preditores.churn_evento.testes;
  const nTestes = testes.length + f.preditores.churn_flag.testes.length;
  const patamar = km.slice(5).reduce((s, k) => s + k.hazard, 0) / km.slice(5).length;
  const Isq = ({ tom, Ic }) => <span className={`isq ${tom}`}><Ic /></span>;

  return (
    <div className="page">
      <Topbar titulo="Evidências" chips={[{ txt: '5 blocos · abra o que quiser verificar' }, { txt: 'permutação · 20.000 reamostragens', tom: 'gold' }]} />
      <Rise>
        <p className="lead" style={{ maxWidth: 760 }}>A afirmação de cada bloco está na linha. O teste que a sustenta abre ao clicar. Se você é o CEO, pode pular — a decisão não muda. Se vai defender o número numa reunião, abra tudo.</p>
      </Rise>

      <Rise>
        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <Acc aberto icone={<Isq tom="gold" Ic={Trend} />} titulo="Cada safra sai mais rápido — na mesma idade de conta"
            resumo={`90 dias: ${f.coortes.map((c) => c.m3 ? pct(c.m3.pct) : '–').join(' → ')}`} pill={<span className="chip ok">p &lt; 0,0001</span>}>
            <CoorteChart coortes={f.coortes} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span className="chip soft">χ² = {num(f.teste_coorte.chi2, 2)}</span>
              <span className="chip soft">n = {int(f.teste_coorte.n)} com 90 dias completos</span>
              <span className="chip soft">0 de 20.000 embaralhamentos igualou</span>
              <span className="chip soft">mix de canal, plano e porte estável</span>
            </div>
          </Acc>

          <Acc icone={<Isq tom="blue" Ic={Users} />} titulo="A piora acontece dentro de cada canal" resumo="Não é um canal ruim contaminando o total" pill={<span className="chip blue">5 de 5</span>}>
            <CanalChart dados={f.coorte_por_canal} coortes={f.coortes} />
          </Acc>

          <Acc icone={<Isq tom="ok" Ic={Target} />} titulo="Nenhuma variável prevê qual conta vai sair"
            resumo={`${nTestes} testes · 18 variáveis × 2 definições de churn · maior efeito |d| < 0,17`} pill={<span className="chip ok">0 / {nTestes}</span>}>
            <PreditorChart testes={testes} />
            <div className="card gold tight" style={{ marginTop: 10 }}>
              <b style={{ fontSize: 13 }}>Este resultado negativo é o achado mais valioso.</b>
              <p className="hint" style={{ marginTop: 4, color: 'var(--ink-2)' }}>Sem sinal individual e com deterioração enorme por safra, a causa é sistêmica e mudou no tempo. Não se conserta ligando para contas em risco — conserta-se a entrada. Um modelo treinado nessas variáveis teria performance de moeda ao ar.</p>
            </div>
          </Acc>

          <Acc icone={<Isq tom="no" Ic={Clock} />} titulo="O risco está concentrado nos primeiros 90 dias"
            resumo={`Metade sai até o mês ${meio?.mes} · risco cai de ${pct(km[0].hazard)} para ~${pct(patamar)} ao mês`} pill={<span className="chip no">{pct(km[0].hazard)} no 1º mês</span>}>
            <SobrevivenciaChart km={km} />
            <div style={{ marginTop: 10 }}><HazardChart km={km} /></div>
          </Acc>

          <Acc icone={<Isq tom="soft" Ic={Flask} />} titulo="Quatro explicações plausíveis que os dados não sustentam" resumo="Três delas são o que uma análise apressada entregaria" pill={<span className="chip soft">4 rejeitadas</span>}>
            <div className="rows">
              {f.rejeitadas.map((r, i) => (
                <div key={i} className="row-i" style={{ alignItems: 'flex-start' }}>
                  <span className="isq no" style={{ width: 28, height: 28, borderRadius: 8 }}><X size={14} /></span>
                  <div className="tx"><b>{r.hipotese}</b><span className="mono" style={{ display: 'block', marginTop: 3 }}>{r.teste}</span><span style={{ marginTop: 4, color: 'var(--ink-2)' }}>{r.detalhe}</span></div>
                  <span className="chip no">{r.veredito}</span>
                </div>
              ))}
            </div>
          </Acc>
        </div>
      </Rise>
    </div>
  );
}
