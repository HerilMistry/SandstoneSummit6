import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY   = 'ss6_organizer_token';
const USER_KEY    = 'ss6_organizer_user';

interface OrganizerUser {
  email: string;
  name: string;
}

interface AuthContextType {
  token:     string | null;
  user:      OrganizerUser | null;
  isLoading: boolean;
  login:     (t: string, user?: OrganizerUser) => Promise<void>;
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [user,      setUser]      = useState<OrganizerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ])
      .then(([t, u]) => {
        setToken(t);
        setUser(u ? JSON.parse(u) : null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (t: string, u?: OrganizerUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    if (u) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
