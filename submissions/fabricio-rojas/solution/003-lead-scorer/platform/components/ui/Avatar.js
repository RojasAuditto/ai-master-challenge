// Avatar circular com iniciais e cor determinística (padrão dos ícones de ativos no Coinstax).
const CORES = [['#8b5cf6', 'rgba(139,92,246,.18)'], ['#f59e0b', 'rgba(245,158,11,.18)'], ['#22d3ee', 'rgba(34,211,238,.16)'], ['#f472b6', 'rgba(244,114,182,.18)'],
  ['#4ade80', 'rgba(74,222,128,.16)'], ['#60a5fa', 'rgba(96,165,250,.18)'], ['#fb7185', 'rgba(251,113,133,.18)'], ['#a3e635', 'rgba(163,230,53,.16)']];
const hash = (s) => [...(s || '?')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const iniciais = (nome) => (nome || '—').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function Avatar({ nome, size = 32, quadrado = false, style }) {
  const [fg, bg] = CORES[hash(nome) % CORES.length];
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: quadrado ? size * 0.3 : '50%', background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: Math.max(10, size * 0.36), fontWeight: 700, letterSpacing: '.02em', flex: 'none', ...style }}>
      {iniciais(nome)}
    </span>
  );
}
