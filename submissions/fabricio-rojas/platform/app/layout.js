import './globals.css';
import Sidebar from '@/components/Sidebar';
import { filaCompleta } from '@/lib/data';

export const metadata = {
  title: 'RavenStack — Diagnóstico de Churn | G4 AI Master',
  description: 'Diagnóstico de causa raiz do churn da RavenStack: resposta primeiro, prova sob demanda, ferramentas para o CS.',
};

export default function RootLayout({ children }) {
  const ativas = filaCompleta().length;
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
          <Sidebar badges={{ fila: ativas }} />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
