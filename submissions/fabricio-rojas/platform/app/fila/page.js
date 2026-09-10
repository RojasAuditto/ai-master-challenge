import Fila from '@/components/Fila';
import { Rise } from '@/components/Reveal';
import { findings, filaCompleta } from '@/lib/data';
import { usd, int, pct } from '@/lib/fmt';

export const metadata = { title: 'Fila do CS — RavenStack | G4 AI Master' };

export default function FilaPage() {
  const f = findings();
  const contas = filaCompleta();
  const cN = f.coortes[f.coortes.length - 1];
  const km = f.sobrevivencia;

  return (
    <div className="wrap">
      <section id="fila">
        <Rise>
          <div className="eyebrow">Fila do CS · atualizada com os dados até {f.asof}</div>
          <h1 style={{ fontSize: 'clamp(26px, 3.6vw, 38px)' }}>As contas para trabalhar na segunda-feira.</h1>
          <p className="lead" style={{ maxWidth: 730 }}>
            Não é um dashboard: é uma fila de trabalho. As {int(f.base.ativas)} contas ativas, ordenadas por{' '}
            <strong>ARR exposto</strong> — o MRR anualizado multiplicado pelo risco empírico da fase de vida em
            que a conta está. Clique em qualquer linha para ver por que ela está aí.
          </p>
        </Rise>

        <Rise atraso={80}>
          <div className="card plain" style={{ marginBottom: 16 }}>
            <h3>Por que o score é assim, e não um modelo</h3>
            <p style={{ margin: 0, fontSize: 13.5, maxWidth: 800 }}>
              Nenhuma das 18 variáveis comportamentais previu churn nos testes — nem uso, nem tickets, nem CSAT.
              Ranquear por “probabilidade de saída” seria inventar precisão. O que é defensável é ranquear por{' '}
              <strong>exposição</strong>: receita × risco conhecido da fase. O risco por tempo de casa vem da curva
              de sobrevivência da base inteira ({pct(km[0].hazard)} no 1º mês, caindo a um patamar depois do 5º).
            </p>
          </div>
        </Rise>

        <Fila contas={contas} coorteNova={cN.coorte} />
      </section>
    </div>
  );
}
