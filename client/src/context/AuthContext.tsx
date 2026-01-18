import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceName: string | null;
  databaseId: string | null;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const checkAuth = useCallback(async (sessionIdFromUrl?: string) => {
    try {
      console.log('🔍 Checking auth...', { sessionIdFromUrl });

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

          // Clean up URL params after successful auth
          const url = new URL(window.location.href);
          if (url.searchParams.has('login') || url.searchParams.has('sid')) {
            url.searchParams.delete('login');
            url.searchParams.delete('sid');
            window.history.replaceState({}, '', url.pathname);
          }
          return;
        }
      }

      // Cookie auth failed - try session restore if we have a session ID from URL
      // This handles mobile browsers where cookies are blocked due to ITP
      if (sessionIdFromUrl) {
        console.log('  ⚠️ Cookie auth failed, trying session restore...');

        const restoreResponse = await fetch('/api/auth/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId: sessionIdFromUrl }),
        });

        if (restoreResponse.ok) {
          const restoreData = await restoreResponse.json();
          console.log('  /api/auth/restore response:', restoreData);

          if (restoreData.authenticated) {
            console.log('  ✅ Authenticated via session restore');
            setIsAuthenticated(true);
            setWorkspaceName(restoreData.workspaceName);
            setDatabaseId(restoreData.databaseId);

            // Clean up URL params after successful auth
            const url = new URL(window.location.href);
            url.searchParams.delete('login');
            url.searchParams.delete('sid');
            window.history.replaceState({}, '', url.pathname);
            return;
          }
        } else {
          console.log('  ❌ Session restore failed:', restoreResponse.status);
        }
      }

      // Not authenticated
      console.log('  ❌ Not authenticated');
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');
    const sessionId = params.get('sid'); // Session ID for mobile fallback

    console.log('🚀 AuthContext useEffect:', { loginStatus, sessionId: sessionId ? 'present' : 'absent' });

    if (loginStatus === 'success') {
      // Just returned from OAuth - mark as just logged in and check auth
      // Pass session ID for mobile browsers where cookies may be blocked
      setJustLoggedIn(true);
      checkAuth(sessionId || undefined);
    } else if (loginStatus === 'error') {
      // OAuth failed
      setIsAuthenticated(false);
      setIsLoading(false);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      url.searchParams.delete('sid');
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
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearJustLoggedIn = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      workspaceName,
      databaseId,
      justLoggedIn,
      clearJustLoggedIn,
      login,
      logout
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
