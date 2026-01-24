'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

type AuthContextType = {
  isLoggedIn: boolean;
  user: any;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const login = () => {
    window.location.href = '/auth/login';
  };

  const logout = () => {
    window.location.href = '/auth/logout';
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn: !!user, 
      user,
      login, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
