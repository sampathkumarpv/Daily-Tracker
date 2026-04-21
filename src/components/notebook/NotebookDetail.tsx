import { C, FONTS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconPlus } from '../ui/Icons';
import type { Notebook, Notecard } from '../../types';

interface Props {
  notebook: Notebook;
  notecards: Notecard[];
  onOpenNotecard: (id: string) => void;
  onBack: () => void;
}

export function NotebookDetail({ notebook, notecards, onOpenNotecard, onBack }: Props) {
  const cards = notecards.filter((nc) => nc.notebookId === notebook.id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: 18, overflow: 'hidden' }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onBack}
          style={{ border: 'none', background: 'transparent', fontFamily: FONTS.kalam, fontSize: 12, color: C.coral, cursor: 'pointer', padding: 0 }}
        >
          ← Notebooks
        </button>
        <span style={{ color: C.pencilLight }}>/</span>
        <span style={{ fontFamily: FONTS.caveat, fontSize: 20, fontWeight: 700, color: C.ink }}>
          {notebook.name}
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>
          {cards.length} cards
        </span>
      </div>

      {/* card grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          overflowY: 'auto',
          alignContent: 'start',
        }}
      >
        {cards.map((nc, i) => (
          <div
            key={nc.id}
            onClick={() => onOpenNotecard(nc.id)}
            style={{
              position: 'relative',
              background: nc.tint,
              padding: 14,
              minHeight: 140,
              transform: `rotate(${(i % 3 - 1) * 0.8}deg)`,
              cursor: 'pointer',
              borderRadius: 3,
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.03)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = `rotate(${(i % 3 - 1) * 0.8}deg)`;
            }}
          >
            <SketchBox stroke={C.ink} strokeWidth={1.4} rough={1.1} radius={3} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                {nc.title}
              </div>
              <div style={{ fontSize: 10, color: C.pencil, marginBottom: 8 }}>
                {nc.date}
              </div>
              {nc.content && (
                <p style={{ fontFamily: FONTS.architects, fontSize: 12, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
                  {nc.content.substring(0, 80)}{nc.content.length > 80 ? '…' : ''}
                </p>
              )}
              {nc.checkItems.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: C.inkSoft }}>
                  ☑ {nc.checkItems.filter((ci) => ci.done).length}/{nc.checkItems.length} done
                </div>
              )}
              {nc.reminder && (
                <div style={{ marginTop: 6, fontSize: 10, color: C.coral }}>
                  🔔 {nc.reminder}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* add new card */}
        <div
          style={{
            position: 'relative',
            minHeight: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <SketchBox stroke={C.pencilLight} strokeWidth={1.5} rough={1.2} radius={3} />
          <IconPlus size={20} color={C.pencil} />
          <span style={{ fontFamily: FONTS.caveat, fontSize: 15, color: C.pencil }}>new card</span>
        </div>
      </div>
    </div>
  );
}
