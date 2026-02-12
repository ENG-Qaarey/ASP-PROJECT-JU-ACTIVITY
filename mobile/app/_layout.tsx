import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { LogBox } from 'react-native';

// Ignore specific logs that should only appear in terminal, not as mobile overlays
LogBox.ignoreLogs([
  'Network request failed',
  'Invalid email or password',
  'API Request Failed',
  'Failed to fetch users',
  'Timeout'
]);

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { AuthProvider } from '@/src/context/AuthContext';
import { ChatProvider } from '@/src/context/ChatContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { NotificationService } from '@/src/lib/NotificationService';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
 
/**
 * Render the application's themed navigation layout and handle notification-driven navigation.
 *
 * When a notification response is received, navigates to `/chat/{id}` if the notification data
 * `type` is `"chat"` (using `groupId` or `senderId`), or to `/notifications` if the `type` is
 * `"approval"` or `"rejection"`. Selects a light or dark navigation theme based on the device
 * color scheme and provides the app's stack navigator and status bar.
 *
 * @returns The React element containing the app's navigation provider, stack navigator, and status bar.
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  useEffect(() => {
    // Handle notification when app is minimized/backgrounded
    const subscription = NotificationService.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'chat') {
        const id = data.groupId || data.senderId;
        if (id) router.push(`/chat/${id}`);
      } else if (data?.type === 'approval' || data?.type === 'rejection') {
        router.push('/notifications' as any);
      }
    });

    return () => subscription.remove();
  }, []);

  const CustomDefaultTheme = {
    ...NavDefaultTheme,
    colors: {
      ...NavDefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.error,
    },
  };

  const CustomDarkTheme = {
    ...NavDarkTheme,
    colors: {
      ...NavDarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
      notification: Colors.dark.error,
    },
  };

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(coordinator)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Compose global app providers and render the root navigation layout.
 *
 * The component wraps the app's root navigation with gesture handling and a stack
 * of global context providers (Theme, Auth, Notification, Toast, Chat).
 *
 * @returns The root React element that supplies global contexts and mounts the navigation layout.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <ChatProvider>
                  <RootLayoutNav />
                </ChatProvider>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}