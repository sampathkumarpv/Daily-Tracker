import { useState } from 'react';
import { C, FONTS } from '../../theme';
import { IconBook, IconPlus, IconFolder, IconChevronDown, IconChevronRight, IconSettings } from '../ui/Icons';
import type { View, Topic, Project } from '../../types';
import type { Notebook } from '../../types';
import { resolveNotebookColor } from '../../utils/notebookColor';

interface Props {
  activeView: View;
  onNavigate: (v: View) => void;
  onOpenNotebook: (id: string) => void;
  onOpenTopic: (id: string) => void;
  notebooks: Notebook[];
  taskCounts: Record<string, number>;
  pendingRemindersCount: number;
  topics?: Topic[];
  projects?: Project[];
  selectedTopicId?: string | null;
}

const NAV_ITEMS = [
  { id: 'today' as View, label: 'Today' },
  { id: 'board' as View, label: 'Board' },
  { id: 'all' as View, label: 'All tasks' },
  { id: 'done' as View, label: 'Done' },
] as const;

export function Sidebar({
  activeView,
  onNavigate,
  notebooks,
  taskCounts,
  onOpenNotebook,
  onOpenTopic,
  pendingRemindersCount,
  topics = [],
  projects = [],
  selectedTopicId,
}: Props) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopicExpand = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    projects.filter(p => p.topicId === topicId && p.status === 'active');

  const handleTopicClick = (topicId: string) => {
    onOpenTopic(topicId);
  };

  return (
    <aside
      style={{
        width: 175,
        flexShrink: 0,
        padding: '14px 10px',
        borderRight: `1.5px dashed ${C.pencilLight}`,
        background: C.paper,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONTS.kalam,
        overflowY: 'auto',
      }}
    >
      {/* nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                border: 'none',
                borderRadius: 6,
                background: active ? C.coralSoft : 'transparent',
                fontFamily: active ? FONTS.architects : FONTS.kalam,
                fontSize: '0.8125rem',
                color: active ? C.ink : C.inkSoft,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s',
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: '0.625rem', color: C.pencil }}>{taskCounts[item.id] ?? ''}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: C.pencilLight, opacity: 0.4 }} />

      {/* Topics section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            padding: '0 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconFolder size={11} color={C.pencil} />
            <span style={{ fontFamily: FONTS.caveat, fontSize: '0.875rem', fontWeight: 700, color: C.inkSoft }}>
              Topics
            </span>
          </div>
          <button
            onClick={() => onNavigate('topics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              opacity: 0.6,
            }}
            title="Manage topics"
          >
            <IconSettings size={10} color={C.pencil} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {topics.map((topic) => {
            const topicProjects = getProjectsForTopic(topic.id);
            const isExpanded = expandedTopics.has(topic.id);
            const isSelected = selectedTopicId === topic.id;

            return (
              <div key={topic.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {topicProjects.length > 0 ? (
                    <button
                      onClick={(e) => toggleTopicExpand(topic.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? (
                        <IconChevronDown size={10} color={C.pencil} />
                      ) : (
                        <IconChevronRight size={10} color={C.pencil} />
                      )}
                    </button>
                  ) : (
                    <div style={{ width: 16 }} />
                  )}
                  <button
                    onClick={() => handleTopicClick(topic.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      fontSize: '0.75rem',
                      color: isSelected ? C.ink : C.inkSoft,
                      border: 'none',
                      background: isSelected ? C.tealSoft : 'transparent',
                      borderRadius: 4,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: topic.color || C.pencil,
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topic.name}
                    </span>
                  </button>
                </div>

                {/* Nested projects - just show names, clicking topic opens detail view */}
                {isExpanded && topicProjects.length > 0 && (
                  <div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {topicProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleTopicClick(topic.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 6px',
                          fontSize: '0.6875rem',
                          color: C.pencil,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: C.pencilLight }}>└</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={() => onNavigate('topics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              marginLeft: 16,
              fontSize: '0.6875rem',
              color: C.pencil,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <IconPlus size={10} color={C.pencil} />
            <span>new topic</span>
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: C.pencilLight, opacity: 0.4 }} />

      {/* notebooks section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 8,
            padding: '0 4px',
          }}
        >
          <IconBook size={11} color={C.pencil} />
          <span style={{ fontFamily: FONTS.caveat, fontSize: '0.875rem', fontWeight: 700, color: C.inkSoft }}>
            Notebooks
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notebooks.map((nb) => (
            <button
              key={nb.id}
              onClick={() => onOpenNotebook(nb.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: C.inkSoft,
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 13,
                  background: resolveNotebookColor(nb.color),
                  border: `1.3px solid ${C.ink}`,
                  borderRadius: '1px 3px 3px 1px',
                  flexShrink: 0,
                }}
              />
              <span>{nb.name}</span>
            </button>
          ))}
          <button
            onClick={() => onNavigate('notebooks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: '0.6875rem',
              color: C.pencil,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <IconPlus size={10} color={C.pencil} />
            <span>new notebook</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {pendingRemindersCount > 0 && (
        <div
          style={{
            fontFamily: FONTS.caveat,
            fontSize: '0.8125rem',
            color: C.pencil,
            padding: '0 4px',
            lineHeight: 1.3,
          }}
        >
          {pendingRemindersCount} reminder{pendingRemindersCount !== 1 ? 's' : ''}
          <br />
          queued
        </div>
      )}
    </aside>
  );
}
