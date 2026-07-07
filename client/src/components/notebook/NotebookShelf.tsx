import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { C, FONTS, rem, SHADOWS, OVERLAYS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconPlus, IconX } from '../ui/Icons';
import type { Notebook, Notecard } from '../../types';
import { DeleteNotebookDialog } from './DeleteNotebookDialog';

interface Props {
  notebooks: Notebook[];
  notecards: Notecard[];
  onOpenNotebook: (id: string) => void;
  onAddNotebook: (notebook: Omit<Notebook, 'id' | 'createdAt' | 'order'>) => void;
  onUpdateNotebook: (id: string, patch: Partial<Notebook>) => void;
  onDeleteNotebook: (id: string) => void;
  onReorderNotebooks: (orderedIds: string[]) => void;
  onMoveNotecardToNotebook: (notecardId: string, notebookId: string) => void;
}

const ACCENT_COLORS: { key: string; color: string; label: string }[] = [
  { key: '#f9c0c0', color: '#f9c0c0', label: 'Blush' },
  { key: '#fdd5b1', color: '#fdd5b1', label: 'Peach' },
  { key: '#fef0a0', color: '#fef0a0', label: 'Butter' },
  { key: '#c5f0d0', color: '#c5f0d0', label: 'Mint' },
  { key: '#b8d8f5', color: '#b8d8f5', label: 'Sky' },
  { key: '#d4c5f9', color: '#d4c5f9', label: 'Lavender' },
  { key: '#c5ddb8', color: '#c5ddb8', label: 'Sage' },
  { key: '#f5c0d8', color: '#f5c0d8', label: 'Rose' },
  { key: '#f0e0c0', color: '#f0e0c0', label: 'Sand' },
  { key: '#c0c8f0', color: '#c0c8f0', label: 'Periwinkle' },
  { key: '#b8e0e0', color: '#b8e0e0', label: 'Seafoam' },
  { key: '#e0c8e0', color: '#e0c8e0', label: 'Mauve' },
];

// Notebook color palettes - derive page/text colors from base background
// Uses CSS variables scoped to each notebook card
const NOTEBOOK_PALETTES: Record<string, { page: string; pageFaded: string }> = {
  '#f9c0c0': { page: '#e89a9a', pageFaded: 'rgba(249,192,192,0.8)' },
  '#fdd5b1': { page: '#e8b88a', pageFaded: 'rgba(253,213,177,0.8)' },
  '#fef0a0': { page: '#e8d87a', pageFaded: 'rgba(254,240,160,0.8)' },
  '#c5f0d0': { page: '#9ad8aa', pageFaded: 'rgba(197,240,208,0.8)' },
  '#b8d8f5': { page: '#8abde8', pageFaded: 'rgba(184,216,245,0.8)' },
  '#d4c5f9': { page: '#b8a0e8', pageFaded: 'rgba(212,197,249,0.8)' },
  '#c5ddb8': { page: '#a0c890', pageFaded: 'rgba(197,221,184,0.8)' },
  '#f5c0d8': { page: '#e898b8', pageFaded: 'rgba(245,192,216,0.8)' },
  '#f0e0c0': { page: '#d8c898', pageFaded: 'rgba(240,224,192,0.8)' },
  '#c0c8f0': { page: '#98a8e0', pageFaded: 'rgba(192,200,240,0.8)' },
  '#b8e0e0': { page: '#90c8c8', pageFaded: 'rgba(184,224,224,0.8)' },
  '#e0c8e0': { page: '#c8a8c8', pageFaded: 'rgba(224,200,224,0.8)' },
};

// Default palette for unknown colors
const DEFAULT_PALETTE = { page: '#d0b0b0', pageFaded: 'rgba(208,176,176,0.8)' };

function getNotebookPalette(color: string) {
  return NOTEBOOK_PALETTES[color] || DEFAULT_PALETTE;
}

interface NotebookCoverProps {
  notebook: Notebook;
  cardCount: number;
  recentCards: string[];
  onClick: () => void;
  isDragging?: boolean;
  isOver?: boolean;
  rotate?: number;
}

// Max visible cards before showing "+N more"
const MAX_VISIBLE_CARDS = 3;

function NotebookCover({ notebook, cardCount, recentCards, onClick, isDragging, isOver, rotate = 0 }: NotebookCoverProps) {
  const palette = getNotebookPalette(notebook.color);
  const hasOverflow = recentCards.length > MAX_VISIBLE_CARDS;
  const visibleCards = recentCards.slice(0, MAX_VISIBLE_CARDS);
  const overflowCount = recentCards.length - MAX_VISIBLE_CARDS;

  return (
    <div
      data-name="notebook-cover"
      onClick={onClick}
      style={{
        // CSS variables for stacked pages effect (color-specific)
        ['--nb-bg' as string]: notebook.color,
        ['--nb-page' as string]: palette.page,
        ['--nb-page-faded' as string]: palette.pageFaded,
        // Fixed dimensions
        width: 130,
        height: 165,
        background: 'var(--nb-bg)',
        overflow: 'hidden',
        borderRadius: '3px 12px 12px 3px',
        // Stacked pages effect
        boxShadow: '-3px 2px 0 -1px var(--nb-page), -6px 4px 0 -2px var(--nb-page-faded)',
        padding: '0.625rem 0.5rem 0.625rem 0.75rem',
        boxSizing: 'border-box',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transform: `rotate(${rotate}deg)${isOver ? ' scale(1.05)' : ''}`,
        opacity: isDragging ? 0.5 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: isOver ? `2px solid ${C.ink}` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}deg) scale(1.04)`;
          (e.currentTarget as HTMLDivElement).style.boxShadow = '-4px 4px 0 -1px var(--nb-page), -8px 6px 0 -2px var(--nb-page-faded), 0 4px 12px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}deg)`;
          (e.currentTarget as HTMLDivElement).style.boxShadow = '-3px 2px 0 -1px var(--nb-page), -6px 4px 0 -2px var(--nb-page-faded)';
        }
      }}
    >
      {/* Title */}
      <div
        data-name="notebook-title"
        style={{
          fontFamily: FONTS.head,
          fontSize: rem(14),
          fontWeight: 600,
          color: C.ink,
          marginBottom: rem(6),
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {notebook.name}
      </div>

      {/* Card list */}
      <div data-name="notebook-card-list" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: rem(4) }}>
          {visibleCards.map((cardName, i) => (
            <div
              key={i}
              data-name="notebook-card-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(4),
              }}
            >
              <i
                className="ti ti-note"
                style={{
                  fontSize: rem(10),
                  color: C.inkSoft,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: rem(10),
                  color: C.inkSoft,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cardName}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom fade for overflow */}
        {hasOverflow && (
          <div
            data-name="notebook-fade"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: rem(20),
              background: 'linear-gradient(transparent, var(--nb-bg))',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div
        data-name="notebook-footer"
        style={{
          fontFamily: FONTS.ui,
          fontSize: rem(10),
          color: C.pencil,
          marginTop: rem(4),
        }}
      >
        {hasOverflow
          ? `+${overflowCount} more · ${cardCount} cards`
          : `${cardCount} card${cardCount !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}

function SortableNotebook({
  notebook,
  cardCount,
  recentCards,
  onClick,
  index,
}: {
  notebook: Notebook;
  cardCount: number;
  recentCards: string[];
  onClick: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: notebook.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NotebookCover
        notebook={notebook}
        cardCount={cardCount}
        recentCards={recentCards}
        onClick={onClick}
        isDragging={isDragging}
        isOver={isOver}
        rotate={isDragging ? -6 : (index % 3 - 1) * 1.5}
      />
    </div>
  );
}

const BIN_ID = 'notebook-bin';

function BinIcon({ size = 40, active = false }: { size?: number; active?: boolean }) {
  const ink = 'var(--color-ink)';
  const rib = active ? 'var(--color-coral)' : 'var(--color-pencil)';
  const body = active ? 'var(--color-coralSoft)' : 'var(--color-paper)';
  return (
    <svg width={size} height={size * 1.07} viewBox="0 0 58 62" fill="none"
         stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14 H50" />
      <path d="M21 14 V9 Q21 6.5 24 6.5 H34 Q37 6.5 37 9 V14" />
      <path d="M12 14 L15 54 Q15.3 57 18.5 57 H39.5 Q42.7 57 43 54 L46 14 Z" fill={body} />
      <path d="M23 24 V47 M29 24 V47 M35 24 V47" stroke={rib} strokeWidth="2.4" />
    </svg>
  );
}

function BinZone({ isDragging }: { isDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: BIN_ID });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 28,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: isDragging ? 'all' : 'none',
      }}
    >
      {/* Drop area — only visible while dragging */}
      <div style={{
        position: 'absolute',
        inset: '-14px -16px',
        borderRadius: 12,
        background: isOver ? 'var(--color-coralSoft)' : 'transparent',
        border: isDragging
          ? `2px ${isOver ? 'solid' : 'dashed'} ${isOver ? 'var(--color-coral)' : 'var(--color-pencilLight)'}`
          : 'none',
        boxShadow: isOver ? '0 0 0 4px var(--color-coralSoft), 0 8px 24px rgba(0,0,0,0.12)' : 'none',
        opacity: isDragging ? 1 : 0,
        transition: 'opacity 0.2s, background 0.15s, box-shadow 0.15s',
      }} />

      {/* Bin icon — always visible */}
      <div style={{
        position: 'relative',
        transition: 'transform 0.15s',
        transform: isOver ? 'scale(1.15)' : 'scale(1)',
      }}>
        <BinIcon size={40} active={isDragging || isOver} />
      </div>

      {/* Label */}
      <span style={{
        position: 'relative',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        color: isOver ? 'var(--color-coral)' : 'var(--color-pencil)',
        fontWeight: isOver ? 700 : 400,
        whiteSpace: 'nowrap',
        transition: 'color 0.15s',
        opacity: isDragging ? 1 : 0.7,
      }}>
        {isDragging ? (isOver ? 'release to delete' : 'drag a notebook here') : 'drag a notebook here'}
      </span>
    </div>
  );
}

function NewNotebookSlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      data-name="new-notebook-slot"
      onClick={onClick}
      style={{
        position: 'relative',
        width: 130,
        height: 165,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: rem(6),
        cursor: 'pointer',
        flexShrink: 0,
        borderRadius: '3px 12px 12px 3px',
        border: `2px dashed ${C.pencilLight}`,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.pencil;
        (e.currentTarget as HTMLDivElement).style.background = C.paperDark;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.pencilLight;
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <IconPlus size={18} color={C.pencil} />
      <span style={{ fontFamily: FONTS.head, fontSize: rem(12), color: C.pencil }}>new notebook</span>
    </div>
  );
}

interface CreateNotebookModalProps {
  onClose: () => void;
  onCreate: (notebook: Omit<Notebook, 'id' | 'createdAt' | 'order'>) => void;
}

function CreateNotebookModal({ onClose, onCreate }: CreateNotebookModalProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>('#f9c0c0');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({ name: title.trim(), color });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modal,
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: C.paper,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          borderRadius: 8,
          boxShadow: SHADOWS.modal,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FONTS.head, fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>
              New Notebook
            </h2>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={18} color={C.pencil} />
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 12, color: C.inkSoft, marginBottom: 6, display: 'block' }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="My notebook..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 6,
                fontFamily: FONTS.body,
                fontSize: 14,
                color: C.ink,
                background: C.paper,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 12, color: C.inkSoft, marginBottom: 8, display: 'block' }}>
              Color
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  title={c.label}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 6,
                    background: c.color,
                    border: color === c.key ? `2.5px solid ${C.ink}` : `1.5px solid ${C.pencilLight}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.12s, transform 0.12s',
                    transform: color === c.key ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: color === c.key ? `0 2px 8px rgba(0,0,0,0.18)` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 6,
                background: 'transparent',
                fontFamily: FONTS.ui,
                fontSize: 13,
                color: C.inkSoft,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: title.trim() ? C.coral : C.pencilLight,
                fontFamily: FONTS.ui,
                fontSize: 13,
                color: C.paper,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotebookShelf({
  notebooks,
  notecards,
  onOpenNotebook,
  onAddNotebook,
  onDeleteNotebook,
  onReorderNotebooks,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sortedNotebooks = [...notebooks].sort((a, b) => a.order - b.order);

  const getCardCount = (notebookId: string) =>
    notecards.filter((nc) => nc.notebookId === notebookId).length;

  const getRecentCards = (notebookId: string) =>
    notecards
      .filter((nc) => nc.notebookId === notebookId)
      .slice(0, 10)
      .map((nc) => nc.title);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    // Dropped on bin → show confirmation dialog
    if (over.id === BIN_ID) {
      setPendingDeleteId(active.id as string);
      return;
    }

    if (active.id === over.id) return;

    const oldIndex = sortedNotebooks.findIndex((nb) => nb.id === active.id);
    const newIndex = sortedNotebooks.findIndex((nb) => nb.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sortedNotebooks, oldIndex, newIndex);
      onReorderNotebooks(reordered.map((nb) => nb.id));
    }
  };

  const activeNotebook = activeId ? sortedNotebooks.find((nb) => nb.id === activeId) : null;

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
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 6,
            background: 'transparent',
            fontFamily: FONTS.caveat,
            fontSize: 15,
            color: C.ink,
            cursor: 'pointer',
          }}
        >
          <IconPlus size={14} color={C.ink} />
          new notebook
        </button>
      </div>

      {/* shelf */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedNotebooks.map((nb) => nb.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                display: 'flex',
                gap: 22,
                alignItems: 'flex-end',
                padding: '40px 10px 24px',
                flexWrap: 'wrap',
              }}
            >
              {sortedNotebooks.map((nb, i) => (
                <SortableNotebook
                  key={nb.id}
                  notebook={nb}
                  cardCount={getCardCount(nb.id)}
                  recentCards={getRecentCards(nb.id)}
                  onClick={() => onOpenNotebook(nb.id)}
                  index={i}
                />
              ))}
              <NewNotebookSlot onClick={() => setShowCreateModal(true)} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeNotebook && (
              <div style={{ transform: 'rotate(-6deg) scale(1.04)', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.22))' }}>
                <NotebookCover
                  notebook={activeNotebook}
                  cardCount={getCardCount(activeNotebook.id)}
                  recentCards={getRecentCards(activeNotebook.id)}
                  onClick={() => {}}
                />
              </div>
            )}
          </DragOverlay>

          <BinZone isDragging={activeId !== null} />
        </DndContext>

      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNotebookModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onAddNotebook}
        />
      )}

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (() => {
        const nb = notebooks.find((n) => n.id === pendingDeleteId);
        if (!nb) return null;
        return (
          <DeleteNotebookDialog
            notebook={{ ...nb, cardCount: getCardCount(nb.id) }}
            onCancel={() => setPendingDeleteId(null)}
            onConfirm={() => {
              onDeleteNotebook(pendingDeleteId);
              setPendingDeleteId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
