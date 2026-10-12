import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { C, FONTS, SHADOWS } from "../../theme";
import { SketchBox } from "./SketchBox";
import { IconExpand, IconCollapse } from "./Icons";

export interface ScratchpadHistoryItem {
  date: string | null;
  content: string;
  updatedAt: number | null;
}

export interface ScratchPadProps {
  floating?: boolean;
  content: string;
  isFloating: boolean;
  onToggleFloat: () => void;
  onChange: (value: string) => void;
  readOnly?: boolean;
  currentDate?: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onGoToToday?: () => void;
  canGoNext?: boolean;
  history?: ScratchpadHistoryItem[];
  onDateSelect?: (date: string) => void;
}

export function ScratchPad({
  floating,
  content,
  isFloating,
  onToggleFloat,
  onChange,
  readOnly = false,
  currentDate,
  onPrevDay,
  onNextDay,
  onGoToToday,
  canGoNext = true,
  history = [],
  onDateSelect,
}: ScratchPadProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "scratch-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "scratch-task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "scratch-task-item",
        },
      }),
      Placeholder.configure({
        placeholder: "Jot down anything...",
      }),
      Underline,
    ],
    content: content || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "scratch-editor",
        spellcheck: "true",
      },
    },
  });

  // Sync content from parent when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Format date for display
  const formatDateLabel = (dateStr: string): string => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const date = new Date(dateStr + "T12:00:00");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const showNavigation = currentDate && onPrevDay;

  // Toolbar actions
  const toggleStrikethrough = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const insertLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", previousUrl || "https://");

    if (url === null) return;

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertTaskList = useCallback(() => {
    editor?.chain().focus().toggleTaskList().run();
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor || readOnly) return;

      // Cmd/Ctrl + Shift + X for strikethrough
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        toggleStrikethrough();
      }
      // Cmd/Ctrl + K for link
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        insertLink();
      }
      // Cmd/Ctrl + Shift + C for checkbox/task list
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        insertTaskList();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, readOnly, toggleStrikethrough, insertLink, insertTaskList]);

  // Format date for history display
  const formatHistoryDate = (dateStr: string | null): string => {
    if (!dateStr) return "Unknown date";
    const date = new Date(dateStr + "T12:00:00");
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const olderHistory = currentDate
    ? history.filter((item) => item.date && item.date < currentDate).sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    : [];
  const newerHistory = currentDate
    ? history.filter((item) => item.date && item.date > currentDate).sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    : [];

  const renderHistoryItem = (item: ScratchpadHistoryItem, index: number, isLast: boolean) => (
    <div
      key={item.date || index}
      onClick={() => item.date && onDateSelect?.(item.date)}
      style={{
        padding: "12px 24px",
        borderBottom: !isLast ? `1px dashed ${C.pencilLight}` : "none",
        cursor: onDateSelect && item.date ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onDateSelect && item.date) {
          e.currentTarget.style.background = C.tealSoft;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          fontFamily: FONTS.kalam,
          fontSize: "0.8125rem",
          color: C.teal,
          marginBottom: 8,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{formatHistoryDate(item.date)}</span>
        {onDateSelect && item.date && (
          <span style={{ fontSize: "0.6875rem", opacity: 0.7 }}>click to view</span>
        )}
      </div>
      <div
        style={{
          fontFamily: FONTS.architects,
          fontSize: "0.8125rem",
          color: C.inkSoft,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    </div>
  );

  return (
    <div
      data-name="scratchpad-container"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: floating ? "92vh" : "auto",
        maxHeight: floating ? "92vh" : "none",
        width: floating ? 850 : "auto",
        maxWidth: floating ? "95vw" : "none",
        borderRadius: 3,
        boxShadow: floating ? SHADOWS.modal : "none",
        overflow: floating ? "hidden" : "visible",
      }}
    >
      {/* Older scratchpads */}
      {floating && olderHistory.length > 0 && (
        <div
          data-name="scratchpad-older-history"
          style={{
            flex: newerHistory.length > 0 ? "0 0 auto" : 1,
            maxHeight: newerHistory.length > 0 ? 300 : "none",
            overflowY: "auto",
            background: C.paper,
            borderBottom: `2px dashed ${C.pencilLight}`,
            borderRadius: "3px 3px 0 0",
          }}
        >
          <div
            style={{
              padding: "12px 24px 8px",
              fontFamily: FONTS.caveat,
              fontSize: "1rem",
              fontWeight: 700,
              color: C.pencil,
              position: "sticky",
              top: 0,
              background: C.paper,
              zIndex: 1,
            }}
          >
            Previous Days
          </div>
          {olderHistory.map((item, index) => renderHistoryItem(item, index, index === olderHistory.length - 1))}
        </div>
      )}

      {/* Main editor area */}
      <div
        data-name="scratchpad-editor-area"
        style={{
          position: "relative",
          padding: floating ? 24 : 16,
          background: C.yellowSoft,
          minHeight: floating ? 320 : 180,
          flex: floating ? "0 0 auto" : "none",
          borderRadius: floating && (olderHistory.length > 0 || newerHistory.length > 0) ? 0 : 3,
          borderTopLeftRadius: floating && olderHistory.length === 0 ? 3 : 0,
          borderTopRightRadius: floating && olderHistory.length === 0 ? 3 : 0,
          borderBottomLeftRadius: floating && newerHistory.length === 0 ? 3 : 0,
          borderBottomRightRadius: floating && newerHistory.length === 0 ? 3 : 0,
        }}
      >
        <SketchBox stroke={C.ink} strokeWidth={1.5} rough={1} radius={3} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div
            data-name="scratchpad-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showNavigation && (
                <button
                  type="button"
                  onClick={onPrevDay}
                  title="Previous day"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.6,
                    transition: "opacity 0.15s",
                    fontFamily: FONTS.architects,
                    fontSize: floating ? "1.125rem" : "0.875rem",
                    color: C.ink,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                >

                </button>
              )}
              <div
                style={{
                  fontFamily: FONTS.caveat,
                  fontSize: floating ? "1.5rem" : "1.25rem",
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                {showNavigation && currentDate
                  ? `${formatDateLabel(currentDate)}'s scratchpad`
                  : floating
                    ? "Scratchpad"
                    : "Today's scratchpad"}
              </div>
              {showNavigation && (
                <button
                  type="button"
                  onClick={onNextDay}
                  disabled={!canGoNext}
                  title={canGoNext ? "Next day" : "Already at today"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: canGoNext ? "pointer" : "not-allowed",
                    padding: "2px 6px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: canGoNext ? 0.6 : 0.2,
                    transition: "opacity 0.15s",
                    fontFamily: FONTS.architects,
                    fontSize: floating ? "1.125rem" : "0.875rem",
                    color: C.ink,
                  }}
                  onMouseEnter={(e) => {
                    if (canGoNext) e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = canGoNext ? "0.6" : "0.2";
                  }}
                >

                </button>
              )}
              {showNavigation && canGoNext && onGoToToday && (
                <button
                  type="button"
                  onClick={onGoToToday}
                  title="Jump to today"
                  style={{
                    background: C.tealSoft,
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 8px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.85,
                    transition: "opacity 0.15s",
                    fontFamily: FONTS.kalam,
                    fontSize: floating ? "0.75rem" : "0.625rem",
                    color: C.teal,
                    marginLeft: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                >
                  Today
                </button>
              )}
            </div>

            {/* Toolbar buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {!readOnly && (
                <>
                  {/* Task list button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertTaskList();
                    }}
                    title="Insert checkbox (Cmd+Shift+C)"
                    style={{
                      background: editor?.isActive("taskList") ? C.tealSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.architects,
                        fontSize: "0.875rem",
                        color: C.ink,
                      }}
                    >

                    </span>
                  </button>

                  {/* Link button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertLink();
                    }}
                    title="Insert link (Cmd+K)"
                    style={{
                      background: editor?.isActive("link") ? C.tealSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round">
                      <path d="M6.5 9.5L9.5 6.5M7 11L5.5 12.5C4.5 13.5 3 13.5 2.5 13C2 12.5 2 11 3 10L4.5 8.5M9 5L10.5 3.5C11.5 2.5 13 2.5 13.5 3C14 3.5 14 5 13 6L11.5 7.5" />
                    </svg>
                  </button>

                  {/* Strikethrough button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleStrikethrough();
                    }}
                    title="Strikethrough (Cmd+Shift+X)"
                    style={{
                      background: editor?.isActive("strike") ? C.coralSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <span
                      style={{
                        textDecoration: "line-through",
                        fontFamily: FONTS.architects,
                        fontSize: "0.8125rem",
                        color: C.ink,
                        fontWeight: 700,
                      }}
                    >
                      S
                    </span>
                  </button>

                  {/* Bold button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor?.chain().focus().toggleBold().run();
                    }}
                    title="Bold (Cmd+B)"
                    style={{
                      background: editor?.isActive("bold") ? C.tealSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.architects,
                        fontSize: "0.8125rem",
                        color: C.ink,
                        fontWeight: 700,
                      }}
                    >
                      B
                    </span>
                  </button>

                  {/* Italic button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor?.chain().focus().toggleItalic().run();
                    }}
                    title="Italic (Cmd+I)"
                    style={{
                      background: editor?.isActive("italic") ? C.tealSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.architects,
                        fontSize: "0.8125rem",
                        color: C.ink,
                        fontStyle: "italic",
                      }}
                    >
                      I
                    </span>
                  </button>

                  {/* Bullet list button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor?.chain().focus().toggleBulletList().run();
                    }}
                    title="Bullet list"
                    style={{
                      background: editor?.isActive("bulletList") ? C.tealSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.55,
                      transition: "opacity 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round">
                      <line x1="6" y1="4" x2="14" y2="4" />
                      <line x1="6" y1="8" x2="14" y2="8" />
                      <line x1="6" y1="12" x2="14" y2="12" />
                      <circle cx="3" cy="4" r="1" fill={C.ink} />
                      <circle cx="3" cy="8" r="1" fill={C.ink} />
                      <circle cx="3" cy="12" r="1" fill={C.ink} />
                    </svg>
                  </button>
                </>
              )}

              {/* Expand/Collapse button */}
              <button
                type="button"
                onClick={onToggleFloat}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.7,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                title={isFloating ? "Collapse" : "Expand"}
              >
                {isFloating ? <IconCollapse size={16} color={C.ink} /> : <IconExpand size={16} color={C.ink} />}
              </button>
            </div>
          </div>

          {/* Hints */}
          {!readOnly && (
            <div
              style={{
                fontSize: "0.625rem",
                color: C.pencil,
                marginBottom: 10,
                fontFamily: FONTS.kalam,
              }}
            >
              auto-saves | Markdown: **bold** *italic* - list | URLs auto-link
            </div>
          )}

          {/* Tiptap Editor */}
          <EditorContent
            editor={editor}
            style={{
              width: "100%",
              minHeight: floating ? 240 : 120,
            }}
          />
        </div>
      </div>

      {/* Newer scratchpads */}
      {floating && newerHistory.length > 0 && (
        <div
          data-name="scratchpad-newer-history"
          style={{
            flex: 1,
            overflowY: "auto",
            background: C.paper,
            borderTop: `2px dashed ${C.pencilLight}`,
            borderRadius: "0 0 3px 3px",
          }}
        >
          <div
            style={{
              padding: "12px 24px 8px",
              fontFamily: FONTS.caveat,
              fontSize: "1rem",
              fontWeight: 700,
              color: C.pencil,
              position: "sticky",
              top: 0,
              background: C.paper,
              zIndex: 1,
            }}
          >
            Following Days
          </div>
          {newerHistory.map((item, index) => renderHistoryItem(item, index, index === newerHistory.length - 1))}
        </div>
      )}

      {/* Editor styles */}
      <style>{`
        .scratch-editor {
          font-family: ${FONTS.architects};
          font-size: ${floating ? "0.9375rem" : "0.8125rem"};
          color: ${C.inkSoft};
          line-height: 1.8;
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .scratch-editor p {
          margin: 0 0 0.5em 0;
        }

        .scratch-editor p:last-child {
          margin-bottom: 0;
        }

        .scratch-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${C.pencilLight};
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        .scratch-editor a,
        .scratch-link {
          color: ${C.teal};
          text-decoration: underline;
          text-decoration-style: dashed;
          cursor: pointer;
        }

        .scratch-editor a:hover,
        .scratch-link:hover {
          text-decoration-style: solid;
        }

        .scratch-task-list {
          list-style: none;
          padding-left: 0;
          margin: 0.5em 0;
        }

        .scratch-task-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0.25em 0;
        }

        .scratch-task-item > label {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .scratch-task-item > label input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid ${C.pencil};
          border-radius: 3px;
          cursor: pointer;
          position: relative;
          background: transparent;
        }

        .scratch-task-item > label input[type="checkbox"]:checked {
          background: ${C.teal};
          border-color: ${C.teal};
        }

        .scratch-task-item > label input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .scratch-task-item[data-checked="true"] > div {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .scratch-editor ul,
        .scratch-editor ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .scratch-editor li {
          margin: 0.25em 0;
        }

        .scratch-editor h1,
        .scratch-editor h2,
        .scratch-editor h3 {
          font-family: ${FONTS.caveat};
          color: ${C.ink};
          margin: 0.75em 0 0.5em 0;
          line-height: 1.3;
        }

        .scratch-editor h1 {
          font-size: 1.5em;
        }

        .scratch-editor h2 {
          font-size: 1.3em;
        }

        .scratch-editor h3 {
          font-size: 1.15em;
        }

        .scratch-editor blockquote {
          border-left: 3px solid ${C.teal};
          margin: 0.5em 0;
          padding-left: 1em;
          color: ${C.pencil};
          font-style: italic;
        }

        .scratch-editor code {
          background: ${C.paperDark};
          padding: 0.1em 0.3em;
          border-radius: 3px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 0.9em;
        }

        .scratch-editor pre {
          background: ${C.paperDark};
          padding: 0.75em 1em;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0.5em 0;
        }

        .scratch-editor pre code {
          background: none;
          padding: 0;
        }

        .scratch-editor hr {
          border: none;
          border-top: 2px dashed ${C.pencilLight};
          margin: 1em 0;
        }

        .scratch-editor strong {
          font-weight: 700;
          color: ${C.ink};
        }

        .scratch-editor em {
          font-style: italic;
        }

        .scratch-editor s {
          text-decoration: line-through;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
