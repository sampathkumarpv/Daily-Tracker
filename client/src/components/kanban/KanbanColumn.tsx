import { C, FONTS, STATUS_META } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconPlus } from '../ui/Icons';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Props {
  status: StatusKey;
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onAddTask: (status: StatusKey) => void;
  isOver?: boolean;
  focusedTaskId?: string | null;
  onClearFocus?: () => void;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask, isOver, focusedTaskId, onClearFocus }: Props) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver: droppableOver } = useDroppable({ id: status });
  const over = isOver || droppableOver;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {/* column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          padding: '0 2px',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: meta.color,
            border: `1.5px solid ${C.ink}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: FONTS.caveat, fontSize: 16, fontWeight: 700, color: C.ink }}>
          {meta.label}
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>({tasks.length})</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onAddTask(status)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
        >
          <IconPlus size={13} color={C.pencil} />
        </button>
      </div>

      {/* droppable zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: 6,
          background: over ? `${meta.color}30` : meta.tint,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden auto',
          transition: 'background 0.15s',
          minHeight: 80,
        }}
      >
        <SketchBox stroke={over ? meta.color : C.pencilLight} strokeWidth={over ? 1.8 : 1.2} rough={0.8} radius={4} />

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onClick={() => onTaskClick(t.id)}
                isFocused={focusedTaskId === t.id}
                onClearFocus={onClearFocus}
              />
            ))}

            {/* drop indicator when empty or hovering */}
            {over && tasks.length === 0 && (
              <div
                style={{
                  border: `2px dashed ${meta.color}`,
                  borderRadius: 4,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONTS.caveat,
                  fontSize: 14,
                  color: meta.color,
                  background: `${meta.color}10`,
                }}
              >
                drop here
              </div>
            )}

            <button
              onClick={() => onAddTask(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 8px',
                fontFamily: FONTS.kalam,
                fontSize: 11,
                color: C.pencil,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <IconPlus size={10} color={C.pencil} />
              add task
            </button>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
