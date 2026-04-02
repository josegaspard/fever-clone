'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCities, getPlans, City } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const { user, logout, loading, isSuperAdmin, isBusiness } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cityOpen, setCityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planCount, setPlanCount] = useState(0);
  const cityRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCities()
      .then((c) => {
        setCities(c);
        // Use saved city from localStorage (set by HeroBanner geolocation)
        const saved = typeof window !== 'undefined' ? localStorage.getItem('fever-city') : null;
        if (saved) {
          const match = c.find(city => city.slug === saved);
          if (match) { setSelectedCity(match.name); return; }
        }
        // Don't auto-select - show "Ciudad" placeholder
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && !isBusiness && !isSuperAdmin) {
      getPlans()
        .then((res) => {
          const active = (res.data || []).filter(
            (p) => p.status === 'active' || p.status === 'ACTIVE'
          );
          setPlanCount(active.length);
        })
        .catch(() => {});
    } else {
      setPlanCount(0);
    }
  }, [user, isBusiness, isSuperAdmin]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node))
        setCityOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getDashboardLink = () => {
    if (isSuperAdmin) return '/super-admin';
    if (isBusiness) return '/business';
    return null;
  };

  const getDashboardLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isBusiness) return 'Panel Empresa';
    return null;
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: 'var(--nav-border)' }} role="navigation" aria-label="Navegacion principal">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-[#e63946] shrink-0"
          aria-label="CTXplorer - Ir al inicio"
        >
          CTXPLORER
        </Link>

        {/* City selector -- desktop */}
        <div ref={cityRef} className="relative hidden md:block">
          <button
            onClick={() => setCityOpen(!cityOpen)}
            className="flex items-center gap-1 text-sm hover:text-[var(--fg)] transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {selectedCity || 'Ciudad'}
            <svg className={`w-3 h-3 transition-transform ${cityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {cityOpen && (
            <div className="absolute top-full mt-2 left-0 border rounded-lg shadow-xl py-1 min-w-[180px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {cities.map((c) => (
                <button
                  key={c.id}
                  className="block w-full text-left px-4 py-2 text-sm transition hover:bg-[var(--card-hover)]"
                  style={{ color: selectedCity === c.name ? '#e63946' : 'var(--text-secondary)' }}
                  onClick={() => { setSelectedCity(c.name); setCityOpen(false); localStorage.setItem('fever-city', c.slug); router.push(`/${c.slug}`); }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-[var(--card)] transition"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos..."
                className="input-theme text-sm rounded-lg px-3 py-1.5 w-48 focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 hover:text-[var(--fg)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="hidden md:block hover:text-[var(--fg)] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Blog link - visible to all */}
          <Link
            href="/blog"
            className="hidden md:block text-sm hover:text-[var(--fg)] transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            Blog
          </Link>

          {/* Favorites - only for regular users */}
          {user && !isBusiness && !isSuperAdmin && (
            <Link href="/favorites" className="hover:text-[#e63946] transition" style={{ color: 'var(--text-secondary)' }} title="Favoritos">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
          )}

          {/* Mis Days - only for regular users */}
          {user && !isBusiness && !isSuperAdmin && (
            <Link href="/plans" className="hidden md:flex items-center gap-1 hover:text-[#e63946] transition relative" style={{ color: 'var(--text-secondary)' }} title="Mis Days">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {planCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#e63946] rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {planCount > 9 ? '9+' : planCount}
                </span>
              )}
            </Link>
          )}

          {/* My Tickets - only for regular users */}
          {user && !isBusiness && !isSuperAdmin && (
            <Link href="/tickets" className="hidden md:block hover:text-[#e63946] transition" style={{ color: 'var(--text-secondary)' }} title="Mis Tickets">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </Link>
          )}

          {/* Dashboard link for business/admin */}
          {user && getDashboardLink() && (
            <Link
              href={getDashboardLink()!}
              className="hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition"
              style={{ background: 'var(--card)', color: '#e63946', border: '1px solid var(--border)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {getDashboardLabel()}
            </Link>
          )}

          {/* User menu -- desktop */}
          {!loading && (
            <div ref={userRef} className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-sm font-bold text-white"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 border rounded-lg shadow-xl py-1 min-w-[200px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="px-4 py-2 text-sm border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                        <div className="font-medium" style={{ color: 'var(--fg)' }}>{user.name}</div>
                        <div className="text-xs mt-0.5">{user.email}</div>
                        {isBusiness && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400">EMPRESA</span>}
                        {isSuperAdmin && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400">SUPER ADMIN</span>}
                      </div>
                      {getDashboardLink() && (
                        <Link href={getDashboardLink()!} className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition" style={{ color: '#e63946' }} onClick={() => setUserMenuOpen(false)}>
                          {getDashboardLabel()}
                        </Link>
                      )}
                      <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition" style={{ color: 'var(--text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Mi perfil</Link>
                      {!isBusiness && !isSuperAdmin && (
                        <>
                          <Link href="/favorites" className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition" style={{ color: 'var(--text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Mis favoritos</Link>
                          <Link href="/plans" className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition" style={{ color: 'var(--text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Mis Days</Link>
                          <Link href="/tickets" className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition" style={{ color: 'var(--text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Mis tickets</Link>
                        </>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cerrar sesion
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="text-sm hover:text-[var(--fg)] transition" style={{ color: 'var(--text-secondary)' }}>
                    Iniciar sesion
                  </Link>
                  <Link href="/auth/register" className="text-sm bg-[#e63946] hover:bg-[#c62d3a] text-white px-3 py-1.5 rounded-lg transition">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Hamburger -- mobile */}
          <button className="md:hidden hover:text-[var(--fg)]" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-3" style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="flex-1 input-theme text-sm rounded-lg px-3 py-2"
            />
          </form>

          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Ciudad</p>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full input-theme text-sm rounded-lg px-3 py-2"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Theme toggle - mobile */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>

          <hr style={{ borderColor: 'var(--border)' }} />

          {user ? (
            <>
              <Link href="/profile" className="block text-sm font-medium" style={{ color: 'var(--fg)' }} onClick={() => setMenuOpen(false)}>
                Mi perfil
              </Link>
              {getDashboardLink() && (
                <Link href={getDashboardLink()!} className="block text-sm font-medium text-[#e63946]" onClick={() => setMenuOpen(false)}>
                  {getDashboardLabel()}
                </Link>
              )}
              {!isBusiness && !isSuperAdmin && (
                <>
                  <Link href="/favorites" className="block text-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>Mis favoritos</Link>
                  <Link href="/plans" className="block text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>
                    Mis Days
                    {planCount > 0 && <span className="w-5 h-5 bg-[#e63946] rounded-full text-[10px] font-bold flex items-center justify-center text-white">{planCount}</span>}
                  </Link>
                  <Link href="/tickets" className="block text-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>Mis tickets</Link>
                </>
              )}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>Iniciar sesion</Link>
              <Link href="/auth/register" className="block text-sm text-[#e63946]" onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
