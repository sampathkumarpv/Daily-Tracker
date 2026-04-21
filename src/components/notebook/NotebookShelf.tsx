import { C, FONTS } from '../../theme';
import { SketchBox, SketchButton } from '../ui/SketchBox';
import { IconPlus } from '../ui/Icons';
import type { Notebook, Notecard } from '../../types';

interface Props {
  notebooks: Notebook[];
  notecards: Notecard[];
  onOpenNotebook: (id: string) => void;
}

function NotebookCover({
  notebook,
  cardCount,
  recentCards,
  rotate = 0,
  onClick,
}: {
  notebook: Notebook;
  cardCount: number;
  recentCards: string[];
  rotate?: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: 140,
        height: 182,
        transform: `rotate(${rotate}deg)`,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}deg) scale(1.04)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}deg)`;
      }}
    >
      {/* spine */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: notebook.color,
          borderRight: `1.5px solid ${C.ink}`,
          borderRadius: '2px 0 0 2px',
        }}
      />
      {/* cover */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 0,
          right: 0,
          bottom: 0,
          background: notebook.color,
          padding: '14px 10px 10px',
          boxSizing: 'border-box',
          borderRadius: '0 3px 3px 0',
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={1.7} rough={1} radius={2} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            color: C.ink,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.caveat,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            {notebook.name}
          </div>
          <svg width="60" height="6" viewBox="0 0 60 6" style={{ marginBottom: 8 }}>
            <path d="M 1 3 Q 15 1 30 3 T 59 3" stroke={C.ink} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
          {recentCards.slice(0, 2).map((title, i) => (
            <div
              key={i}
              style={{ fontFamily: FONTS.kalam, fontSize: 9, color: C.inkSoft, lineHeight: 1.4, marginBottom: 2 }}
            >
              · {title}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.inkSoft }}>{cardCount} cards</div>
        </div>
      </div>
    </div>
  );
}

export function NotebookShelf({ notebooks, notecards, onOpenNotebook }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: 18, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: FONTS.caveat, fontSize: 30, fontWeight: 700, color: C.ink }}>
          My notebooks
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: 12, color: C.pencil }}>
          {notebooks.length} notebooks · {notecards.length} cards
        </span>
        <div style={{ flex: 1 }} />
        <SketchButton fill="transparent" color={C.ink}>
          + new notebook
        </SketchButton>
      </div>

      {/* shelf */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden auto' }}>
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'flex-end',
            padding: '40px 10px 24px',
            flexWrap: 'wrap',
          }}
        >
          {notebooks.map((nb, i) => {
            const cards = notecards.filter((nc) => nc.notebookId === nb.id);
            return (
              <NotebookCover
                key={nb.id}
                notebook={nb}
                cardCount={cards.length}
                recentCards={cards.slice(0, 3).map((c) => c.title)}
                rotate={(i % 3 - 1) * 1.5}
                onClick={() => onOpenNotebook(nb.id)}
              />
            );
          })}

          {/* empty slot */}
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 182,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <SketchBox stroke={C.pencilLight} strokeWidth={1.5} rough={1.5} radius={3} />
            <IconPlus size={22} color={C.pencil} />
            <span style={{ fontFamily: FONTS.caveat, fontSize: 15, color: C.pencil }}>new</span>
          </div>
        </div>

        {/* shelf plank */}
        <div style={{ position: 'sticky', bottom: 0 }}>
          <svg width="100%" height="10" preserveAspectRatio="none" viewBox="0 0 800 10">
            <path
              d="M 2 5 Q 200 3 400 5 T 798 5"
              stroke={C.ink}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
