import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Cmdk from '@/components/layout/Cmdk';
import { scores, gerentes, agentesResumo } from '@/lib/data';

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export const metadata = {
  title: 'Lead Scorer',
  description: 'Onde o vendedor coloca as horas na segunda-feira, e por quê. Priorização de pipeline com score explicável.',
};

export default function RootLayout({ children }) {
  const s = scores();
  const busca = s.deals.map((d) => ({ id: d.id, account: d.account, agent: d.agent, product: d.product, acao: d.acao, ev: d.ev, dias: d.dias, p: d.p, ticket: d.ticket, score: d.score }));
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="no-js">
        <script dangerouslySetInnerHTML={{ __html: "document.body.classList.remove('no-js');try{if(localStorage.getItem('ls-motion')==='off')document.documentElement.dataset.motion='off'}catch(e){}" }} />
        <div className="shell">
          <Sidebar gerentes={gerentes()} agentes={s.agentes.map((a) => a.agent).sort()} />
          <main className="main">{children}</main>
        </div>
        <Cmdk itens={busca} vendedores={agentesResumo()} janelas={s.janelas} cicloMax={s.ciclo_max} />
      </body>
    </html>
  );
}
