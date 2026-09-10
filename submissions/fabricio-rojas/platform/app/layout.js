import './globals.css';
import Sidebar from '@/components/Sidebar';
import { findings, filaCompleta } from '@/lib/data';

export const metadata = {
  title: 'RavenStack — Diagnóstico de Churn | G4 AI Master',
  description: 'Diagnóstico de causa raiz do churn da RavenStack, com testes de significância e plano de ação priorizado.',
};

export default function RootLayout({ children }) {
  const f = findings();
  const ativas = filaCompleta().length;
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="no-js">
        <script dangerouslySetInnerHTML={{ __html: "document.body.classList.remove('no-js')" }} />
        <div className="shell">
          <Sidebar asof={f.asof} linhas={f.base.linhas_analisadas} contasFila={ativas} />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
