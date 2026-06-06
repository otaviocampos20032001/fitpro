export default function OFLogo({ size = 36, color = "#3DBDD4" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* O shape - rounded square */}
      <rect x="8" y="8" width="44" height="44" rx="12" stroke={color} strokeWidth="8" fill="none"/>
      <circle cx="30" cy="30" r="5" fill={color}/>
      {/* F shape */}
      <line x1="62" y1="12" x2="92" y2="12" stroke={color} strokeWidth="8" strokeLinecap="round"/>
      <line x1="62" y1="12" x2="62" y2="52" stroke={color} strokeWidth="8" strokeLinecap="round"/>
      <line x1="62" y1="32" x2="85" y2="32" stroke={color} strokeWidth="8" strokeLinecap="round"/>
      {/* Connector dot */}
      <circle cx="56" cy="32" r="4" fill={color}/>
    </svg>
  );
}
