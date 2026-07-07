import type { CSSProperties } from 'react';
import { C, FONTS } from '../../theme';

interface Props {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  rough?: number;
  radius?: number;
  style?: CSSProperties;
}

// Generates a slightly wobbly rounded-rect path to mimic hand-drawn borders.
function buildPath(w: number, h: number, r: number, rough: number): string {
  const jit = (seed: number) => {
    const x = Math.sin(seed * 9.21) * 10000;
    return (x - Math.floor(x) - 0.5) * rough;
  };
  return [
    `M ${r + jit(1)} ${jit(2)}`,
    `L ${w - r + jit(3)} ${jit(4)}`,
    `Q ${w + jit(5)} ${jit(6)} ${w + jit(7)} ${r + jit(8)}`,
    `L ${w + jit(9)} ${h - r + jit(10)}`,
    `Q ${w + jit(11)} ${h + jit(12)} ${w - r + jit(13)} ${h + jit(14)}`,
    `L ${r + jit(15)} ${h + jit(16)}`,
    `Q ${jit(17)} ${h + jit(18)} ${jit(19)} ${h - r + jit(20)}`,
    `L ${jit(21)} ${r + jit(22)}`,
    `Q ${jit(23)} ${jit(24)} ${r + jit(25)} ${jit(26)}`,
    'Z',
  ].join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SketchBox(_props: Props) {
  // Borders removed - return null to disable hand-drawn box effect
  return null;
}

// Separate component so callers with known dimensions can avoid DOM measurement.
export function SketchPath({
  w = 100,
  h = 100,
  stroke = C.ink,
  strokeWidth = 1.8,
  fill = 'none',
  rough = 1.5,
  radius = 4,
}: { w?: number; h?: number; stroke?: string; strokeWidth?: number; fill?: string; rough?: number; radius?: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <path
        d={buildPath(w, h, radius, rough)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface CardProps {
  children: React.ReactNode;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rough?: number;
  radius?: number;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function SketchCard({
  children,
  fill = C.paper,
  stroke = C.ink,
  strokeWidth = 1.8,
  rough = 1.2,
  radius = 4,
  padding = 14,
  style,
  className,
  onClick,
}: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        background: fill,
        borderRadius: radius,
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <SketchBox stroke={stroke} strokeWidth={strokeWidth} rough={rough} radius={radius} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

export function SketchPill({
  children,
  color = C.pencil,
  bg = 'transparent',
  style,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        fontSize: 11,
        color,
        background: bg,
        borderRadius: 10,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {/* Border SVG removed */}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  );
}

export function SketchButton({
  children,
  onClick,
  fill = C.coral,
  color = C.paper,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  fill?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '7px 16px',
        border: 'none',
        background: fill,
        color,
        fontFamily: FONTS.head,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        borderRadius: 4,
        ...style,
      }}
    >
      <SketchBox stroke={C.ink} strokeWidth={1.6} rough={0.9} radius={3} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
