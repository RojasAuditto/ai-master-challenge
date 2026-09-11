'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Help, Gear } from '@/components/ui/Icons';
import { iniciais } from '@/components/ui/Avatar';

const CRUMBS = { '/': ['Pipeline', 'Segunda-feira'], '/equipe': ['Gestão', 'Equipe'], '/metodo': ['Outros', 'Como funciona'], '/dados': ['Gestão', 'Dados do CRM'] };

/** Barra do invoice: trilha à esquerda; sino (fila Decidir), ajuda, engrenagem e avatar à direita. */
export default function Topbar({ decidir = 0 }) {
  const rota = usePathname();
  const [g, p] = CRUMBS[rota] ?? (rota.startsWith('/deal') ? ['Pipeline', 'Deal'] : ['Lead Scorer', '']);
  return (
    <div className="top">
      <div className="crumb"><span>{g}</span>{p && <><span style={{ opacity: .5 }}>/</span><b>{p}</b></>}</div>
      <div className="top-r">
        <Link href="/?agente=&fila=decidir" className="ibtn rel" title={`${decidir} deals para decidir`} aria-label={`${decidir} deals para decidir`}><Bell size={17} />{decidir > 0 && <span className="dot" />}</Link>
        <Link href="/metodo" className="ibtn" title="Como funciona" aria-label="Como funciona"><Help size={17} /></Link>
        <button className="ibtn" title="Configurações" aria-label="Configurações" onClick={() => window.dispatchEvent(new CustomEvent('ls:prefs'))}><Gear size={17} /></button>
        <span className="avatar" style={{ background: 'var(--lime)', color: 'var(--bg)', marginLeft: 4 }} title="Fabrício Rojas">{iniciais('Fabrício Rojas')}</span>
      </div>
    </div>
  );
}
