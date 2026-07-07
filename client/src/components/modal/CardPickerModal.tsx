import { useState } from 'react';
import { C, FONTS, SHADOWS, OVERLAYS } from '../../theme';
import { SketchBox, SketchButton } from '../ui/SketchBox';
import { IconSearch, IconPlus, IconX } from '../ui/Icons';
import type { Notecard, Task, Notebook } from '../../types';
import { resolveNotebookColor } from '../../utils/notebookColor';

const MAX_NOTECARDS_PER_TASK = 2;

interface Props {
  task: Task;
  notecards: Notecard[];
  notebooks: Notebook[];
  onAttach: (notecardId: string) => { success: boolean; message?: string };
  onCreateNotecard: (notebookId: string) => void;
  onClose: () => void;
}

export function CardPickerModal({ task, notecards, notebooks, onAttach, onCreateNotecard, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notebookFilter, setNotebookFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  // Check if task already has max notecards
  const isAtCapacity = task.notecardIds.length >= MAX_NOTECARDS_PER_TASK;
  const slotsRemaining = MAX_NOTECARDS_PER_TASK - task.notecardIds.length;

  // collect unique notebook names for filter
  const notebookNames = ['all', ...Array.from(new Set(notecards.map((nc) => nc.notebookName)))];

  const available = notecards.filter(
    (nc) =>
      !task.notecardIds.includes(nc.id) &&
      (notebookFilter === 'all' || nc.notebookName === notebookFilter) &&
      (!query || nc.title.toLowerCase().includes(query.toLowerCase()))
  );

  const handleAttach = () => {
    if (!selected) return;

    const result = onAttach(selected);
    if (!result.success) {
      setErrorMessage(result.message || 'Failed to attach notecard');
      return;
    }

    // Success - close will happen via onAttach callback
  };

  const handleCreateInNotebook = (notebookId: string) => {
    onCreateNotecard(notebookId);
    setShowCreateOptions(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modal,
        backdropFilter: 'blur(3px)',
        zIndex: 300,
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
          padding: 22,
          width: '100%',
          maxWidth: 700,
          maxHeight: '85vh',
          borderRadius: 8,
          boxShadow: SHADOWS.modal,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflow: 'hidden' }}>

          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: FONTS.caveat, fontSize: 22, fontWeight: 700, color: C.ink }}>
              Attach a notecard
            </span>
            <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>
              to "{task.title}"
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: FONTS.kalam,
                fontSize: 11,
                color: isAtCapacity ? C.coral : C.teal,
                padding: '3px 8px',
                background: isAtCapacity ? C.coralSoft : C.tealSoft,
                borderRadius: 10,
              }}
            >
              {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </span>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <IconX size={16} color={C.pencil} />
            </button>
          </div>

          {/* capacity warning */}
          {isAtCapacity && (
            <div
              style={{
                padding: '10px 14px',
                background: C.coralSoft,
                borderRadius: 6,
                fontFamily: FONTS.kalam,
                fontSize: 12,
                color: C.ink,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>
                This task already has {MAX_NOTECARDS_PER_TASK} notecards attached (maximum).
                Detach one first to attach another.
              </span>
            </div>
          )}

          {/* error message */}
          {errorMessage && (
            <div
              style={{
                padding: '8px 12px',
                background: C.coralSoft,
                borderRadius: 6,
                fontFamily: FONTS.kalam,
                fontSize: 12,
                color: C.coral,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              >
                <IconX size={12} color={C.coral} />
              </button>
            </div>
          )}

          {/* search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: C.paper, borderRadius: 4, flexShrink: 0 }}>
            <SketchBox stroke={C.pencilLight} strokeWidth={1.3} rough={0.7} radius={4} />
            <IconSearch size={13} color={C.pencil} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search across all notebooks…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONTS.kalam, fontSize: 13, color: C.ink, flex: 1 }}
              disabled={isAtCapacity}
            />
          </div>

          {/* filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {notebookNames.map((nb) => (
              <button
                key={nb}
                onClick={() => setNotebookFilter(nb)}
                disabled={isAtCapacity}
                style={{
                  padding: '3px 10px',
                  border: `1.3px solid ${notebookFilter === nb ? C.coral : C.pencilLight}`,
                  borderRadius: 10,
                  background: notebookFilter === nb ? C.coralSoft : 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: 11,
                  color: notebookFilter === nb ? C.ink : C.pencil,
                  cursor: isAtCapacity ? 'not-allowed' : 'pointer',
                  opacity: isAtCapacity ? 0.5 : 1,
                }}
              >
                {nb}
              </button>
            ))}
          </div>

          {/* card grid */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              overflowY: 'auto',
              minHeight: 0,
              opacity: isAtCapacity ? 0.5 : 1,
              pointerEvents: isAtCapacity ? 'none' : 'auto',
            }}
          >
            {available.map((nc, i) => (
              <div
                key={nc.id}
                onClick={() => setSelected(selected === nc.id ? null : nc.id)}
                style={{
                  position: 'relative',
                  background: nc.tint,
                  padding: 14,
                  minHeight: 120,
                  transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)`,
                  cursor: 'pointer',
                  borderRadius: 3,
                  transition: 'transform 0.15s',
                }}
              >
                <SketchBox
                  stroke={selected === nc.id ? C.coral : C.ink}
                  strokeWidth={selected === nc.id ? 2.2 : 1.3}
                  rough={1}
                  radius={3}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontFamily: FONTS.caveat, fontSize: 16, fontWeight: 700, marginBottom: 3, color: C.ink }}>
                    {nc.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.pencil, marginBottom: 8 }}>
                    {nc.notebookName} · {nc.date}
                  </div>
                  <p style={{ fontFamily: FONTS.architects, fontSize: 11, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
                    {(nc.content || '').substring(0, 60)}{(nc.content || '').length > 60 ? '…' : ''}
                  </p>
                </div>
                {selected === nc.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: C.coral,
                      color: C.paper,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONTS.caveat,
                      fontSize: 14,
                      fontWeight: 700,
                      zIndex: 2,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            ))}

            {/* new notecard slot */}
            <div
              onClick={() => !isAtCapacity && setShowCreateOptions(true)}
              style={{
                position: 'relative',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                cursor: isAtCapacity ? 'not-allowed' : 'pointer',
              }}
            >
              <SketchBox stroke={C.pencil} strokeWidth={1.5} rough={1.2} radius={3} />
              <IconPlus size={18} color={C.pencil} />
              <span style={{ fontFamily: FONTS.caveat, fontSize: 14, color: C.pencil }}>new notecard</span>
            </div>
          </div>

          {/* Create notecard options dropdown */}
          {showCreateOptions && notebooks.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 80,
                right: 22,
                background: C.paper,
                border: `1.5px solid ${C.ink}`,
                borderRadius: 6,
                padding: 8,
                boxShadow: SHADOWS.dropdown,
                zIndex: 10,
              }}
            >
              <div style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil, marginBottom: 6 }}>
                Create in notebook:
              </div>
              {notebooks.map((nb) => (
                <button
                  key={nb.id}
                  onClick={() => handleCreateInNotebook(nb.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '6px 10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 4,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDark)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{
                      width: 8,
                      height: 11,
                      background: resolveNotebookColor(nb.color),
                      border: `1px solid ${C.ink}`,
                      borderRadius: '1px 2px 2px 1px',
                    }}
                  />
                  <span style={{ fontFamily: FONTS.kalam, fontSize: 12, color: C.ink }}>{nb.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ padding: '7px 16px', border: 'none', background: 'transparent', fontFamily: FONTS.caveat, fontSize: 14, color: C.pencil, cursor: 'pointer' }}
            >
              cancel
            </button>
            <SketchButton
              onClick={handleAttach}
              fill={selected && !isAtCapacity ? C.coral : C.pencilLight}
              style={{ cursor: selected && !isAtCapacity ? 'pointer' : 'not-allowed' }}
            >
              attach selected
            </SketchButton>
          </div>
        </div>
      </div>
    </div>
  );
}
