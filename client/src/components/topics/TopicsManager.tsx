import { useState } from 'react';
import { C, FONTS, rem, NOTEBOOK_COLORS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconPlus, IconTrash, IconEdit, IconChevronDown, IconChevronRight, IconChevronLeft } from '../ui/Icons';
import type { Topic, Project, ProjectStatus } from '../../types';

interface Props {
  topics: Topic[];
  projects: Project[];
  onAddTopic: (name: string, color?: string) => Promise<Topic>;
  onUpdateTopic: (id: string, data: { name?: string; color?: string; description?: string }) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
  onAddProject: (name: string, topicId: string) => Promise<Project>;
  onUpdateProject: (id: string, data: { name?: string; status?: ProjectStatus; description?: string }) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onBack: () => void;
}

export function TopicsManager({
  topics,
  projects,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onBack,
}: Props) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(topics.map(t => t.id)));
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicColor, setNewTopicColor] = useState(NOTEBOOK_COLORS[0]);
  const [newProjectName, setNewProjectName] = useState('');
  const [addingProjectToTopicId, setAddingProjectToTopicId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const getProjectsForTopic = (topicId: string) =>
    projects.filter(p => p.topicId === topicId);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    await onAddTopic(newTopicName.trim(), newTopicColor);
    setNewTopicName('');
    setNewTopicColor(NOTEBOOK_COLORS[0]);
  };

  const handleAddProject = async (topicId: string) => {
    if (!newProjectName.trim()) return;
    const created = await onAddProject(newProjectName.trim(), topicId);
    setNewProjectName('');
    setAddingProjectToTopicId(null);
    // Auto-expand the topic
    setExpandedTopics(prev => new Set([...prev, topicId]));
  };

  const startEditTopic = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditName(topic.name);
    setEditColor(topic.color);
  };

  const saveEditTopic = async () => {
    if (!editingTopicId || !editName.trim()) return;
    await onUpdateTopic(editingTopicId, { name: editName.trim(), color: editColor });
    setEditingTopicId(null);
    setEditName('');
    setEditColor('');
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
  };

  const saveEditProject = async () => {
    if (!editingProjectId || !editName.trim()) return;
    await onUpdateProject(editingProjectId, { name: editName.trim() });
    setEditingProjectId(null);
    setEditName('');
  };

  const handleDeleteTopic = async (topic: Topic) => {
    const topicProjects = getProjectsForTopic(topic.id);
    const message = topicProjects.length > 0
      ? `Delete topic "${topic.name}" and its ${topicProjects.length} project(s)? Tasks will be unassigned.`
      : `Delete topic "${topic.name}"? Tasks assigned to it will be unassigned.`;
    if (window.confirm(message)) {
      await onDeleteTopic(topic.id);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Delete project "${project.name}"? Tasks assigned to it will be unassigned.`)) {
      await onDeleteProject(project.id);
    }
  };

  const handleProjectStatusChange = async (project: Project, status: ProjectStatus) => {
    await onUpdateProject(project.id, { status });
  };

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div name="topics-manager" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 28px', gap: 18, overflow: 'hidden', minHeight: 0 }}>
      {/* Header */}
      <div name="topics-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
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
        <span style={{ fontFamily: FONTS.caveat, fontSize: rem(26), fontWeight: 700, color: C.ink }}>
          Topics & Projects
        </span>
      </div>

      {/* Add new topic form */}
      <div name="add-topic-form" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
        <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={6} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {NOTEBOOK_COLORS.slice(0, 6).map(color => (
              <button
                key={color}
                onClick={() => setNewTopicColor(color)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: color,
                  border: newTopicColor === color ? `2px solid ${C.ink}` : `1px solid ${C.pencilLight}`,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <input
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
            placeholder="New topic name..."
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: FONTS.kalam,
              fontSize: rem(13),
              color: C.ink,
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddTopic}
            disabled={!newTopicName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              border: `1.5px solid ${C.pencilLight}`,
              borderRadius: 6,
              background: 'transparent',
              fontFamily: FONTS.head,
              fontSize: rem(12),
              color: newTopicName.trim() ? C.ink : C.pencil,
              cursor: newTopicName.trim() ? 'pointer' : 'not-allowed',
              opacity: newTopicName.trim() ? 1 : 0.6,
            }}
          >
            <IconPlus size={12} color={newTopicName.trim() ? C.ink : C.pencil} />
            Add Topic
          </button>
        </div>
      </div>

      {/* Topics list */}
      <div name="topics-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: FONTS.caveat, fontSize: '1.125rem', color: C.pencil }}>
            No topics yet. Create one above!
          </div>
        ) : (
          topics.map(topic => {
            const topicProjects = getProjectsForTopic(topic.id);
            const isExpanded = expandedTopics.has(topic.id);
            const isEditingThis = editingTopicId === topic.id;

            return (
              <div key={topic.id} name="topic-card" style={{ position: 'relative' }}>
                <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.8} radius={8} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Topic header */}
                  <div
                    name="topic-header"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderBottom: isExpanded ? `1px dashed ${C.pencilLight}` : 'none',
                    }}
                  >
                    <button
                      onClick={() => toggleTopicExpand(topic.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? (
                        <IconChevronDown size={12} color={C.pencil} />
                      ) : (
                        <IconChevronRight size={12} color={C.pencil} />
                      )}
                    </button>

                    <span
                      style={{
                        width: 14,
                        height: 14,
                        background: topic.color || C.pencil,
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />

                    {isEditingThis ? (
                      <>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {NOTEBOOK_COLORS.slice(0, 6).map(color => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 3,
                                background: color,
                                border: editColor === color ? `2px solid ${C.ink}` : `1px solid ${C.pencilLight}`,
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </div>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEditTopic()}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            border: `1px solid ${C.pencilLight}`,
                            borderRadius: 4,
                            background: C.paper,
                            fontFamily: FONTS.architects,
                            fontSize: rem(14),
                            color: C.ink,
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={saveEditTopic}
                          style={{
                            padding: '4px 10px',
                            border: `1px solid ${C.teal}`,
                            borderRadius: 4,
                            background: C.tealSoft,
                            fontFamily: FONTS.kalam,
                            fontSize: rem(11),
                            color: C.ink,
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTopicId(null)}
                          style={{
                            padding: '4px 10px',
                            border: `1px solid ${C.pencilLight}`,
                            borderRadius: 4,
                            background: 'transparent',
                            fontFamily: FONTS.kalam,
                            fontSize: rem(11),
                            color: C.pencil,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontFamily: FONTS.architects, fontSize: rem(15), fontWeight: 600, color: C.ink }}>
                          {topic.name}
                        </span>
                        <span style={{ fontFamily: FONTS.kalam, fontSize: rem(11), color: C.pencil }}>
                          {topicProjects.length} project{topicProjects.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => startEditTopic(topic)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 4,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            opacity: 0.6,
                          }}
                          title="Edit topic"
                        >
                          <IconEdit size={14} color={C.pencil} />
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 4,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            opacity: 0.6,
                          }}
                          title="Delete topic"
                        >
                          <IconTrash size={14} color={C.coral} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Projects list */}
                  {isExpanded && (
                    <div name="projects-list" style={{ padding: '10px 14px 14px 44px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topicProjects.map(project => {
                        const isEditingProject = editingProjectId === project.id;
                        return (
                          <div
                            key={project.id}
                            name="project-row"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              background: C.paperDark,
                              borderRadius: 6,
                            }}
                          >
                            {isEditingProject ? (
                              <>
                                <input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && saveEditProject()}
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    border: `1px solid ${C.pencilLight}`,
                                    borderRadius: 4,
                                    background: C.paper,
                                    fontFamily: FONTS.kalam,
                                    fontSize: rem(13),
                                    color: C.ink,
                                    outline: 'none',
                                  }}
                                />
                                <button
                                  onClick={saveEditProject}
                                  style={{
                                    padding: '3px 8px',
                                    border: `1px solid ${C.teal}`,
                                    borderRadius: 4,
                                    background: C.tealSoft,
                                    fontFamily: FONTS.kalam,
                                    fontSize: rem(10),
                                    color: C.ink,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingProjectId(null)}
                                  style={{
                                    padding: '3px 8px',
                                    border: `1px solid ${C.pencilLight}`,
                                    borderRadius: 4,
                                    background: 'transparent',
                                    fontFamily: FONTS.kalam,
                                    fontSize: rem(10),
                                    color: C.pencil,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span style={{ fontFamily: FONTS.kalam, fontSize: rem(13), color: C.ink, flex: 1 }}>
                                  {project.name}
                                </span>
                                <select
                                  value={project.status}
                                  onChange={e => handleProjectStatusChange(project, e.target.value as ProjectStatus)}
                                  style={{
                                    padding: '3px 6px',
                                    border: `1px solid ${C.pencilLight}`,
                                    borderRadius: 4,
                                    background: C.paper,
                                    fontFamily: FONTS.kalam,
                                    fontSize: rem(10),
                                    color: project.status === 'active' ? C.teal : project.status === 'completed' ? C.pencil : C.pencilLight,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => startEditProject(project)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 3,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                  }}
                                  title="Edit project"
                                >
                                  <IconEdit size={12} color={C.pencil} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(project)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 3,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                  }}
                                  title="Delete project"
                                >
                                  <IconTrash size={12} color={C.coral} />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Add project form */}
                      {addingProjectToTopicId === topic.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddProject(topic.id);
                              if (e.key === 'Escape') {
                                setAddingProjectToTopicId(null);
                                setNewProjectName('');
                              }
                            }}
                            placeholder="Project name..."
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              border: `1px solid ${C.pencilLight}`,
                              borderRadius: 4,
                              background: C.paper,
                              fontFamily: FONTS.kalam,
                              fontSize: rem(12),
                              color: C.ink,
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => handleAddProject(topic.id)}
                            disabled={!newProjectName.trim()}
                            style={{
                              padding: '5px 10px',
                              border: `1px solid ${C.teal}`,
                              borderRadius: 4,
                              background: C.tealSoft,
                              fontFamily: FONTS.kalam,
                              fontSize: rem(11),
                              color: C.ink,
                              cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                              opacity: newProjectName.trim() ? 1 : 0.6,
                            }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setAddingProjectToTopicId(null);
                              setNewProjectName('');
                            }}
                            style={{
                              padding: '5px 10px',
                              border: `1px solid ${C.pencilLight}`,
                              borderRadius: 4,
                              background: 'transparent',
                              fontFamily: FONTS.kalam,
                              fontSize: rem(11),
                              color: C.pencil,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingProjectToTopicId(topic.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 10px',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: FONTS.kalam,
                            fontSize: rem(11),
                            color: C.pencil,
                            cursor: 'pointer',
                          }}
                        >
                          <IconPlus size={10} color={C.pencil} />
                          Add project
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
