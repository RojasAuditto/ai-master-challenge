import Pipeline from '@/components/Pipeline';
import { scores, dealsLeves } from '@/lib/data';

export default async function Page({ searchParams }) {
  // Parâmetros lidos no servidor: a página chega renderizada, sem 'Carregando…' no celular.
  const sp = (await searchParams) ?? {};
  const inicial = { agente: sp.agente, fila: sp.fila, deal: sp.deal };
  const s = scores();
  // Persona padrão: quem tem mais deals na janela de fechamento — a página abre com trabalho na mesa.
  const agentes = [...s.agentes]
    .map((a) => ({ agent: a.agent, manager: a.manager, office: a.office, ev: a.ev, abertos: a.abertos, fechar: a.por_acao.fechar, decidir: a.por_acao.decidir, sem_conta: a.sem_conta }))
    .sort((x, y) => y.fechar - x.fechar || y.ev - x.ev);
  // key: navegar via ⌘K para outro deal/vendedor remonta o estado; a sincronização interna da URL não passa por aqui.
  return <Pipeline key={`${inicial.agente ?? ''}|${inicial.fila ?? ''}|${inicial.deal ?? ''}`} deals={dealsLeves()} agentes={agentes} janelas={s.janelas} curva={s.curva} cicloMax={s.ciclo_max} asof={s.asof} inicial={inicial} />;
}
