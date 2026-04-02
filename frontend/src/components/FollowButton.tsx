'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { followVenue } from '@/lib/api';

interface FollowButtonProps {
  venueSlug: string;
  venueName: string;
  initialFollowing: boolean;
  initialCount: number;
}

export default function FollowButton({
  venueSlug,
  venueName,
  initialFollowing,
  initialCount,
}: FollowButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showNotifToggle, setShowNotifToggle] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleFollow = useCallback(async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Optimistic update
    const wasFollowing = following;
    const prevCount = count;
    setFollowing(!wasFollowing);
    setCount(wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLoading(true);

    try {
      const result = await followVenue(venueSlug);
      setFollowing(result.following);
      setCount(result.followerCount);
      if (!result.following) {
        setShowNotifToggle(false);
      }
    } catch {
      // Revert on error
      setFollowing(wasFollowing);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }, [user, following, count, venueSlug, router]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFollow}
        disabled={loading}
        aria-label={following ? `Dejar de seguir a ${venueName}` : `Seguir a ${venueName}`}
        className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer"
        style={
          following
            ? {
                background: 'transparent',
                border: '2px solid var(--border)',
                color: 'var(--fg)',
              }
            : {
                background: '#e63946',
                border: '2px solid #e63946',
                color: '#ffffff',
              }
        }
        onMouseEnter={(e) => {
          if (following) {
            e.currentTarget.style.borderColor = '#e63946';
            e.currentTarget.style.color = '#e63946';
          } else {
            e.currentTarget.style.background = '#d62b39';
            e.currentTarget.style.borderColor = '#d62b39';
          }
        }}
        onMouseLeave={(e) => {
          if (following) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--fg)';
          } else {
            e.currentTarget.style.background = '#e63946';
            e.currentTarget.style.borderColor = '#e63946';
          }
        }}
      >
        {following ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Siguiendo
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Seguir
          </>
        )}
      </button>

      {/* Notification bell toggle - only visible when following */}
      {following && (
        <button
          onClick={() => {
            setShowNotifToggle(!showNotifToggle);
            setNotifications(!notifications);
          }}
          aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: notifications ? 'rgba(230, 57, 70, 0.1)' : 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          {notifications ? (
            <svg className="w-4.5 h-4.5" fill="#e63946" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" fill="none" stroke="var(--muted)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
        </button>
      )}

      {/* Follower count */}
      <span
        className="text-sm font-medium tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatCount(count)}
      </span>
    </div>
  );
}
