import './globals.css';

export const metadata = {
  title: 'RavenStack — Diagnóstico de Churn | G4 AI Master',
  description: 'Diagnóstico de causa raiz do churn da RavenStack, com testes de significância e plano de ação priorizado.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
