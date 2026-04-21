import { C } from '../../theme';

const svgProps = (color: string, size: number) => ({
  width: size,
  height: size,
  fill: 'none',
  stroke: color,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconClip = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M11.5 7.5 L6.8 12.2 Q4.8 14.2 3.3 12.7 Q1.8 11.2 3.8 9.2 L9.5 3.5 Q11 2 12.3 3.3 Q13.6 4.6 12.1 6.1 L7 11.2 Q6.3 11.9 5.7 11.3 Q5.1 10.7 5.8 10 L10 5.8" />
  </svg>
);

export const IconPlus = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.ink, size)} viewBox="0 0 16 16">
    <path d="M8 2.5 V13.5 M2.5 8 H13.5" />
  </svg>
);

export const IconSearch = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 L14 14" />
  </svg>
);

export const IconCalendar = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <rect x="2" y="3.5" width="12" height="10.5" rx="1" />
    <path d="M5 2 V5 M11 2 V5 M2 7 H14" />
  </svg>
);

export const IconBell = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M3.5 11.5 Q3 11 3.3 10.3 L4 9 V6.5 Q4 3.5 8 3.5 Q12 3.5 12 6.5 V9 L12.7 10.3 Q13 11 12.5 11.5 Z" />
    <path d="M6.5 13.2 Q7 14.2 8 14.2 Q9 14.2 9.5 13.2" />
  </svg>
);

export const IconBook = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M2.5 3 H7 Q8 3 8 4 V13.5 Q8 12.5 7 12.5 H2.5 Z" />
    <path d="M13.5 3 H9 Q8 3 8 4 V13.5 Q8 12.5 9 12.5 H13.5 Z" />
  </svg>
);

export const IconGrip = ({ size = 12, color }: { size?: number; color?: string }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 10 14" fill={color ?? C.pencilLight}>
    <circle cx="3" cy="3" r="1.1" />
    <circle cx="7" cy="3" r="1.1" />
    <circle cx="3" cy="7" r="1.1" />
    <circle cx="7" cy="7" r="1.1" />
    <circle cx="3" cy="11" r="1.1" />
    <circle cx="7" cy="11" r="1.1" />
  </svg>
);

export const IconX = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M3 3 L13 13 M13 3 L3 13" />
  </svg>
);

export const IconArrowRight = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M3 8 H13 M9 4 L13 8 L9 12" />
  </svg>
);

export function SketchAvatar({
  size = 22,
  letter = 'M',
  color,
}: {
  size?: number;
  letter?: string;
  color?: string;
}) {
  const c = color ?? C.coral;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="12" cy="12" r="10.5" fill={c} stroke={C.ink} strokeWidth="1.4" />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Caveat', cursive",
          fontSize: size * 0.6,
          color: '#fff',
          fontWeight: 700,
        }}
      >
        {letter}
      </span>
    </div>
  );
}

export function SketchCheck({
  checked,
  size = 16,
  stroke,
  onChange,
}: {
  checked: boolean;
  size?: number;
  stroke?: string;
  onChange?: () => void;
}) {
  const s = stroke ?? C.ink;
  return (
    <span
      onClick={onChange}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        cursor: onChange ? 'pointer' : 'default',
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        <rect
          x="1"
          y="1"
          width={size - 2}
          height={size - 2}
          rx="2"
          fill="none"
          stroke={s}
          strokeWidth="1.6"
        />
        {checked && (
          <path
            d={`M ${size * 0.2} ${size * 0.55} L ${size * 0.42} ${size * 0.78} L ${size * 0.85} ${size * 0.25}`}
            fill="none"
            stroke={C.coral}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
}
