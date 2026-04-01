import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@shared/store/useGameStore';
import type { NotificationData } from '@shared/types';

/* ============================================================
   Notifications — Toast notification stack
   Top-right corner, newest on top. Auto-dismiss after duration.
   ============================================================ */

const DEFAULT_DURATION = 5000;

const TYPE_ICONS: Record<NotificationData['type'], string> = {
  info: '\u2139',       // i
  quest: '\u2694',      // crossed swords
  achievement: '\u2605', // star
  warning: '\u26A0',    // warning triangle
  guide: '\u2192',      // right arrow
};

const TYPE_CLASS: Record<NotificationData['type'], string> = {
  info: 'notification-info',
  quest: 'notification-quest',
  achievement: 'notification-achievement',
  warning: 'notification-warning',
  guide: 'notification-guide',
};

export const Notifications: React.FC = () => {
  const notifications = useGameStore((s) => s.notifications);
  const dismissNotification = useGameStore((s) => s.dismissNotification);

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 320,
        zIndex: 180,
        pointerEvents: 'auto',
      }}
    >
      {notifications.map((n) => (
        <NotificationToast
          key={n.id}
          notification={n}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = notification.duration || DEFAULT_DURATION;
    timerRef.current = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification.id, notification.duration, onDismiss]);

  const icon = TYPE_ICONS[notification.type] ?? TYPE_ICONS.info;
  const typeClass = TYPE_CLASS[notification.type] ?? TYPE_CLASS.info;

  return (
    <div
      className={`panel slide-in-right ${typeClass}`}
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 14px',
        fontSize: 12,
        position: 'relative',
        minWidth: 220,
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: 18,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 1,
          opacity: 0.9,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 'bold',
            color: '#E8D5B7',
            fontSize: 12,
            marginBottom: 2,
            lineHeight: 1.3,
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            color: '#D4C4A8',
            fontSize: 11,
            lineHeight: 1.4,
            opacity: 0.85,
          }}
        >
          {notification.message}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          background: 'none',
          border: 'none',
          color: '#6D6359',
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
          padding: '2px 4px',
          fontFamily: "'Courier New', Courier, monospace",
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#E8D5B7';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#6D6359';
        }}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
};
