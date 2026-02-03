import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ChatIconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const ChatIcon: React.FC<ChatIconProps> = ({ 
  size = 20, 
  color = '#64748b',
  backgroundColor = '#f8fafc'
}) => {
  const router = useRouter();
  const [onlineCount, setOnlineCount] = useState(3);
  const [hasUnread, setHasUnread] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Simulated real-time data - replace with actual API
    const interval = setInterval(() => {
      setOnlineCount(Math.floor(Math.random() * 5) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasUnread) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasUnread]);

  const handlePress = () => {
    router.push('/chat/users');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MessageCircle size={size} color={color} />
      
      {/* Online users indicator */}
      {onlineCount > 0 && (
        <View style={styles.onlineBadge}>
          <Animated.View 
            style={[
              styles.onlineDot,
              { 
                transform: [{ scale: pulseAnim }],
                backgroundColor: '#22C55E'
              }
            ]} 
          />
        </View>
      )}

      {/* Unread messages indicator */}
      {hasUnread && (
        <Animated.View 
          style={[
            styles.unreadBadge,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.unreadDot} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
});
