import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  appName?: string;
  messages?: string[];
  error?: string | null;
  onRetry?: () => void;
}

const DEFAULT_MESSAGES = [
  'Sharpening pencils…',
  'Sorting your sticky notes…',
  "Gathering today's tasks…",
  'Straightening the columns…',
  'Filing the notecards…',
  'Almost on the same page…',
];

export function LoadingScreen({
  appName = 'TaskFlow',
  messages = DEFAULT_MESSAGES,
  error = null,
  onRetry,
}: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Cycle through messages (only when not in error state)
  useEffect(() => {
    if (prefersReducedMotion || error) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      setFadeKey((prev) => prev + 1);
    }, 1800);

    return () => clearInterval(interval);
  }, [messages.length, prefersReducedMotion, error]);

  return (
    <div data-component="loading-screen" style={styles.container}>
      <style>{cssStyles}</style>

      {/* Triangle Spinner - always animates */}
      <div
        className={prefersReducedMotion ? 'loader loader-paused' : 'loader'}
        style={{ marginBottom: '2rem' }}
      />

      {/* Wordmark: checkbox + app name */}
      <div style={styles.wordmark}>
        {/* Hand-drawn checkbox with coral checkmark */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          style={{ marginRight: '0.625rem' }}
        >
          {/* Rounded square border */}
          <rect
            x="2"
            y="2"
            width="22"
            height="22"
            rx="4"
            stroke="var(--color-ink)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Coral checkmark */}
          <path
            d="M7 13.5 L11 17.5 L19 9"
            stroke="var(--color-coral)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={styles.appName}>{appName}</span>
      </div>

      {/* Error state or rotating status message */}
      {error ? (
        <div style={styles.errorContainer}>
          <div style={styles.errorTitle}>Can't reach the server</div>
          <div style={styles.errorMessage}>{error}</div>
          {onRetry && (
            <button onClick={onRetry} style={styles.retryButton}>
              Try again
            </button>
          )}
        </div>
      ) : (
        <div
          key={fadeKey}
          className={prefersReducedMotion ? '' : 'status-fade'}
          style={styles.statusText}
        >
          {messages[messageIndex]}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-paper)',
    zIndex: 9999,
  },
  wordmark: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  appName: {
    fontFamily: 'var(--font-head)',
    fontSize: '2.25rem',
    fontWeight: 700,
    color: 'var(--color-ink)',
    letterSpacing: '-0.5px',
  },
  statusText: {
    fontFamily: 'var(--font-ui)',
    fontSize: '1rem',
    color: 'var(--color-pencil)',
    minHeight: '1.5em',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '20rem',
  },
  errorTitle: {
    fontFamily: 'var(--font-head)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--color-ink)',
    marginBottom: '0.5rem',
  },
  errorMessage: {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.9rem',
    color: 'var(--color-pencil)',
    marginBottom: '1.25rem',
    lineHeight: 1.5,
  },
  retryButton: {
    padding: '0.625rem 1.75rem',
    background: 'var(--color-coral)',
    color: 'var(--color-paper)',
    border: 'none',
    borderRadius: '0.375rem',
    fontFamily: 'var(--font-ui)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
};

// Use theme CSS variables (--color-*, --font-*)
const cssStyles = `
  .loader {
    width: 38px;
    aspect-ratio: 0.577;
    color: var(--color-ink);
    display: grid;
    background:
      linear-gradient(currentColor 0 0) top    /100% 2px,
      linear-gradient(currentColor 0 0) bottom /100% 2px,
      linear-gradient(to bottom right, #0000 calc(50% - 2px),currentColor calc(50% - 1.4px),#0000 50%) top/100% calc(100% + 2px),
      linear-gradient(to bottom left,  #0000 calc(50% - 2px),currentColor calc(50% - 1.4px),#0000 50%) top/100% calc(100% + 2px);
    background-repeat: no-repeat;
    animation: l17 4s infinite linear;
  }

  .loader::before,
  .loader::after {
    content: "";
    grid-area: 1/1;
    background: inherit;
    border: inherit;
    animation: inherit;
  }

  .loader::after {
    animation-duration: 2s;
  }

  .loader-paused,
  .loader-paused::before,
  .loader-paused::after {
    animation-play-state: paused;
  }

  @keyframes l17 {
    100% { transform: rotate(1turn); }
  }

  .status-fade {
    animation: fadeInUp 0.5s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loader,
    .loader::before,
    .loader::after {
      animation: none;
    }
    .status-fade {
      animation: none;
    }
  }

  [data-component="loading-screen"] button:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-coral) 30%, transparent);
  }

  [data-component="loading-screen"] button:active {
    transform: scale(0.98);
  }
`;
