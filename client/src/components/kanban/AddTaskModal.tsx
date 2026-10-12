import { useState, useRef, useEffect } from 'react';
import { C, FONTS, STATUS_META, SHADOWS, OVERLAYS } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchButton } from '../ui/SketchBox';
import type { Task, Topic, Project } from '../../types';

interface Props {
  defaultStatus: StatusKey;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existingTags?: string[];
  topics?: Topic[];
  projects?: Project[];
  onAddTopic?: (name: string) => Promise<Topic>;
  onAddProject?: (name: string, topicId: string) => Promise<Project>;
}

export function AddTaskModal({ defaultStatus, onAdd, onClose, existingTags = [], topics = [], projects = [], onAddTopic, onAddProject }: Props) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<StatusKey>(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'hi' | 'med' | 'lo' | undefined>(undefined);
  const [topicId, setTopicId] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statuses = Object.keys(STATUS_META) as StatusKey[];

  // Filter projects by selected topic
  const filteredProjects = topicId
    ? projects.filter((p) => p.topicId === topicId && p.status === 'active')
    : [];

  // Reset projectId when topic changes
  useEffect(() => {
    setProjectId(undefined);
    setIsCreatingProject(false);
    setNewProjectName('');
  }, [topicId]);

  // Filter existing tags based on input
  const filteredTags = existingTags.filter(
    (t) => t.toLowerCase().includes(tag.toLowerCase()) && t.toLowerCase() !== tag.toLowerCase()
  );
  const showAddNew = tag.trim() && !existingTags.some((t) => t.toLowerCase() === tag.trim().toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(e.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      tag: tag.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      description: '',
      subtasks: [],
      notecardIds: [],
      topicId: topicId || undefined,
      projectId: projectId || undefined,
    });
    onClose();
  };

  const selectTag = (selectedTag: string) => {
    setTag(selectedTag);
    setShowTagDropdown(false);
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !onAddTopic) return;
    try {
      const created = await onAddTopic(newTopicName.trim());
      setTopicId(created.id);
      setNewTopicName('');
      setIsCreatingTopic(false);
    } catch (e) {
      console.error('Failed to create topic', e);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !topicId || !onAddProject) return;
    try {
      const created = await onAddProject(newProjectName.trim(), topicId);
      setProjectId(created.id);
      setNewProjectName('');
      setIsCreatingProject(false);
    } catch (e) {
      console.error('Failed to create project', e);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modalDark,
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
          width: 460,
          borderRadius: 8,
          boxShadow: SHADOWS.modalDeep,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontFamily: FONTS.caveat, fontSize: '1.5rem', fontWeight: 700, color: C.ink }}>
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

          {/* Topic & Project Selection - Always visible */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil, marginBottom: 4, display: 'block' }}>
                Topic
              </label>
              {isCreatingTopic ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTopic();
                      if (e.key === 'Escape') {
                        setIsCreatingTopic(false);
                        setNewTopicName('');
                      }
                    }}
                    placeholder="Topic name…"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={handleCreateTopic}
                    disabled={!newTopicName.trim()}
                    style={{
                      padding: '6px 10px',
                      border: `1.5px solid ${C.teal}`,
                      borderRadius: 4,
                      background: C.tealSoft,
                      fontFamily: FONTS.kalam,
                      fontSize: '0.6875rem',
                      color: C.ink,
                      cursor: newTopicName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newTopicName.trim() ? 1 : 0.5,
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={topicId || ''}
                    onChange={(e) => setTopicId(e.target.value || undefined)}
                    style={{ ...selectStyle, flex: 1 }}
                  >
                    <option value="">No topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {onAddTopic && (
                    <button
                      onClick={() => setIsCreatingTopic(true)}
                      style={{
                        padding: '6px 10px',
                        border: `1.5px solid ${C.pencilLight}`,
                        borderRadius: 4,
                        background: 'transparent',
                        fontFamily: FONTS.kalam,
                        fontSize: '0.75rem',
                        color: C.teal,
                        cursor: 'pointer',
                      }}
                      title="Add new topic"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil, marginBottom: 4, display: 'block' }}>
                Project (optional)
              </label>
              {isCreatingProject ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') {
                        setIsCreatingProject(false);
                        setNewProjectName('');
                      }
                    }}
                    placeholder="Project name…"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    style={{
                      padding: '6px 10px',
                      border: `1.5px solid ${C.teal}`,
                      borderRadius: 4,
                      background: C.tealSoft,
                      fontFamily: FONTS.kalam,
                      fontSize: '0.6875rem',
                      color: C.ink,
                      cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newProjectName.trim() ? 1 : 0.5,
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={projectId || ''}
                    onChange={(e) => setProjectId(e.target.value || undefined)}
                    style={{ ...selectStyle, flex: 1 }}
                    disabled={!topicId}
                  >
                    <option value="">No project</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {onAddProject && topicId && (
                    <button
                      onClick={() => setIsCreatingProject(true)}
                      style={{
                        padding: '6px 10px',
                        border: `1.5px solid ${C.pencilLight}`,
                        borderRadius: 4,
                        background: 'transparent',
                        fontFamily: FONTS.kalam,
                        fontSize: '0.75rem',
                        color: C.teal,
                        cursor: 'pointer',
                      }}
                      title="Add new project"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={tagInputRef}
                value={tag}
                onChange={(e) => {
                  setTag(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                placeholder="Tag (e.g. FE-100)"
                style={inputStyle}
              />
              {showTagDropdown && (filteredTags.length > 0 || showAddNew) && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: C.paper,
                    border: `1.5px solid ${C.pencilLight}`,
                    borderRadius: 4,
                    boxShadow: SHADOWS.card,
                    maxHeight: 150,
                    overflowY: 'auto',
                    zIndex: 10,
                  }}
                >
                  {filteredTags.map((t) => (
                    <div
                      key={t}
                      onClick={() => selectTag(t)}
                      style={{
                        padding: '8px 12px',
                        fontFamily: FONTS.architects,
                        fontSize: '0.875rem',
                        color: C.ink,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${C.paperDark}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDark)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {t}
                    </div>
                  ))}
                  {showAddNew && (
                    <div
                      onClick={() => selectTag(tag.trim())}
                      style={{
                        padding: '8px 12px',
                        fontFamily: FONTS.architects,
                        fontSize: '0.875rem',
                        color: C.teal,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDark)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '1rem' }}>+</span> Add "{tag.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
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
                  fontSize: '0.6875rem',
                  color: status === s ? C.ink : C.pencil,
                  cursor: 'pointer',
                }}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Priority:</span>
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
                  fontSize: '0.6875rem',
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
                fontSize: '0.875rem',
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
  background: C.paper,
  fontFamily: FONTS.architects,
  fontSize: '0.875rem',
  color: C.ink,
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1.5px solid ${C.pencilLight}`,
  borderRadius: 4,
  background: C.paper,
  fontFamily: FONTS.architects,
  fontSize: '0.8125rem',
  color: C.ink,
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
};
