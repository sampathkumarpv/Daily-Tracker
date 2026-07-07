import { useTheme } from '../../context/ThemeContext';
import { THEMES, FONT_PRESETS, type ThemeName, type FontName } from '../../context/themeConfig';
import { SHADOWS } from '../../theme';

const themeKeys = Object.keys(THEMES) as ThemeName[];
const fontKeys = Object.keys(FONT_PRESETS) as FontName[];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemePanel({ isOpen, onClose }: Props) {
  const { name, setName, font, setFont } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 50,
        right: 60,
        zIndex: 50,
        background: 'var(--color-paper)',
        borderRadius: 12,
        border: '1px solid var(--color-ink)',
        boxShadow: SHADOWS.dropdown,
        padding: 16,
        minWidth: 280,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>Appearance</span>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            color: 'var(--color-pencil)',
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Theme row */}
      <div style={{ marginBottom: 14 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--color-pencil)',
          marginBottom: 8,
          display: 'block',
        }}>
          Theme
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {themeKeys.map((key) => {
            const theme = THEMES[key];
            const isActive = name === key;
            return (
              <button
                key={key}
                onClick={() => setName(key)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: isActive ? 'none' : '1px solid var(--color-pencilLight)',
                  background: isActive ? 'var(--color-ink)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {/* 3-swatch preview */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: theme.paper,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }} />
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: theme.coral,
                  }} />
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: theme.teal,
                  }} />
                </div>
                <span style={{
                  fontSize: 10,
                  color: isActive ? 'var(--color-paper)' : 'var(--color-inkSoft)',
                  fontFamily: 'var(--font-ui)',
                }}>
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font row */}
      <div>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--color-pencil)',
          marginBottom: 8,
          display: 'block',
        }}>
          Font
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {fontKeys.map((key) => {
            const preset = FONT_PRESETS[key];
            const isActive = font === key;
            return (
              <button
                key={key}
                onClick={() => setFont(key)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: isActive ? 'none' : '1px solid var(--color-pencilLight)',
                  background: isActive ? 'var(--color-ink)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: preset.head,
                  fontSize: 12,
                  color: isActive ? 'var(--color-paper)' : 'var(--color-inkSoft)',
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
