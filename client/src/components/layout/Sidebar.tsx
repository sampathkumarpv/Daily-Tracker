import { C, FONTS } from '../../theme';
import { IconBook, IconPlus } from '../ui/Icons';
import type { View } from '../../types';
import type { Notebook } from '../../types';
import { resolveNotebookColor } from '../../utils/notebookColor';

interface Props {
  activeView: View;
  onNavigate: (v: View) => void;
  onOpenNotebook: (id: string) => void;
  notebooks: Notebook[];
  taskCounts: Record<string, number>;
  pendingRemindersCount: number;
}

const NAV_ITEMS = [
  { id: 'today' as View, label: 'Today' },
  { id: 'board' as View, label: 'Board' },
  { id: 'all' as View, label: 'All tasks' },
  { id: 'done' as View, label: 'Done' },
] as const;

export function Sidebar({ activeView, onNavigate, notebooks, taskCounts, onOpenNotebook, pendingRemindersCount }: Props) {
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
