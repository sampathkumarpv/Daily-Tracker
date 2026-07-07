import { useEffect, useState, useCallback } from 'react';
import { C, FONTS, SHADOWS } from '../../theme';
import { IconBell, IconX } from './Icons';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration ?? 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const colors = {
    info: C.pencil,
    success: C.teal,
    warning: C.yellow,
    reminder: C.coral,
  };

  const icons = {
    info: null,
    success: '✓',
    warning: '⚠',
    reminder: <IconBell size={16} color={C.coral} />,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        background: C.paper,
        border: `2px solid ${colors[toast.type]}`,
        borderRadius: 8,
        boxShadow: SHADOWS.toast,
        maxWidth: 340,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      {icons[toast.type] && (
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          {typeof icons[toast.type] === 'string' ? (
            <span style={{ fontSize: 18, color: colors[toast.type] }}>{icons[toast.type]}</span>
          ) : (
            icons[toast.type]
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.head,
            fontSize: 15,
            fontWeight: 700,
            color: C.ink,
            marginBottom: toast.message ? 4 : 0,
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: C.inkSoft,
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <IconX size={14} color={C.pencil} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showReminder = useCallback((label: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, {
      id,
      type: 'reminder',
      title: 'Reminder',
      message: label,
      duration: 8000,
    }]);
  }, []);

  return { toasts, addToast, dismissToast, showReminder };
}
