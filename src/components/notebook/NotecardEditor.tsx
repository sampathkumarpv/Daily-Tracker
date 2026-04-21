import { useState } from 'react';
import { C, FONTS } from '../../theme';
import { SketchBox } from '../ui/SketchBox';
import { SketchCheck } from '../ui/Icons';
import type { Notecard } from '../../types';

interface Props {
  notecard: Notecard;
  allNotecards: Notecard[];
  onBack: () => void;
  onUpdate: (patch: Partial<Notecard>) => void;
  onToggleCheckItem: (itemId: string) => void;
}

const TOOLBAR_ITEMS = [
  { label: 'B', title: 'Bold' },
  { label: 'I', title: 'Italic' },
  { label: 'U', title: 'Underline' },
  { label: 'H₁', title: 'Heading' },
  { label: '• list', title: 'Bullet list' },
  { label: '☑ todo', title: 'Checkbox', active: true },
  { label: '{ } code', title: 'Code block', active: true },
  { label: '📅 date', title: 'Insert date' },
  { label: '🔔 remind', title: 'Reminder' },
  { label: '📎 file', title: 'Attach file' },
  { label: '🖼 img', title: 'Insert image' },
];

export function NotecardEditor({
  notecard,
  allNotecards,
  onUpdate,
  onToggleCheckItem,
}: Props) {
  const [title, setTitle] = useState(notecard.title);
  const [content, setContent] = useState(notecard.content);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Which other notecards from the same notebook
  const siblings = allNotecards.filter((nc) => nc.notebookId === notecard.notebookId);

  return (
    <div style={{ flex: 1, display: 'flex', gap: 18, padding: '18px 28px', overflow: 'hidden', minHeight: 0 }}>
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
              background: '#f2d4c9',
              border: `1.4px solid ${C.ink}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: FONTS.caveat, fontSize: 18, fontWeight: 700, color: C.ink }}>
            {notecard.notebookName}
          </span>
        </div>

        {siblings.map((nc) => (
          <div
            key={nc.id}
            style={{
              position: 'relative',
              padding: '8px 10px',
              background: nc.id === notecard.id ? C.yellowSoft : '#fff',
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
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingBottom: 8,
            borderBottom: `1.5px dashed ${C.pencilLight}`,
            flexShrink: 0,
          }}
        >
          {TOOLBAR_ITEMS.map((item, i) => (
            <button
              key={i}
              title={item.title}
              onClick={() => setActiveItem(activeItem === item.title ? null : item.title)}
              style={{
                padding: '3px 8px',
                fontFamily: FONTS.caveat,
                fontSize: 13,
                color: activeItem === item.title ? C.ink : C.inkSoft,
                border: activeItem === item.title ? `1.3px solid ${C.ink}` : 'none',
                background: activeItem === item.title ? C.yellowSoft : 'transparent',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: C.pencil, fontFamily: FONTS.kalam }}>
            attached to 1 task
          </span>
        </div>

        {/* title */}
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); onUpdate({ title: e.target.value }); }}
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

        <div style={{ fontSize: 11, color: C.pencil, fontFamily: FONTS.kalam, flexShrink: 0 }}>
          {notecard.date} · {notecard.notebookName}
        </div>

        {/* content area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* main text */}
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); onUpdate({ content: e.target.value }); }}
            placeholder="Start writing…"
            style={{
              fontFamily: FONTS.architects,
              fontSize: 13,
              color: C.ink,
              lineHeight: 1.6,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              resize: 'none',
              minHeight: 80,
              width: '100%',
            }}
          />

          {/* checklist */}
          {notecard.checkItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: FONTS.caveat, fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>
                Checklist
              </div>
              {notecard.checkItems.map((ci) => (
                <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SketchCheck checked={ci.done} size={14} onChange={() => onToggleCheckItem(ci.id)} />
                  <span
                    style={{
                      fontFamily: FONTS.architects,
                      fontSize: 12,
                      color: ci.done ? C.pencil : C.ink,
                      textDecoration: ci.done ? 'line-through' : 'none',
                    }}
                  >
                    {ci.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* code block */}
          {notecard.codeBlock && (
            <div style={{ position: 'relative', padding: 12, background: C.paperDark, borderRadius: 3 }}>
              <SketchBox stroke={C.ink} strokeWidth={1.3} rough={0.7} radius={2} />
              <pre
                style={{
                  position: 'relative',
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: C.inkSoft,
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {notecard.codeBlock}
              </pre>
            </div>
          )}

          {/* image placeholder */}
          {notecard.attachments.length > 0 && (
            <div style={{ position: 'relative', height: 90, background: C.paperDark, borderRadius: 3 }}>
              <SketchBox stroke={C.pencil} strokeWidth={1.3} rough={0.8} radius={2} />
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <line x1="2" y1="2" x2="100%" y2="88" stroke={C.pencilLight} strokeWidth="1" strokeDasharray="2,3" />
                <line x1="100%" y1="2" x2="2" y2="88" stroke={C.pencilLight} strokeWidth="1" strokeDasharray="2,3" />
              </svg>
              <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 10, color: C.pencil, fontFamily: FONTS.kalam }}>
                📎 {notecard.attachments[0]}
              </span>
            </div>
          )}

          {/* reminder */}
          {notecard.reminder && (
            <div style={{ position: 'relative', padding: '8px 12px', background: C.coralSoft, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SketchBox stroke={C.coral} strokeWidth={1.4} rough={0.9} radius={3} />
              <span style={{ fontSize: 14 }}>🔔</span>
              <span style={{ position: 'relative', fontSize: 12, color: C.inkSoft, fontFamily: FONTS.architects }}>
                {notecard.reminder}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
