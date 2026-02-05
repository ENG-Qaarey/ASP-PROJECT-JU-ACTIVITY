import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

/**
 * Lightweight wrapper screen to open a real group chat
 * using the existing `[id].tsx` chat implementation.
 *
 * Usage (navigation):
 * router.push({
 *   pathname: '/chat/ActivityGroupChat',
 *   params: { id: activityId, title: activityTitle }
 * });
 */
export default function ActivityGroupChat() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    if (id) {
      // Redirect into the shared chat screen but flagged as a group chat
      router.replace({
        pathname: '/chat/[id]',
        params: { id, isGroup: 'true', title },
      });
    }
  }, [id]);

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

