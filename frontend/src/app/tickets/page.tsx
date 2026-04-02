'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Ticket, getTickets } from '@/lib/api';
import QRTicket from '@/components/QRTicket';

export default function TicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'USED'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await getTickets();
      setTickets(res.data || []);
    } catch {
      // Not available
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const formatDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Activo', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    USED: { label: 'Usado', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10' },
    CANCELLED: { label: 'Cancelado', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-48" style={{ background: 'var(--card)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold" style={{ color: 'var(--fg)' }}>Mis Tickets</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { key: 'all', label: 'Todos' },
          { key: 'ACTIVE', label: 'Activos' },
          { key: 'USED', label: 'Usados' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-[#e63946] text-white'
                : ''
            }`}
            style={filter !== f.key ? { background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <QRTicket ticket={selectedTicket} />
          </div>
        </div>
      )}

      {/* Tickets grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--card)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--fg)' }}>No tienes tickets</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Compra entradas para eventos y apareceran aqui</p>
          <Link
            href="/search"
            className="inline-block bg-[#e63946] hover:bg-[#c62d3a] px-6 py-2.5 rounded-lg text-sm font-medium text-white transition"
          >
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((ticket) => {
            const st = statusConfig[ticket.status] || statusConfig.ACTIVE;
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="rounded-xl overflow-hidden text-left hover:opacity-90 transition-all group"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {/* Event image */}
                {ticket.event?.image && (
                  <div className="h-32 overflow-hidden">
                    <img src={ticket.event.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}

                {/* Mini QR preview */}
                <div className="p-4 flex justify-center">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-0 w-12 h-12">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`${ticket.qrCode.charCodeAt(i % ticket.qrCode.length) % 2 === 0 ? 'bg-black' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-2">
                  <h3 className="text-sm font-semibold group-hover:text-[#e63946] transition line-clamp-2" style={{ color: 'var(--fg)' }}>
                    {ticket.event?.title || 'Evento'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {ticket.event?.date ? formatDate(ticket.event.date) : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      {ticket.qrCode}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
