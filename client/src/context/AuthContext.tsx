import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { invalidateCoffeeEntries, setAuthToken } from '@/lib/queryClient';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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

type SupabaseSessionWithProviderToken = {
  access_token: string;
  provider_token?: string;
};

async function linkNotionProviderToken(accessToken: string, providerToken: string) {
  const response = await fetch('/api/auth/notion/link-provider-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ providerToken }),
  });

  if (!response.ok) {
    throw new Error(`Failed to link Notion provider token (${response.status})`);
  }

  return await response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const clearLocalAuth = useCallback(() => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setWorkspaceName(null);
    setDatabaseId(null);
    setIsOwner(false);
    localStorage.removeItem('beankeeper_auth_data');
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Legacy fallback path if Supabase is not configured yet.
      if (!isSupabaseConfigured || !supabase) {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setWorkspaceName(data.workspaceName);
            setDatabaseId(data.databaseId);
            setIsOwner(data.isOwner || false);
            invalidateCoffeeEntries();
            return;
          }
        }

        clearLocalAuth();
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        clearLocalAuth();
        return;
      }

      const session = sessionData.session as unknown as SupabaseSessionWithProviderToken;
      setAuthToken(session.access_token);

      const meResponse = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!meResponse.ok) {
        clearLocalAuth();
        return;
      }

      const meData = await meResponse.json();

      if (meData.authenticated && meData.notionLinked) {
        setIsAuthenticated(true);
        setWorkspaceName(meData.workspaceName || null);
        setDatabaseId(meData.databaseId || null);
        setIsOwner(meData.isOwner || false);

        localStorage.setItem(
          'beankeeper_auth_data',
          JSON.stringify({
            databaseId: meData.databaseId,
            workspaceName: meData.workspaceName,
            isOwner: meData.isOwner || false,
          }),
        );

        invalidateCoffeeEntries();
        return;
      }

      if (meData.authenticated && !meData.notionLinked && session.provider_token) {
        const linkResult = await linkNotionProviderToken(session.access_token, session.provider_token);
        setIsAuthenticated(true);
        setWorkspaceName(linkResult.workspaceName || null);
        setDatabaseId(linkResult.databaseId || null);
        setIsOwner(false);
        localStorage.setItem(
          'beankeeper_auth_data',
          JSON.stringify({
            databaseId: linkResult.databaseId,
            workspaceName: linkResult.workspaceName,
            isOwner: false,
          }),
        );
        invalidateCoffeeEntries();
        return;
      }

      // Signed in at Supabase but missing provider token to complete Notion linking.
      setAuthError('LOGIN_FAILED');
      clearLocalAuth();
    } catch (error) {
      console.error('Auth check failed:', error);
      clearLocalAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearLocalAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');

    if (loginStatus === 'success') {
      setJustLoggedIn(true);
      checkAuth();
    } else if (loginStatus === 'no_pages') {
      setAuthError('NO_PAGES_SHARED');
      clearLocalAuth();
      setIsLoading(false);
    } else if (loginStatus === 'error') {
      setAuthError('LOGIN_FAILED');
      clearLocalAuth();
      setIsLoading(false);
    } else {
      checkAuth();
    }

    if (loginStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete('login');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [checkAuth, clearLocalAuth]);

  const login = () => {
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signInWithOAuth({
        provider: 'notion',
        options: {
          redirectTo: `${window.location.origin}/?login=success`,
        },
      });
      return;
    }

    window.location.href = '/api/auth/notion';
  };

  const logout = async () => {
    try {
      const currentSession = isSupabaseConfigured && supabase
        ? await supabase.auth.getSession()
        : null;
      const accessToken = currentSession?.data.session?.access_token;

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }

      clearLocalAuth();
      invalidateCoffeeEntries();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      clearLocalAuth();
    }
  };

  const ownerLogin = async (_password: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: _password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setWorkspaceName(data.workspaceName);
        setDatabaseId(data.databaseId);
        setIsOwner(true);
        setJustLoggedIn(true);
        invalidateCoffeeEntries();
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
      ownerLogin,
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
