'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  UserType,
  login as apiLogin,
  register as apiRegister,
  googleAuth as apiGoogleAuth,
  getMe,
  updateProfile as apiUpdateProfile,
} from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, userType?: UserType, companyName?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  isBusiness: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/search', '/auth/', '/events/', '/plans/shared/', '/onboarding/'];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(async () => {
    const saved = localStorage.getItem('token');
    if (!saved) {
      setLoading(false);
      return;
    }
    setToken(saved);
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (loading || !user) return;
    if (user.onboardingCompleted) return;
    if (pathname?.startsWith('/onboarding')) return;
    if (pathname?.startsWith('/auth')) return;

    const userType = (user.userType || 'USER').toUpperCase();
    if (userType === 'BUSINESS') {
      router.push('/onboarding/business');
    } else if (userType === 'USER') {
      router.push('/onboarding/user');
    }
  }, [user, loading, pathname, router]);

  const handleAuthResponse = (res: { token: string; user: User }) => {
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const u = handleAuthResponse(res);
    if (!u.onboardingCompleted) {
      const type = (u.userType || 'USER').toUpperCase();
      if (type === 'BUSINESS') router.push('/onboarding/business');
      else if (type === 'USER') router.push('/onboarding/user');
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await apiGoogleAuth(credential);
    handleAuthResponse(res);
  };

  const register = async (name: string, email: string, password: string, userType: UserType = 'USER', companyName?: string) => {
    const res = await apiRegister(name, email, password, userType, companyName);
    const u = handleAuthResponse(res);
    const type = (u.userType || userType).toUpperCase();
    if (type === 'BUSINESS') router.push('/onboarding/business');
    else router.push('/onboarding/user');
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await apiUpdateProfile(data as Record<string, unknown>);
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const userType = (user?.userType || 'USER').toUpperCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        logout,
        isSuperAdmin: userType === 'SUPERADMIN',
        isBusiness: userType === 'BUSINESS',
        isUser: userType === 'USER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
