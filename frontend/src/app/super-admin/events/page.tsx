'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getAllEventsAdmin, updateEvent, Event, PaginatedResponse } from '@/lib/api';

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function Skeleton({ width, height, radius = 8 }: { width: string | number; height: string | number; radius?: number }) {
  return (
    <div className="shimmer" style={{ width, height, borderRadius: radius, minWidth: typeof width === 'number' ? width : undefined }} />
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    PUBLISHED: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
    DRAFT: { bg: 'rgba(234,179,8,0.12)', fg: '#eab308' },
    ARCHIVED: { bg: 'rgba(128,128,128,0.12)', fg: '#888' },
  };
  const c = colors[status.toUpperCase()] || { bg: 'rgba(128,128,128,0.12)', fg: '#888' };
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg, letterSpacing: 0.3,
    }}>
      {status}
    </span>
  );
}

/* ─── Pagination ───────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--card)', color: page <= 1 ? 'var(--text-tertiary)' : 'var(--fg)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
        }}
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-secondary)' }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: p === page ? '1px solid #e63946' : '1px solid var(--border)',
              background: p === page ? 'rgba(230,57,70,0.12)' : 'var(--card)',
              color: p === page ? '#e63946' : 'var(--fg)',
              cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 500,
            }}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--card)', color: page >= totalPages ? 'var(--text-tertiary)' : 'var(--fg)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
        }}
      >
        Siguiente
      </button>
    </div>
  );
}

/* ─── Tabs ─────────────────────────────────────────────────────────────── */
const TABS = [
  { label: 'Todos', value: '' },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Archivados', value: 'ARCHIVED' },
];

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function SuperAdminEvents() {
  const [data, setData] = useState<PaginatedResponse<Event> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllEventsAdmin({
        page,
        limit: 15,
        q: searchDebounce || undefined,
        status: statusFilter || undefined,
      });
      setData(result);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [searchDebounce, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map((e) => e.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        updateEvent(id, { status: newStatus })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      loadEvents();
    } catch {
      // handle error
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateEvent(eventId, { status: newStatus });
      loadEvents();
    } catch {
      // handle error
    }
  };

  const allSelected = data ? data.data.length > 0 && selectedIds.size === data.data.length : false;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', letterSpacing: -0.5, marginBottom: 4 }}>
          Eventos
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Gestiona todos los eventos de la plataforma
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--card)', borderRadius: 12, padding: 4,
        border: '1px solid var(--border)', width: 'fit-content',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: statusFilter === tab.value ? 'rgba(230,57,70,0.12)' : 'transparent',
              color: statusFilter === tab.value ? '#e63946' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: statusFilter === tab.value ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Bulk Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por titulo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-theme"
            style={{
              width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'rgba(230,57,70,0.08)', borderRadius: 10, padding: '6px 14px',
            border: '1px solid rgba(230,57,70,0.2)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e63946' }}>
              {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--border)' }}>|</span>
            {['PUBLISHED', 'DRAFT', 'ARCHIVED'].map((s) => (
              <button
                key={s}
                onClick={() => handleBulkStatusChange(s)}
                disabled={bulkLoading}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--fg)', fontSize: 11, fontWeight: 600,
                  cursor: bulkLoading ? 'wait' : 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e63946'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {s === 'PUBLISHED' ? 'Publicar' : s === 'DRAFT' ? 'Borrador' : 'Archivar'}
              </button>
            ))}
          </div>
        )}

        {data && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginLeft: 'auto' }}>
            {data.total} evento{data.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--card)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e63946' }}
                  />
                </th>
                {['Imagen', 'Titulo', 'Ciudad', 'Categoria', 'Precio', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px',
                    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={16} height={16} radius={4} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={48} height={36} radius={8} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={140} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={80} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={70} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={60} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={72} height={24} radius={6} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={80} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={100} height={32} radius={8} /></td>
                  </tr>
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ marginBottom: 12 }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    No se encontraron eventos
                  </td>
                </tr>
              ) : (
                data.data.map((event, i) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: i < data.data.length - 1 ? '1px solid var(--border)' : undefined,
                      background: selectedIds.has(event.id)
                        ? 'rgba(230,57,70,0.06)'
                        : i % 2 === 1 ? 'rgba(128,128,128,0.03)' : undefined,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedIds.has(event.id)) e.currentTarget.style.background = 'rgba(230,57,70,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedIds.has(event.id)) e.currentTarget.style.background = i % 2 === 1 ? 'rgba(128,128,128,0.03)' : '';
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(event.id)}
                        onChange={() => toggleSelect(event.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e63946' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          style={{ width: 48, height: 36, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: 48, height: 36, borderRadius: 8, background: 'var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {event.city?.name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {event.category?.name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
                      ${event.price?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={event.status || 'DRAFT'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', textDecoration: 'none',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          title="Ver evento"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        <select
                          value={event.status || 'DRAFT'}
                          onChange={(e) => handleSingleStatusChange(event.id, e.target.value)}
                          style={{
                            padding: '6px 8px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--card)',
                            color: 'var(--fg)', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="PUBLISHED">Publicado</option>
                          <option value="DRAFT">Borrador</option>
                          <option value="ARCHIVED">Archivado</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
