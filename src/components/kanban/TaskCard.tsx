import { C, FONTS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconCalendar, IconClip } from '../ui/Icons';
import type { Task } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const dragging = isDragging || isSortableDragging;
  const isToday = task.dueDate === 'Today';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.4 : 1,
      }}
    >
      <div
        onClick={onClick}
        style={{
          position: 'relative',
          background: '#fff',
          padding: '10px 12px 12px',
          marginBottom: 8,
          boxSizing: 'border-box',
          cursor: 'pointer',
          transform: dragging ? 'rotate(-1.5deg)' : 'none',
          boxShadow: dragging
            ? '0 8px 20px rgba(0,0,0,.14)'
            : '0 1px 3px rgba(0,0,0,.05)',
          borderRadius: 4,
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
      >
        <SketchBox
          stroke={dragging ? C.coral : C.ink}
          strokeWidth={dragging ? 2 : 1.6}
          rough={1}
          radius={3}
        />
        {/* drag handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            cursor: 'grab',
            padding: 3,
            opacity: 0.3,
            zIndex: 2,
          }}
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill={C.pencil}>
            <circle cx="2" cy="2" r="1" />
            <circle cx="6" cy="2" r="1" />
            <circle cx="2" cy="6" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="2" cy="10" r="1" />
            <circle cx="6" cy="10" r="1" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* tag row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <span style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.pencil, letterSpacing: 0.3 }}>
              {task.tag}
            </span>
            {task.priority === 'hi' && (
              <span style={{ fontFamily: FONTS.caveat, fontSize: 13, color: C.coral, lineHeight: 1 }}>!!</span>
            )}
          </div>

          {/* title */}
          <div
            style={{
              fontFamily: FONTS.architects,
              fontSize: 13,
              color: C.ink,
              lineHeight: 1.3,
              marginBottom: 8,
              paddingRight: 12,
            }}
          >
            {task.title}
          </div>

          {/* meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {task.dueDate && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: FONTS.kalam,
                  fontSize: 10,
                  color: isToday ? C.coral : C.pencil,
                }}
              >
                <IconCalendar size={10} color={isToday ? C.coral : C.pencil} />
                {task.dueDate}
              </span>
            )}
            {task.notecardIds.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: FONTS.kalam,
                  fontSize: 10,
                  color: C.pencil,
                }}
              >
                <IconClip size={10} color={C.pencil} />
                {task.notecardIds.length}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.pencil }}>
                ↳ {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overlay card shown during active drag (full opacity, slight rotation)
export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        padding: '10px 12px 12px',
        boxSizing: 'border-box',
        transform: 'rotate(-2deg)',
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
        borderRadius: 4,
        cursor: 'grabbing',
      }}
    >
      <SketchBox stroke={C.coral} strokeWidth={2} rough={1} radius={3} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.pencil, marginBottom: 3 }}>
          {task.tag}
        </div>
        <div style={{ fontFamily: FONTS.architects, fontSize: 13, color: C.ink, lineHeight: 1.3 }}>
          {task.title}
        </div>
      </div>
    </div>
  );
}
