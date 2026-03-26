'use client';

import { useState, useEffect } from 'react';
import { PlanInvitation, inviteToPlan, getPlanInvitations } from '@/lib/api';
import { useToast } from './Toast';

interface InviteFriendsProps {
  planId: string;
}

export default function InviteFriends({ planId }: InviteFriendsProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<PlanInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [planId]);

  async function loadInvitations() {
    setLoading(true);
    try {
      const res = await getPlanInvitations(planId);
      setInvitations(res.data);
    } catch {
      // Not available
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const inv = await inviteToPlan(planId, email.trim());
      setInvitations((prev) => [...prev, inv]);
      setEmail('');
      showToast('Invitacion enviada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al invitar', 'error');
    } finally {
      setSending(false);
    }
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ACCEPTED: { label: 'Aceptado', color: 'text-green-400', bg: 'bg-green-400/10' },
    DECLINED: { label: 'Rechazado', color: 'text-red-400', bg: 'bg-red-400/10' },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Invitar amigos
      </h3>

      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
        />
        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="bg-[#e63946] hover:bg-[#c62d3a] px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 shrink-0"
        >
          {sending ? '...' : 'Invitar'}
        </button>
      </form>

      {/* Invitations list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-[#2a2a2a] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : invitations.length > 0 ? (
        <ul className="space-y-2">
          {invitations.map((inv) => {
            const status = statusConfig[inv.status] || statusConfig.PENDING;
            return (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                    {inv.inviteeEmail.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 truncate">
                    {inv.inviteeEmail}
                  </span>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color} ${status.bg} shrink-0`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">
          Aun no has invitado a nadie
        </p>
      )}
    </div>
  );
}
