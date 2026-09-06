import { useEffect, useRef } from 'react';
import { C, FONTS, SHADOWS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconCalendar, IconClip } from '../ui/Icons';
import type { Task } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getDueDateLabel, isDueTodayOrOverdue } from '../../utils/dateUtils';

interface Props {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  isFocused?: boolean;
  onClearFocus?: () => void;
}

export function TaskCard({ task, onClick, isDragging, isFocused, onClearFocus }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const dragging = isDragging || isSortableDragging;
  const dueDateLabel = getDueDateLabel(task.dueDate);
  const isUrgent = isDueTodayOrOverdue(task.dueDate);

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isFocused]);

  // Handle click - open task (focus is cleared by parent click handler)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent double-clearing from parent
    if (onClearFocus) onClearFocus();
    onClick();
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.4 : 1,
      }}
    >
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          background: isFocused ? C.tealSoft : C.paper,
          padding: '10px 12px 12px',
          marginBottom: 8,
          boxSizing: 'border-box',
          cursor: 'pointer',
          transform: dragging ? 'rotate(-1.5deg)' : isFocused ? 'scale(1.02)' : 'none',
          boxShadow: isFocused
            ? `0 0 0 3px ${C.teal}, ${SHADOWS.cardHover}`
            : dragging
              ? SHADOWS.cardHover
              : SHADOWS.card,
          borderRadius: 4,
          transition: 'box-shadow 0.15s, transform 0.15s, background 0.15s',
          animation: isFocused ? 'focusPulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        <SketchBox
          stroke={isFocused ? C.teal : dragging ? C.coral : C.ink}
          strokeWidth={isFocused ? 2.5 : dragging ? 2 : 1.6}
          rough={1}
          radius={3}
        />
        {/* Focus indicator */}
        {isFocused && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              background: C.teal,
              color: C.paper,
              padding: '2px 8px',
              borderRadius: 8,
              fontFamily: FONTS.kalam,
              fontSize: 9,
              fontWeight: 600,
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Here it is!
          </div>
        )}
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
            {dueDateLabel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: FONTS.kalam,
                  fontSize: 10,
                  color: isUrgent ? C.coral : C.pencil,
                }}
              >
                <IconCalendar size={10} color={isUrgent ? C.coral : C.pencil} />
                {dueDateLabel}
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
        background: C.paper,
        padding: '10px 12px 12px',
        boxSizing: 'border-box',
        transform: 'rotate(-2deg)',
        boxShadow: SHADOWS.modal,
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
