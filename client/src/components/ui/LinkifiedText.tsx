import { C } from '../../theme';

interface Props {
  text: string;
  style?: React.CSSProperties;
}

// Regex to match URLs (http, https, and www prefixes)
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

export function LinkifiedText({ text, style }: Props) {
  const parts = text.split(URL_REGEX).filter(Boolean);

  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset lastIndex since we're using global regex
          URL_REGEX.lastIndex = 0;
          const href = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: C.coral,
                textDecoration: 'underline',
                textDecorationStyle: 'wavy',
                textDecorationThickness: '1px',
                textUnderlineOffset: '2px',
                cursor: 'pointer',
                wordBreak: 'break-all',
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
