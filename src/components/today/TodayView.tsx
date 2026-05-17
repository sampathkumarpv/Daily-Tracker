import { useState } from 'react';
import { C, FONTS, STATUS_META } from '../../theme';
import type { StatusKey } from '../../theme';
import { SketchBox, SketchPill } from '../ui/SketchBox';
import { IconBell, IconCalendar, IconExpand, IconCollapse, SketchCheck } from '../ui/Icons';
import type { Task } from '../../types';

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
}

const REMINDERS = [
  '10:00 am — standup',
  '2:30 pm — decide on dnd lib',
  '5:00 pm — push PR review',
];

export function TodayView({ tasks, onTaskClick }: Props) {
  const [isFloating, setIsFloating] = useState(false);
  const todayTasks = tasks.filter((t) => t.dueDate === 'Today' || t.status === 'proc');
  const upcoming = tasks.filter((t) => t.dueDate && t.dueDate !== 'Today' && t.status !== 'done');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'good morning, M';
    if (h < 17) return 'good afternoon, M';
    return 'good evening, M';
  };

  const inProcess = tasks.filter((t) => t.status === 'proc').length;

  const ScratchPad = ({ floating }: { floating?: boolean }) => (
    <div
      style={{
        position: 'relative',
        padding: floating ? 24 : 16,
        background: C.yellowSoft,
        minHeight: floating ? 320 : 180,
        borderRadius: 3,
        width: floating ? 500 : 'auto',
        maxWidth: floating ? '90vw' : 'none',
        boxShadow: floating ? '0 8px 32px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <SketchBox stroke={C.ink} strokeWidth={1.5} rough={1} radius={3} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: FONTS.caveat, fontSize: floating ? 24 : 20, fontWeight: 700, color: C.ink }}>
            Today's scratchpad
          </div>
          <button
            onClick={() => setIsFloating(!isFloating)}
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
            title={floating ? 'Collapse' : 'Expand'}
          >
            {floating ? <IconCollapse size={16} color={C.ink} /> : <IconExpand size={16} color={C.ink} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.pencil, marginBottom: 10, fontFamily: FONTS.kalam }}>
          auto-saves to Work log
        </div>
        <textarea
          placeholder="Jot down anything…"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontFamily: FONTS.architects,
            fontSize: floating ? 15 : 13,
            color: C.inkSoft,
            lineHeight: 1.8,
            resize: 'none',
            outline: 'none',
            minHeight: floating ? 240 : 120,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Blur overlay when floating */}
      {isFloating && (
        <div
          onClick={() => setIsFloating(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Floating scratchpad */}
      {isFloating && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 101,
          }}
        >
          <ScratchPad floating />
        </div>
      )}
    <div
      style={{
        flex: 1,
        display: 'flex',
        padding: '22px 32px',
        gap: 28,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* left column */}
      <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        {/* greeting */}
        <div>
          <div style={{ fontFamily: FONTS.caveat, fontSize: 36, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
            {greeting()}
          </div>
          <div style={{ fontFamily: FONTS.kalam, fontSize: 13, color: C.pencil, marginTop: 4 }}>
            {todayTasks.length} tasks today · {inProcess} in process
            {tasks.filter((t) => t.dueDate === 'Today').length > 0 &&
              ` · ${tasks.filter((t) => t.dueDate === 'Today').length} due today`}
          </div>
        </div>

        {/* focus list */}
        <div>
          <div style={{ fontFamily: FONTS.caveat, fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
            Focus list
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayTasks.slice(0, 6).map((t) => {
              const statusMeta = STATUS_META[t.status as StatusKey];
              return (
                <div
                  key={t.id}
                  onClick={() => onTaskClick(t.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: '#fff',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <SketchBox
                    stroke={t.priority === 'hi' ? C.coral : C.pencilLight}
                    strokeWidth={t.priority === 'hi' ? 1.8 : 1.3}
                    rough={0.9}
                    radius={3}
                  />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, width: '100%', zIndex: 1 }}>
                    <SketchCheck checked={t.status === 'done'} size={14} />
                    <span style={{ fontSize: 10, color: C.pencil, width: 62, flexShrink: 0, fontFamily: FONTS.kalam }}>
                      {t.tag}
                    </span>
                    <span style={{ fontFamily: FONTS.architects, fontSize: 14, flex: 1, color: C.ink }}>
                      {t.title}
                    </span>
                    <SketchPill color={statusMeta.color}>{statusMeta.short}</SketchPill>
                    {t.priority === 'hi' && (
                      <span style={{ fontFamily: FONTS.caveat, fontSize: 14, color: C.coral }}>!!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div style={{ fontFamily: FONTS.caveat, fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              Upcoming
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {upcoming.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  onClick={() => onTaskClick(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '5px 2px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: C.pencil, width: 72, fontFamily: FONTS.kalam, flexShrink: 0 }}>
                    {u.dueDate}
                  </span>
                  <span style={{ color: C.pencil, width: 62, fontSize: 10, fontFamily: FONTS.kalam, flexShrink: 0 }}>
                    {u.tag}
                  </span>
                  <span style={{ fontFamily: FONTS.architects, color: C.inkSoft }}>{u.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* right rail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        {/* scratchpad */}
        <ScratchPad />

        {/* reminders */}
        <div style={{ position: 'relative', padding: 14, borderRadius: 3 }}>
          <SketchBox stroke={C.pencilLight} strokeWidth={1.3} rough={0.8} radius={3} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <IconBell size={14} color={C.coral} />
              <span style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink }}>
                Reminders
              </span>
            </div>
            {REMINDERS.map((r, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  padding: '4px 0',
                  color: C.inkSoft,
                  fontFamily: FONTS.architects,
                  borderBottom: i < REMINDERS.length - 1 ? `1px dashed ${C.pencilLight}` : 'none',
                }}
              >
                · {r}
              </div>
            ))}
          </div>
        </div>

        {/* mini calendar hint */}
        <div style={{ position: 'relative', padding: 14, borderRadius: 3 }}>
          <SketchBox stroke={C.pencilLight} strokeWidth={1.3} rough={0.8} radius={3} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IconCalendar size={14} color={C.teal} />
              <span style={{ fontFamily: FONTS.caveat, fontSize: 17, fontWeight: 700, color: C.ink }}>
                This week
              </span>
            </div>
            {tasks
              .filter((t) => t.dueDate && t.status !== 'done')
              .slice(0, 4)
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => onTaskClick(t.id)}
                  style={{ display: 'flex', gap: 8, padding: '3px 0', cursor: 'pointer' }}
                >
                  <span style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.pencil, width: 60, flexShrink: 0 }}>
                    {t.dueDate}
                  </span>
                  <span style={{ fontFamily: FONTS.architects, fontSize: 11, color: C.inkSoft }}>
                    {t.title}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
