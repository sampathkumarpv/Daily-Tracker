import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { common, createLowlight } from 'lowlight';
import { C, FONTS, SHADOWS, OVERLAYS, TEXT_COLORS, HIGHLIGHT_COLORS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { IconBell, IconCalendar, IconClip, IconX } from '../ui/Icons';
import type { Notecard, Notebook, Task, Reminder } from '../../types';
import type { CreateReminderRequest } from '../../api/reminders';

// Color palettes imported from theme.ts as TEXT_COLORS and HIGHLIGHT_COLORS
// Adding default/none options for the UI
const TEXT_COLOR_OPTIONS = [
  { name: 'Default', value: null },
  ...TEXT_COLORS.map(c => ({ name: c.name.charAt(0).toUpperCase() + c.name.slice(1), value: c.value })),
];

const HIGHLIGHT_COLOR_OPTIONS = [
  { name: 'None', value: null },
  ...HIGHLIGHT_COLORS.map(c => ({ name: c.name.charAt(0).toUpperCase() + c.name.slice(1), value: c.value })),
];

// Debounce helper with cleanup
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay]
  );
}

const lowlight = createLowlight(common);

interface Props {
  notecard: Notecard;
  notebook: Notebook;
  allNotecards: Notecard[];
  tasks: Task[];
  reminders: Reminder[];
  onBack: () => void;
  onUpdate: (patch: Partial<Notecard>) => void;
  onOpenNotecard: (id: string) => void;
  onAddReminder: (request: CreateReminderRequest) => void;
  onDeleteReminder: (id: number) => void;
  onDeleteNotecard: (id: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '4px 8px',
        fontFamily: FONTS.ui,
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? C.ink : C.inkSoft,
        border: isActive ? `1.5px solid ${C.ink}` : '1.5px solid transparent',
        background: isActive ? C.yellowSoft : 'transparent',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

interface ColorPickerProps {
  colors: { name: string; value: string | null }[];
  currentColor: string | null;
  onSelect: (color: string | null) => void;
  icon: React.ReactNode;
  title: string;
}

function ColorPickerDropdown({ colors, currentColor, onSelect, icon, title }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={title}
        style={{
          padding: '4px 8px',
          fontFamily: FONTS.ui,
          fontSize: 12,
          color: C.inkSoft,
          border: '1.5px solid transparent',
          background: 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {icon}
        <span style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: C.paper,
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 6,
            padding: 6,
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            width: 140,
            zIndex: 100,
            boxShadow: SHADOWS.dropdown,
          }}
        >
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                onSelect(c.value);
                setOpen(false);
              }}
              title={c.name}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                border: currentColor === c.value ? `2px solid ${C.ink}` : `1.5px solid ${C.pencilLight}`,
                background: c.value || C.paper,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
              }}
            >
              {!c.value && '✕'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TableDropdownProps {
  editor: ReturnType<typeof useEditor>;
}

function TableDropdown({ editor }: TableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustomSize(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!editor) return null;

  const isInTable = editor.isActive('table');

  const handleInsertCustomTable = () => {
    const rows = Math.max(1, Math.min(20, customRows));
    const cols = Math.max(1, Math.min(10, customCols));
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
    setShowCustomSize(false);
  };

  const tableActions = [
    {
      label: 'Insert 3×3 table',
      icon: '⊞',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      show: !isInTable,
    },
    {
      label: 'Insert 2×2 table',
      icon: '⊟',
      action: () => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(),
      show: !isInTable,
    },
    {
      label: 'Custom size...',
      icon: '⋯',
      action: () => setShowCustomSize(true),
      show: !isInTable,
      noClose: true,
    },
    { label: 'divider', icon: '', action: () => {}, show: !isInTable && isInTable === false },
    {
      label: 'Add column before',
      icon: '←+',
      action: () => editor.chain().focus().addColumnBefore().run(),
      show: isInTable,
    },
    {
      label: 'Add column after',
      icon: '+→',
      action: () => editor.chain().focus().addColumnAfter().run(),
      show: isInTable,
    },
    {
      label: 'Delete column',
      icon: '×|',
      action: () => editor.chain().focus().deleteColumn().run(),
      show: isInTable,
    },
    { label: 'divider', icon: '', action: () => {}, show: isInTable },
    {
      label: 'Add row before',
      icon: '↑+',
      action: () => editor.chain().focus().addRowBefore().run(),
      show: isInTable,
    },
    {
      label: 'Add row after',
      icon: '+↓',
      action: () => editor.chain().focus().addRowAfter().run(),
      show: isInTable,
    },
    {
      label: 'Delete row',
      icon: '×—',
      action: () => editor.chain().focus().deleteRow().run(),
      show: isInTable,
    },
    { label: 'divider', icon: '', action: () => {}, show: isInTable },
    {
      label: 'Toggle header row',
      icon: '▤',
      action: () => editor.chain().focus().toggleHeaderRow().run(),
      show: isInTable,
    },
    {
      label: 'Toggle header column',
      icon: '▥',
      action: () => editor.chain().focus().toggleHeaderColumn().run(),
      show: isInTable,
    },
    {
      label: 'Merge cells',
      icon: '⊡',
      action: () => editor.chain().focus().mergeCells().run(),
      show: isInTable,
    },
    {
      label: 'Split cell',
      icon: '⊞',
      action: () => editor.chain().focus().splitCell().run(),
      show: isInTable,
    },
    { label: 'divider', icon: '', action: () => {}, show: isInTable },
    {
      label: 'Delete table',
      icon: '🗑',
      action: () => editor.chain().focus().deleteTable().run(),
      show: isInTable,
      danger: true,
    },
  ];

  const visibleActions = tableActions.filter(a => a.show);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Table"
        style={{
          padding: '4px 8px',
          fontFamily: FONTS.ui,
          fontSize: 12,
          color: isInTable ? C.ink : C.inkSoft,
          border: isInTable ? `1.5px solid ${C.ink}` : '1.5px solid transparent',
          background: isInTable ? C.yellowSoft : 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontWeight: 600 }}>⊞</span>
        table
        <span style={{ fontSize: 8 }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: C.paper,
            border: `1.5px solid ${C.pencilLight}`,
            borderRadius: 6,
            padding: 4,
            minWidth: 160,
            zIndex: 100,
            boxShadow: SHADOWS.dropdown,
          }}
        >
          {showCustomSize ? (
            <div style={{ padding: '8px 4px' }}>
              <div style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.ink, marginBottom: 8, fontWeight: 600 }}>
                Custom Table Size
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: FONTS.ui, fontSize: 10, color: C.inkSoft, display: 'block', marginBottom: 2 }}>
                    Rows
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={customRows}
                    onChange={(e) => setCustomRows(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: `1.5px solid ${C.pencilLight}`,
                      borderRadius: 4,
                      fontFamily: FONTS.ui,
                      fontSize: 12,
                      color: C.ink,
                      background: C.paper,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = C.teal}
                    onBlur={(e) => e.currentTarget.style.borderColor = C.pencilLight}
                  />
                </div>
                <span style={{ fontFamily: FONTS.ui, fontSize: 12, color: C.pencil, marginTop: 14 }}>×</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: FONTS.ui, fontSize: 10, color: C.inkSoft, display: 'block', marginBottom: 2 }}>
                    Cols
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={customCols}
                    onChange={(e) => setCustomCols(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: `1.5px solid ${C.pencilLight}`,
                      borderRadius: 4,
                      fontFamily: FONTS.ui,
                      fontSize: 12,
                      color: C.ink,
                      background: C.paper,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = C.teal}
                    onBlur={(e) => e.currentTarget.style.borderColor = C.pencilLight}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setShowCustomSize(false)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    border: `1.5px solid ${C.pencilLight}`,
                    borderRadius: 4,
                    background: 'transparent',
                    fontFamily: FONTS.ui,
                    fontSize: 10,
                    color: C.inkSoft,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleInsertCustomTable}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    border: 'none',
                    borderRadius: 4,
                    background: C.teal,
                    fontFamily: FONTS.ui,
                    fontSize: 10,
                    color: C.paper,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Insert
                </button>
              </div>
            </div>
          ) : (
            visibleActions.map((action, i) =>
              action.label === 'divider' ? (
                <div
                  key={`divider-${i}`}
                  style={{
                    height: 1,
                    background: C.pencilLight,
                    margin: '4px 0',
                  }}
                />
              ) : (
                <button
                  key={action.label}
                  onClick={() => {
                    action.action();
                    if (!(action as { noClose?: boolean }).noClose) {
                      setOpen(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 4,
                    fontFamily: FONTS.ui,
                    fontSize: 11,
                    color: (action as { danger?: boolean }).danger ? C.coral : C.ink,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.paperDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ width: 16, textAlign: 'center', fontSize: 12 }}>
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

interface DatePickerModalProps {
  onClose: () => void;
  onInsert: (dateStr: string) => void;
}

function DatePickerModal({ onClose, onInsert }: DatePickerModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const handleInsert = () => {
    if (!date) return;
    const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    onInsert(formatted);
    onClose();
  };

  const handleToday = () => {
    const formatted = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    onInsert(formatted);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modal,
        backdropFilter: 'blur(3px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: C.paper,
          padding: 24,
          width: '100%',
          maxWidth: 320,
          borderRadius: 8,
          boxShadow: SHADOWS.modal,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: FONTS.head, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>
              Insert Date
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={16} color={C.pencil} />
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                fontFamily: FONTS.ui,
                fontSize: 13,
                color: C.ink,
                background: C.paper,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={handleToday}
              style={{
                padding: '8px 14px',
                border: `1.5px solid ${C.teal}`,
                borderRadius: 4,
                background: 'transparent',
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.teal,
                cursor: 'pointer',
                marginRight: 'auto',
              }}
            >
              Today
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                background: 'transparent',
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.inkSoft,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!date}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 4,
                background: date ? C.teal : C.pencilLight,
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.paper,
                cursor: date ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LinkModalProps {
  onClose: () => void;
  onSave: (url: string, text: string) => void;
  onRemove?: () => void;
  initialUrl?: string;
  initialText?: string;
  hasSelection?: boolean;
}

function LinkModal({ onClose, onSave, onRemove, initialUrl = '', initialText = '', hasSelection = false }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const isEditing = !!initialUrl;

  const handleSave = () => {
    if (!url.trim()) return;
    onSave(url.trim(), text.trim());
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modal,
        backdropFilter: 'blur(3px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: C.paper,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          borderRadius: 8,
          boxShadow: SHADOWS.modal,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: FONTS.head, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>
              {isEditing ? 'Edit Link' : 'Insert Link'}
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={16} color={C.pencil} />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
              URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                fontFamily: FONTS.body,
                fontSize: 13,
                color: C.ink,
                background: C.paper,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) {
                  handleSave();
                }
              }}
            />
          </div>

          {!hasSelection && !isEditing && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
                Display Text <span style={{ color: C.pencil }}>(optional)</span>
              </label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Link text (defaults to URL)"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1.5px solid ${C.pencilLight}`,
                  borderRadius: 4,
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: C.ink,
                  background: C.paper,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim()) {
                    handleSave();
                  }
                }}
              />
            </div>
          )}

          {hasSelection && !isEditing && (
            <p style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil, marginBottom: 16 }}>
              The selected text will become a link
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {isEditing && onRemove && (
              <button
                onClick={handleRemove}
                style={{
                  padding: '8px 14px',
                  border: `1.5px solid ${C.coral}`,
                  borderRadius: 4,
                  background: 'transparent',
                  fontFamily: FONTS.ui,
                  fontSize: 12,
                  color: C.coral,
                  cursor: 'pointer',
                  marginRight: 'auto',
                }}
              >
                Remove Link
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                background: 'transparent',
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.inkSoft,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!url.trim()}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 4,
                background: url.trim() ? C.teal : C.pencilLight,
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.paper,
                cursor: url.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              {isEditing ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReminderModalProps {
  onClose: () => void;
  onSave: (dueAt: string, label: string) => void;
}

function ReminderModal({ onClose, onSave }: ReminderModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [label, setLabel] = useState('');

  const handleSave = () => {
    if (!date || !label.trim()) return;
    const dueAt = `${date}T${time}:00`;
    onSave(dueAt, label.trim());
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: OVERLAYS.modal,
        backdropFilter: 'blur(3px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: C.paper,
          padding: 24,
          width: '100%',
          maxWidth: 360,
          borderRadius: 8,
          boxShadow: SHADOWS.modal,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={2} rough={1.2} radius={6} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: FONTS.head, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>
              Set Reminder
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
              <IconX size={16} color={C.pencil} />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
              Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Remind me to..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                fontFamily: FONTS.body,
                fontSize: 13,
                color: C.ink,
                background: C.paper,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1.5px solid ${C.pencilLight}`,
                  borderRadius: 4,
                  fontFamily: FONTS.ui,
                  fontSize: 12,
                  color: C.ink,
                  background: C.paper,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: FONTS.ui, fontSize: 11, color: C.inkSoft, display: 'block', marginBottom: 4 }}>
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1.5px solid ${C.pencilLight}`,
                  borderRadius: 4,
                  fontFamily: FONTS.ui,
                  fontSize: 12,
                  color: C.ink,
                  background: C.paper,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                border: `1.5px solid ${C.pencilLight}`,
                borderRadius: 4,
                background: 'transparent',
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.inkSoft,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!date || !label.trim()}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 4,
                background: date && label.trim() ? C.coral : C.pencilLight,
                fontFamily: FONTS.ui,
                fontSize: 12,
                color: C.paper,
                cursor: date && label.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              Set Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotecardEditor({
  notecard,
  notebook,
  allNotecards,
  tasks,
  reminders,
  onBack,
  onUpdate,
  onOpenNotecard,
  onAddReminder,
  onDeleteReminder,
  onDeleteNotecard,
  onNavigateToTask,
}: Props) {
  const [title, setTitle] = useState(notecard.title);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync title when notecard changes
  useEffect(() => {
    setTitle(notecard.title);
    setShowDeleteConfirm(false); // Reset delete confirmation when switching cards
  }, [notecard.id, notecard.title]);

  // Get siblings from same notebook
  const siblings = allNotecards.filter((nc) => nc.notebookId === notecard.notebookId);

  // Get attached tasks (check both directions for compatibility)
  const attachedTasks = tasks.filter((t) =>
    notecard.attachedTaskIds?.includes(t.id) || t.notecardIds?.includes(notecard.id)
  );

  // Get reminders for this notecard
  const notecardReminders = reminders.filter((r) => r.entityType === 'notecard' && r.entityId === notecard.id);

  // Debounced update handler to prevent lag while typing
  const debouncedUpdate = useDebouncedCallback((body: string, content: string) => {
    onUpdate({ body, content });
  }, 300);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.extend({
        inclusive: false, // Don't extend link when typing at the end
      }).configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'notecard-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: (() => {
      try {
        return notecard.body ? JSON.parse(notecard.body) : { type: 'doc', content: [{ type: 'paragraph' }] };
      } catch {
        // Fallback: convert legacy content to TipTap format
        return {
          type: 'doc',
          content: [
            { type: 'paragraph', content: notecard.content ? [{ type: 'text', text: notecard.content }] : [] }
          ]
        };
      }
    })(),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      // Use debounced update to prevent lag
      debouncedUpdate(JSON.stringify(json), text.substring(0, 200));
    },
    editorProps: {
      attributes: {
        style: `
          font-family: var(--font-body);
          font-size: calc(14px * var(--font-scale, 1));
          color: var(--color-ink);
          line-height: 1.7;
          outline: none;
          min-height: 200px;
        `,
      },
    },
  });

  // Update editor content when notecard changes
  useEffect(() => {
    if (!editor) return;

    try {
      if (notecard.body) {
        const currentContent = JSON.stringify(editor.getJSON());
        if (currentContent !== notecard.body) {
          editor.commands.setContent(JSON.parse(notecard.body));
        }
      } else if (notecard.content) {
        // Fallback: convert legacy content to TipTap format
        editor.commands.setContent({
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: notecard.content }] }
          ]
        });
      } else {
        // Empty notecard - reset editor
        editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
      }
    } catch {
      // On parse error, reset to empty
      editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
    }
  }, [editor, notecard.id]); // Run when editor is ready or notecard changes

  // Handle title change with debounce
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    onUpdate({ title: newTitle });
  }, [onUpdate]);

  // Insert date as inline text
  const insertDate = useCallback((dateStr: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`📅 ${dateStr} `).run();
  }, [editor]);

  // Handle reminder creation
  const handleAddReminder = useCallback((dueAt: string, label: string) => {
    // Convert ISO date string to milliseconds
    const dueAtMs = new Date(dueAt).getTime();
    onAddReminder({
      entityType: 'notecard',
      entityId: notecard.id,
      dueAt: dueAtMs,
      label,
    });
    // Also insert reminder chip in editor
    if (editor) {
      const dateStr = new Date(dueAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      editor.chain().focus().insertContent(`🔔 ${label} (${dateStr}) `).run();
    }
  }, [editor, notecard.id, onAddReminder]);

  // Handle file attachment
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, store file name (in real app, upload to server)
    const attachments = [...(notecard.attachments || []), file.name];
    onUpdate({ attachments });

    if (editor) {
      editor.chain().focus().insertContent(`📎 ${file.name} `).run();
    }
  }, [editor, notecard.attachments, onUpdate]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for inline preview
    const reader = new FileReader();
    reader.onload = () => {
      if (editor && typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result }).run();
      }
    };
    reader.readAsDataURL(file);
  }, [editor]);

  // Handle link insertion
  const handleAddLink = useCallback((url: string, text: string) => {
    if (!editor) return;

    // Ensure URL has protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    const hasSelection = !editor.state.selection.empty;

    if (hasSelection) {
      // Apply link to selected text
      editor.chain().focus().setLink({ href: finalUrl }).run();
    } else if (text) {
      // Insert new text with link
      editor.chain().focus().insertContent({
        type: 'text',
        text: text,
        marks: [{ type: 'link', attrs: { href: finalUrl } }],
      }).run();
    } else {
      // Insert URL as link text
      editor.chain().focus().insertContent({
        type: 'text',
        text: finalUrl,
        marks: [{ type: 'link', attrs: { href: finalUrl } }],
      }).run();
    }
  }, [editor]);

  // Handle link removal
  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  // Handle delete
  const handleDelete = useCallback(() => {
    onDeleteNotecard(notecard.id);
    onBack();
  }, [notecard.id, onDeleteNotecard, onBack]);

  if (!editor) return null;

  return (
    <div style={{ flex: 1, display: 'flex', gap: 18, padding: '18px 28px', overflow: 'hidden', minHeight: 0 }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* left: card list */}
      <div
        style={{
          width: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderRight: `1.5px dashed ${C.pencilLight}`,
          paddingRight: 14,
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        {/* notebook title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            style={{
              width: 10,
              height: 14,
              background: `var(--color-${notebook.color})`,
              border: `1.4px solid ${C.ink}`,
              borderRadius: '1px 3px 3px 1px',
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: FONTS.caveat, fontSize: 18, fontWeight: 700, color: C.ink }}>
            {notebook.name}
          </span>
        </div>

        {siblings.map((nc) => (
          <div
            key={nc.id}
            onClick={() => onOpenNotecard(nc.id)}
            style={{
              position: 'relative',
              padding: '8px 10px',
              background: nc.id === notecard.id ? C.yellowSoft : C.paper,
              fontSize: 12,
              fontFamily: FONTS.architects,
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            <SketchBox
              stroke={nc.id === notecard.id ? C.ink : C.pencilLight}
              strokeWidth={nc.id === notecard.id ? 1.6 : 1.2}
              rough={0.8}
              radius={2}
            />
            <span style={{ position: 'relative', zIndex: 1, color: C.ink }}>{nc.title}</span>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 11,
            color: C.pencil,
            cursor: 'pointer',
          }}
        >
          <span>+</span>
          <span style={{ fontFamily: FONTS.kalam }}>new card</span>
        </div>
      </div>

      {/* right: editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0 }}>
        {/* toolbar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingBottom: 10,
            borderBottom: `1.5px dashed ${C.pencilLight}`,
            flexShrink: 0,
          }}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <span style={{ fontWeight: 700, fontStyle: 'normal' }}>B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            U
          </ToolbarButton>

          <div style={{ width: 1, height: 20, background: C.pencilLight, margin: '0 6px' }} />

          {/* Text Color */}
          <ColorPickerDropdown
            colors={TEXT_COLOR_OPTIONS}
            currentColor={editor.getAttributes('textStyle').color || null}
            onSelect={(color) => {
              const currentColor = editor.getAttributes('textStyle').color;
              const hasSelection = !editor.state.selection.empty;

              if (color) {
                // Set the new color (works for both selection and cursor position)
                if (currentColor === color && !hasSelection) {
                  // Toggle off if clicking same color with no selection
                  editor.chain().focus().unsetMark('textStyle').run();
                } else {
                  editor.chain().focus().setColor(color).run();
                }
              } else {
                // "Default" selected
                if (hasSelection) {
                  // Remove color from selected text
                  editor.chain().focus().unsetColor().run();
                } else {
                  // Clear stored marks for future typing without affecting existing text
                  editor.chain().focus().unsetMark('textStyle').run();
                }
              }
            }}
            icon={
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontWeight: 600, color: editor.getAttributes('textStyle').color || C.inkSoft }}>A</span>
                <span style={{ width: 12, height: 3, background: editor.getAttributes('textStyle').color || C.inkSoft, borderRadius: 1 }} />
              </span>
            }
            title="Text Color (click to set, type to apply)"
          />

          {/* Highlight */}
          <ColorPickerDropdown
            colors={HIGHLIGHT_COLOR_OPTIONS}
            currentColor={editor.getAttributes('highlight').color || null}
            onSelect={(color) => {
              const currentHighlight = editor.getAttributes('highlight').color;
              const hasSelection = !editor.state.selection.empty;

              if (color) {
                // Set the new highlight
                if (currentHighlight === color && !hasSelection) {
                  // Toggle off if clicking same highlight with no selection
                  editor.chain().focus().unsetMark('highlight').run();
                } else {
                  editor.chain().focus().setHighlight({ color }).run();
                }
              } else {
                // "None" selected
                if (hasSelection) {
                  // Remove highlight from selected text
                  editor.chain().focus().unsetHighlight().run();
                } else {
                  // Clear stored marks for future typing
                  editor.chain().focus().unsetMark('highlight').run();
                }
              }
            }}
            icon={
              <span
                style={{
                  padding: '1px 4px',
                  background: editor.getAttributes('highlight').color || HIGHLIGHT_COLORS[0].value,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                H
              </span>
            }
            title="Highlight (click to set, type to apply)"
          />

          <div style={{ width: 1, height: 20, background: C.pencilLight, margin: '0 6px' }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <div style={{ width: 1, height: 20, background: C.pencilLight, margin: '0 6px' }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            • list
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Checklist"
          >
            ☑ todo
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            {'{ } code'}
          </ToolbarButton>
          <TableDropdown editor={editor} />

          <div style={{ width: 1, height: 20, background: C.pencilLight, margin: '0 6px' }} />

          <ToolbarButton onClick={() => setShowDateModal(true)} title="Insert Date">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconCalendar size={12} color={C.inkSoft} />
              date
            </span>
          </ToolbarButton>
          <ToolbarButton onClick={() => setShowReminderModal(true)} title="Set Reminder">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconBell size={12} color={C.inkSoft} />
              remind
            </span>
          </ToolbarButton>
          <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Attach File">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconClip size={12} color={C.inkSoft} />
              file
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowLinkModal(true)}
            isActive={editor.isActive('link')}
            title="Insert Link"
          >
            🔗 link
          </ToolbarButton>
          <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Insert Image">
            🖼 img
          </ToolbarButton>

          <div style={{ flex: 1 }} />

          {attachedTasks.length > 0 && (
            <span style={{ fontSize: 10, color: C.teal, fontFamily: FONTS.kalam }}>
              attached to {attachedTasks.length} task{attachedTasks.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* title */}
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          style={{
            fontFamily: FONTS.caveat,
            fontSize: 30,
            fontWeight: 700,
            color: C.ink,
            border: 'none',
            borderBottom: `1.5px solid ${C.ink}`,
            background: 'transparent',
            outline: 'none',
            paddingBottom: 4,
            flexShrink: 0,
          }}
        />

        {/* meta */}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.pencil, fontFamily: FONTS.kalam, flexShrink: 0, flexWrap: 'wrap' }}>
          <span>
            Created: {notecard.createdAt ? new Date(notecard.createdAt).toLocaleDateString() : notecard.date}
          </span>
          {notecard.updatedAt && (
            <span>
              Updated: {new Date(notecard.updatedAt).toLocaleDateString()}
            </span>
          )}
          <span>{notebook.name}</span>
        </div>

        {/* content area */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingBottom: 24,
          }}
        >
          {/* TipTap Editor */}
          <div
            style={{
              minHeight: 200,
              flexShrink: 0,
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Reminders display */}
          {notecardReminders.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FONTS.caveat, fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                Reminders
              </div>
              {notecardReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  style={{
                    position: 'relative',
                    padding: '8px 12px',
                    background: reminder.fired ? C.paperDark : C.coralSoft,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <SketchBox
                    stroke={reminder.fired ? C.pencil : C.coral}
                    strokeWidth={1.4}
                    rough={0.9}
                    radius={3}
                  />
                  <IconBell size={14} color={reminder.fired ? C.pencil : C.coral} />
                  <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{ fontFamily: FONTS.architects, fontSize: 12, color: C.ink }}>
                      {reminder.label}
                    </div>
                    <div style={{ fontFamily: FONTS.kalam, fontSize: 10, color: C.inkSoft }}>
                      {new Date(reminder.dueAt).toLocaleString()}
                      {reminder.fired && ' (fired)'}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteReminder(reminder.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <IconX size={12} color={C.pencil} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attached Tasks display */}
          {attachedTasks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FONTS.caveat, fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                Attached to Tasks
              </div>
              {attachedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onNavigateToTask?.(task.id)}
                  style={{
                    padding: '6px 10px',
                    background: C.tealSoft,
                    borderRadius: 4,
                    marginBottom: 4,
                    fontFamily: FONTS.architects,
                    fontSize: 12,
                    color: C.ink,
                    cursor: onNavigateToTask ? 'pointer' : 'default',
                    transition: 'background 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (onNavigateToTask) {
                      e.currentTarget.style.background = C.teal;
                      e.currentTarget.style.color = C.paper;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = C.tealSoft;
                    e.currentTarget.style.color = C.ink;
                    e.currentTarget.style.transform = 'none';
                  }}
                  title="Click to go to task on Board"
                >
                  {task.title} →
                </div>
              ))}
            </div>
          )}

          {/* Attachments display */}
          {notecard.attachments && notecard.attachments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FONTS.caveat, fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                Attachments
              </div>
              {notecard.attachments.map((attachment, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 10px',
                    background: C.paperDark,
                    borderRadius: 4,
                    marginBottom: 4,
                    fontFamily: FONTS.kalam,
                    fontSize: 11,
                    color: C.inkSoft,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <IconClip size={11} color={C.pencil} />
                  {attachment}
                </div>
              ))}
            </div>
          )}

          {/* Delete section */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1.5px dashed ${C.pencilLight}` }}>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '6px 12px',
                  border: `1.5px solid ${C.coral}`,
                  borderRadius: 4,
                  background: 'transparent',
                  fontFamily: FONTS.kalam,
                  fontSize: 11,
                  color: C.coral,
                  cursor: 'pointer',
                }}
              >
                Delete notecard
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.coral }}>
                  Delete this notecard?
                </span>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '4px 10px',
                    border: 'none',
                    borderRadius: 4,
                    background: C.coral,
                    fontFamily: FONTS.kalam,
                    fontSize: 11,
                    color: C.paper,
                    cursor: 'pointer',
                  }}
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '4px 10px',
                    border: `1.5px solid ${C.pencilLight}`,
                    borderRadius: 4,
                    background: 'transparent',
                    fontFamily: FONTS.kalam,
                    fontSize: 11,
                    color: C.pencil,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDateModal && (
        <DatePickerModal
          onClose={() => setShowDateModal(false)}
          onInsert={insertDate}
        />
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal
          onClose={() => setShowReminderModal(false)}
          onSave={handleAddReminder}
        />
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <LinkModal
          onClose={() => setShowLinkModal(false)}
          onSave={handleAddLink}
          onRemove={handleRemoveLink}
          initialUrl={editor?.getAttributes('link').href || ''}
          hasSelection={!editor?.state.selection.empty}
        />
      )}

      {/* TipTap Editor Styles */}
      <style>{`
        .ProseMirror {
          outline: none;
          font-synthesis: auto;
        }
        .ProseMirror p {
          margin: 0 0 0.75em 0;
        }
        .ProseMirror h1 {
          font-family: var(--font-head);
          font-size: calc(24px * var(--font-scale, 1));
          font-weight: 700;
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror h2 {
          font-family: var(--font-head);
          font-size: calc(20px * var(--font-scale, 1));
          font-weight: 700;
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--color-coral);
        }
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div > p {
          text-decoration: line-through;
          color: var(--color-pencil);
        }
        .ProseMirror pre {
          background: var(--color-paperDark);
          border-radius: 4px;
          padding: 12px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .ProseMirror code {
          background: var(--color-paperDark);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.9em;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 0.5em 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--color-pencil);
          opacity: 0.6;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror strong,
        .ProseMirror b {
          font-weight: 700 !important;
        }
        .ProseMirror em,
        .ProseMirror i {
          font-style: italic !important;
          font-synthesis: style !important;
          opacity: 0.75;
          /* Fallback slant for fonts without italic variant */
          font-variation-settings: 'slnt' -12;
        }
        /* Extra fallback: use transform if font doesn't support italic */
        @supports not (font-synthesis: style) {
          .ProseMirror em,
          .ProseMirror i {
            transform: skewX(-10deg);
            display: inline-block;
          }
        }
        .ProseMirror u {
          text-decoration: underline !important;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--color-pencil);
          padding-left: 12px;
          margin: 0.75em 0;
          color: var(--color-inkSoft);
        }
        .ProseMirror mark {
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
        }
        .ProseMirror span[style*="color"] {
          font-weight: inherit;
        }
        .ProseMirror a {
          color: var(--color-teal);
          text-decoration: underline;
          text-decoration-style: wavy;
          text-decoration-color: var(--color-teal);
          text-underline-offset: 2px;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .ProseMirror a:hover {
          color: var(--color-coral);
          text-decoration-color: var(--color-coral);
        }
        /* Table styles */
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
          border: 1.5px solid var(--color-pencilLight);
          border-radius: 4px;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid var(--color-pencilLight);
          box-sizing: border-box;
          min-width: 1em;
          padding: 8px 10px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror th {
          background-color: var(--color-paperDark);
          font-weight: 600;
          text-align: left;
          font-family: var(--font-ui);
          font-size: calc(12px * var(--font-scale, 1));
          color: var(--color-ink);
        }
        .ProseMirror td {
          font-family: var(--font-body);
          font-size: calc(13px * var(--font-scale, 1));
        }
        .ProseMirror .selectedCell:after {
          background: var(--color-yellowSoft);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
          opacity: 0.5;
        }
        .ProseMirror .column-resize-handle {
          background-color: var(--color-teal);
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
        }
        .ProseMirror.resize-cursor {
          cursor: col-resize;
        }
        .ProseMirror table p {
          margin: 0;
        }
        /* Table row hover effect */
        .ProseMirror tr:hover td {
          background-color: var(--color-paperDark);
        }
        .ProseMirror tr:hover th {
          background-color: var(--color-pencilLight);
        }
      `}</style>
    </div>
  );
}
