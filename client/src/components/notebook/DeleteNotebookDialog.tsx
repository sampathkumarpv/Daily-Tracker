import React from 'react';
import type { Notebook } from '../../types';
import { SHADOWS, OVERLAYS } from '../../theme';

interface DeleteNotebookDialogProps {
  notebook: Notebook & { cardCount: number };
  onCancel: () => void;
  onConfirm: (opts: { archiveCards: boolean }) => void;
}

export function DeleteNotebookDialog({ notebook, onCancel, onConfirm }: DeleteNotebookDialogProps) {
  const [archiveCards, setArchiveCards] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-nb-title"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: OVERLAYS.modal,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--color-paper)',
          border: '2px solid var(--color-coral)',
          borderRadius: 8, padding: 26,
          boxShadow: SHADOWS.modal,
          fontFamily: 'var(--font-ui)', color: 'var(--color-ink)',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }} aria-hidden="true">
            <path d="M22 5 L40 37 Q41 39 39 39 L5 39 Q3 39 4 37 Z"
              fill="var(--color-coralSoft)" stroke="var(--color-coral)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M22 16 V27" stroke="var(--color-coral)" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="22" cy="32.5" r="1.6" fill="var(--color-coral)" />
          </svg>
          <div>
            <div id="del-nb-title" style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
              Delete this notebook?
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-pencil)', marginTop: 3 }}>This can't be undone</div>
          </div>
        </div>

        {/* the notebook being deleted */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', marginBottom: 14,
          background: 'var(--color-paper)', border: '1.5px solid var(--color-pencilLight)', borderRadius: 4,
        }}>
          <span style={{
            width: 16, height: 20, flexShrink: 0,
            background: `var(--color-${notebook.color})`,
            border: '1.5px solid var(--color-ink)',
            borderRadius: '2px 4px 4px 2px',
          }} />
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>{notebook.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-coral)', fontWeight: 700 }}>
              {notebook.cardCount} notecard{notebook.cardCount === 1 ? '' : 's'} will be permanently deleted
            </div>
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-inkSoft)', lineHeight: 1.5, margin: '0 0 14px' }}>
          All notecards inside this notebook will also be deleted. Any that are attached to tasks will be detached first.
        </p>

        {/* safer alternative */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          padding: '10px 12px', marginBottom: 18,
          background: 'var(--color-paperDark)', border: '1.5px solid var(--color-pencilLight)', borderRadius: 4,
          fontSize: 13, color: 'var(--color-inkSoft)',
        }}>
          <input
            type="checkbox"
            checked={archiveCards}
            onChange={(e) => setArchiveCards(e.target.checked)}
            style={{ accentColor: 'var(--color-coral)', width: 16, height: 16 }}
          />
          Move its {notebook.cardCount} cards to <strong>Archive</strong> instead
        </label>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>Keep it</button>
          <button onClick={() => onConfirm({ archiveCards })} style={btnDanger}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-paper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4.5 H13" />
              <path d="M6 4.5 V3 Q6 2.3 6.7 2.3 H9.3 Q10 2.3 10 3 V4.5" />
              <path d="M4 4.5 L4.6 13 Q4.7 13.7 5.4 13.7 H10.6 Q11.3 13.7 11.4 13 L12 4.5" />
              <path d="M6.5 7 V11 M9.5 7 V11" />
            </svg>
            {archiveCards ? 'Delete notebook' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 4, cursor: 'pointer',
  fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
};
const btnGhost: React.CSSProperties = { ...btnBase, background: 'transparent', color: 'var(--color-ink)', border: '1.5px solid var(--color-ink)' };
const btnDanger: React.CSSProperties = { ...btnBase, background: 'var(--color-coral)', color: 'var(--color-paper)', border: '1.5px solid var(--color-ink)' };
