/**
 * ============================================================================
 * ICON REGISTRY - Single source of truth for all icons
 * ============================================================================
 *
 * USAGE IN COMPONENTS:
 *   import { IconBell, IconPlus, IconSearch } from '../ui/Icons';
 *   <IconBell size={16} color={C.ink} />
 *
 * WHY CENTRALIZED?
 *   • Change an icon once → updates everywhere
 *   • Easy to swap between custom SVGs and libraries
 *   • Consistent naming and API across the app
 *
 * TO SWITCH TO LUCIDE (or other library):
 *   1. npm i lucide-react
 *   2. Replace custom SVG with:
 *      import { Bell } from 'lucide-react';
 *      export const IconBell = Bell;
 *   3. All usages automatically get the new icon
 *
 * NAMING CONVENTION:
 *   • Always prefix with "Icon" → IconBell, IconPlus, IconTrash
 *   • Matches the action/object → IconSearch, IconCalendar, IconBook
 *
 * ============================================================================
 */

import { C, FONTS } from '../../theme';

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

export const IconTrash = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M3 4 H13 M6 4 V2 H10 V4 M5 4 V14 H11 V4 M7 7 V11 M9 7 V11" />
  </svg>
);

export const IconExpand = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M2 6 V2 H6 M10 2 H14 V6 M14 10 V14 H10 M6 14 H2 V10" />
  </svg>
);

export const IconCollapse = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M6 2 V6 H2 M14 6 H10 V2 M10 14 V10 H14 M2 10 H6 V14" />
  </svg>
);

export const IconArrowRight = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M3 8 H13 M9 4 L13 8 L9 12" />
  </svg>
);

export const IconChevronLeft = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M10 3 L5 8 L10 13" />
  </svg>
);

export const IconChevronRight = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M6 3 L11 8 L6 13" />
  </svg>
);

export const IconClock = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5 V8 L10.5 10" />
  </svg>
);

export const IconTrendingUp = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M2 12 L6 8 L9 11 L14 4 M10 4 H14 V8" />
  </svg>
);

export const IconCheckCircle = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M5 8 L7 10 L11 6" />
  </svg>
);

export const IconFileText = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg {...svgProps(color ?? C.pencil, size)} viewBox="0 0 16 16">
    <path d="M4 2 H10 L12 4 V14 H4 Z M10 2 V4 H12 M6 7 H10 M6 9.5 H10 M6 12 H8" />
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
          fontFamily: FONTS.head,
          fontSize: size * 0.6,
          color: C.paper,
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
