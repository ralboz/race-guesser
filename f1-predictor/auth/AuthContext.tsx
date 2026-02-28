'use client';
import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

type AuthContextType = {
  isLoggedIn: boolean;
  user: any;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const login = useCallback(() => {
    window.location.href = '/sign-in';
  }, []);

  const logout = useCallback(() => {
    signOut({ redirectUrl: '/' });
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn: !!isSignedIn, 
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
