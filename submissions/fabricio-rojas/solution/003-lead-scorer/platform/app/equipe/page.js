import Team from '@/components/equipe/Team';
import { Rise } from '@/components/ui/Reveal';
import { WinCI } from '@/components/charts/Charts';
import { scores } from '@/lib/data';
import { num } from '@/lib/fmt';

export const metadata = { title: 'Equipe — Lead Scorer' };

export default async function EquipePage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const s = scores();
  const auc = s.validacao.aucs.find((a) => a.fator.startsWith('Agente'));
  return (
    <>
      <Team key={sp.gerente ?? ''} agentes={s.agentes} janelas={s.janelas} base={s.base.base_win} inicial={{ gerente: sp.gerente }} />
      <div className="page" style={{ paddingTop: 0, marginTop: -60 }}>
        <Rise>
          <div className="card">
            <div className="card-h"><div><h3>Win rate por vendedor, com intervalo de confiança</h3><span className="sub">Por que "quem é o vendedor" não entra no score</span></div><span className="pill line">IC 95% · Wilson</span></div>
            <div style={{ marginTop: 12 }}><WinCI agentes={s.agentes} base={s.base.base_win} /></div>
            <p className="hint" style={{ marginTop: 8 }}>A faixa de cada vendedor é o que o histórico dele permite afirmar. Quase todas cruzam a média do time — e no teste temporal o win rate do agente prevê o próximo fechamento com AUC {num(auc.auc, 2)}: moeda ao ar. Ranquear vendedores por isso seria ranquear ruído.</p>
          </div>
        </Rise>
      </div>
    </>
  );
}
