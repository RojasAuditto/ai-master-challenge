import Pipeline from '@/components/pipeline/Pipeline';
import { scores, dealsLeves, agentesResumo } from '@/lib/data';

export default async function Page({ searchParams }) {
  // Parâmetros lidos no servidor: a página chega renderizada, sem "carregando".
  const sp = (await searchParams) ?? {};
  const inicial = { agente: sp.agente, fila: sp.fila };
  const s = scores();
  return (
    <Pipeline key={`${inicial.agente ?? ''}|${inicial.fila ?? ''}`} deals={dealsLeves()} agentes={agentesResumo()}
      janelas={s.janelas} cicloMax={s.ciclo_max} asof={s.asof} inicial={inicial} totalAbertos={s.base.abertos} />
  );
}
