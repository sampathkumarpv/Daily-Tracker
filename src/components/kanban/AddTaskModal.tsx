import { useState } from 'react';
import { C, FONTS, STATUS_META } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchButton } from '../ui/SketchBox';
import type { Task } from '../../types';

interface Props {
  defaultStatus: StatusKey;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function AddTaskModal({ defaultStatus, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<StatusKey>(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'hi' | 'med' | 'lo' | undefined>(undefined);

  const statuses = Object.keys(STATUS_META) as StatusKey[];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      tag: tag.trim() || `TASK-${Math.floor(Math.random() * 999)}`,
      status,
      priority,
      dueDate: dueDate || undefined,
      description: '',
      subtasks: [],
      notecardIds: [],
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,38,32,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: C.paper,
          padding: 28,
          width: 420,
          borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontFamily: FONTS.caveat, fontSize: 24, fontWeight: 700, color: C.ink }}>
            Add task
          </span>

          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Task title…"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (e.g. FE-100)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Due date"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: '4px 12px',
                  border: `1.5px solid ${STATUS_META[s].color}`,
                  borderRadius: 12,
                  background: status === s ? STATUS_META[s].tint : 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: 11,
                  color: status === s ? C.ink : C.pencil,
                  cursor: 'pointer',
                }}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>Priority:</span>
            {(['hi', 'med', 'lo'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(priority === p ? undefined : p)}
                style={{
                  padding: '3px 10px',
                  border: `1.3px solid ${p === 'hi' ? C.coral : p === 'med' ? C.yellow : C.pencilLight}`,
                  borderRadius: 10,
                  background: priority === p ? (p === 'hi' ? C.coralSoft : p === 'med' ? C.yellowSoft : C.paperDark) : 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: 11,
                  color: C.inkSoft,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 16px',
                border: 'none',
                background: 'transparent',
                fontFamily: FONTS.caveat,
                fontSize: 14,
                color: C.pencil,
                cursor: 'pointer',
              }}
            >
              cancel
            </button>
            <SketchButton onClick={handleSubmit}>add task</SketchButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1.5px solid ${C.pencilLight}`,
  borderRadius: 4,
  background: '#fff',
  fontFamily: FONTS.architects,
  fontSize: 14,
  color: C.ink,
  outline: 'none',
  boxSizing: 'border-box',
};
