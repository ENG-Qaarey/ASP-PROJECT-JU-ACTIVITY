import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeSetting: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeSetting: 'system',
  setTheme: () => {},
  toggleTheme: () => {},
  refreshTheme: async () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useNativeColorScheme();
  const [themeSetting, setThemeSettingState] = useState<Theme>('system');

  const getStorageKey = async () => {
    const userId = await AsyncStorage.getItem('current-user');
    return userId ? `theme-${userId}` : 'user-theme';
  };

  const loadTheme = async () => {
    const key = await getStorageKey();
    const savedTheme = await AsyncStorage.getItem(key);
    if (savedTheme) {
      setThemeSettingState(savedTheme as Theme);
    }
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeSettingState(newTheme);
    const key = await getStorageKey();
    await AsyncStorage.setItem(key, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = themeSetting === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  const effectiveTheme = themeSetting === 'system' 
    ? (systemScheme === 'dark' ? 'dark' : 'light') 
    : themeSetting;

  return (
    <ThemeContext.Provider value={{ 
      theme: effectiveTheme, 
      themeSetting, 
      setTheme, 
      toggleTheme, 
      refreshTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
