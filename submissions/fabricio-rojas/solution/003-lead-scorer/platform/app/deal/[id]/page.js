import { notFound } from 'next/navigation';
import Deal from '@/components/deal/Deal';
import { scores, dealPorId, ctxExplicacao } from '@/lib/data';
import { explicar } from '@/lib/explain';

export async function generateMetadata({ params }) {
  const { id } = await params; const d = dealPorId(id);
  return { title: d ? `${d.account ?? d.id} · ${d.product} — Lead Scorer` : 'Deal não encontrado' };
}

export default async function DealPage({ params }) {
  const { id } = await params;
  const d = dealPorId(id);
  if (!d) notFound();
  const s = scores();
  const ctx = ctxExplicacao();
  const ag = s.agentes.find((a) => a.agent === d.agent);
  return <Deal d={d} ctx={ctx} curva={s.curva} explicacao={explicar(d, ctx)} asof={s.asof} agenteInfo={ag ? { office: ag.office, manager: ag.manager } : null} />;
}
