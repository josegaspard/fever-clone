'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAdminUsers, updateUserRole, deleteUser, User, UserType, PaginatedResponse } from '@/lib/api';

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function Skeleton({ width, height, radius = 8 }: { width: string | number; height: string | number; radius?: number }) {
  return (
    <div className="shimmer" style={{ width, height, borderRadius: radius, minWidth: typeof width === 'number' ? width : undefined }} />
  );
}

/* ─── Badge ────────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    USER: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' },
    BUSINESS: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
    SUPERADMIN: { bg: 'rgba(230,57,70,0.12)', fg: '#e63946' },
  };
  const c = colors[type.toUpperCase()] || { bg: 'rgba(128,128,128,0.12)', fg: '#888' };
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg, letterSpacing: 0.3,
    }}>
      {type}
    </span>
  );
}

/* ─── Avatar ───────────────────────────────────────────────────────────── */
function Avatar({ name, type }: { name: string; type: string }) {
  const colors: Record<string, string> = {
    USER: '#3b82f6',
    BUSINESS: '#22c55e',
    SUPERADMIN: '#e63946',
  };
  const bg = colors[(type || 'USER').toUpperCase()] || '#6b7280';
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Modal ────────────────────────────────────────────────────────────── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
          padding: 28, maxWidth: 440, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        className="animate-slide-up"
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Actions Dropdown ─────────────────────────────────────────────────── */
function ActionsDropdown({ onChangeType, onDelete }: { onChangeType: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--card)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e63946'; e.currentTarget.style.color = '#e63946'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, overflow: 'hidden', minWidth: 180, zIndex: 51,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <button
              onClick={() => { setOpen(false); onChangeType(); }}
              style={{
                width: '100%', padding: '10px 16px', border: 'none', background: 'transparent',
                color: 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(230,57,70,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Cambiar tipo
            </button>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              style={{
                width: '100%', padding: '10px 16px', border: 'none', background: 'transparent',
                color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
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

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function SuperAdminUsers() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Modal states
  const [changeTypeUser, setChangeTypeUser] = useState<User | null>(null);
  const [newType, setNewType] = useState<UserType>('USER');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminUsers({
        page,
        limit: 15,
        q: searchDebounce || undefined,
        userType: filterType || undefined,
      });
      setData(result);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, filterType]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchDebounce, filterType]);

  const handleChangeType = async () => {
    if (!changeTypeUser) return;
    setActionLoading(true);
    try {
      await updateUserRole(changeTypeUser.id, { userType: newType });
      setChangeTypeUser(null);
      loadUsers();
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    setActionLoading(true);
    try {
      await deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      loadUsers();
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', letterSpacing: -0.5, marginBottom: 4 }}>
          Usuarios
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Gestiona todos los usuarios de la plataforma
        </p>
      </div>

      {/* Filters bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search */}
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
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-theme"
            style={{
              width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10,
              fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input-theme"
          style={{
            padding: '10px 36px 10px 14px', borderRadius: 10, fontSize: 14,
            cursor: 'pointer', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="USER">USER</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>

        {/* Count */}
        {data && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginLeft: 'auto' }}>
            {data.total} usuario{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
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
                {['', 'Nombre', 'Email', 'Tipo', 'Rol', 'Fecha registro', 'Acciones'].map((h) => (
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
                    <td style={{ padding: '12px 16px' }}><Skeleton width={38} height={38} radius={10} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={120} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={160} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={70} height={24} radius={6} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={50} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={90} height={16} /></td>
                    <td style={{ padding: '12px 16px' }}><Skeleton width={32} height={32} radius={8} /></td>
                  </tr>
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                data.data.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < data.data.length - 1 ? '1px solid var(--border)' : undefined,
                      background: i % 2 === 1 ? 'rgba(128,128,128,0.03)' : undefined,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(230,57,70,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(128,128,128,0.03)' : ''; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Avatar name={user.name} type={user.userType} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <TypeBadge type={user.userType || 'USER'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {user.role || 'user'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ActionsDropdown
                        onChangeType={() => {
                          setChangeTypeUser(user);
                          setNewType((user.userType as UserType) || 'USER');
                        }}
                        onDelete={() => setDeleteConfirmUser(user)}
                      />
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

      {/* Change Type Modal */}
      <Modal open={!!changeTypeUser} onClose={() => setChangeTypeUser(null)}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 8 }}>
          Cambiar tipo de usuario
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Cambiando tipo para <strong style={{ color: 'var(--fg)' }}>{changeTypeUser?.name}</strong>
        </p>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Nuevo tipo
        </label>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as UserType)}
          className="input-theme"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            fontSize: 14, marginBottom: 24, cursor: 'pointer',
          }}
        >
          <option value="USER">USER</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setChangeTypeUser(null)}
            className="btn-secondary"
            style={{ padding: '10px 20px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleChangeType}
            disabled={actionLoading}
            className="btn-primary"
            style={{
              padding: '10px 20px', border: 'none', cursor: actionLoading ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 600, opacity: actionLoading ? 0.7 : 1,
            }}
          >
            {actionLoading ? 'Guardando...' : 'Guardar cambio'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirmUser} onClose={() => setDeleteConfirmUser(null)}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#ef4444',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 8 }}>
            Eliminar usuario
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Estas seguro de eliminar a <strong style={{ color: 'var(--fg)' }}>{deleteConfirmUser?.name}</strong>?
            <br />Esta accion no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteConfirmUser(null)}
              className="btn-secondary"
              style={{ padding: '10px 24px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none',
                background: '#ef4444', color: '#fff', cursor: actionLoading ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 700, opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {actionLoading ? 'Eliminando...' : 'Si, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
