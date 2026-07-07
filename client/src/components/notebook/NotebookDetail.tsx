import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { C, FONTS, SHADOWS, OVERLAYS, NOTEBOOK_COLORS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconPlus, IconX, IconBell, IconClip } from '../ui/Icons';
import type { Notebook, Notecard, NotebookColor } from '../../types';
import { resolveNotebookColor } from '../../utils/notebookColor';

interface Props {
  notebook: Notebook;
  notebooks: Notebook[];
  notecards: Notecard[];
  onOpenNotecard: (id: string) => void;
  onBack: () => void;
  onAddNotecard: (notecard: Omit<Notecard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  onUpdateNotecard: (id: string, patch: Partial<Notecard>) => void;
  onDeleteNotecard: (id: string) => void;
  onReorderNotecards: (notebookId: string, orderedIds: string[]) => void;
  onMoveNotecardToNotebook: (notecardId: string, notebookId: string) => void;
  onUpdateNotebook: (id: string, patch: Partial<Notebook>) => void;
}

function getColorValue(colorKey: NotebookColor | string): string {
  const colorMap: Record<string, string> = {
    coral: 'var(--color-coralSoft)',
    teal: 'var(--color-tealSoft)',
    yellow: 'var(--color-yellowSoft)',
    lilac: 'var(--color-lilacSoft)',
    pencil: 'var(--color-paperDark)',
  };
  return colorMap[colorKey] ?? C.paperDark;
}

interface NotecardItemProps {
  notecard: Notecard;
  onClick: () => void;
  isDragging?: boolean;
  rotate?: number;
}

function NotecardItem({ notecard, onClick, isDragging, rotate = 0 }: NotecardItemProps) {
  const attachedCount = notecard.attachedTaskIds?.length ?? 0;
  const hasReminder = !!notecard.reminder;
  const checkDone = notecard.checkItems?.filter((ci) => ci.done).length ?? 0;
  const checkTotal = notecard.checkItems?.length ?? 0;

  // Get snippet from body or content
  const getSnippet = () => {
    if (notecard.content) {
      return notecard.content.substring(0, 80) + (notecard.content.length > 80 ? '…' : '');
    }
    try {
      const body = JSON.parse(notecard.body || '{}');
      const firstPara = body.content?.find((n: { type: string }) => n.type === 'paragraph');
      if (firstPara?.content?.[0]?.text) {
        const text = firstPara.content[0].text;
        return text.substring(0, 80) + (text.length > 80 ? '…' : '');
      }
    } catch {
      // Ignore parsing errors
    }
    return '';
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: notecard.tint || C.paperDark,
        padding: 14,
        minHeight: 140,
        transform: `rotate(${rotate}deg)`,
        cursor: 'pointer',
        borderRadius: 3,
        transition: 'transform 0.15s',
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}deg)`;
        }
      }}
    >
      <SketchBox stroke={C.ink} strokeWidth={1.4} rough={1.1} radius={3} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
          {notecard.title}
        </div>
        <div style={{ fontSize: 10, color: C.pencil, marginBottom: 8 }}>
          {notecard.date || new Date(notecard.createdAt).toLocaleDateString()}
        </div>

        {getSnippet() && (
          <p style={{ fontFamily: FONTS.architects, fontSize: 12, color: C.inkSoft, margin: 0, lineHeight: 1.5, marginBottom: 8 }}>
            {getSnippet()}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {checkTotal > 0 && (
            <div style={{ fontSize: 11, color: C.inkSoft }}>
              ☑ {checkDone}/{checkTotal}
            </div>
          )}
          {hasReminder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.coral }}>
              <IconBell size={10} color={C.coral} />
              <span>{notecard.reminder}</span>
            </div>
          )}
          {attachedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.teal }}>
              <IconClip size={10} color={C.teal} />
              <span>{attachedCount} task{attachedCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableNotecard({
  notecard,
  onClick,
  index,
}: {
  notecard: Notecard;
  onClick: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: notecard.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NotecardItem
        notecard={notecard}
        onClick={onClick}
        isDragging={isDragging}
        rotate={(index % 3 - 1) * 0.8}
      />
    </div>
  );
}

interface CreateNotecardModalProps {
  notebookId: string;
  notebookName: string;
  notebookColor: string;
  onClose: () => void;
  onCreate: (notecard: Omit<Notecard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
}

function CreateNotecardModal({ notebookId, notebookName, notebookColor, onClose, onCreate }: CreateNotecardModalProps) {
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      notebookId,
      notebookName,
      body: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      attachedTaskIds: [],
      date: new Date().toLocaleDateString(),
      content: '',
      checkItems: [],
      attachments: [],
      tint: getColorValue(notebookColor),
    });
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
              New Notecard
            </h2>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={18} color={C.pencil} />
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 12, color: C.inkSoft, marginBottom: 6, display: 'block' }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="My notecard..."
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

export function NotebookDetail({
  notebook,
  notebooks,
  notecards,
  onOpenNotecard,
  onBack,
  onAddNotecard,
  onReorderNotecards,
  onMoveNotecardToNotebook,
  onUpdateNotebook,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Double-click to edit notebook name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(notebook.name);
  const originalNameRef = useRef(notebook.name); // Store original name for revert on Escape
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Available colors for notebooks (from theme)
  const notebookColorOptions = NOTEBOOK_COLORS.map((value, i) => ({
    name: ['Coral', 'Rose', 'Teal', 'Lilac', 'Sage', 'Cream', 'Sky', 'Tan'][i],
    value,
  }));

  // Reset edited name when notebook changes
  useEffect(() => {
    setEditedName(notebook.name);
  }, [notebook.name]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Close color picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  const handleNameDoubleClick = () => {
    originalNameRef.current = notebook.name; // Store original before editing
    setIsEditingName(true);
  };

  const handleColorSelect = (color: string) => {
    onUpdateNotebook(notebook.id, { color });
    setShowColorPicker(false);
  };

  // Live update name as user types
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditedName(newName);
    // Update store immediately for live reflection in sidebar
    if (newName.trim()) {
      onUpdateNotebook(notebook.id, { name: newName });
    }
  };

  const handleNameSave = () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      // Reset to original if empty
      setEditedName(originalNameRef.current);
      onUpdateNotebook(notebook.id, { name: originalNameRef.current });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      // Revert to original name on escape
      setEditedName(originalNameRef.current);
      onUpdateNotebook(notebook.id, { name: originalNameRef.current });
      setIsEditingName(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const cards = notecards
    .filter((nc) => nc.notebookId === notebook.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if dropping onto a notebook in sidebar
    const overId = over.id as string;
    if (overId.startsWith('sidebar_nb_')) {
      const targetNotebookId = overId.replace('sidebar_nb_', '');
      onMoveNotecardToNotebook(active.id as string, targetNotebookId);
      return;
    }

    // Reorder within notebook
    const oldIndex = cards.findIndex((nc) => nc.id === active.id);
    const newIndex = cards.findIndex((nc) => nc.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(cards, oldIndex, newIndex);
      onReorderNotecards(notebook.id, reordered.map((nc) => nc.id));
    }
  };

  const activeCard = activeId ? cards.find((nc) => nc.id === activeId) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: 18, overflow: 'hidden' }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{ border: 'none', background: 'transparent', fontFamily: FONTS.kalam, fontSize: 12, color: C.coral, cursor: 'pointer', padding: 0 }}
        >
          ← Notebooks
        </button>
        <span style={{ color: C.pencilLight }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          {/* Color icon - click to open color picker */}
          <span
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Click to change color"
            style={{
              width: 10,
              height: 13,
              background: resolveNotebookColor(notebook.color),
              border: `1.3px solid ${C.ink}`,
              borderRadius: '1px 3px 3px 1px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLSpanElement).style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLSpanElement).style.transform = 'scale(1)';
            }}
          />

          {/* Color picker popup */}
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 8,
                background: C.paper,
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 8,
                padding: 12,
                boxShadow: SHADOWS.dropdown,
                zIndex: 100,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                minWidth: 160,
              }}
            >
              {notebookColorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                  style={{
                    width: 28,
                    height: 28,
                    background: color.value,
                    border: notebook.color === color.value ? `2px solid ${C.ink}` : `1.5px solid ${C.pencilLight}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                />
              ))}
            </div>
          )}

          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={editedName}
              onChange={handleNameChange}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 20,
                fontWeight: 700,
                color: C.ink,
                border: `1.5px solid ${C.coral}`,
                borderRadius: 4,
                padding: '2px 8px',
                background: C.paper,
                outline: 'none',
                minWidth: 120,
              }}
            />
          ) : (
            <span
              onDoubleClick={handleNameDoubleClick}
              title="Double-click to edit"
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 20,
                fontWeight: 700,
                color: C.ink,
                cursor: 'text',
                padding: '2px 4px',
                borderRadius: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLSpanElement).style.background = C.paperDark;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLSpanElement).style.background = 'transparent';
              }}
            >
              {notebook.name}
            </span>
          )}
        </div>
        <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>
          {cards.length} cards
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 6,
            background: 'transparent',
            fontFamily: FONTS.caveat,
            fontSize: 14,
            color: C.ink,
            cursor: 'pointer',
          }}
        >
          <IconPlus size={12} color={C.ink} />
          new card
        </button>
      </div>

      {/* Sidebar with other notebooks for drag target */}
      <div style={{ display: 'flex', flex: 1, gap: 18, overflow: 'hidden' }}>
        {/* Notebook targets sidebar */}
        <div
          style={{
            width: 120,
            flexShrink: 0,
            borderRight: `1.5px dashed ${C.pencilLight}`,
            paddingRight: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil, marginBottom: 4 }}>
            Move card to:
          </div>
          {notebooks.filter((nb) => nb.id !== notebook.id).map((nb) => (
            <div
              key={nb.id}
              id={`sidebar_nb_${nb.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 4,
                background: C.paperDark,
                fontSize: 11,
                color: C.inkSoft,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 11,
                  background: resolveNotebookColor(nb.color),
                  border: `1px solid ${C.ink}`,
                  borderRadius: '1px 2px 2px 1px',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: FONTS.kalam, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nb.name}
              </span>
            </div>
          ))}
        </div>

        {/* card grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={cards.map((nc) => nc.id)} strategy={rectSortingStrategy}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 16,
                  alignContent: 'start',
                }}
              >
                {cards.map((nc, i) => (
                  <SortableNotecard
                    key={nc.id}
                    notecard={nc}
                    onClick={() => onOpenNotecard(nc.id)}
                    index={i}
                  />
                ))}

                {/* add new card */}
                <div
                  onClick={() => setShowCreateModal(true)}
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
            </SortableContext>

            <DragOverlay>
              {activeCard && (
                <NotecardItem notecard={activeCard} onClick={() => {}} />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNotecardModal
          notebookId={notebook.id}
          notebookName={notebook.name}
          notebookColor={notebook.color}
          onClose={() => setShowCreateModal(false)}
          onCreate={onAddNotecard}
        />
      )}
    </div>
  );
}
