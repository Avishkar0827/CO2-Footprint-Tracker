"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    message?: string;
    data?: User;
    token?: string;
  }>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getTokenFromStorage = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const storeAuthData = (token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      document.cookie = `token=${token}; path=/; max-age=${MAX_AGE}; Secure; SameSite=Strict`;
    }
  };

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      document.cookie = 'token=; path=/; max-age=0';
    }
  };

  const initializeAuth = async () => {
    try {
      const token = getTokenFromStorage();
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        const response = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setUser(JSON.parse(userData));
        } else {
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 || data.message?.toLowerCase().includes('user not found')) {
          return {
            success: false,
            message: 'No account found. Please sign up first!',
          };
        }
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }

      storeAuthData(data.token, data.data);
      setUser(data.data);
      return { success: true, data: data.data, token: data.token };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Signup failed'
        };
      }

      // Return success without storing auth data or setting user
      return {
        success: true,
        message: data.message || 'Registration successful! Please login.',
        data: data.data
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      clearAuthData();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}