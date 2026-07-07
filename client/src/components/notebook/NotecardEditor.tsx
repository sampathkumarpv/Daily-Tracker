import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
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

  // Insert current date as inline text
  const insertDate = useCallback(() => {
    if (!editor) return;
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', minHeight: 0 }}>
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

          <div style={{ width: 1, height: 20, background: C.pencilLight, margin: '0 6px' }} />

          <ToolbarButton onClick={insertDate} title="Insert Date">
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
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* TipTap Editor */}
          <div
            style={{
              minHeight: 200,
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

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal
          onClose={() => setShowReminderModal(false)}
          onSave={handleAddReminder}
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
      `}</style>
    </div>
  );
}
