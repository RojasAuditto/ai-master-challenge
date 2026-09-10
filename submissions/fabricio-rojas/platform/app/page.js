import Link from 'next/link';
import Topbar from '@/components/Topbar';
import { Rise, Contador } from '@/components/Reveal';
import { CoorteChart, Mini } from '@/components/Charts';
import { Zap, Clock, Users, Target, ArrowR, Calc, List, Trend, Check, Alert } from '@/components/Icons';
import { findings, filaCompleta } from '@/lib/data';
import { usd, usdK, num, pct, int } from '@/lib/fmt';

const dataBR = (iso) => iso.split('-').reverse().join('/');

export default function Page() {
  const f = findings();
  const contas = filaCompleta();
  const c0 = f.coortes[0], cN = f.coortes[f.coortes.length - 1];
  const km = f.sobrevivencia;
  const meio = km.find((k) => k.sobrevivencia <= 50);
  const nTestes = f.preditores.churn_evento.testes.length + f.preditores.churn_flag.testes.length;
  const criticas = contas.filter((c) => c.meses <= 3);
  const arrCrit = criticas.reduce((s, c) => s + c.arr_em_risco, 0);
  const ult = (a) => a.slice(-14);
  const varia = (a, k) => { const p = a[0][k], u = a[a.length - 1][k]; return p ? ((u - p) / p) * 100 : 0; };
  const sChurn = ult(f.afirmacoes_ceo.churn), sUso = ult(f.afirmacoes_ceo.uso), sCsat = ult(f.afirmacoes_ceo.csat);

  const acoes = [
    { n: 1, t: 'Instrumentar a janela de 90 dias e achar o que quebrou em 2024', prazo: 'Semana 1', imp: `${usdK(f.economia.arr_recuperavel)}/ano`, tom: 'gold', href: '/modelo', onde: 'Modelo de risco' },
    { n: 2, t: 'Consertar a instrumentação de churn antes de decidir com ela', prazo: 'Semana 1–2', imp: `${int(f.integridade[0].n)} contas contraditórias`, tom: 'no', href: '/dados', onde: 'Dados quebrados' },
    { n: 3, t: 'Cobrir as contas novas por exposição de receita, não por score', prazo: 'Contínuo', imp: `${usd(arrCrit)} expostos`, tom: 'soft', href: '/fila', onde: 'Fila do CS' },
  ];

  return (
    <div className="page">
      <Topbar titulo="Diagnóstico de churn" chips={[{ txt: `Dados até ${dataBR(f.asof)}` }, { txt: `${int(f.base.linhas_analisadas)} linhas · 5 tabelas` }]} />

      <div className="grid g-21">
        <Rise>
          <div className="card navy verdict">
            <span className="k">Diagnóstico</span>
            <h1>O churn não é retenção.<br />É <em>onboarding</em> — e piora a cada safra.</h1>
            <p>Metade das contas some antes do mês {meio?.mes}. Quem entrou em {cN.coorte} perde {pct(cN.m3.pct)} em 90 dias, contra {pct(c0.m3.pct)} de quem entrou em {c0.coorte}. A empresa não perde clientes antigos — falha em ativar os novos.</p>
            <div className="chips">
              <span className="chip"><b>{num(cN.m3.pct / c0.m3.pct)}×</b> pior na mesma idade</span>
              <span className="chip"><b>5 de 5</b> canais afetados</span>
              <span className="chip"><b>0/{nTestes}</b> preditores individuais</span>
              <span className="chip"><b>p &lt; 0,0001</b></span>
            </div>
            <div className="ft">
              <span style={{ fontSize: 12, color: '#8ea2b3' }}>Uso e satisfação estáveis são verdade — e é por isso que ninguém viu.</span>
              <Link href="/evidencias">Ver a prova <ArrowR size={15} /></Link>
            </div>
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card gold kpi" style={{ height: '100%', justifyContent: 'space-between' }}>
            <div>
              <div className="lab"><span>Prêmio anual</span><span className="isq gold" style={{ width: 30, height: 30, borderRadius: 9 }}><Zap size={15} /></span></div>
              <div className="big gold" style={{ fontSize: 40, marginTop: 10 }}><Contador para={f.economia.arr_recuperavel} formato="usdK" /></div>
              <div className="sub" style={{ marginTop: 8 }}>de ARR recuperável ao voltar à retenção de 90 dias que a empresa já teve em {c0.coorte}.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700 }}><span style={{ color: 'var(--alert)' }}>Hoje · {pct(cN.m3.pct)}</span><span style={{ color: 'var(--ok)' }}>Meta · {pct(c0.m3.pct)}</span></div>
              <div className="bar"><i className="no" style={{ width: `${cN.m3.pct}%` }} /></div>
              <div className="bar"><i className="ok" style={{ width: `${c0.m3.pct}%` }} /></div>
              <div className="hint">{num(f.economia.contas_salvas_mes)} contas salvas por mês · {usd(f.economia.mrr_medio_conta)} de MRR médio</div>
            </div>
          </div>
        </Rise>
      </div>

      <div className="grid g-4">
        {[
          { Ic: Clock, tom: 'no', lab: 'Risco no 1º mês', v: <><Contador para={km[0].hazard} formato="num" />%</>, sub: 'o pico de toda a vida do cliente' },
          { Ic: Trend, tom: 'no', lab: 'Churn em 90 dias hoje', v: <>{pct(cN.m3.pct)}</>, sub: `era ${pct(c0.m3.pct)} em ${c0.coorte}` },
          { Ic: Users, tom: 'gold', lab: 'Na janela crítica', v: <><Contador para={criticas.length} formato="int" /><small>contas</small></>, sub: `${usd(arrCrit)} de ARR expostos` },
          { Ic: Target, tom: 'ok', lab: 'Preditores válidos', v: <>0<small>/ {nTestes}</small></>, sub: 'nenhuma variável prevê quem sai' },
        ].map((k, i) => (
          <Rise key={k.lab} atraso={i * 60}>
            <div className="card tight kpi">
              <div className="lab"><span>{k.lab}</span><span className={`isq ${k.tom}`} style={{ width: 30, height: 30, borderRadius: 9 }}><k.Ic size={15} /></span></div>
              <div className="big">{k.v}</div>
              <div className="sub">{k.sub}</div>
            </div>
          </Rise>
        ))}
      </div>

      <div className="grid g-32">
        <Rise>
          <div className="card">
            <div className="card-h">
              <div className="ttl"><span className="isq navy"><Trend /></span><div><h3>Churn na mesma idade, por safra</h3><span>Passe o mouse nas barras · troque o horizonte</span></div></div>
              <span className="chip ok"><Check size={12} /> p &lt; 0,0001</span>
            </div>
            <CoorteChart coortes={f.coortes} compacto />
          </div>
        </Rise>
        <Rise atraso={80}>
          <div className="card" style={{ height: '100%' }}>
            <div className="card-h">
              <div className="ttl"><span className="isq blue"><Alert /></span><div><h3>Por que ninguém viu</h3><span>Os três times estão certos</span></div></div>
            </div>
            <div className="rows">
              {[
                { t: 'Churns por mês', s: `${sChurn[0].n} → ${sChurn[sChurn.length - 1].n}`, d: sChurn, k: 'n', cor: '#b3402f', tom: 'no' },
                { t: 'Uso do produto', s: `${int(sUso[0].usos)} → ${int(sUso[sUso.length - 1].usos)}`, d: sUso, k: 'usos', cor: '#3d6f94', tom: 'soft' },
                { t: 'Satisfação (CSAT)', s: `${num(sCsat[0].csat, 2)} → ${num(sCsat[sCsat.length - 1].csat, 2)}`, d: sCsat, k: 'csat', cor: '#3d6f94', tom: 'soft', dom: [1, 5] },
              ].map((r) => (
                <div key={r.t} className="row-i">
                  <div className="tx"><b>{r.t}</b><span>{r.s}</span></div>
                  <Mini dados={r.d} chave={r.k} cor={r.cor} dominio={r.dom} w={96} h={30} />
                  <span className={`chip ${r.tom}`} style={{ minWidth: 58, justifyContent: 'center' }}>{varia(r.d, r.k) >= 0 ? '+' : ''}{num(varia(r.d, r.k), 0)}%</span>
                </div>
              ))}
            </div>
            <p className="hint" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              Uso e CSAT são médias dominadas por quem <b style={{ color: 'var(--ink)' }}>sobreviveu</b>. As contas novas somem antes de mover a média. O churn conta todas as saídas.
            </p>
          </div>
        </Rise>
      </div>

      <Rise>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-h" style={{ padding: '16px 18px 0', marginBottom: 12 }}>
            <div className="ttl"><span className="isq gold"><Check /></span><div><h3>O que fazer</h3><span>Três frentes, em ordem de retorno</span></div></div>
          </div>
          <div className="tw" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead><tr><th style={{ width: 44 }}>#</th><th>Ação</th><th>Prazo</th><th>Impacto</th><th>Ferramenta</th></tr></thead>
              <tbody>
                {acoes.map((a) => (
                  <tr key={a.n}>
                    <td><span className="isq" style={{ width: 28, height: 28, borderRadius: 8, fontWeight: 800, fontSize: 12, color: 'var(--ink)' }}>{a.n}</span></td>
                    <td style={{ color: 'var(--ink)', fontWeight: 600 }}>{a.t}</td>
                    <td><span className="chip soft"><Clock size={12} />{a.prazo}</span></td>
                    <td><span className={`chip ${a.tom}`}>{a.imp}</span></td>
                    <td><Link href={a.href} style={{ color: 'var(--gold-ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>{a.onde} <ArrowR size={13} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="hint" style={{ fontWeight: 700, color: 'var(--ink-2)' }}>Não recomendo:</span>
            <span className="chip soft">modelo preditivo por comportamento</span>
            <span className="chip soft">campanha por segmento</span>
            <span className="chip soft">programa de satisfação</span>
            <Link href="/evidencias" className="hint" style={{ marginLeft: 'auto', color: 'var(--gold-ink)', fontWeight: 700 }}>por quê →</Link>
          </div>
        </div>
      </Rise>

      <div className="grid g-2">
        {[
          { href: '/modelo', Ic: Calc, t: 'Modelo de risco', s: `Data de entrada prevê (AUC ${num(f.modelo.auc_data_entrada, 2)}); comportamento não (${num(f.modelo.melhor_comportamental.auc, 2)}). Simule uma conta.`, chip: 'Modelo preditivo' },
          { href: '/fila', Ic: List, t: 'Fila do CS', s: `${int(contas.length)} contas ativas ordenadas por ARR exposto, com roteiro de abordagem. Exporta em CSV.`, chip: 'Usável amanhã' },
        ].map((c, i) => (
          <Rise key={c.href} atraso={i * 70}>
            <Link href={c.href} className="card tight" style={{ display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .14s' }}>
              <span className="isq navy" style={{ width: 42, height: 42, borderRadius: 13 }}><c.Ic size={19} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><b style={{ fontSize: 14 }}>{c.t}</b><span className="chip gold" style={{ padding: '3px 8px', fontSize: 10.5 }}>{c.chip}</span></div>
                <div className="hint" style={{ marginTop: 3 }}>{c.s}</div>
              </div>
              <ArrowR size={17} style={{ color: 'var(--ink-3)', flex: 'none' }} />
            </Link>
          </Rise>
        ))}
      </div>
    </div>
  );
}
