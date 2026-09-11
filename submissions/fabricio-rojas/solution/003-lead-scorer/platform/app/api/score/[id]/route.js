// GET /api/score/:id — score e explicação de um deal aberto, a mesma que a interface mostra.
import { scores, dealPorId, ctxExplicacao } from '@/lib/data';
import { explicar } from '@/lib/explain';

export async function GET(_req, { params }) {
  const { id } = await params;
  const d = dealPorId(id);
  if (!d) return Response.json({ erro: `deal ${id} não encontrado entre os abertos` }, { status: 404 });
  const s = scores();
  const ctx = ctxExplicacao();
  return Response.json(
    { ...d, janela: s.janelas[d.acao], explicacao: explicar(d, ctx), asof: s.asof, gerado_em: s.gerado_em },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}
