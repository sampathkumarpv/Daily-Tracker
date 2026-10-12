import { useState } from 'react';
import { C, FONTS, STATUS_META, rem } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchPill } from '../ui/SketchBox';
import { IconCalendar, IconClip, IconPlus, IconTrash, SketchCheck } from '../ui/Icons';
import type { Task, Status, Topic, Project } from '../../types';
import { AddTaskModal } from './AddTaskModal';
import { getDueDateLabel, isDueTodayOrOverdue } from '../../utils/dateUtils';
import { TaskFilters, defaultFilters, hasActiveFilters } from './TaskFilters';
import type { TaskFilterState } from './TaskFilters';

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onDeleteTask?: (id: string) => void;
  filterStatus?: Status | 'all' | 'done';
  topics?: Topic[];
  projects?: Project[];
  onAddTopic?: (name: string) => Promise<Topic>;
  onAddProject?: (name: string, topicId: string) => Promise<Project>;
}

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

export function AllTasksView({ tasks, onTaskClick, onAddTask, onDeleteTask, filterStatus = 'all', topics = [], projects = [], onAddTopic, onAddProject }: Props) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters);

  const handleDelete = (e: React.MouseEvent, taskId: string, taskTitle: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${taskTitle}"?`)) {
      onDeleteTask?.(taskId);
    }
  };

  const existingTags = [...new Set(tasks.map((t) => t.tag).filter(Boolean))];

  // Helper to get topic name by id
  const getTopicName = (topicId?: string) => {
    if (!topicId) return null;
    const topic = topics.find((t) => t.id === topicId);
    return topic?.name;
  };

  // Apply status filter first
  let filtered = tasks.filter((t) => {
    if (filterStatus === 'done') return t.status === 'done';
    if (filterStatus !== 'all') return t.status === filterStatus;
    return true;
  });

  // Apply search
  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tag.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply advanced filters
  filtered = applyFilters(filtered, filters);

  const title = filterStatus === 'done' ? 'Done' : filterStatus === 'all' ? 'All tasks' : STATUS_META[filterStatus as StatusKey].label;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 28px', gap: 14, overflow: 'hidden', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONTS.caveat, fontSize: rem(26), fontWeight: 700, color: C.ink }}>{title}</span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>{filtered.length} tasks</span>
        {onAddTask && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: rem(6),
              padding: `${rem(6)} ${rem(12)}`,
              border: `1.5px solid ${C.pencilLight}`,
              borderRadius: 6,
              background: 'transparent',
              fontFamily: FONTS.head,
              fontSize: rem(13),
              color: C.ink,
              cursor: 'pointer',
            }}
          >
            <IconPlus size={12} color={C.ink} />
            new task
          </button>
        )}
        <div style={{ flex: 1 }} />
        {filterStatus === 'all' && (
          <TaskFilters filters={filters} onChange={setFilters} existingTags={existingTags} topics={topics} projects={projects} />
        )}
      </div>

      {filterStatus === 'all' && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter tasks…"
          style={{
            padding: '8px 12px',
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 4,
            background: C.paper,
            fontFamily: FONTS.kalam,
            fontSize: '0.75rem',
            color: C.ink,
            outline: 'none',
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((t) => {
          const sm = STATUS_META[t.status as StatusKey];
          const isHovered = hoveredTaskId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onTaskClick(t.id)}
              onMouseEnter={() => setHoveredTaskId(t.id)}
              onMouseLeave={() => setHoveredTaskId(null)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: C.paper,
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={3} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <SketchCheck checked={t.status === 'done'} size={14} />
                <span style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil, width: 68, flexShrink: 0 }}>
                  {t.tag}
                </span>
                <span style={{ fontFamily: FONTS.architects, fontSize: '0.8125rem', flex: 1, color: t.status === 'done' ? C.pencil : C.ink, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                  {t.title}
                </span>
                {t.topicId && getTopicName(t.topicId) && (
                  <span style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil }}>{getTopicName(t.topicId)}</span>
                )}
                {t.dueDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONTS.kalam, fontSize: '0.625rem', color: isDueTodayOrOverdue(t.dueDate) ? C.coral : C.pencil }}>
                    <IconCalendar size={9} color={isDueTodayOrOverdue(t.dueDate) ? C.coral : C.pencil} />
                    {getDueDateLabel(t.dueDate)}
                  </span>
                )}
                {t.notecardIds.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil }}>
                    <IconClip size={9} color={C.pencil} />
                    {t.notecardIds.length}
                  </span>
                )}
                <SketchPill color={sm.color}>{sm.short}</SketchPill>
                {t.priority === 'hi' && (
                  <span style={{ fontFamily: FONTS.caveat, fontSize: '0.8125rem', color: C.coral }}>!!</span>
                )}
                {onDeleteTask && isHovered && (
                  <button
                    onClick={(e) => handleDelete(e, t.id, t.title)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 0.6,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                    title="Delete task"
                  >
                    <IconTrash size={14} color={C.coral} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: FONTS.caveat, fontSize: '1.125rem', color: C.pencil }}>
            {hasActiveFilters(filters) ? 'No tasks match your filters.' : filterStatus === 'done' ? 'Nothing done yet.' : 'No tasks found.'}
          </div>
        )}
      </div>

      {showAddModal && onAddTask && (
        <AddTaskModal
          defaultStatus="yts"
          onAdd={onAddTask}
          onClose={() => setShowAddModal(false)}
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
