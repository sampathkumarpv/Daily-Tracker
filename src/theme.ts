export const C = {
  paper:        '#fdfbf5',
  paperDark:    '#f5f0e3',
  ink:          '#2a2620',
  inkSoft:      '#4a453e',
  pencil:       '#8a8478',
  pencilLight:  '#c9c2b2',
  coral:        '#d96a4d',
  coralSoft:    '#f2d4c9',
  teal:         '#4a8b8b',
  tealSoft:     '#cfe1e1',
  yellow:       '#f5d76e',
  yellowSoft:   '#fdf2c7',
  lilac:        '#b8a8d9',
  lilacSoft:    '#e6ddf2',
} as const;

export const STATUS_META = {
  yts:  { label: 'Yet to start',  short: 'To Do',   color: C.pencil,  tint: '#f5f0e3' },
  proc: { label: 'In process',    short: 'Doing',   color: C.coral,   tint: '#fbe6de' },
  rev:  { label: 'Review',        short: 'Review',  color: C.yellow,  tint: '#fdf2c7' },
  inv:  { label: 'Investigation', short: 'Invest.', color: C.lilac,   tint: '#e6ddf2' },
  done: { label: 'Merged / done', short: 'Done',    color: C.teal,    tint: '#cfe1e1' },
} as const;

export type StatusKey = keyof typeof STATUS_META;

export const FONTS = {
  caveat:     "'Caveat', cursive",
  architects: "'Architects Daughter', cursive",
  kalam:      "'Kalam', cursive",
  mono:       "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const;
