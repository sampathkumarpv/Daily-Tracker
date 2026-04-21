import { useState } from 'react';
import { C, FONTS } from '../../theme';
import { IconSearch, IconBell, SketchAvatar } from '../ui/Icons';
import { SketchBox } from '../ui/SketchBox';

interface Props {
  title?: string;
  tasks: { title: string; tag: string }[];
}

export function TopBar({ title = 'My Tasks', tasks }: Props) {
  const [query, setQuery] = useState('');

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();

  const filtered = query.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.tag.toLowerCase().includes(query.toLowerCase())
      )
    : [];

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
          fontSize: 22,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: 0.5,
        }}
      >
        ✱ {title}
      </span>
      <span style={{ fontFamily: FONTS.kalam, fontSize: 11, color: C.pencil }}>
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
            background: '#fff',
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
              fontSize: 11,
              color: C.ink,
              width: 140,
            }}
          />
        </div>
        {filtered.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: `1.5px solid ${C.pencilLight}`,
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,.12)',
              zIndex: 100,
              marginTop: 4,
            }}
          >
            {filtered.slice(0, 6).map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  fontFamily: FONTS.architects,
                  fontSize: 12,
                  color: C.ink,
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.pencilLight}` : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setQuery('')}
              >
                <span style={{ color: C.pencil, marginRight: 8, fontSize: 10 }}>{t.tag}</span>
                {t.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* bell */}
      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <IconBell size={16} color={C.ink} />
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -3,
            width: 6,
            height: 6,
            borderRadius: 3,
            background: C.coral,
          }}
        />
      </div>

      <SketchAvatar letter="M" color={C.coral} size={26} />
    </header>
  );
}
