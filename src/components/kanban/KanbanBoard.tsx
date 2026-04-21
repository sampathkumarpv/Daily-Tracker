import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { C, FONTS } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchPill } from '../ui/SketchBox';
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import type { Task, Status } from '../../types';

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onMoveTask: (id: string, status: Status) => void;
  onReorderTasks: (status: Status, orderedIds: string[]) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

const STATUSES: StatusKey[] = ['yts', 'proc', 'rev', 'inv', 'done'];

export function KanbanBoard({ tasks, onTaskClick, onMoveTask, onReorderTasks, onAddTask }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<StatusKey | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'area'>('none');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const tasksByStatus = (status: StatusKey) =>
    tasks.filter((t) => t.status === status);

  const findTaskStatus = (taskId: string): StatusKey | null => {
    const t = tasks.find((t) => t.id === taskId);
    return t ? (t.status as StatusKey) : null;
  };

  const onDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id);
    setActiveTask(task ?? null);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStatus = findTaskStatus(activeId);
    if (!activeStatus) return;

    // Check if dropped over a column (status key) or another task
    const overStatus = STATUSES.includes(overId as StatusKey)
      ? (overId as StatusKey)
      : findTaskStatus(overId);

    if (overStatus && overStatus !== activeStatus) {
      onMoveTask(activeId, overStatus);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const status = findTaskStatus(activeId);
    if (!status) return;

    if (STATUSES.includes(overId as StatusKey)) return; // dropped on column header

    const colTasks = tasksByStatus(status);
    const activeIdx = colTasks.findIndex((t) => t.id === activeId);
    const overIdx = colTasks.findIndex((t) => t.id === overId);

    if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
      const reordered = arrayMove(colTasks, activeIdx, overIdx).map((t) => t.id);
      onReorderTasks(status, reordered);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 18px',
        gap: 10,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* board header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <span style={{ fontFamily: FONTS.caveat, fontSize: 26, fontWeight: 700, color: C.ink }}>
          Board
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>
          drag cards → change status
        </span>
        <div style={{ flex: 1 }} />
        <SketchPill color={C.pencil}>filter</SketchPill>
        <button
          onClick={() => setGroupBy((g) => (g === 'none' ? 'area' : 'none'))}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
        >
          <SketchPill color={groupBy === 'area' ? C.coral : C.pencil}>
            group: {groupBy}
          </SketchPill>
        </button>
      </div>

      {/* columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              tasks={tasksByStatus(s)}
              onTaskClick={onTaskClick}
              onAddTask={() => setAddingToStatus(s)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {addingToStatus && (
        <AddTaskModal
          defaultStatus={addingToStatus}
          onAdd={onAddTask}
          onClose={() => setAddingToStatus(null)}
        />
      )}
    </div>
  );
}
