import { useState } from 'react';
import { C, FONTS, STATUS_META, rem } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchPill } from '../ui/SketchBox';
import { IconChevronDown, IconChevronRight, IconChevronLeft, IconCalendar, IconPlus } from '../ui/Icons';
import type { Task, Topic, Project } from '../../types';
import { getDueDateLabel, isDueTodayOrOverdue } from '../../utils/dateUtils';

interface Props {
  topic: Topic;
  projects: Project[];
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onBack: () => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export function TopicDetailView({ topic, projects, tasks, onTaskClick, onBack, onAddTask }: Props) {
  // Get projects for this topic (active ones)
  const topicProjects = projects.filter(p => p.topicId === topic.id && p.status === 'active');

  // Get tasks for this topic
  const topicTasks = tasks.filter(t => t.topicId === topic.id);

  // Tasks not assigned to any project
  const unassignedTasks = topicTasks.filter(t => !t.projectId);

  // Expanded state for projects
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(topicProjects.map(p => p.id)) // All expanded by default
  );
  const [showUnassigned, setShowUnassigned] = useState(true);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getTasksForProject = (projectId: string) =>
    topicTasks.filter(t => t.projectId === projectId);

  const TaskRow = ({ task }: { task: Task }) => {
    const sm = STATUS_META[task.status as StatusKey];
    return (
      <div
        onClick={() => onTaskClick(task.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          marginLeft: 24,
          background: C.paper,
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.paperDark}
        onMouseLeave={e => e.currentTarget.style.background = C.paper}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: sm.color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontFamily: FONTS.architects,
            fontSize: rem(13),
            color: task.status === 'done' ? C.pencil : C.ink,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </span>
        {task.tag && (
          <span style={{ fontFamily: FONTS.kalam, fontSize: rem(10), color: C.pencil }}>
            {task.tag}
          </span>
        )}
        {task.dueDate && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: FONTS.kalam,
              fontSize: rem(10),
              color: isDueTodayOrOverdue(task.dueDate) ? C.coral : C.pencil,
            }}
          >
            <IconCalendar size={9} color={isDueTodayOrOverdue(task.dueDate) ? C.coral : C.pencil} />
            {getDueDateLabel(task.dueDate)}
          </span>
        )}
        <SketchPill color={sm.color}>{sm.short}</SketchPill>
        {task.priority === 'hi' && (
          <span style={{ fontFamily: FONTS.caveat, fontSize: rem(13), color: C.coral }}>!!</span>
        )}
      </div>
    );
  };

  const ProjectSection = ({ project }: { project: Project }) => {
    const projectTasks = getTasksForProject(project.id);
    const isExpanded = expandedProjects.has(project.id);
    const doneCount = projectTasks.filter(t => t.status === 'done').length;

    return (
      <div name="project-section" style={{ marginBottom: 8 }}>
        <button
          onClick={() => toggleProject(project.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            background: C.paperDark,
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {isExpanded ? (
            <IconChevronDown size={14} color={C.pencil} />
          ) : (
            <IconChevronRight size={14} color={C.pencil} />
          )}
          <span style={{ fontFamily: FONTS.architects, fontSize: rem(14), fontWeight: 600, color: C.ink, flex: 1 }}>
            {project.name}
          </span>
          <span style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>
            {doneCount}/{projectTasks.length} done
          </span>
        </button>

        {isExpanded && (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projectTasks.length === 0 ? (
              <div style={{ marginLeft: 24, padding: '8px 12px', fontFamily: FONTS.kalam, fontSize: rem(12), color: C.pencil, fontStyle: 'italic' }}>
                No tasks in this project
              </div>
            ) : (
              projectTasks.map(task => <TaskRow key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div name="topic-detail-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 28px', gap: 18, overflow: 'hidden', minHeight: 0 }}>
      {/* Header */}
      <div name="topic-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <IconChevronLeft size={16} color={C.pencil} />
        </button>
        <span
          style={{
            width: 18,
            height: 18,
            background: topic.color || C.pencil,
            borderRadius: 4,
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: FONTS.caveat, fontSize: rem(26), fontWeight: 700, color: C.ink }}>
          {topic.name}
        </span>
        <span style={{ fontFamily: FONTS.kalam, fontSize: rem(12), color: C.pencil }}>
          {topicTasks.length} task{topicTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
        <div style={{ position: 'relative', padding: '10px 16px', borderRadius: 6 }}>
          <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={6} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: FONTS.caveat, fontSize: rem(22), fontWeight: 700, color: C.ink }}>
              {topicProjects.length}
            </div>
            <div style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>Projects</div>
          </div>
        </div>
        <div style={{ position: 'relative', padding: '10px 16px', borderRadius: 6 }}>
          <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={6} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: FONTS.caveat, fontSize: rem(22), fontWeight: 700, color: C.teal }}>
              {topicTasks.filter(t => t.status === 'done').length}
            </div>
            <div style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>Completed</div>
          </div>
        </div>
        <div style={{ position: 'relative', padding: '10px 16px', borderRadius: 6 }}>
          <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={6} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: FONTS.caveat, fontSize: rem(22), fontWeight: 700, color: C.coral }}>
              {topicTasks.filter(t => t.status !== 'done').length}
            </div>
            <div style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>In Progress</div>
          </div>
        </div>
      </div>

      {/* Tree view */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Projects */}
        {topicProjects.length > 0 && (
          <div name="projects-tree">
            <div style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Projects
            </div>
            {topicProjects.map(project => (
              <ProjectSection key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Unassigned tasks (not in any project) */}
        {unassignedTasks.length > 0 && (
          <div name="unassigned-tasks">
            <button
              onClick={() => setShowUnassigned(!showUnassigned)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 12px',
                border: `1px dashed ${C.pencilLight}`,
                background: 'transparent',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: topicProjects.length > 0 ? 8 : 0,
              }}
            >
              {showUnassigned ? (
                <IconChevronDown size={14} color={C.pencil} />
              ) : (
                <IconChevronRight size={14} color={C.pencil} />
              )}
              <span style={{ fontFamily: FONTS.architects, fontSize: rem(14), color: C.inkSoft, flex: 1 }}>
                Tasks without project
              </span>
              <span style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>
                {unassignedTasks.length} task{unassignedTasks.length !== 1 ? 's' : ''}
              </span>
            </button>

            {showUnassigned && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {unassignedTasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {topicTasks.length === 0 && topicProjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: FONTS.caveat, fontSize: rem(18), color: C.pencil }}>
            No tasks or projects in this topic yet.
            <br />
            <span style={{ fontSize: rem(14) }}>Create tasks and assign them to this topic.</span>
          </div>
        )}
      </div>
    </div>
  );
}
