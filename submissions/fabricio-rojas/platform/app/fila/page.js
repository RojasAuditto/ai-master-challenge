import Topbar from '@/components/Topbar';
import Fila from '@/components/Fila';
import { Rise } from '@/components/Reveal';
import { findings, filaCompleta } from '@/lib/data';
import { int, pct } from '@/lib/fmt';

export const metadata = { title: 'Fila do CS — RavenStack | G4 AI Master' };

export default function FilaPage() {
  const f = findings();
  const contas = filaCompleta();
  const cN = f.coortes[f.coortes.length - 1];
  return (
    <div className="page">
      <Topbar titulo="Fila do CS" chips={[{ txt: 'Usável amanhã', tom: 'gold' }, { txt: `${int(contas.length)} contas ativas` }, { txt: `ordem: MRR × 12 × risco da fase` }]} />
      <Rise>
        <p className="lead" style={{ maxWidth: 760 }}>
          Fila de trabalho, não dashboard. Ordenada por <b>ARR exposto</b>: MRR anualizado × risco empírico da idade da conta ({pct(f.sobrevivencia[0].hazard)} no 1º mês). Sem score comportamental — nenhuma variável previu churn. Clique numa linha para o motivo e o roteiro de abordagem.
        </p>
      </Rise>
      <Fila contas={contas} coorteNova={cN.coorte} />
    </div>
  );
}
