import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface NotificationData {
  id: string;
  title: string;
  message: string;
  avatar?: any;
  appIcon?: any;
  type?: 'chat' | 'approval' | 'rejection' | 'announcement';
  onPress?: () => void;
}

interface NotificationContextType {
  showNotification: (data: Omit<NotificationData, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const timerRef = useRef<any>(null);

  const hideNotification = useCallback(() => {
    // Subtle fade out with spring slide up
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withSpring(-200, { damping: 20, stiffness: 100 }, (finished) => {
      if (finished) {
        runOnJS(setNotification)(null);
      }
    });
  }, []);

  const showNotification = useCallback((data: Omit<NotificationData, 'id'>) => {
    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotification({ ...data, id: Math.random().toString() });
    
    // Haptic feedback for premium feel
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fade in and slide down with a snappy but smooth spring
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(insets.top + 10, { 
        damping: 15, 
        stiffness: 120,
        mass: 1 
    });

    // Auto-hide after 5 seconds
    timerRef.current = setTimeout(() => {
      hideNotification();
    }, 5000);
  }, [insets.top]);

  // Swiping Gesture
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
        // Only allow upward swiping to dismiss
        if (event.translationY < 0) {
            translateY.value = (insets.top + 10) + event.translationY;
        }
    })
    .onEnd((event) => {
        if (event.translationY < -40 || event.velocityY < -500) {
            runOnJS(hideNotification)();
        } else {
            translateY.value = withSpring(insets.top + 10, { damping: 15 });
        }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const ReanimatedView = Animated.View as any;

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {notification && (
        <GestureDetector gesture={gesture}>
          <ReanimatedView style={[styles.container, animatedStyle]}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => {
                notification.onPress?.();
                hideNotification();
              }}
              style={styles.card}
            >
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.content}>
                <View style={styles.avatarContainer}>
                  {notification.avatar ? (
                    <Image 
                      source={typeof notification.avatar === 'string' ? { uri: notification.avatar } : notification.avatar} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                      <Text style={styles.placeholderText}>{notification.title.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.appIconBadge}>
                      <Ionicons 
                          name={notification.type === 'chat' ? 'chatbubble' : 'notifications'} 
                          size={10} 
                          color="#fff" 
                      />
                  </View>
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.headerRow}>
                      <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                      <Text style={styles.timeLabel}>now</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ReanimatedView>
        </GestureDetector>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  placeholderAvatar: {
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appIconBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#0EA5E9',
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 18,
  },
});
