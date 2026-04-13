'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';

const HINT_DISMISSED_KEY = 'gg-notif-hint-dismissed';

export function NotificationToggle() {
  const { getToken } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const cooldownRef = useRef(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(HINT_DISMISSED_KEY);
    if (!dismissed) setShowHint(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/protected/notification-preference`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.email_notifications);
          if (data.email_notifications) dismissHint();
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
  };

  const toggle = async () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 2000);

    const newValue = !enabled;
    setEnabled(newValue);
    if (newValue) dismissHint();
    try {
      const token = await getToken();
      await fetch(`${API_URL}/protected/notification-preference`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_notifications: newValue }),
      });
    } catch {
      setEnabled(!newValue);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-4">
      {showHint && (
        <div
          className="flex items-center justify-between px-3 py-2 mb-2"
          style={{
            backgroundColor: 'var(--color-accent-muted)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span className="text-base" style={{ color: 'var(--text-primary)' }}>
            ↓ Turn on email reminders so you never miss a prediction deadline
          </span>
          <button
            onClick={dismissHint}
            className="text-base ml-2 shrink-0"
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label="Dismiss hint"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          role="switch"
          aria-checked={enabled}
          aria-label="Email reminders"
          className="relative shrink-0"
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '10px',
            backgroundColor: enabled ? 'var(--color-success)' : 'var(--bg-elevated)',
            border: `1px solid ${enabled ? 'var(--color-success)' : 'var(--text-muted)'}`,
            transition: 'background-color 0.2s, border-color 0.2s',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '18px' : '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </button>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Email reminders
        </span>
      </div>
    </div>
  );
}
