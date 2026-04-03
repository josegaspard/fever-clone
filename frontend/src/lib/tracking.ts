'use client';

// Lightweight behavioral tracking
// Tracks: clicks, dwell time, shares, add-to-plan

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === 'undefined') return '';
  sessionId = sessionStorage.getItem('ctx-session') || `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('ctx-session', sessionId);
  return sessionId;
}

export function trackEvent(actionType: string, eventId?: string, extra?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  const body: Record<string, unknown> = {
    actionType,
    sessionId: getSessionId(),
  };
  if (eventId) body.eventId = eventId;
  if (extra) body.metadata = extra;

  // Fire and forget — don't block UI
  fetch('/api/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

// Track dwell time on event pages
let dwellTimer: ReturnType<typeof setTimeout> | null = null;
let dwellStart: number = 0;

export function startDwellTracking(eventId: string) {
  dwellStart = Date.now();
  // Track if user stays > 15 seconds
  dwellTimer = setTimeout(() => {
    const seconds = Math.round((Date.now() - dwellStart) / 1000);
    trackEvent('dwell', eventId, { durationSeconds: seconds });
  }, 15000);
}

export function stopDwellTracking(eventId: string) {
  if (dwellTimer) {
    clearTimeout(dwellTimer);
    dwellTimer = null;
  }
  const seconds = Math.round((Date.now() - dwellStart) / 1000);
  if (seconds >= 5) {
    trackEvent('dwell', eventId, { durationSeconds: seconds });
  }
}

// Track search queries
export function trackSearch(query: string, resultsCount: number) {
  trackEvent('search', undefined, { query, resultsCount });
}

// Track click on event card
export function trackClick(eventId: string, source?: string) {
  trackEvent('click', eventId, { source });
}

// Track share
export function trackShare(eventId: string, platform: string) {
  trackEvent('share', eventId, { platform });
}
