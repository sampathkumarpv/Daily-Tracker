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
import { KanbanColumn } from './KanbanColumn';
import { TaskCardOverlay } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { TaskFilters, defaultFilters } from './TaskFilters';
import type { TaskFilterState } from './TaskFilters';
import type { Task, Status, Topic, Project } from '../../types';

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onMoveTask: (id: string, status: Status) => void;
  onReorderTasks: (status: Status, orderedIds: string[]) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  focusedTaskId?: string | null;
  onClearFocus?: () => void;
  topics?: Topic[];
  projects?: Project[];
  onAddTopic?: (name: string) => Promise<Topic>;
  onAddProject?: (name: string, topicId: string) => Promise<Project>;
}

const STATUSES: StatusKey[] = ['yts', 'proc', 'rev', 'inv', 'done'];

function applyFilters(tasks: Task[], filters: TaskFilterState): Task[] {
  return tasks.filter((t) => {
    // Topic filter
    if (filters.topicId !== 'all') {
      if (filters.topicId === 'none') {
        if (t.topicId) return false;
      } else {
        if (t.topicId !== filters.topicId) return false;
      }
    }

    // Project filter
    if (filters.projectId !== 'all') {
      if (filters.projectId === 'none') {
        if (t.projectId) return false;
      } else {
        if (t.projectId !== filters.projectId) return false;
      }
    }

    // Tag filter
    if (filters.tag !== 'all') {
      if (filters.tag === 'none') {
        if (t.tag && t.tag.trim() !== '') return false;
      } else {
        if (t.tag !== filters.tag) return false;
      }
    }

    // Priority filter
    if (filters.priority !== 'all') {
      if (filters.priority === 'none') {
        if (t.priority) return false;
      } else {
        if (t.priority !== filters.priority) return false;
      }
    }

    // Due date range
    if (filters.dueDateFrom && t.dueDate) {
      if (t.dueDate < filters.dueDateFrom) return false;
    }
    if (filters.dueDateTo && t.dueDate) {
      if (t.dueDate > filters.dueDateTo) return false;
    }
    // If due date filter is set but task has no due date, exclude it
    if ((filters.dueDateFrom || filters.dueDateTo) && !t.dueDate) return false;

    // Added date range (createdAt)
    if (filters.addedDateFrom && t.createdAt) {
      const createdDate = t.createdAt.split('T')[0];
      if (createdDate < filters.addedDateFrom) return false;
    }
    if (filters.addedDateTo && t.createdAt) {
      const createdDate = t.createdAt.split('T')[0];
      if (createdDate > filters.addedDateTo) return false;
    }

    return true;
  });
}

export function KanbanBoard({ tasks, onTaskClick, onMoveTask, onReorderTasks, onAddTask, focusedTaskId, onClearFocus, topics = [], projects = [], onAddTopic, onAddProject }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<StatusKey | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const existingTags = [...new Set(tasks.map((t) => t.tag).filter(Boolean))];
  const filteredTasks = applyFilters(tasks, filters);

  const tasksByStatus = (status: StatusKey) =>
    filteredTasks.filter((t) => t.status === status);

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
      onClick={onClearFocus}
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
        <span style={{ fontFamily: FONTS.caveat, fontSize: '1.625rem', fontWeight: 700, color: C.ink }}>
          Board
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>
          drag cards → change status
        </span>
        <div style={{ flex: 1 }} />
        <TaskFilters filters={filters} onChange={setFilters} existingTags={existingTags} topics={topics} projects={projects} />
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
              focusedTaskId={focusedTaskId}
              onClearFocus={onClearFocus}
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
          existingTags={existingTags}
          topics={topics}
          projects={projects}
          onAddTopic={onAddTopic}
          onAddProject={onAddProject}
        />
      )}
    </div>
  );
}
