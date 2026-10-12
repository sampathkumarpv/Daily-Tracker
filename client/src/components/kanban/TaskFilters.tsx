import { useState, useRef, useEffect } from 'react';
import { C, FONTS, SHADOWS } from '../../theme';
import { IconFilter } from '../ui/Icons';
import type { Topic, Project } from '../../types';

export interface TaskFilterState {
  tag: string;
  priority: 'all' | 'hi' | 'med' | 'lo' | 'none';
  dueDateFrom: string;
  dueDateTo: string;
  addedDateFrom: string;
  addedDateTo: string;
  topicId: string;
  projectId: string;
}

export const defaultFilters: TaskFilterState = {
  tag: 'all',
  priority: 'all',
  dueDateFrom: '',
  dueDateTo: '',
  addedDateFrom: '',
  addedDateTo: '',
  topicId: 'all',
  projectId: 'all',
};

export function hasActiveFilters(filters: TaskFilterState): boolean {
  return (
    filters.tag !== 'all' ||
    filters.priority !== 'all' ||
    filters.dueDateFrom !== '' ||
    filters.dueDateTo !== '' ||
    filters.addedDateFrom !== '' ||
    filters.addedDateTo !== '' ||
    filters.topicId !== 'all' ||
    filters.projectId !== 'all'
  );
}

interface Props {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  existingTags: string[];
  topics?: Topic[];
  projects?: Project[];
}

export function TaskFilters({ filters, onChange, existingTags, topics = [], projects = [] }: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter projects by selected topic
  const filteredProjects = filters.topicId !== 'all'
    ? projects.filter((p) => p.topicId === filters.topicId)
    : projects;

  const activeCount = [
    filters.tag !== 'all',
    filters.priority !== 'all',
    filters.dueDateFrom || filters.dueDateTo,
    filters.addedDateFrom || filters.addedDateTo,
    filters.topicId !== 'all',
    filters.projectId !== 'all',
  ].filter(Boolean).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const update = (partial: Partial<TaskFilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const clearAll = () => {
    onChange(defaultFilters);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          border: `1.5px solid ${activeCount > 0 ? C.teal : C.pencilLight}`,
          borderRadius: 8,
          background: activeCount > 0 ? C.tealSoft : 'transparent',
          fontFamily: FONTS.kalam,
          fontSize: '0.6875rem',
          color: activeCount > 0 ? C.ink : C.pencil,
          cursor: 'pointer',
        }}
      >
        <IconFilter size={12} color={activeCount > 0 ? C.teal : C.pencil} />
        Filters{activeCount > 0 && ` (${activeCount})`}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 320,
            background: C.paper,
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 8,
            boxShadow: SHADOWS.modal,
            padding: 16,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: FONTS.caveat, fontSize: '1.125rem', fontWeight: 600, color: C.ink }}>
              Filters
            </span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: '0.625rem',
                  color: C.coral,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Topic Filter */}
          {topics.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Topic</span>
              <select
                value={filters.topicId}
                onChange={(e) => update({ topicId: e.target.value, projectId: 'all' })}
                style={selectStyle}
              >
                <option value="all">All topics</option>
                <option value="none">No topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project Filter */}
          {topics.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Project</span>
              <select
                value={filters.projectId}
                onChange={(e) => update({ projectId: e.target.value })}
                style={selectStyle}
                disabled={filteredProjects.length === 0}
              >
                <option value="all">All projects</option>
                <option value="none">No project</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tag Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Tag</span>
            <select
              value={filters.tag}
              onChange={(e) => update({ tag: e.target.value })}
              style={selectStyle}
            >
              <option value="all">All tags</option>
              <option value="none">No tag</option>
              {existingTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Priority</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'hi', 'med', 'lo', 'none'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => update({ priority: p })}
                  style={{
                    padding: '4px 10px',
                    border: `1.3px solid ${
                      p === 'hi' ? C.coral : p === 'med' ? C.yellow : p === 'lo' ? C.pencilLight : C.pencilLight
                    }`,
                    borderRadius: 8,
                    background:
                      filters.priority === p
                        ? p === 'hi'
                          ? C.coralSoft
                          : p === 'med'
                          ? C.yellowSoft
                          : C.paperDark
                        : 'transparent',
                    fontFamily: FONTS.kalam,
                    fontSize: '0.625rem',
                    color: filters.priority === p ? C.ink : C.pencil,
                    cursor: 'pointer',
                  }}
                >
                  {p === 'none' ? 'unset' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Due date range</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                value={filters.dueDateFrom}
                onChange={(e) => update({ dueDateFrom: e.target.value })}
                style={dateInputStyle}
              />
              <span style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil }}>to</span>
              <input
                type="date"
                value={filters.dueDateTo}
                onChange={(e) => update({ dueDateTo: e.target.value })}
                style={dateInputStyle}
              />
            </div>
          </div>

          {/* Added Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>Added date range</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                value={filters.addedDateFrom}
                onChange={(e) => update({ addedDateFrom: e.target.value })}
                style={dateInputStyle}
              />
              <span style={{ fontFamily: FONTS.kalam, fontSize: '0.625rem', color: C.pencil }}>to</span>
              <input
                type="date"
                value={filters.addedDateTo}
                onChange={(e) => update({ addedDateTo: e.target.value })}
                style={dateInputStyle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '5px 8px',
  border: `1.5px solid ${C.pencilLight}`,
  borderRadius: 4,
  background: C.paper,
  fontFamily: FONTS.architects,
  fontSize: '0.75rem',
  color: C.ink,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: `1.5px solid ${C.pencilLight}`,
  borderRadius: 4,
  background: C.paper,
  fontFamily: FONTS.architects,
  fontSize: '0.8125rem',
  color: C.ink,
  cursor: 'pointer',
};
