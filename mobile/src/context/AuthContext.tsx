import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from '@/src/lib/api';
import { NotificationService } from '@/src/lib/NotificationService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  lastLogin: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
  setUser: () => {},
  logout: async () => {},
  lastLogin: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // Helper for 2s timeout
  const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const storedLastLogin = await AsyncStorage.getItem('last_login');
      if (storedLastLogin) setLastLogin(storedLastLogin);

      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      // Try to load cached profile first for instant load
      const cachedProfile = await AsyncStorage.getItem('user_profile');
      if (cachedProfile) {
        setUser(JSON.parse(cachedProfile));
        setLoading(false); // Stop loading immediately if we have a cache
      }

      // Fetch fresh data with 2s timeout
      // Valid data race: if network matches, use it. If timeout, we relied on cache or will fail silently if no cache
      try {
        const data: any = await Promise.race([
          client.get('/users/me'),
          timeoutPromise(2000)
        ]);

        if (data && data.id) {
          setUser(data);
          await AsyncStorage.setItem('user_profile', JSON.stringify(data));
        } else {
             if (!cachedProfile) setUser(null);
        }
      } catch (err: any) {
        // If it was a timeout, just log and ignore (we likely have cache)
        if (err.message === 'Timeout') {
            console.log('AuthContext: Profile fetch timed out (2s limit)');
        } else {
            throw err; // Re-throw other errors to be handled by outer catch
        }
      }

    } catch (error: any) {
      if (error?.message !== 'User not found') {
        console.log('AuthContext: Profile fetch failed (using cache if available)', error?.message);
      }
      
      // If unauthorized (401), clear everything
      if (error?.status === 401 || error?.response?.status === 401) {
        await AsyncStorage.removeItem('user_token');
        await AsyncStorage.removeItem('user_profile');
        setUser(null);
      }
      // For other errors (network/timeout), we just keep the cached user if it exists
    } finally {
      // FORCE stop loading after everything
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.id) {
      NotificationService.syncPushTokenWithBackend();
    }
  }, [user?.id]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_profile');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile, setUser, logout, lastLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
