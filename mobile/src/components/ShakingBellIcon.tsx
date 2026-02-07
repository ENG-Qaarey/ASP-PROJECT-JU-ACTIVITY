import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { client } from '@/src/lib/api';

interface ShakingBellIconProps {
  size?: number;
  color?: string;
  badgeColor?: string;
  route: string; // Route to navigate to when tapped
  style?: any;
}

export function ShakingBellIcon({ size = 20, color = '#0EA5E9', badgeColor = '#EF4444', route, style }: ShakingBellIconProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bellAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await client.get('/notifications');
      const unread = Array.isArray(data) ? data.filter((n: any) => !n.read) : [];
      setUnreadCount(unread.length);
    } catch (err) {
      console.log('Failed to fetch notifications:', err);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    // Stop previous animation
    if (bellAnimationRef.current) {
      bellAnimationRef.current.stop();
    }

    if (unreadCount > 0) {
      // Create a smooth, wave-like bell ringing animation
      bellAnimationRef.current = Animated.loop(
        Animated.sequence([
          // Smooth swing sequence with gentle rhythm
          Animated.parallel([
            // Rotation - smooth pendulum motion
            Animated.sequence([
              Animated.timing(shakeAnim, { 
                toValue: 1, 
                duration: 150, 
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true 
              }),
              Animated.timing(shakeAnim, { 
                toValue: -1, 
                duration: 300, 
                easing: Easing.bezier(0.42, 0, 0.58, 1),
                useNativeDriver: true 
              }),
              Animated.timing(shakeAnim, { 
                toValue: 0.6, 
                duration: 200, 
                easing: Easing.bezier(0.42, 0, 0.58, 1),
                useNativeDriver: true 
              }),
              Animated.timing(shakeAnim, { 
                toValue: -0.6, 
                duration: 200, 
                easing: Easing.bezier(0.42, 0, 0.58, 1),
                useNativeDriver: true 
              }),
              Animated.timing(shakeAnim, { 
                toValue: 0, 
                duration: 150, 
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true 
              }),
            ]),
            // Scale - subtle pulse
            Animated.sequence([
              Animated.timing(scaleAnim, { 
                toValue: 1.12, 
                duration: 200, 
                easing: Easing.out(Easing.quad),
                useNativeDriver: true 
              }),
              Animated.timing(scaleAnim, { 
                toValue: 1, 
                duration: 600, 
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                useNativeDriver: true 
              }),
              Animated.timing(scaleAnim, { 
                toValue: 1.05, 
                duration: 100, 
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true 
              }),
              Animated.timing(scaleAnim, { 
                toValue: 1, 
                duration: 200, 
                easing: Easing.out(Easing.quad),
                useNativeDriver: true 
              }),
            ]),
          ]),
          Animated.delay(3000),
        ])
      );
      bellAnimationRef.current.start();
    } else {
      // Reset to default values
      shakeAnim.setValue(0);
      scaleAnim.setValue(1);
    }

    // Cleanup on unmount
    return () => {
      if (bellAnimationRef.current) {
        bellAnimationRef.current.stop();
      }
    };
  }, [unreadCount]);

  const handlePress = () => {
    setUnreadCount(0);
    router.push(route as any);
  };

  const rotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  // Format count display
  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();

  return (
    <TouchableOpacity onPress={handlePress} style={style} activeOpacity={0.7}>
      <View style={styles.container}>
        {/* Bell with animation */}
        <Animated.View style={{ 
          transform: [
            { rotate: rotation },
            { scale: scaleAnim }
          ] 
        }}>
          <Bell size={size} color={color} strokeWidth={2.2} />
        </Animated.View>
        
        {/* Badge - completely separate and static */}
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <View style={[
              styles.notifBadge, 
              { backgroundColor: badgeColor }
            ]}>
              <Text style={styles.notifBadgeText}>
                {displayCount}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -8,
    pointerEvents: 'none', // Ensures badge doesn't interfere with touch events
  },
  notifBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});
