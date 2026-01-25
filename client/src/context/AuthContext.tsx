import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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

  const checkAuth = useCallback(async (sessionIdFromUrl?: string) => {
    try {
      // Get stored session ID from localStorage (for ITP/Safari persistence)
      const storedSessionId = localStorage.getItem('beankeeper_session_id');
      const storedAuthData = localStorage.getItem('beankeeper_auth_data');
      const sessionIdToUse = sessionIdFromUrl || storedSessionId;

      console.log('🔍 Checking auth...', {
        sessionIdFromUrl,
        storedSessionId: storedSessionId ? 'present' : 'absent',
        storedAuthData: storedAuthData ? 'present' : 'absent',
        sessionIdToUse: sessionIdToUse ? 'present' : 'absent'
      });

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

          // Store auth data in localStorage for persistence across sessions
          localStorage.setItem('beankeeper_auth_data', JSON.stringify({
            databaseId: data.databaseId,
            workspaceName: data.workspaceName,
            isOwner: data.isOwner || false,
          }));

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

      // Cookie auth failed - try session restore if we have a session ID
      // This handles mobile browsers where cookies are blocked due to ITP
      // Check both URL param AND localStorage for session ID
      if (sessionIdToUse) {
        console.log('  ⚠️ Cookie auth failed, trying session restore with:', sessionIdToUse.substring(0, 8) + '...');

        const restoreResponse = await fetch('/api/auth/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId: sessionIdToUse }),
        });

        if (restoreResponse.ok) {
          const restoreData = await restoreResponse.json();
          console.log('  /api/auth/restore response:', restoreData);

          if (restoreData.authenticated) {
            console.log('  ✅ Authenticated via session restore');
            setIsAuthenticated(true);
            setWorkspaceName(restoreData.workspaceName);
            setDatabaseId(restoreData.databaseId);
            setIsOwner(restoreData.isOwner || false);

            // Store the session ID in localStorage for future page loads (ITP workaround)
            if (sessionIdFromUrl) {
              localStorage.setItem('beankeeper_session_id', sessionIdFromUrl);
              console.log('  💾 Saved session ID to localStorage');
            }

            // Store auth data for persistence
            localStorage.setItem('beankeeper_auth_data', JSON.stringify({
              databaseId: restoreData.databaseId,
              workspaceName: restoreData.workspaceName,
              isOwner: restoreData.isOwner || false,
            }));

            // Clean up URL params after successful auth
            const url = new URL(window.location.href);
            url.searchParams.delete('login');
            url.searchParams.delete('sid');
            window.history.replaceState({}, '', url.pathname);
            return;
          }
        } else {
          console.log('  ❌ Session restore failed:', restoreResponse.status);
          // If restore failed, clear the stored session ID
          localStorage.removeItem('beankeeper_session_id');
        }
      }

      // Cookie and session restore failed - handle differently for owner vs OAuth users
      // SECURITY: Don't trust localStorage for OAuth users without server validation
      if (storedAuthData) {
        try {
          const authData = JSON.parse(storedAuthData);
          console.log('  📦 Found stored auth data (server validation failed)');

          // Owner can be restored from localStorage since owner uses server credentials (API key)
          // The API key is stored server-side, so we just need to verify the database is accessible
          if (authData.isOwner && authData.databaseId) {
            console.log('  🔑 Owner data found, attempting quick verification...');
            try {
              // Quick test: try to fetch entries - if it works, owner credentials are valid
              const testResponse = await fetch('/api/coffee-entries?limit=1', {
                credentials: 'include',
              });
              if (testResponse.ok) {
                console.log('  ✅ Owner credentials verified');
                setIsAuthenticated(true);
                setWorkspaceName(authData.workspaceName);
                setDatabaseId(authData.databaseId);
                setIsOwner(true);
                return;
              }
            } catch {
              console.log('  ⚠️ Owner verification failed');
            }
          }

          // For OAuth users, we must NOT show them as logged in without server confirmation
          // Their access token may have been revoked or expired
          console.log('  🔒 Clearing stale auth data - user must re-authenticate');
          localStorage.removeItem('beankeeper_auth_data');
          localStorage.removeItem('beankeeper_session_id');
        } catch (e) {
          console.log('  ❌ Failed to parse stored auth data');
          localStorage.removeItem('beankeeper_auth_data');
        }
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
    const sessionId = params.get('sid'); // Session ID for mobile fallback

    console.log('🚀 AuthContext useEffect:', { loginStatus, sessionId: sessionId ? 'present' : 'absent' });

    if (loginStatus === 'success') {
      // Just returned from OAuth - mark as just logged in and check auth
      // Pass session ID for mobile browsers where cookies may be blocked
      setJustLoggedIn(true);
      checkAuth(sessionId || undefined);
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
      // Clear session ID from localStorage (ITP workaround)
      localStorage.removeItem('beankeeper_session_id');
      // Clear owner auth data from localStorage
      localStorage.removeItem('beankeeper_auth_data');
      console.log('🚪 Logged out, cleared session from localStorage');
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
