import Topbar from '@/components/Topbar';
import { Rise } from '@/components/Reveal';
import { Book, Flask, Clock, Info } from '@/components/Icons';
import { findings } from '@/lib/data';
import { int } from '@/lib/fmt';

export const metadata = { title: 'Método — RavenStack | G4 AI Master' };

export default function Metodo() {
  const f = findings();
  const cN = f.coortes[f.coortes.length - 1];
  const cards = [
    { Ic: Book, tom: 'gold', t: 'Pipeline', s: `5 CSVs (${int(f.base.linhas_analisadas)} linhas) → build-db.mjs → SQLite → findings.mjs → findings.json → este app. Zero dependências na análise: só node:sqlite, biblioteca padrão.` },
    { Ic: Flask, tom: 'ok', t: 'Testes estatísticos', s: 'Permutação, 20.000 reamostragens, sem premissa de distribuição, PRNG semeado — duas execuções dão saída idêntica. stats.mjs tem self-check que falha se um rótulo aleatório for declarado significativo.' },
    { Ic: Clock, tom: 'blue', t: 'Tratamento de censura', s: `Nas tabelas de safra, o denominador só inclui contas com o horizonte inteiro observado. Sem isso a safra ${cN.coorte} apareceria com churn acima de 100% — foi o erro da primeira versão, registrado no process log.` },
    { Ic: Info, tom: 'no', t: 'Limitações', s: `Os dados não têm eventos de onboarding: a causa exata é inferida por eliminação, não observada. A janela encerra em ${f.asof}; o último mês está parcialmente censurado. O dataset é sintético.` },
  ];
  return (
    <div className="page">
      <Topbar titulo="Método e reprodução" chips={[{ txt: 'Node 22+ · nada mais' }, { txt: 'byte a byte reproduzível', tom: 'gold' }]} />
      <div className="grid g-2">
        {cards.map((c, i) => (
          <Rise key={c.t} atraso={i * 60}>
            <div className="card" style={{ height: '100%' }}>
              <div className="card-h" style={{ marginBottom: 10 }}><div className="ttl"><span className={`isq ${c.tom}`}><c.Ic /></span><h3>{c.t}</h3></div></div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{c.s}</p>
            </div>
          </Rise>
        ))}
      </div>
      <Rise>
        <div className="card navy" style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.9, color: '#c2cfd9' }}>
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Reproduzir</div>
          <div><span style={{ color: '#6f8698' }}>$</span> cd analysis && node build-db.mjs && node findings.mjs</div>
          <div><span style={{ color: '#6f8698' }}>$</span> cd ../platform && npm install && npm run dev</div>
        </div>
      </Rise>
    </div>
  );
}
