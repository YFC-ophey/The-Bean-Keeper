import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceName: string | null;
  databaseId: string | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
        setWorkspaceName(data.workspaceName);
        setDatabaseId(data.databaseId);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/auth/notion';
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setIsAuthenticated(false);
      setWorkspaceName(null);
      setDatabaseId(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      workspaceName,
      databaseId,
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
