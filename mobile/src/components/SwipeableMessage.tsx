import React, { useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Reply } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableMessageProps {
  onSwipeReply: () => void;
  children: React.ReactNode;
  theme: any;
  isMe: boolean;
}

export const SwipeableMessage = ({ onSwipeReply, children, theme, isMe }: SwipeableMessageProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const { translationX } = event.nativeEvent;
        // Only allow swipe to the right and limit to 80px
        if (translationX > 0 && translationX <= 80) {
          const opacity = Math.min(translationX / 50, 1);
          iconOpacity.setValue(opacity);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      // If swiped more than 60px, trigger reply
      if (translationX > 60) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSwipeReply();
      }
      
      // Animate back to original position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={[
            styles.messageWrapper,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 80],
                    outputRange: [0, 80],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>

      {/* Reply Icon */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            opacity: iconOpacity,
            transform: [
              {
                scale: iconOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Reply size={22} color={theme.textSecondary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  messageWrapper: {
    width: '100%',
  },
  replyIconContainer: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
