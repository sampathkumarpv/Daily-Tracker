const LEGACY: Record<string, string> = {
  coral:  'var(--color-coral)',
  teal:   'var(--color-teal)',
  yellow: 'var(--color-yellow)',
  lilac:  'var(--color-lilac)',
  pencil: 'var(--color-pencil)',
};

/**
 * Resolves a notebook color value to a valid CSS color.
 * Handles legacy theme-key names (e.g. "coral") and
 * new direct hex values (e.g. "#f9c0c0").
 */
export function resolveNotebookColor(color: string): string {
  return LEGACY[color] ?? color;
}
