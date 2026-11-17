import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sipasti_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('sipasti_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await request.get(API_ENDPOINTS.AUTH.PROFILE);
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('sipasti_user', JSON.stringify(res.data));
      }
    } catch {
      localStorage.removeItem('sipasti_token');
      localStorage.removeItem('sipasti_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (email, password) => {
    const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('sipasti_token', token);
    localStorage.setItem('sipasti_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sipasti_token');
    localStorage.removeItem('sipasti_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
