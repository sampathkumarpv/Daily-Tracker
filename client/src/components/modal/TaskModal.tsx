import { useState, useRef, useEffect } from 'react';
import { C, FONTS, STATUS_META, SHADOWS, OVERLAYS } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchPill, SketchButton } from '../ui/SketchBox';
import { IconCalendar, IconClip, IconX, SketchCheck } from '../ui/Icons';
import { LinkifiedText } from '../ui/LinkifiedText';
import type { Task, Notecard } from '../../types';
import type { Status } from '../../types';
import { getDueDateLabel, isDueTodayOrOverdue } from '../../utils/dateUtils';

interface Props {
  task: Task;
  notecards: Notecard[];
  onClose: () => void;
  onOpenCardPicker: () => void;
  onDetachCard: (notecardId: string) => void;
  onOpenNotecard: (id: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onMoveTask: (status: Status) => void;
  onAddSubtask: (text: string) => void;
  onUpdateTask?: (patch: Partial<Task>) => void;
}

export function TaskModal({
  task,
  notecards,
  onClose,
  onOpenCardPicker,
  onDetachCard,
  onOpenNotecard,
  onToggleSubtask,
  onMoveTask,
  onAddSubtask,
  onUpdateTask,
}: Props) {
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const attachedCards = notecards.filter((nc) => task.notecardIds.includes(nc.id));
  const statusMeta = STATUS_META[task.status as StatusKey];
  const statuses = Object.keys(STATUS_META) as StatusKey[];

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [editingDescription]);

  // Auto-resize description textarea (up to 3 lines)
  const autoResizeDescription = () => {
    const textarea = descriptionRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = 20; // approximate line height for fontSize 13 with 1.6 lineHeight
      const maxHeight = lineHeight * 3;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    autoResizeDescription();
  }, [description]);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask.trim());
    setNewSubtask('');
  };

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTask?.({ title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      onUpdateTask?.({ description });
    }
    setEditingDescription(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      // Store in YYYY-MM-DD format (the native date input already provides this)
      onUpdateTask?.({ dueDate: val });
    } else {
      onUpdateTask?.({ dueDate: undefined });
    }
  };

  // Calculate display label dynamically
  const dueDateLabel = getDueDateLabel(task.dueDate);
  const isDueUrgent = isDueTodayOrOverdue(task.dueDate);

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
          maxWidth: 900,
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
            <SketchPill color={statusMeta.color} bg={`${statusMeta.tint}`}>
              {statusMeta.label}
            </SketchPill>
            <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil, paddingTop: 3 }}>
              {task.tag} · created {task.createdAt}
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={18} color={C.pencil} />
            </button>
          </div>

          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setTitle(task.title);
                  setEditingTitle(false);
                }
              }}
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 30,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.1,
                margin: 0,
                flexShrink: 0,
                border: 'none',
                borderBottom: `2px solid ${C.coral}`,
                background: 'transparent',
                outline: 'none',
                width: '100%',
              }}
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 30,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.1,
                margin: 0,
                flexShrink: 0,
                cursor: 'pointer',
                borderBottom: '2px solid transparent',
              }}
              title="Click to edit title"
            >
              {task.title}
            </h2>
          )}

          {/* meta row */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.inkSoft, flexWrap: 'wrap', flexShrink: 0, fontFamily: FONTS.kalam }}>
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }}
              onClick={() => dateInputRef.current?.showPicker()}
              title="Click to change date"
            >
              <IconCalendar size={11} color={isDueUrgent ? C.coral : C.pencil} />
              <span style={{ color: isDueUrgent ? C.coral : C.inkSoft }}>
                {dueDateLabel ? `due ${dueDateLabel}` : 'set due date'}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                onChange={handleDateChange}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
            </span>
            {task.subtasks.length > 0 && <span>↳ {task.subtasks.length} subtasks</span>}
            {task.priority && <span>priority: {task.priority}</span>}
          </div>

          {/* status changer */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => onMoveTask(s)}
                style={{
                  padding: '3px 10px',
                  border: `1.5px solid ${STATUS_META[s].color}`,
                  borderRadius: 12,
                  background: task.status === s ? STATUS_META[s].tint : 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: 10,
                  color: task.status === s ? C.ink : C.pencil,
                  cursor: 'pointer',
                  fontWeight: task.status === s ? 600 : 400,
                }}
              >
                {STATUS_META[s].short}
              </button>
            ))}
          </div>

          {/* body */}
          <div style={{ flex: 1, display: 'flex', gap: 20, overflow: 'hidden', minHeight: 0 }}>
            {/* left: description + subtasks */}
            <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
              {/* description */}
              <div>
                <div style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                  Description
                </div>
                {editingDescription ? (
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Add a description…"
                    rows={1}
                    style={{
                      fontFamily: FONTS.architects,
                      fontSize: 13,
                      color: C.inkSoft,
                      lineHeight: '20px',
                      margin: 0,
                      width: '100%',
                      padding: '4px 0',
                      border: 'none',
                      borderBottom: `1.5px solid ${C.pencilLight}`,
                      borderRadius: 0,
                      background: 'transparent',
                      outline: 'none',
                      resize: 'none',
                      overflow: 'auto',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setEditingDescription(true)}
                    style={{
                      fontFamily: FONTS.architects,
                      fontSize: 13,
                      color: description ? C.inkSoft : C.pencil,
                      lineHeight: '20px',
                      padding: '4px 0',
                      borderBottom: `1.5px solid ${C.pencilLight}`,
                      cursor: 'text',
                      minHeight: 20,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                    title="Click to edit description"
                  >
                    {description ? (
                      <LinkifiedText text={description} />
                    ) : (
                      'Add a description…'
                    )}
                  </div>
                )}
              </div>

              {/* subtasks */}
              <div>
                <div style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                  Subtasks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {task.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '4px 0',
                        fontFamily: FONTS.architects,
                        fontSize: 13,
                      }}
                    >
                      <SketchCheck
                        checked={sub.done}
                        size={15}
                        onChange={() => onToggleSubtask(sub.id)}
                      />
                      <span
                        style={{
                          textDecoration: sub.done ? 'line-through' : 'none',
                          color: sub.done ? C.pencil : C.ink,
                        }}
                      >
                        {sub.text}
                      </span>
                    </div>
                  ))}
                </div>
                {/* add subtask */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="+ add subtask…"
                    style={{
                      border: 'none',
                      borderBottom: `1.5px solid ${C.pencilLight}`,
                      background: 'transparent',
                      fontFamily: FONTS.kalam,
                      fontSize: 11,
                      color: C.ink,
                      outline: 'none',
                      padding: '4px 0',
                      flex: 1,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* right: notecards */}
            <div
              style={{
                flex: 1,
                borderLeft: `1.5px dashed ${C.pencilLight}`,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconClip size={13} color={C.ink} />
                <span style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink }}>
                  Attached notecards
                </span>
                <span style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.pencil }}>
                  {attachedCards.length} / 2
                </span>
              </div>

              {attachedCards.map((nc, i) => (
                <div
                  key={nc.id}
                  style={{
                    position: 'relative',
                    padding: 14,
                    background: nc.tint,
                    transform: `rotate(${i === 0 ? -0.8 : 0.8}deg)`,
                    cursor: 'pointer',
                    borderRadius: 3,
                  }}
                  onClick={() => onOpenNotecard(nc.id)}
                >
                  <SketchBox stroke={C.ink} strokeWidth={1.4} rough={1.1} radius={3} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                      style={{ fontFamily: FONTS.caveat, fontSize: 16, fontWeight: 700, marginBottom: 4, color: C.ink }}
                    >
                      {nc.title}
                    </div>
                    <div style={{ fontSize: 10, color: C.pencil, marginBottom: 8 }}>
                      {nc.notebookName} · {nc.date}
                    </div>
                    {nc.content && (
                      <p style={{ fontFamily: FONTS.architects, fontSize: 11, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
                        {nc.content.substring(0, 80)}{nc.content.length > 80 ? '…' : ''}
                      </p>
                    )}
                    {nc.checkItems.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {nc.checkItems.slice(0, 3).map((ci) => (
                          <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.inkSoft }}>
                            <span>{ci.done ? '▸✓' : '▸'}</span>
                            <span style={{ textDecoration: ci.done ? 'line-through' : 'none' }}>{ci.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDetachCard(nc.id); }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      border: 'none',
                      background: OVERLAYS.paperTranslucent,
                      borderRadius: 10,
                      cursor: 'pointer',
                      padding: '1px 5px',
                      fontFamily: FONTS.kalam,
                      fontSize: 10,
                      color: C.pencil,
                      zIndex: 2,
                    }}
                  >
                    detach
                  </button>
                </div>
              ))}

              {attachedCards.length < 2 ? (
                <SketchButton onClick={onOpenCardPicker} fill="transparent" color={C.ink} style={{ border: `1.5px dashed ${C.pencilLight}`, fontFamily: FONTS.caveat }}>
                  + attach notecard
                </SketchButton>
              ) : (
                <div
                  style={{
                    fontFamily: FONTS.caveat,
                    fontSize: 13,
                    color: C.pencil,
                    textAlign: 'center',
                    padding: 10,
                    border: `1.5px dashed ${C.pencilLight}`,
                    borderRadius: 4,
                  }}
                >
                  slots full · detach one to attach another
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
