import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { C, FONTS, STATUS_META, SHADOWS, OVERLAYS } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchPill } from '../ui/SketchBox';
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconCheckCircle,
  IconTrendingUp,
  IconFileText,
  IconExpand,
  SketchCheck,
} from '../ui/Icons';
import { ScratchPad } from '../ui/ScratchPad';
import type { ActivityEvent, CalendarMode, CalendarFilters } from '../../types';
import { activityLogApi } from '../../api/activityLog';
import { scratchpadApi, type ScratchpadResponse } from '../../api/scratchpad';

interface Props {
  onNavigateToToday: () => void;
  initialDate?: string;
  initialFrom?: string;
  initialTo?: string;
  onUrlChange?: (params: { date?: string; from?: string; to?: string }) => void;
}

function formatDateISO(date: Date): string {
  // Use local date parts, NOT toISOString() which converts to UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getRelativeLabel(date: Date): string {
  // Compare calendar days, not raw timestamps
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff === -1) return 'tomorrow';
  if (diff > 0 && diff < 7) return `${diff} days ago`;
  if (diff >= 7 && diff < 14) return 'last week';
  if (diff >= 14 && diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return '';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

type DotCategory = 'added' | 'statusChanged' | 'notecards';

function getActivityDots(events: ActivityEvent[]): DotCategory[] {
  const dots: DotCategory[] = [];
  if (events.some(e => e.type === 'created')) dots.push('added');
  if (events.some(e => e.type === 'status_changed' || e.type === 'completed')) dots.push('statusChanged');
  if (events.some(e => e.type === 'notecard_created')) dots.push('notecards');
  return dots.slice(0, 3);
}

const DOT_COLORS: Record<DotCategory, string> = {
  added: C.teal,
  statusChanged: C.coral,
  notecards: C.lilac,
};

function filterEvents(events: ActivityEvent[], filters: CalendarFilters): ActivityEvent[] {
  return events.filter(e => {
    if (e.type === 'created' && !filters.newTasks) return false;
    if (e.type === 'status_changed' && !filters.statusUpdates) return false;
    if (e.type === 'completed' && !filters.completed) return false;
    if (e.type === 'notecard_created' && !filters.notecards) return false;
    if (e.type === 'reminder_fired' && !filters.reminders) return false;
    return true;
  });
}

// MiniCalendar Component
interface MiniCalendarProps {
  mode: CalendarMode;
  selectedDay: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  viewMonth: Date;
  activityByDay: Map<string, ActivityEvent[]>;
  onDayClick: (day: Date) => void;
  onRangeSelect: (start: Date, end: Date) => void;
  onMonthChange: (month: Date) => void;
  onJumpToToday: () => void;
}

function MiniCalendar({
  mode, selectedDay, rangeStart, rangeEnd, viewMonth, activityByDay,
  onDayClick, onRangeSelect, onMonthChange, onJumpToToday,
}: MiniCalendarProps) {
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const handleMouseDown = (day: number) => {
    if (mode === 'timeframe') {
      const date = new Date(year, month, day);
      setDragStart(date);
      setDragEnd(date);
      setIsDragging(true);
    } else {
      onDayClick(new Date(year, month, day));
    }
  };

  const handleMouseEnter = (day: number) => {
    if (isDragging && mode === 'timeframe') {
      setDragEnd(new Date(year, month, day));
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;
      onRangeSelect(start, end);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isInRange = (day: number): boolean => {
    const date = new Date(year, month, day);
    const start = isDragging ? (dragStart && dragEnd ? (dragStart < dragEnd ? dragStart : dragEnd) : null) : rangeStart;
    const end = isDragging ? (dragStart && dragEnd ? (dragStart < dragEnd ? dragEnd : dragStart) : null) : rangeEnd;
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  const isRangeEndpoint = (day: number): boolean => {
    const date = new Date(year, month, day);
    const start = isDragging ? dragStart : rangeStart;
    const end = isDragging ? dragEnd : rangeEnd;
    return (start && isSameDay(date, start)) || (end && isSameDay(date, end)) || false;
  };

  return (
    <div style={{ userSelect: 'none' }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IconChevronLeft size={14} color={C.ink} />
        </button>
        <span style={{ fontFamily: FONTS.head, fontSize: '1rem', fontWeight: 700, color: C.ink }}>{monthName}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IconChevronRight size={14} color={C.ink} />
        </button>
      </div>

      <button
        onClick={onJumpToToday}
        style={{
          width: '100%', padding: '6px 0', marginBottom: 12, background: 'transparent',
          border: `1px dashed ${C.pencilLight}`, borderRadius: 4,
          fontFamily: FONTS.ui, fontSize: '0.6875rem', color: C.coral, cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.coralSoft)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        jump to today
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;
          const date = new Date(year, month, day);
          const dateKey = formatDateISO(date);
          const dayIsToday = isToday(date);
          const dayIsSelected = mode === 'day' && isSameDay(date, selectedDay);
          const dayInRange = mode === 'timeframe' && isInRange(day);
          const isEndpoint = mode === 'timeframe' && isRangeEndpoint(day);
          const events = activityByDay.get(dateKey) || [];
          const dots = getActivityDots(events);

          return (
            <div
              key={i}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '6px 2px 4px', borderRadius: 4, cursor: 'pointer',
                background: dayIsSelected || isEndpoint ? C.coral : dayInRange ? C.coralSoft : 'transparent',
                border: dayIsToday ? `1.5px solid ${C.coral}` : '1.5px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              <span style={{
                fontFamily: FONTS.ui, fontSize: '0.6875rem',
                fontWeight: dayIsSelected || isEndpoint ? 700 : 400,
                color: dayIsSelected || isEndpoint ? C.paper : C.ink,
              }}>{day}</span>
              {dots.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {dots.map((cat, j) => (
                    <span key={j} style={{
                      width: 4, height: 4, borderRadius: 2,
                      background: dayIsSelected || isEndpoint ? C.paperDark : DOT_COLORS[cat],
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.teal }} />
          <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>added</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.coral }} />
          <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>moved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.lilac }} />
          <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>notecards</span>
        </div>
      </div>
    </div>
  );
}

// SingleDayJournal Component
interface SingleDayJournalProps {
  date: Date;
  events: ActivityEvent[];
  scratchpad: ScratchpadResponse | null;
  onPrevDay: () => void;
  onNextDay: () => void;
  onExpandScratchpad: () => void;
}

function SingleDayJournal({ date, events, scratchpad, onPrevDay, onNextDay, onExpandScratchpad }: SingleDayJournalProps) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const relativeLabel = getRelativeLabel(date);

  const tasksMoved = events.filter(e => e.type === 'status_changed').length;
  const tasksAdded = events.filter(e => e.type === 'created').length;
  const tasksCompleted = events.filter(e => e.type === 'completed').length;
  const notecardsCreated = events.filter(e => e.type === 'notecard_created').length;

  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getEventKindPill = (event: ActivityEvent) => {
    switch (event.type) {
      case 'created': return <SketchPill color={C.teal}>added</SketchPill>;
      case 'status_changed': return <SketchPill color={C.coral}>moved</SketchPill>;
      case 'completed': return <SketchPill color={C.teal}>done</SketchPill>;
      case 'notecard_created': return <SketchPill color={C.lilac}>note</SketchPill>;
      case 'reminder_fired': return <SketchPill color={C.yellow}>reminder</SketchPill>;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: FONTS.head, fontSize: '1.5rem', fontWeight: 700, color: C.ink }}>{weekday}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FONTS.ui, fontSize: '0.8125rem', color: C.inkSoft }}>{dateStr}</span>
            {relativeLabel && <span style={{ fontFamily: FONTS.ui, fontSize: '0.6875rem', color: C.pencil }}>({relativeLabel})</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onPrevDay} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.pencilLight}`, borderRadius: 4, cursor: 'pointer' }}>
            <IconChevronLeft size={14} color={C.ink} />
          </button>
          <button onClick={onNextDay} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.pencilLight}`, borderRadius: 4, cursor: 'pointer' }}>
            <IconChevronRight size={14} color={C.ink} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile icon={<IconTrendingUp size={16} color={C.coral} />} value={tasksMoved} label="moved" />
        <StatTile icon={<IconPlus size={16} color={C.teal} />} value={tasksAdded} label="added" />
        <StatTile icon={<IconCheckCircle size={16} color={C.teal} />} value={tasksCompleted} label="completed" />
        <StatTile icon={<IconFileText size={16} color={C.lilac} />} value={notecardsCreated} label="notecards" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {sortedEvents.length === 0 ? (
          <EmptyState message="No activity logged for this day" />
        ) : (
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 2, background: C.pencilLight, borderRadius: 1 }} />
            {sortedEvents.map((event, i) => (
              <div key={event.id} style={{ position: 'relative', display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < sortedEvents.length - 1 ? `1px dashed ${C.pencilLight}` : 'none' }}>
                <div style={{ position: 'absolute', left: -18, top: 16, width: 8, height: 8, borderRadius: 4, background: event.type === 'completed' || event.type === 'created' ? C.teal : event.type === 'notecard_created' ? C.lilac : C.coral, border: `2px solid ${C.paper}` }} />
                <span style={{ fontFamily: FONTS.ui, fontSize: '0.625rem', color: C.pencil, width: 60, flexShrink: 0 }}>{formatTime(event.timestamp)}</span>
                <div style={{ flex: 1 }}>
                  {event.taskTag && <span style={{ fontFamily: FONTS.ui, fontSize: '0.625rem', color: C.pencil, marginRight: 8 }}>{event.taskTag}</span>}
                  <span style={{ fontFamily: FONTS.body, fontSize: '0.8125rem', color: C.ink }}>{event.title}</span>
                  {event.type === 'status_changed' && event.from && event.to && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SketchPill color={STATUS_META[event.from as StatusKey]?.color || C.pencil}>{STATUS_META[event.from as StatusKey]?.short || event.from}</SketchPill>
                      <span style={{ color: C.pencil, fontSize: '0.625rem' }}>→</span>
                      <SketchPill color={STATUS_META[event.to as StatusKey]?.color || C.pencil}>{STATUS_META[event.to as StatusKey]?.short || event.to}</SketchPill>
                    </div>
                  )}
                  {event.notebookName && <div style={{ marginTop: 4, fontFamily: FONTS.ui, fontSize: '0.625rem', color: C.pencil }}>in {event.notebookName}</div>}
                </div>
                <div>{getEventKindPill(event)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scratchpad for that day */}
      <div style={{ position: 'relative', padding: 14, background: C.yellowSoft, borderRadius: 6 }}>
        <SketchBox stroke={C.ink} strokeWidth={1.2} rough={0.8} radius={6} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: FONTS.head, fontSize: '0.9375rem', fontWeight: 700, color: C.ink }}>
              Scratchpad
            </div>
            <button
              onClick={onExpandScratchpad}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              title="Expand & Edit"
            >
              <IconExpand size={14} color={C.ink} />
            </button>
          </div>
          {scratchpad && scratchpad.content.trim() ? (
            <div
              style={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: C.inkSoft, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: scratchpad.content }}
            />
          ) : (
            <div style={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: C.pencil, fontStyle: 'italic' }}>
              No notes for this day. Click expand to add.
            </div>
          )}
        </div>
      </div>

      {sortedEvents.filter(e => e.type === 'notecard_created').length > 0 && (
        <div>
          <div style={{ fontFamily: FONTS.head, fontSize: '0.9375rem', fontWeight: 700, color: C.ink, marginBottom: 8 }}>Notecards created</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedEvents.filter(e => e.type === 'notecard_created').map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.lilacSoft, borderRadius: 4 }}>
                <IconFileText size={12} color={C.lilac} />
                <span style={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: C.ink, flex: 1 }}>{e.title}</span>
                <span style={{ fontFamily: FONTS.ui, fontSize: '0.625rem', color: C.pencil }}>{e.notebookName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// TimeframeSummary Component
interface TimeframeSummaryProps {
  from: Date;
  to: Date;
  events: ActivityEvent[];
  onQuickRange: (days: number) => void;
}

function TimeframeSummary({ from, to, events, onQuickRange }: TimeframeSummaryProps) {
  const dayCount = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toStr = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const tasksMoved = events.filter(e => e.type === 'status_changed').length;
  const tasksAdded = events.filter(e => e.type === 'created').length;
  const tasksCompleted = events.filter(e => e.type === 'completed').length;
  const notecardsCreated = events.filter(e => e.type === 'notecard_created').length;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, number>();
    const current = new Date(from);
    while (current <= to) {
      map.set(formatDateISO(current), 0);
      current.setDate(current.getDate() + 1);
    }
    events.forEach(e => {
      const key = formatDateISO(new Date(e.timestamp));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [from, to, events]);

  const maxActivity = Math.max(...Array.from(eventsByDay.values()), 1);
  const newTasks = events.filter(e => e.type === 'created');
  const statusUpdates = events.filter(e => e.type === 'status_changed' || e.type === 'completed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <div>
        <div style={{ fontFamily: FONTS.head, fontSize: '1.5rem', fontWeight: 700, color: C.ink }}>{fromStr} – {toStr}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: FONTS.ui, fontSize: '0.75rem', color: C.pencil }}>{dayCount} day{dayCount !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <QuickRangeChip label="this week" onClick={() => onQuickRange(7)} />
            <QuickRangeChip label="last 7d" onClick={() => onQuickRange(7)} />
            <QuickRangeChip label="this month" onClick={() => onQuickRange(30)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile icon={<IconTrendingUp size={16} color={C.coral} />} value={tasksMoved} label="moved" />
        <StatTile icon={<IconPlus size={16} color={C.teal} />} value={tasksAdded} label="added" />
        <StatTile icon={<IconCheckCircle size={16} color={C.teal} />} value={tasksCompleted} label="completed" />
        <StatTile icon={<IconFileText size={16} color={C.lilac} />} value={notecardsCreated} label="notecards" />
      </div>

      <div style={{ position: 'relative', padding: 16, background: C.paperDark, borderRadius: 6 }}>
        <div style={{ fontFamily: FONTS.head, fontSize: '0.8125rem', fontWeight: 700, color: C.ink, marginBottom: 12 }}>Activity per day</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {Array.from(eventsByDay.entries()).map(([dateKey, count]) => (
            <div key={dateKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', maxWidth: 24, height: `${(count / maxActivity) * 60}px`, minHeight: count > 0 ? 4 : 0, background: count > 0 ? C.coral : 'transparent', borderRadius: '2px 2px 0 0', transition: 'height 0.2s' }} />
              <span style={{ fontFamily: FONTS.ui, fontSize: '0.5rem', color: C.pencil }}>{new Date(dateKey).getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontFamily: FONTS.head, fontSize: '0.8125rem', fontWeight: 700, color: C.ink, marginBottom: 8 }}>New tasks added ({newTasks.length})</div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {newTasks.length === 0 ? <EmptyState message="No tasks added" small /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {newTasks.map(e => (
                  <div key={e.id} style={{ padding: '8px 10px', background: C.paper, borderRadius: 4, border: `1px solid ${C.pencilLight}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>{e.taskTag}</span>
                      <span style={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: C.ink, flex: 1 }}>{e.title}</span>
                    </div>
                    <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>{new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontFamily: FONTS.head, fontSize: '0.8125rem', fontWeight: 700, color: C.ink, marginBottom: 8 }}>Status updates ({statusUpdates.length})</div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {statusUpdates.length === 0 ? <EmptyState message="No status changes" small /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {statusUpdates.map(e => (
                  <div key={e.id} style={{ padding: '8px 10px', background: C.paper, borderRadius: 4, border: `1px solid ${C.pencilLight}` }}>
                    <div style={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: C.ink, marginBottom: 4 }}>{e.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {e.from && <SketchPill color={STATUS_META[e.from as StatusKey]?.color || C.pencil} style={{ fontSize: '0.5625rem', padding: '1px 6px' }}>{STATUS_META[e.from as StatusKey]?.short || e.from}</SketchPill>}
                      <span style={{ color: C.pencil, fontSize: '0.5rem' }}>→</span>
                      {e.to && <SketchPill color={STATUS_META[e.to as StatusKey]?.color || C.pencil} style={{ fontSize: '0.5625rem', padding: '1px 6px' }}>{STATUS_META[e.to as StatusKey]?.short || e.to}</SketchPill>}
                      <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil, marginLeft: 'auto' }}>{new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', background: C.paper, borderRadius: 6 }}>
      <SketchBox stroke={C.pencilLight} strokeWidth={1.2} rough={0.6} radius={6} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {icon}
        <span style={{ fontFamily: FONTS.head, fontSize: '1.5rem', fontWeight: 700, color: C.ink, marginTop: 4 }}>{value}</span>
        <span style={{ fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.pencil }}>{label}</span>
      </div>
    </div>
  );
}

function QuickRangeChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '3px 8px', background: C.paperDark, border: `1px solid ${C.pencilLight}`, borderRadius: 4, fontFamily: FONTS.ui, fontSize: '0.5625rem', color: C.inkSoft, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.coralSoft; e.currentTarget.style.borderColor = C.coral; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = C.paperDark; e.currentTarget.style.borderColor = C.pencilLight; }}
    >
      {label}
    </button>
  );
}

function EmptyState({ message, small }: { message: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: small ? '20px 16px' : '40px 16px', background: C.paperDark, borderRadius: 6, fontFamily: FONTS.ui, fontSize: small ? '0.6875rem' : '0.8125rem', color: C.pencil, textAlign: 'center' }}>
      {message}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
      <SketchCheck checked={checked} size={14} onChange={onChange} />
      <span style={{ fontFamily: FONTS.ui, fontSize: '0.6875rem', color: C.inkSoft }}>{label}</span>
    </label>
  );
}

// Main CalendarView Component
export function CalendarView({ onNavigateToToday, initialDate, initialFrom, initialTo, onUrlChange }: Props) {
  const [mode, setMode] = useState<CalendarMode>(initialFrom && initialTo ? 'timeframe' : 'day');
  const [selectedDay, setSelectedDay] = useState<Date>(() => initialDate ? parseDate(initialDate) : new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(() => initialFrom ? parseDate(initialFrom) : null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(() => initialTo ? parseDate(initialTo) : null);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (initialDate) return parseDate(initialDate);
    if (initialFrom) return parseDate(initialFrom);
    return new Date();
  });
  const [filters, setFilters] = useState<CalendarFilters>({ newTasks: true, statusUpdates: true, completed: true, notecards: true, reminders: false });
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [scratchpad, setScratchpad] = useState<ScratchpadResponse | null>(null);
  const [isFloatingScratchpad, setIsFloatingScratchpad] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { activityLogApi.getAll().then(setAllEvents); }, []);

  // Fetch scratchpad for selected day from backend
  useEffect(() => {
    if (mode === 'day') {
      const dateKey = formatDateISO(selectedDay);
      scratchpadApi.getByDate(dateKey).then((response) => {
        setScratchpad(response);
        setScratchpadContent(response?.content || '');
      }).catch(() => {
        setScratchpad(null);
        setScratchpadContent('');
      });
    }
  }, [mode, selectedDay]);

  const handleScratchpadChange = useCallback((value: string) => {
    setScratchpadContent(value);
    const dateKey = formatDateISO(selectedDay);
    // Update local state immediately
    setScratchpad({
      date: dateKey,
      content: value,
      updatedAt: Date.now(),
    });
    // Debounce save to backend
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      scratchpadApi.saveForDate(dateKey, value).catch(() => {});
    }, 5000);
  }, [selectedDay]);

  const toggleFloatingScratchpad = useCallback(() => setIsFloatingScratchpad(f => !f), []);

  const activityByDay = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    filterEvents(allEvents, filters).forEach(event => {
      const key = formatDateISO(new Date(event.timestamp));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [allEvents, filters]);

  const viewEvents = useMemo(() => {
    if (mode === 'day') return activityByDay.get(formatDateISO(selectedDay)) || [];
    if (!rangeStart || !rangeEnd) return [];
    return filterEvents(allEvents, filters).filter(e => {
      const date = new Date(e.timestamp);
      return date >= rangeStart && date <= new Date(rangeEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
    });
  }, [mode, selectedDay, rangeStart, rangeEnd, activityByDay, allEvents, filters]);

  useEffect(() => {
    if (!onUrlChange) return;
    if (mode === 'day') onUrlChange({ date: formatDateISO(selectedDay) });
    else if (rangeStart && rangeEnd) onUrlChange({ from: formatDateISO(rangeStart), to: formatDateISO(rangeEnd) });
  }, [mode, selectedDay, rangeStart, rangeEnd, onUrlChange]);

  const handleDayClick = useCallback((day: Date) => { setSelectedDay(day); setViewMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }, []);
  const handleRangeSelect = useCallback((start: Date, end: Date) => { setRangeStart(start); setRangeEnd(end); }, []);
  const handleJumpToToday = useCallback(() => {
    const today = new Date();
    setSelectedDay(today);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    if (mode === 'timeframe') { setRangeStart(today); setRangeEnd(today); }
  }, [mode]);
  const handlePrevDay = useCallback(() => {
    const prev = new Date(selectedDay); prev.setDate(prev.getDate() - 1); setSelectedDay(prev);
    if (prev.getMonth() !== viewMonth.getMonth()) setViewMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
  }, [selectedDay, viewMonth]);
  const handleNextDay = useCallback(() => {
    const next = new Date(selectedDay); next.setDate(next.getDate() + 1); setSelectedDay(next);
    if (next.getMonth() !== viewMonth.getMonth()) setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [selectedDay, viewMonth]);
  const handleQuickRange = useCallback((days: number) => {
    const end = new Date(); const start = new Date(); start.setDate(start.getDate() - days + 1);
    setRangeStart(start); setRangeEnd(end); setViewMonth(new Date(start.getFullYear(), start.getMonth(), 1));
  }, []);
  const toggleFilter = useCallback((key: keyof CalendarFilters) => setFilters(f => ({ ...f, [key]: !f[key] })), []);

  const contextTip = mode === 'day' ? 'Click a day to view its activity journal' : 'Click and drag to select a date range';

  return (
    <>
      {/* Blur overlay when floating scratchpad is open */}
      {isFloatingScratchpad && (
        <div
          onClick={() => setIsFloatingScratchpad(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: OVERLAYS.blur,
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Floating scratchpad modal */}
      {isFloatingScratchpad && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 101,
          }}
        >
          <ScratchPad
            floating
            content={scratchpadContent}
            isFloating={isFloatingScratchpad}
            onToggleFloat={toggleFloatingScratchpad}
            onChange={handleScratchpadChange}
          />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', padding: 0, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0, padding: '20px 24px', borderRight: `1.5px dashed ${C.pencilLight}`, background: C.paper, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', background: C.paperDark, borderRadius: 6, padding: 3 }}>
            {(['day', 'timeframe'] as CalendarMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: 4,
                background: mode === m ? C.paper : 'transparent',
                fontFamily: FONTS.ui, fontSize: '0.75rem', fontWeight: mode === m ? 600 : 400,
                color: mode === m ? C.ink : C.inkSoft, cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: mode === m ? SHADOWS.card : 'none',
              }}>
                {m === 'day' ? 'Single day' : 'Timeframe'}
              </button>
            ))}
          </div>

          <MiniCalendar mode={mode} selectedDay={selectedDay} rangeStart={rangeStart} rangeEnd={rangeEnd} viewMonth={viewMonth} activityByDay={activityByDay} onDayClick={handleDayClick} onRangeSelect={handleRangeSelect} onMonthChange={setViewMonth} onJumpToToday={handleJumpToToday} />

          <div>
            <div style={{ fontFamily: FONTS.head, fontSize: '0.8125rem', fontWeight: 700, color: C.ink, marginBottom: 10 }}>Include in summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FilterCheckbox label="New tasks added" checked={filters.newTasks} onChange={() => toggleFilter('newTasks')} />
              <FilterCheckbox label="Status updates" checked={filters.statusUpdates} onChange={() => toggleFilter('statusUpdates')} />
              <FilterCheckbox label="Completed / merged" checked={filters.completed} onChange={() => toggleFilter('completed')} />
              <FilterCheckbox label="Notecards created" checked={filters.notecards} onChange={() => toggleFilter('notecards')} />
              <FilterCheckbox label="Reminders fired" checked={filters.reminders} onChange={() => toggleFilter('reminders')} />
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: C.yellowSoft, borderRadius: 4, fontFamily: FONTS.ui, fontSize: '0.625rem', color: C.inkSoft, lineHeight: 1.4 }}>
            {contextTip}
          </div>

          <button onClick={onNavigateToToday} style={{ padding: '10px 12px', background: 'transparent', border: `1px dashed ${C.pencilLight}`, borderRadius: 4, fontFamily: FONTS.ui, fontSize: '0.6875rem', color: C.coral, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = C.coralSoft)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            ← Back to Today view
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto', minHeight: 0 }}>
          {mode === 'day' ? (
            <SingleDayJournal date={selectedDay} events={viewEvents} scratchpad={scratchpad} onPrevDay={handlePrevDay} onNextDay={handleNextDay} onExpandScratchpad={toggleFloatingScratchpad} />
          ) : rangeStart && rangeEnd ? (
            <TimeframeSummary from={rangeStart} to={rangeEnd} events={viewEvents} onQuickRange={handleQuickRange} />
          ) : (
            <EmptyState message="Select a date range on the calendar to view summary" />
          )}
        </div>
      </div>
    </>
  );
}
