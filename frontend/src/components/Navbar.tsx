'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCities, City } from '@/lib/api';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cityOpen, setCityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cityRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCities()
      .then((c) => {
        setCities(c);
        if (c.length > 0) setSelectedCity(c[0].name);
      })
      .catch(() => {});
  }, []);

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

  return (
    <nav className="sticky top-0 z-50 bg-[#111] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-[#e63946] shrink-0"
        >
          FEVER
        </Link>

        {/* City selector – desktop */}
        <div ref={cityRef} className="relative hidden md:block">
          <button
            onClick={() => setCityOpen(!cityOpen)}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {selectedCity || 'Ciudad'}
            <svg
              className={`w-3 h-3 transition-transform ${cityOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {cityOpen && (
            <div className="absolute top-full mt-2 left-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl py-1 min-w-[180px]">
              {cities.map((c) => (
                <button
                  key={c.id}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#2a2a2a] transition ${
                    selectedCity === c.name ? 'text-[#e63946]' : 'text-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedCity(c.name);
                    setCityOpen(false);
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos..."
                className="bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-[#e63946]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:block text-gray-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          )}

          {/* Favorites */}
          {user && (
            <Link
              href="/favorites"
              className="text-gray-400 hover:text-[#e63946] transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </Link>
          )}

          {/* User menu – desktop */}
          {!loading && (
            <div ref={userRef} className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-sm font-bold"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl py-1 min-w-[180px]">
                      <div className="px-4 py-2 text-sm text-gray-400 border-b border-[#2a2a2a]">
                        {user.name}
                      </div>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/favorites"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mis favoritos
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a]"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-300 hover:text-white transition"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm bg-[#e63946] hover:bg-[#c62d3a] px-3 py-1.5 rounded-lg transition"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Hamburger – mobile */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
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
        <div className="md:hidden bg-[#111] border-t border-[#2a2a2a] px-4 py-4 space-y-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#e63946]"
            />
          </form>

          {/* City selector */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Ciudad</p>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Links */}
          {user ? (
            <>
              <Link
                href="/favorites"
                className="block text-sm text-gray-300"
                onClick={() => setMenuOpen(false)}
              >
                Mis favoritos
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block text-sm text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="block text-sm text-gray-300"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block text-sm text-gray-300"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="block text-sm text-[#e63946]"
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
