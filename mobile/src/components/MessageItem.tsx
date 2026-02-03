// MessageItem Component with Swipe and Long Press
// This is a helper component to add to your chat screen

import React, { useRef } from 'react';
import { View, Text, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Reply } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MessageItemProps {
  msgItem: any;
  isMe: boolean;
  isLastInGroup: boolean;
  theme: any;
  colorScheme: 'light' | 'dark';
  selectedMessages: Set<string>;
  onReply: (msg: any) => void;
  onSelect: (msgId: string) => void;
  children: React.ReactNode;
}

export const MessageItem = ({ 
  msgItem, 
  isMe, 
  isLastInGroup, 
  theme, 
  colorScheme,
  selectedMessages,
  onReply, 
  onSelect,
  children 
}: MessageItemProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSelected = selectedMessages.has(msgItem.id);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < 80) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          onReply(msgItem);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSelect(msgItem.id);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ translateX }],
        marginBottom: isLastInGroup ? 12 : 2,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {children}
      </TouchableOpacity>

      {/* Reply icon on swipe */}
      <Animated.View
        style={{
          position: 'absolute',
          right: 10,
          alignSelf: 'center',
          opacity: translateX.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 1],
          }),
        }}
      >
        <Reply size={20} color={theme.textSecondary} />
      </Animated.View>
    </Animated.View>
  );
};
