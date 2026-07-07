import { useState, useEffect, useRef, useCallback } from "react";
import { C, FONTS, SHADOWS } from "../../theme";
import { SketchBox } from "./SketchBox";
import { IconExpand, IconCollapse } from "./Icons";

export interface ScratchPadProps {
  floating?: boolean;
  content: string;
  isFloating: boolean;
  onToggleFloat: () => void;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function ScratchPad({
  floating,
  content,
  isFloating,
  onToggleFloat,
  onChange,
  readOnly = false,
}: ScratchPadProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipSync = useRef(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number } | null>(null);

  // Sync content from parent (initial API load) without clobbering user edits
  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    if (editorRef.current) editorRef.current.innerHTML = content;
  }, [content]);

  // Handle text selection to show toolbar
  const handleSelectionChange = useCallback(() => {
    if (readOnly) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setSelectionToolbar(null);
      return;
    }

    // Check if selection is within our editor
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setSelectionToolbar(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setSelectionToolbar(null);
      return;
    }

    // Get position for toolbar
    const rect = range.getBoundingClientRect();
    setSelectionToolbar({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, [readOnly]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const handleInput = () => {
    if (readOnly) return;
    skipSync.current = true;
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const applyStrikethrough = () => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand("strikeThrough", false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertCheckbox = () => {
    if (readOnly) return;
    editorRef.current?.focus();
    const checkboxHtml =
      '<span class="scratch-checkbox" data-checked="false" contenteditable="false">☐</span>&nbsp;';
    document.execCommand("insertHTML", false, checkboxHtml);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    if (readOnly) return;
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    const url = prompt('Enter URL:', selectedText.startsWith('http') ? selectedText : 'https://');
    if (url) {
      editorRef.current?.focus();
      const linkText = selectedText || url;
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="scratch-link">${linkText}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  };

  // Auto-linkify URLs on paste or when typing space after URL
  const autoLinkify = () => {
    if (readOnly || !editorRef.current) return;
    const urlRegex = /(?<!\S)(https?:\/\/[^\s<]+)(?=\s|$|<)/g;
    // Don't linkify URLs already inside <a> tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current.innerHTML;
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    const nodesToReplace: { node: Text; newHtml: string }[] = [];

    let node;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      // Skip if parent is already an anchor
      if (textNode.parentElement?.tagName === 'A') continue;
      const text = textNode.textContent || '';
      if (urlRegex.test(text)) {
        urlRegex.lastIndex = 0;
        const newHtml = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="scratch-link">$1</a>');
        if (newHtml !== text) {
          nodesToReplace.push({ node: textNode, newHtml });
        }
      }
    }

    if (nodesToReplace.length > 0) {
      nodesToReplace.forEach(({ node, newHtml }) => {
        const span = document.createElement('span');
        span.innerHTML = newHtml;
        node.replaceWith(...Array.from(span.childNodes));
      });

      // Save cursor position and restore
      const sel = window.getSelection();
      const range = sel?.getRangeAt(0);
      editorRef.current.innerHTML = tempDiv.innerHTML;
      if (range && sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          // Cursor restoration failed, that's ok
        }
      }
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Handle link clicks - open in new tab
    if (target.tagName === 'A' || target.closest('a')) {
      const link = target.tagName === 'A' ? target : target.closest('a');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    if (readOnly) return;

    if (target.classList.contains("scratch-checkbox")) {
      e.preventDefault();
      const isChecked = target.dataset.checked === "true";
      const parent = target.parentElement;

      if (isChecked) {
        // Uncheck: remove strikethrough from sibling text
        target.dataset.checked = "false";
        target.textContent = "☐";
        target.style.color = "";
        // Remove strikethrough from adjacent text
        if (parent) {
          const walker = document.createTreeWalker(
            parent,
            NodeFilter.SHOW_TEXT,
            null,
          );
          let node;
          while ((node = walker.nextNode())) {
            const textNode = node as Text;
            if (
              textNode.parentElement?.tagName === "STRIKE" ||
              textNode.parentElement?.tagName === "S"
            ) {
              const strike = textNode.parentElement;
              strike.replaceWith(textNode);
            }
          }
        }
      } else {
        // Check: apply strikethrough to text after checkbox on same line
        target.dataset.checked = "true";
        target.textContent = "☑";
        target.style.color = C.teal;
        // Find text content after checkbox and wrap in strikethrough
        let nextSibling = target.nextSibling;
        while (nextSibling) {
          if (
            nextSibling.nodeType === Node.TEXT_NODE &&
            nextSibling.textContent?.trim()
          ) {
            const strike = document.createElement("s");
            strike.textContent = nextSibling.textContent;
            nextSibling.replaceWith(strike);
            break;
          } else if (nextSibling.nodeType === Node.ELEMENT_NODE) {
            const el = nextSibling as HTMLElement;
            if (
              el.tagName !== "BR" &&
              !el.classList.contains("scratch-checkbox")
            ) {
              const strike = document.createElement("s");
              strike.innerHTML = el.outerHTML;
              el.replaceWith(strike);
              break;
            }
          }
          nextSibling = nextSibling.nextSibling;
        }
      }
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "x") {
      e.preventDefault();
      applyStrikethrough();
    }
    // Ctrl/Cmd + Shift + C to insert checkbox
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      insertCheckbox();
    }
    // Ctrl/Cmd + K to insert link
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertLink();
    }
    // Auto-linkify on space or enter after URL
    if (e.key === " " || e.key === "Enter") {
      setTimeout(autoLinkify, 0);
    }
  };

  const handlePaste = () => {
    if (readOnly) return;
    // Auto-linkify after paste
    setTimeout(autoLinkify, 0);
  };

  return (
    <div
      style={{
        position: "relative",
        padding: floating ? 24 : 16,
        background: C.yellowSoft,
        minHeight: floating ? 320 : 180,
        borderRadius: 3,
        width: floating ? 500 : "auto",
        maxWidth: floating ? "90vw" : "none",
        boxShadow: floating ? SHADOWS.modal : "none",
      }}
    >
      <SketchBox stroke={C.ink} strokeWidth={1.5} rough={1} radius={3} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.caveat,
              fontSize: floating ? 24 : 20,
              fontWeight: 700,
              color: C.ink,
            }}
          >
            {floating ? "Scratchpad" : "Today's scratchpad"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Strikethrough button — uses onMouseDown to preserve selection */}
            {!readOnly && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyStrikethrough();
                }}
                title="Strikethrough selected text (Cmd+Shift+X / Ctrl+Shift+X)"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.55,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
              >
                <span
                  style={{
                    textDecoration: "line-through",
                    fontFamily: FONTS.architects,
                    fontSize: 13,
                    color: C.ink,
                    fontWeight: 700,
                  }}
                >
                  S
                </span>
              </button>
            )}
            <button
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
              {isFloating ? (
                <IconCollapse size={16} color={C.ink} />
              ) : (
                <IconExpand size={16} color={C.ink} />
              )}
            </button>
          </div>
        </div>
        {!readOnly && (
          <div
            style={{
              fontSize: 10,
              color: C.pencil,
              marginBottom: 10,
              fontFamily: FONTS.kalam,
            }}
          >
            auto-saves · Cmd+Shift+C checkbox · Cmd+K link · URLs auto-link
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onPaste={handlePaste}
          data-placeholder="Jot down anything…"
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            fontFamily: FONTS.architects,
            fontSize: floating ? 15 : 13,
            color: C.inkSoft,
            lineHeight: 1.8,
            outline: "none",
            minHeight: floating ? 240 : 120,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            cursor: readOnly ? "default" : "text",
          }}
        />
      </div>

      {/* Floating selection toolbar */}
      {!readOnly && selectionToolbar && (
        <div
          style={{
            position: "fixed",
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: "translate(-50%, -100%)",
            background: C.paper,
            border: `1px solid ${C.pencil}`,
            borderRadius: 4,
            padding: 2,
            display: "flex",
            gap: 1,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            zIndex: 1000,
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              insertLink();
              setSelectionToolbar(null);
            }}
            title="Link (Cmd+K)"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 5px",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              color: C.teal,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.tealSoft}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6.5 9.5L9.5 6.5M7 11L5.5 12.5C4.5 13.5 3 13.5 2.5 13C2 12.5 2 11 3 10L4.5 8.5M9 5L10.5 3.5C11.5 2.5 13 2.5 13.5 3C14 3.5 14 5 13 6L11.5 7.5" />
            </svg>
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              applyStrikethrough();
              setSelectionToolbar(null);
            }}
            title="Strikethrough (Cmd+Shift+X)"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 5px",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              color: C.pencil,
              fontFamily: FONTS.architects,
              fontSize: 10,
              fontWeight: 600,
              textDecoration: "line-through",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.coralSoft}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            S
          </button>
        </div>
      )}
    </div>
  );
}
