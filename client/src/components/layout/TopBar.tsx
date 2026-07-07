import { useState, useRef, useEffect } from 'react';
import { C, FONTS, SHADOWS } from '../../theme';
import { IconSearch, IconBell, IconCalendar, SketchAvatar } from '../ui/Icons';
import { SketchBox } from '../ui/SketchBox';
import type { Task, Notecard } from '../../types';

interface Props {
  title?: string;
  tasks: Task[];
  notecards?: Notecard[];
  onThemeToggle?: () => void;
  themeOpen?: boolean;
  onCalendarClick?: () => void;
  isCalendarActive?: boolean;
  onTaskClick?: (taskId: string) => void;
  onNotecardClick?: (notecardId: string) => void;
}

export function TopBar({ title = 'My Tasks', tasks, notecards = [], onThemeToggle, themeOpen, onCalendarClick, isCalendarActive, onTaskClick, onNotecardClick }: Props) {
  const [query, setQuery] = useState('');
  const [showOverduePanel, setShowOverduePanel] = useState(false);
  const overduePanelRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();

  // Parse due date and check if overdue
  const isOverdue = (dueDate: string | undefined): boolean => {
    if (!dueDate) return false;
    if (dueDate.toLowerCase() === 'today') return false;
    if (dueDate.toLowerCase() === 'tomorrow') return false;

    // Try parsing as date
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter overdue tasks (exclude done tasks)
  const overdueTasks = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate));

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overduePanelRef.current && !overduePanelRef.current.contains(e.target as Node)) {
        setShowOverduePanel(false);
      }
    };
    if (showOverduePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOverduePanel]);

  // Search both tasks and notecards
  const q = query.trim().toLowerCase();
  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.tag.toLowerCase().includes(q)
      )
    : [];
  const filteredNotecards = q
    ? notecards.filter(
        (nc) =>
          nc.title.toLowerCase().includes(q) ||
          nc.notebookName.toLowerCase().includes(q) ||
          (nc.content || '').toLowerCase().includes(q)
      )
    : [];
  const hasResults = filteredTasks.length > 0 || filteredNotecards.length > 0;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 18px',
        borderBottom: `1.5px dashed ${C.pencilLight}`,
        background: C.paper,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.caveat,
          fontSize: '1.375rem',
          fontWeight: 700,
          color: C.ink,
          letterSpacing: 0.5,
        }}
      >
        ✱ {title}
      </span>
      <span style={{ fontFamily: FONTS.kalam, fontSize: '0.6875rem', color: C.pencil }}>
        {dayName} · {monthDay}
      </span>
      <div style={{ flex: 1 }} />

      {/* search */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            minWidth: 200,
            background: C.paper,
          }}
        >
          <SketchBox stroke={C.pencilLight} strokeWidth={1.3} rough={0.7} radius={12} />
          <IconSearch size={12} color={C.pencil} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search tasks + notes…"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: FONTS.kalam,
              fontSize: '0.6875rem',
              color: C.ink,
              width: 140,
            }}
          />
        </div>
        {hasResults && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: C.paper,
              border: `1.5px solid ${C.pencilLight}`,
              borderRadius: 6,
              boxShadow: SHADOWS.dropdown,
              zIndex: 100,
              marginTop: 4,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {/* Tasks section */}
            {filteredTasks.length > 0 && (
              <>
                <div style={{ padding: '6px 12px', fontSize: '0.625rem', color: C.pencil, fontFamily: FONTS.kalam, borderBottom: `1px solid ${C.pencilLight}` }}>
                  Tasks ({filteredTasks.length})
                </div>
                {filteredTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '8px 12px',
                      fontFamily: FONTS.architects,
                      fontSize: '0.75rem',
                      color: C.ink,
                      borderBottom: `1px solid ${C.pencilLight}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      onTaskClick?.(t.id);
                      setQuery('');
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.paperDark; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: C.pencil, marginRight: 8, fontSize: '0.625rem' }}>{t.tag}</span>
                    {t.title}
                  </div>
                ))}
              </>
            )}
            {/* Notecards section */}
            {filteredNotecards.length > 0 && (
              <>
                <div style={{ padding: '6px 12px', fontSize: '0.625rem', color: C.pencil, fontFamily: FONTS.kalam, borderBottom: `1px solid ${C.pencilLight}` }}>
                  Notecards ({filteredNotecards.length})
                </div>
                {filteredNotecards.slice(0, 4).map((nc) => (
                  <div
                    key={nc.id}
                    style={{
                      padding: '8px 12px',
                      fontFamily: FONTS.architects,
                      fontSize: '0.75rem',
                      color: C.ink,
                      borderBottom: `1px solid ${C.pencilLight}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      onNotecardClick?.(nc.id);
                      setQuery('');
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.paperDark; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ display: 'inline-block', width: 8, height: 10, background: C.teal, borderRadius: 1, marginRight: 8 }} />
                    <span style={{ color: C.pencil, marginRight: 6, fontSize: '0.625rem' }}>{nc.notebookName}</span>
                    {nc.title}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* calendar icon */}
      {onCalendarClick && (
        <button
          onClick={onCalendarClick}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: isCalendarActive ? `1.5px solid ${C.ink}` : `1px solid ${C.pencilLight}`,
            background: isCalendarActive ? C.coralSoft : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="Calendar"
        >
          <IconCalendar size={14} color={isCalendarActive ? C.coral : C.pencil} />
        </button>
      )}

      {/* theme toggle */}
      {onThemeToggle && (
        <button
          onClick={onThemeToggle}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: themeOpen ? `1.5px solid ${C.ink}` : `1px solid ${C.pencilLight}`,
            background: themeOpen ? C.yellowSoft : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s ease',
          }}
          title="Theme Settings"
        >
          🎨
        </button>
      )}

      {/* bell - overdue tasks */}
      <div ref={overduePanelRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowOverduePanel(!showOverduePanel)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: showOverduePanel ? `1.5px solid ${C.ink}` : `1px solid ${C.pencilLight}`,
            background: showOverduePanel ? C.coralSoft : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
          title="Overdue Tasks"
        >
          <IconBell size={14} color={overdueTasks.length > 0 ? C.coral : C.pencil} />
          {overdueTasks.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 14,
                height: 14,
                borderRadius: 7,
                background: C.coral,
                color: C.paper,
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {overdueTasks.length}
            </span>
          )}
        </button>

        {/* Overdue tasks panel */}
        {showOverduePanel && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 280,
              maxHeight: 360,
              overflowY: 'auto',
              background: C.paper,
              border: `1.5px solid ${C.pencilLight}`,
              borderRadius: 8,
              boxShadow: SHADOWS.modal,
              zIndex: 200,
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: `1px solid ${C.pencilLight}`,
                fontFamily: FONTS.caveat,
                fontSize: 16,
                fontWeight: 700,
                color: C.ink,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: C.coral }}>!</span>
              Overdue Tasks
              <span style={{ fontSize: 12, color: C.pencil, fontWeight: 400 }}>
                ({overdueTasks.length})
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <div
                style={{
                  padding: '24px 14px',
                  textAlign: 'center',
                  fontFamily: FONTS.kalam,
                  fontSize: 13,
                  color: C.pencil,
                }}
              >
                No overdue tasks
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onTaskClick?.(task.id);
                      setShowOverduePanel(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${C.pencilLight}`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = C.paperDark;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONTS.architects,
                        fontSize: 13,
                        color: C.ink,
                        marginBottom: 4,
                      }}
                    >
                      {task.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 10,
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 6px',
                          background: C.coralSoft,
                          borderRadius: 4,
                          color: C.coral,
                          fontFamily: FONTS.kalam,
                        }}
                      >
                        {task.dueDate}
                      </span>
                      <span style={{ color: C.pencil, fontFamily: FONTS.kalam }}>
                        {task.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SketchAvatar letter="M" color={C.coral} size={26} />
    </header>
  );
}
