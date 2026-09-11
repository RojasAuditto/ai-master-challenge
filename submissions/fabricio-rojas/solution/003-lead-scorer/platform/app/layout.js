import './globals.css';
import Sidebar from '@/components/Sidebar';
import Cmdk from '@/components/Cmdk';
import { scores } from '@/lib/data';

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export const metadata = {
  title: 'Lead Scorer — G4 AI Master',
  description: 'Priorização de pipeline para o vendedor: onde colocar as horas na segunda-feira, e por quê.',
};

export default function RootLayout({ children }) {
  const s = scores();
  const busca = s.deals.map((d) => ({ id: d.id, account: d.account, agent: d.agent, product: d.product, acao: d.acao, ev: d.ev }));
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="no-js">
        <script dangerouslySetInnerHTML={{ __html: "document.body.classList.remove('no-js')" }} />
        <div className="shell">
          <Sidebar badges={{ fechar: s.base.por_acao.fechar.n, decidir: s.base.por_acao.decidir.n }} />
          <main className="main">{children}</main>
        </div>
        <Cmdk itens={busca} />
      </body>
    </html>
  );
}
