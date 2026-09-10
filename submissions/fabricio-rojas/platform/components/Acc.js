'use client';
import { useId, useState } from 'react';
import { Chevron } from './Icons';

/** Linha expansível: afirmação sempre visível, evidência sob demanda. */
export default function Acc({ icone, titulo, resumo, pill, aberto = false, children }) {
  const [on, setOn] = useState(aberto);
  const id = useId();
  return (
    <div className="acc">
      <button className="acc-h" aria-expanded={on} aria-controls={id} onClick={() => setOn(!on)}>
        {icone}
        <span className="tx"><b>{titulo}</b><span>{resumo}</span></span>
        {pill}
        <Chevron className="chev" size={16} />
      </button>
      {on && <div className="acc-b" id={id}>{children}</div>}
    </div>
  );
}
