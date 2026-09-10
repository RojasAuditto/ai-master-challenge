'use client';
import { useId, useState } from 'react';

/**
 * Bloco de evidencia expansivel. A afirmacao fica sempre visivel; o teste que a
 * sustenta abre sob demanda. O CEO le so a linha; quem duvida abre e verifica.
 */
export default function Prova({ n, titulo, resumo, children, aberto = false }) {
  const [on, setOn] = useState(aberto);
  const id = useId();
  return (
    <div className="prova">
      <button className="provahead" aria-expanded={on} aria-controls={id} onClick={() => setOn(!on)}>
        <span className="num">{n}</span>
        <span className="txt">
          <span className="t">{titulo}</span>
          <span className="s">{resumo}</span>
        </span>
        <svg className="chev" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {on && <div className="provabody" id={id}>{children}</div>}
    </div>
  );
}
