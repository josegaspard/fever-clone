'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  {
    href: '/business',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    href: '/business/events',
    label: 'Mis Eventos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/business/analytics',
    label: 'Analiticas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/business/settings',
    label: 'Configuracion',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.userType || '').toUpperCase() !== 'BUSINESS')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/business') return pathname === '/business';
    return pathname?.startsWith(href) ?? false;
  };

  const sidebar = (
    <aside
      className="flex flex-col h-full"
      style={{ width: 280, background: '#111111', borderRight: '1px solid var(--border)' }}
    >
      {/* Company branding */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          {user.companyLogo ? (
            <img
              src={user.companyLogo}
              alt={user.companyName || ''}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #e63946 0%, #d32836 100%)' }}
            >
              {(user.companyName || user.name || 'B').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {user.companyName || user.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Panel de negocio
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: active ? 'rgba(230,57,70,0.1)' : 'transparent',
                color: active ? '#e63946' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}

        {/* Create event button */}
        <div className="pt-4">
          <Link
            href="/business/events/new"
            className="btn-primary flex items-center justify-center gap-2 w-full px-4 py-3 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear evento
          </Link>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#2a2a2a' }}
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition hover:bg-white/5"
            title="Cerrar sesion"
          >
            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3" style={{ background: '#111111', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="text-white font-semibold text-sm">
          {user.companyName || user.name}
        </span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </div>

      {/* Desktop layout */}
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            {sidebar}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:pt-0 pt-14">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
