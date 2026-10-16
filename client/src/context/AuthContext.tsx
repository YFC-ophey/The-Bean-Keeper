import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { invalidateCoffeeEntries, setAuthToken } from '@/lib/queryClient';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceName: string | null;
  databaseId: string | null;
  justLoggedIn: boolean;
  authError: string | null;
  isOwner: boolean;
  notionLinked: boolean;
  clearJustLoggedIn: () => void;
  clearAuthError: () => void;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SupabaseSessionWithProviderToken = {
  access_token: string;
  provider_token?: string;
};

async function linkNotionProviderToken(accessToken: string, providerToken: string) {
  const response = await fetch('/api/auth/notion/link-provider-token', {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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
  const [notionLinked, setNotionLinked] = useState(false);

  const clearLocalAuth = useCallback(() => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setWorkspaceName(null);
    setDatabaseId(null);
    setIsOwner(false);
    setNotionLinked(false);
  }, []);

  const checkAuth = useCallback(async (refreshProviderToken = false) => {
    try {
      if (!isSupabaseConfigured || !supabase) {
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
        credentials: 'omit',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!meResponse.ok) {
        clearLocalAuth();
        return;
      }

      const meData = await meResponse.json();

      // A new OAuth callback may carry a rotated Notion token. Refresh the
      // existing connection only then; ordinary page loads use the saved link.
      if (meData.authenticated && session.provider_token && (!meData.notionLinked || refreshProviderToken)) {
        const linkResult = await linkNotionProviderToken(session.access_token, session.provider_token);
        setIsAuthenticated(true);
        setNotionLinked(true);
        setWorkspaceName(linkResult.workspaceName || null);
        setDatabaseId(linkResult.databaseId || null);
        setIsOwner(false);
        invalidateCoffeeEntries();
        return;
      }

      if (meData.authenticated && meData.notionLinked) {
        setIsAuthenticated(true);
        setNotionLinked(true);
        setWorkspaceName(meData.workspaceName || null);
        setDatabaseId(meData.databaseId || null);
        setIsOwner(meData.isOwner || false);

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
      checkAuth(true);
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

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        setAuthToken(session?.access_token ?? null);
      } else if (event === 'SIGNED_OUT') {
        clearLocalAuth();
        invalidateCoffeeEntries();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearLocalAuth]);

  const login = () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError('LOGIN_FAILED');
      return;
    }

    trackEvent('notion_login_start');
    void supabase.auth.signInWithOAuth({
      provider: 'notion',
      options: {
        redirectTo: `${window.location.origin}/?login=success`,
      },
    }).then(({ error }) => {
      if (error) {
        console.error('Notion login failed:', error);
        setAuthError('LOGIN_FAILED');
      }
    }).catch((error) => {
      console.error('Notion login failed:', error);
      setAuthError('LOGIN_FAILED');
    });
  };

  const logout = async () => {
    try {
      const currentSession = isSupabaseConfigured && supabase
        ? await supabase.auth.getSession()
        : null;
      const accessToken = currentSession?.data.session?.access_token;

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'omit',
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      try {
        if (supabase) await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase logout failed:', error);
      }
      clearLocalAuth();
      invalidateCoffeeEntries();
      window.location.href = '/';
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
      notionLinked,
      clearJustLoggedIn,
      clearAuthError,
      login,
      logout,
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
