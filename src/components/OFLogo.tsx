/**
 * OFLogo — SVG fiel à marca Otavio Fontes
 *
 * Estrutura da marca:
 *  • O = squircle (anel quadrado arredondado) + dot interno (tipo lente)
 *  • F = espinha vertical + 2 barras no topo (staggered) + 1 barra central
 *  • Dot separador entre O e F
 *  • Espinha do F conecta à base do O por uma linha horizontal
 */
export default function OFLogo({
  size = 36,
  color = "#3DBDD4",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  // viewBox: 0 0 200 100
  // aspect ratio ≈ 2 : 1
  const sw = 9.5; // espessura do traço dentro do viewBox

  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OFit logo"
    >
      {/* ══════════ O — squircle ══════════ */}
      <rect
        x="7" y="7"
        width="72" height="72"
        rx="18" ry="18"
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeLinejoin="round"
      />
      {/* O — dot interno (lente / apertura) */}
      <circle cx="31" cy="42" r="7" fill={color} />

      {/* ══════════ Dot separador (junção O—F) ══════════ */}
      <circle cx="93" cy="42" r="5.5" fill={color} />

      {/* ══════════ F — espinha vertical ══════════ */}
      <line
        x1="93" y1="13"
        x2="93" y2="79"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />

      {/* F — conector horizontal: base da espinha → borda direita do O */}
      <line
        x1="79" y1="79"
        x2="93" y2="79"
        stroke={color} strokeWidth={sw} strokeLinecap="butt"
      />

      {/* F — barra superior 1 (curta, mais alta) */}
      <line
        x1="99" y1="13"
        x2="152" y2="13"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />

      {/* F — barra superior 2 (longa, logo abaixo) */}
      <line
        x1="99" y1="27"
        x2="175" y2="27"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />

      {/* F — barra central */}
      <line
        x1="99" y1="54"
        x2="165" y2="54"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
      />
    </svg>
  );
}
