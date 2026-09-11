// Explicação do score, compartilhada pela interface e pela API — um só texto, uma só verdade.
import { usd, num, int } from './fmt';

export const TOM = { fechar: 'green', acompanhar: 'blue', decidir: 'red', engajar: 'purple' };
export const ORDEM = ['fechar', 'acompanhar', 'decidir', 'engajar'];

/** Os quatro passos que compõem o score de um deal, com o número que cada um contribuiu. */
export function passos(d, { janelas, ciclo_max, totalAbertos }) {
  const foraHist = (d.flags ?? []).includes('fora_do_historico');
  return [
    { k: 'ticket', titulo: 'Ticket típico do produto', valor: usd(d.ticket),
      desc: `Mediana do que ${d.product} fechou quando ganhou. Não é o preço de tabela: é o que de fato entra.` },
    { k: 'prob', titulo: 'Probabilidade condicional à idade', valor: `× ${num(d.p * 100, 0)}%`,
      desc: d.dias == null ? 'Sem data de engajamento: usa a taxa base do time.'
        : `Dos deals que chegaram ao dia ${Math.min(d.dias, ciclo_max)} ainda abertos, ${num(d.p * 100, 0)}% acabaram ganhos.${foraHist ? ` Além do dia ${ciclo_max} não há histórico — vale o número da última faixa observada.` : ''}` },
    { k: 'janela', titulo: `Janela de ação: ${janelas[d.acao].rotulo}`, valor: `× ${num(d.mult, 1)}`, desc: `${janelas[d.acao].desc}.` },
    { k: 'score', titulo: 'Score', valor: `${d.score} / 100`, desc: `Posição do valor ponderado entre os ${int(totalAbertos)} deals abertos da empresa.` },
  ];
}

/** O que fazer com este deal, escrito para ele. */
export function acaoSugerida(d, { ciclo_max }) {
  const p = num(d.p * 100, 0);
  if (d.acao === 'fechar') return `Está no dia ${d.dias} de Engaging — a faixa em que ${p}% dos deals que chegaram até aqui acabaram ganhos. É onde sua hora rende mais: leve a proposta final para a mesa esta semana.`;
  if (d.acao === 'acompanhar') return `Há ${d.dias} dias em Engaging. Nessa fase as perdas são rápidas e as vitórias demoram — não force o fechamento; garanta que o próximo passo está agendado com a conta.`;
  if (d.acao === 'decidir') return `Há ${d.dias} dias em Engaging. Nenhum deal na história fechou depois de ${ciclo_max} dias. Confirme com a conta se ainda existe decisão em curso; se não existir, encerre e tire do pipeline.`;
  const h = d.hist ? `A conta já fechou ${d.hist.n} deals conosco (${num(d.hist.win * 100, 0)}% ganhos).` : d.account ? 'Sem histórico com a conta.' : 'Sem conta atribuída — resolva isso no CRM antes de qualquer coisa.';
  return `Prospecting, sem conversa comercial iniciada. Ticket típico de ${usd(d.ticket)}. ${h} Agende o primeiro contato.`;
}

export const FLAGS = {
  sem_conta: { label: 'sem conta', tom: 'red', desc: 'Deal sem conta no CRM: sem setor, porte nem histórico. Nenhum deal sem conta jamais foi fechado.' },
  fora_do_historico: { label: 'além do ciclo', tom: 'amber', desc: 'Mais tempo em Engaging do que qualquer deal já fechado. Provavelmente morto sem baixa.' },
  conta_quente: { label: 'conta quente', tom: 'lime', desc: 'Conta com histórico forte de compra conosco.' },
  produto_renomeado: { label: 'produto normalizado', tom: 'blue', desc: 'Veio como "GTXPro" no CRM; tratado como GTX Pro.' },
};

export function explicar(d, ctx) {
  return { passos: passos(d, ctx), acao: acaoSugerida(d, ctx), flags: (d.flags ?? []).map((f) => ({ flag: f, ...FLAGS[f] })) };
}
