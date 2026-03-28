'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserType } from '@/lib/api';

function RegisterForm() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') === 'business' ? 'BUSINESS' : 'USER';
  const [userType, setUserType] = useState<UserType>(defaultType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (userType === 'BUSINESS' && !companyName.trim()) {
      setError('El nombre de empresa es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, userType, companyName || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">Crear cuenta</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Unete a Fever y descubre experiencias unicas
          </p>
        </div>

        {/* User type selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setUserType('USER')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              userType === 'USER'
                ? 'border-[#e63946] bg-[#e63946]/10'
                : 'border-transparent hover:border-[var(--border)]'
            }`}
            style={{ background: userType === 'USER' ? undefined : 'var(--card)' }}
          >
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-sm font-bold">Soy Asistente</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Quiero descubrir eventos</div>
          </button>
          <button
            type="button"
            onClick={() => setUserType('BUSINESS')}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              userType === 'BUSINESS'
                ? 'border-[#e63946] bg-[#e63946]/10'
                : 'border-transparent hover:border-[var(--border)]'
            }`}
            style={{ background: userType === 'BUSINESS' ? undefined : 'var(--card)' }}
          >
            <div className="text-2xl mb-1">🏢</div>
            <div className="text-sm font-bold">Soy Empresa</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Quiero crear eventos</div>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {userType === 'BUSINESS' ? 'Tu nombre' : 'Nombre'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full input-theme rounded-lg px-4 py-2.5"
              placeholder="Tu nombre"
            />
          </div>

          {userType === 'BUSINESS' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Nombre de empresa
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full input-theme rounded-lg px-4 py-2.5"
                placeholder="EventosPro, Live Nation, etc."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email {userType === 'BUSINESS' ? 'corporativo' : ''}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-theme rounded-lg px-4 py-2.5"
              placeholder={userType === 'BUSINESS' ? 'empresa@dominio.com' : 'tu@email.com'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Contrasena
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-theme rounded-lg px-4 py-2.5"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Confirmar contrasena
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full input-theme rounded-lg px-4 py-2.5"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-primary disabled:opacity-50 text-center"
          >
            {loading ? 'Creando cuenta...' : userType === 'BUSINESS' ? 'Registrar empresa' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-[#e63946] hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
