/**
 * ============================================================================
 * THEME STYLE GUIDE - RULES FOR ALL COMPONENTS
 * ============================================================================
 *
 * 1. COLORS - Always use `C.xxx`, never hardcode hex/rgb values
 *    ✅ color: C.ink
 *    ✅ background: C.paper
 *    ❌ color: '#2a2620'
 *    ❌ background: 'rgb(255,255,255)'
 *
 * 2. FONTS - Always use `FONTS.xxx`, never hardcode font names
 *    ✅ fontFamily: FONTS.head
 *    ✅ fontFamily: FONTS.body
 *    ❌ fontFamily: "'Caveat', cursive"
 *    ❌ fontFamily: 'Arial'
 *
 * 3. FONT SIZES - Always use `rem` units, never `px`
 *    ✅ fontSize: '1rem'      (16px at scale 1)
 *    ✅ fontSize: '0.75rem'   (12px at scale 1)
 *    ✅ fontSize: rem(14)     (helper function)
 *    ❌ fontSize: 16
 *    ❌ fontSize: '12px'
 *
 *    Common conversions (px ÷ 16 = rem):
 *    10px = 0.625rem    |  14px = 0.875rem   |  20px = 1.25rem
 *    11px = 0.6875rem   |  15px = 0.9375rem  |  22px = 1.375rem
 *    12px = 0.75rem     |  16px = 1rem       |  24px = 1.5rem
 *    13px = 0.8125rem   |  18px = 1.125rem   |  28px = 1.75rem
 *
 * 4. CSS VARIABLES - Available for direct use in CSS/styled-components:
 *    --font-head, --font-body, --font-ui, --font-scale
 *    --color-paper, --color-ink, --color-coral, --color-teal, etc.
 *
 * 5. ICONS - Always import from the centralized registry
 *    ✅ import { IconBell, IconPlus } from '../ui/Icons';
 *    ❌ import { Bell } from 'lucide-react';  // Don't import directly!
 *
 *    WHY?
 *    • Change icon once → updates everywhere
 *    • Easy to swap libraries (Lucide ↔ custom SVG)
 *    • Consistent API across the app
 *
 *    REGISTRY LOCATION: src/components/ui/Icons.tsx
 *
 *    AVAILABLE LIBRARIES (if switching from custom SVGs):
 *    ─────────────────────────────────────────────────────
 *    • Lucide (lucide.dev) — Clean, modern, most popular
 *    • Tabler Icons — Very large set
 *    • Phosphor Icons — Has hand-drawn-ish "duotone" weight
 *    • Heroicons — Made by Tailwind team
 *
 *    TO ADD A NEW ICON:
 *    1. Add it to src/components/ui/Icons.tsx
 *    2. Use naming convention: IconXxx (e.g., IconTrash, IconEdit)
 *    3. Import from Icons.tsx in your component
 *
 * 6. NAMING CONTAINERS - Every container should have a name attribute
 *    ✅ <div name="task-card">...</div>
 *    ✅ <section name="sidebar-nav">...</section>
 *    ✅ <header name="top-bar">...</header>
 *    ❌ <div>...</div>  // Anonymous container - hard to debug!
 *
 *    WHY?
 *    • Easy to find elements in DevTools
 *    • Self-documenting code structure
 *    • Faster debugging and development
 *    • Clear component boundaries
 *
 *    NAMING CONVENTION:
 *    • Use kebab-case: task-card, sidebar-nav, modal-overlay
 *    • Be descriptive: user-avatar, search-results, notebook-list
 *    • Match component name: TaskCard → name="task-card"
 *
 *    EXAMPLE:
 *    ```tsx
 *    <div name="kanban-board">
 *      <div name="kanban-column">
 *        <div name="task-card">
 *          <span name="task-title">...</span>
 *        </div>
 *      </div>
 *    </div>
 *    ```
 *
 * ============================================================================
 */

// CSS Variable-based theme colors
// These values are set dynamically by ThemeProvider via CSS custom properties
export const C = {
  paper:        'var(--color-paper)',
  paperDark:    'var(--color-paperDark)',
  ink:          'var(--color-ink)',
  inkSoft:      'var(--color-inkSoft)',
  pencil:       'var(--color-pencil)',
  pencilLight:  'var(--color-pencilLight)',
  coral:        'var(--color-coral)',
  coralSoft:    'var(--color-coralSoft)',
  teal:         'var(--color-teal)',
  tealSoft:     'var(--color-tealSoft)',
  yellow:       'var(--color-yellow)',
  yellowSoft:   'var(--color-yellowSoft)',
  lilac:        'var(--color-lilac)',
  lilacSoft:    'var(--color-lilacSoft)',
} as const;

// STATUS_META maps kanban statuses to theme colors
// Yet-to-start → pencil, In-process → coral, Review → yellow, Investigation → lilac, Merged/Done → teal
export const STATUS_META = {
  yts:  { label: 'Yet to start',  short: 'To Do',   color: C.pencil,  tint: C.paperDark },
  proc: { label: 'In process',    short: 'Doing',   color: C.coral,   tint: C.coralSoft },
  rev:  { label: 'Review',        short: 'Review',  color: C.yellow,  tint: C.yellowSoft },
  inv:  { label: 'Investigation', short: 'Invest.', color: C.lilac,   tint: C.lilacSoft },
  done: { label: 'Merged / done', short: 'Done',    color: C.teal,    tint: C.tealSoft },
} as const;

export type StatusKey = keyof typeof STATUS_META;

// CSS Variable-based fonts
// These values are set dynamically by ThemeProvider
export const FONTS = {
  head:       'var(--font-head)',
  body:       'var(--font-body)',
  ui:         'var(--font-ui)',
  // Keep legacy aliases for backward compatibility during transition
  caveat:     'var(--font-head)',
  architects: 'var(--font-body)',
  kalam:      'var(--font-ui)',
  mono:       "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const;

/**
 * Convert px to rem for scalable font sizes
 * Usage: fontSize: rem(14)  → '0.875rem'
 */
export const rem = (px: number): string => `${px / 16}rem`;

// Common shadows and overlays
export const SHADOWS = {
  card: '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)',
  cardHover: '0 2px 6px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.05)',
  dropdown: '0 4px 16px rgba(0,0,0,0.12)',
  modal: '0 8px 24px rgba(0,0,0,0.15)',
  modalDeep: '0 20px 60px rgba(0,0,0,0.25)',
  toast: '0 4px 12px rgba(0,0,0,0.15)',
} as const;

export const OVERLAYS = {
  modal: 'rgba(42,38,32,0.4)',
  modalDark: 'rgba(42,38,32,0.45)',
  blur: 'rgba(0,0,0,0.3)',
  paperTranslucent: 'rgba(255,255,255,0.7)',
} as const;

// Text and highlight color palettes for rich text editor
export const TEXT_COLORS = [
  { name: 'red', value: 'var(--color-text-red, #dc2626)' },
  { name: 'orange', value: 'var(--color-text-orange, #ea580c)' },
  { name: 'green', value: 'var(--color-text-green, #16a34a)' },
  { name: 'blue', value: 'var(--color-text-blue, #2563eb)' },
  { name: 'purple', value: 'var(--color-text-purple, #9333ea)' },
  { name: 'pink', value: 'var(--color-text-pink, #db2777)' },
] as const;

export const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: 'var(--color-highlight-yellow, #fef08a)' },
  { name: 'green', value: 'var(--color-highlight-green, #bbf7d0)' },
  { name: 'blue', value: 'var(--color-highlight-blue, #bfdbfe)' },
  { name: 'pink', value: 'var(--color-highlight-pink, #fbcfe8)' },
  { name: 'orange', value: 'var(--color-highlight-orange, #fed7aa)' },
  { name: 'purple', value: 'var(--color-highlight-purple, #e9d5ff)' },
] as const;

// Notebook color palette
export const NOTEBOOK_COLORS = [
  '#f9c0c0', // coral/pink
  '#f5c0d8', // rose
  '#b8e0e0', // teal
  '#d4c4f0', // lilac
  '#c8e0b8', // sage
  '#f5e6b8', // cream
  '#b8d4e8', // sky
  '#e8d4b8', // tan
] as const;
