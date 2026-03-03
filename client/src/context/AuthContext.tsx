import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { invalidateCoffeeEntries } from '@/lib/queryClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceName: string | null;
  databaseId: string | null;
  justLoggedIn: boolean;
  authError: string | null;
  isOwner: boolean;
  clearJustLoggedIn: () => void;
  clearAuthError: () => void;
  login: () => void;
  logout: () => Promise<void>;
  ownerLogin: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const storedAuthData = localStorage.getItem('beankeeper_auth_data');

      // Use fetch directly to avoid throwing on 401
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('  /api/auth/me response:', data);

        if (data.authenticated) {
          console.log('  ✅ Authenticated via cookie');
          setIsAuthenticated(true);
          setWorkspaceName(data.workspaceName);
          setDatabaseId(data.databaseId);
          setIsOwner(data.isOwner || false);

          // Invalidate coffee entries cache to force fresh fetch for this user's database
          invalidateCoffeeEntries();

          // Store auth data in localStorage for persistence across sessions
          localStorage.setItem('beankeeper_auth_data', JSON.stringify({
            databaseId: data.databaseId,
            workspaceName: data.workspaceName,
            isOwner: data.isOwner || false,
          }));

          // Clean up URL params after successful auth
          const url = new URL(window.location.href);
          if (url.searchParams.has('login')) {
            url.searchParams.delete('login');
            window.history.replaceState({}, '', url.pathname);
          }
          return;
        }
      }

      // Cookie auth failed - clear stale localStorage data
      // SECURITY: Never trust localStorage without server validation
      // Both owner and OAuth users must re-authenticate if session is gone
      if (storedAuthData) {
        console.log('  🔒 Session expired - clearing stale auth data, user must re-authenticate');
        localStorage.removeItem('beankeeper_auth_data');
      }

      // Not authenticated
      console.log('  ❌ Not authenticated');
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
      setIsOwner(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
      setIsOwner(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');

    console.log('🚀 AuthContext useEffect:', { loginStatus });

    if (loginStatus === 'success') {
      // Just returned from OAuth - mark as just logged in and check auth
      setJustLoggedIn(true);
      checkAuth();
    } else if (loginStatus === 'no_pages') {
      // User didn't share any pages during OAuth - show helpful message
      console.log('🔴 OAuth failed: User did not share any pages');
      setIsAuthenticated(false);
      setIsLoading(false);
      setAuthError('NO_PAGES_SHARED');
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      window.history.replaceState({}, '', url.pathname);
    } else if (loginStatus === 'error') {
      // OAuth failed
      setIsAuthenticated(false);
      setIsLoading(false);
      setAuthError('LOGIN_FAILED');
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      window.history.replaceState({}, '', url.pathname);
    } else {
      // Normal page load - check auth
      checkAuth();
    }
  }, [checkAuth]);

  const login = () => {
    window.location.href = '/api/auth/notion';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Clear owner auth data from localStorage
      localStorage.removeItem('beankeeper_auth_data');
      console.log('🚪 Logged out, cleared session from localStorage');

      // Invalidate coffee entries cache to force fresh fetch of owner's collection (guest mode)
      invalidateCoffeeEntries();

      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
      setIsOwner(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const ownerLogin = async (password: string): Promise<boolean> => {
    try {
      console.log('🔑 Attempting owner login...');
      const response = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        console.log('❌ Owner login failed:', response.status);
        return false;
      }

      const data = await response.json();
      console.log('✅ Owner login successful:', data);

      if (data.authenticated) {
        setIsAuthenticated(true);
        setWorkspaceName(data.workspaceName);
        setDatabaseId(data.databaseId);
        setIsOwner(true);
        setJustLoggedIn(true);

        // Invalidate coffee entries cache to force fresh fetch for owner's database
        invalidateCoffeeEntries();

        // Store auth data in localStorage for persistence
        localStorage.setItem('beankeeper_auth_data', JSON.stringify({
          databaseId: data.databaseId,
          workspaceName: data.workspaceName,
          isOwner: true,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Owner login error:', error);
      return false;
    }
  };

  const clearJustLoggedIn = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      workspaceName,
      databaseId,
      justLoggedIn,
      authError,
      isOwner,
      clearJustLoggedIn,
      clearAuthError,
      login,
      logout,
      ownerLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
