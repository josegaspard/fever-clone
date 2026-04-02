'use client';

import { useState, useRef } from 'react';

interface TicketEvent {
  id: string;
  title: string;
  slug: string;
  image?: string;
  date: string;
  time?: string;
}

interface TicketAttendee {
  id: string;
  name: string;
  email: string;
}

interface ScannedTicket {
  id: string;
  userId: string;
  eventId: string;
  qrCode: string;
  status: string;
  scannedAt?: string;
  createdAt: string;
  event: TicketEvent | null;
  attendee: TicketAttendee | null;
}

interface ScanResult {
  ticket: ScannedTicket;
  success: boolean;
  message: string;
  timestamp: string;
}

export default function BusinessScannerPage() {
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ScanResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    const code = qrCode.trim();
    if (!code) return;

    setScanning(true);
    setError('');
    setLastResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch('/api/business/scan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ qrCode: code }),
      });

      const data = await res.json();

      if (res.ok) {
        const result: ScanResult = {
          ticket: data.ticket,
          success: true,
          message: data.message || 'Ticket escaneado correctamente',
          timestamp: new Date().toISOString(),
        };
        setLastResult(result);
        setHistory((prev) => [result, ...prev].slice(0, 10));
        setQrCode('');
      } else if (res.status === 409) {
        // Already used
        const result: ScanResult = {
          ticket: data.ticket,
          success: false,
          message: data.message || 'Este ticket ya fue utilizado',
          timestamp: new Date().toISOString(),
        };
        setLastResult(result);
        setHistory((prev) => [result, ...prev].slice(0, 10));
        setQrCode('');
      } else {
        setError(data.message || 'Error al escanear el ticket');
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan();
    }
  };

  const formatDate = (d: string) => {
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

  const formatTime = (d: string) => {
    try {
      return new Date(d).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
          Scanner de Tickets
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ingresa el codigo QR del ticket para validarlo
        </p>
      </div>

      {/* Scanner input */}
      <div
        className="rounded-2xl border p-6 lg:p-8 mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ingresa o escanea el codigo QR..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all duration-200"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--fg)',
              }}
              autoFocus
              disabled={scanning}
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !qrCode.trim()}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            style={{
              background: scanning ? '#b91c2c' : '#e63946',
            }}
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Escanear
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}
      </div>

      {/* Last scan result */}
      {lastResult && (
        <div
          className="rounded-2xl border p-6 lg:p-8 mb-6 transition-all duration-300"
          style={{
            background: 'var(--card)',
            borderColor: lastResult.success ? '#10b981' : '#ef4444',
            borderWidth: '2px',
          }}
        >
          {/* Status indicator */}
          <div className="flex items-center gap-4 mb-6">
            {lastResult.success ? (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: lastResult.success ? '#10b981' : '#ef4444' }}
              >
                {lastResult.success ? 'Ticket Valido' : 'Ticket No Valido'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {lastResult.message}
              </p>
            </div>
          </div>

          {/* Ticket details */}
          {lastResult.ticket && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lastResult.ticket.event && (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--bg)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Evento
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
                    {lastResult.ticket.event.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(lastResult.ticket.event.date)}
                    {lastResult.ticket.event.time ? ` · ${lastResult.ticket.event.time}` : ''}
                  </p>
                </div>
              )}
              {lastResult.ticket.attendee && (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--bg)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Asistente
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
                    {lastResult.ticket.attendee.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {lastResult.ticket.attendee.email}
                  </p>
                </div>
              )}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'var(--bg)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Estado
                </p>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: lastResult.ticket.status === 'USED'
                      ? lastResult.success
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                    color: lastResult.ticket.status === 'USED'
                      ? lastResult.success
                        ? '#10b981'
                        : '#ef4444'
                      : '#f59e0b',
                  }}
                >
                  {lastResult.ticket.status === 'USED' ? 'Utilizado' : lastResult.ticket.status === 'ACTIVE' ? 'Activo' : 'Cancelado'}
                </span>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: 'var(--bg)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Ticket ID
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--fg)' }}>
                  {lastResult.ticket.id}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent scans history */}
      {history.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>
              Escaneos recientes
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Ultimos {history.length} escaneos de esta sesion
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {history.map((item, i) => (
              <div
                key={`${item.ticket.id}-${item.timestamp}-${i}`}
                className="px-5 py-3.5 flex items-center gap-4"
              >
                {/* Status icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: item.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {item.success ? (
                    <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
                      {item.ticket.attendee?.name || 'Asistente desconocido'}
                    </p>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                      style={{
                        background: item.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: item.success ? '#10b981' : '#ef4444',
                      }}
                    >
                      {item.success ? 'Valido' : 'Rechazado'}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {item.ticket.event?.title || 'Evento'} · {formatTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
