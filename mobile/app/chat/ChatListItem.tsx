import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';
import { ThemedText } from '@/src/components/themed-text';
import { getAvatarUrl } from '@/src/lib/media';

export interface ChatListItemProps {
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline: boolean;
  isRead: boolean;
  isPinned?: boolean;
  isSentByMe?: boolean;
  showDisappearingTimer?: boolean;
  /**
   * Theme object from `Colors[colorScheme]`.
   * Typed as any here to avoid tight coupling.
   */
  theme: any;
  onPress: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount,
  isOnline,
  isRead,
  isPinned,
  isSentByMe,
  showDisappearingTimer,
  theme,
  onPress,
}) => {
  const isAvatarText = !avatar || avatar.length <= 2;

  return (
    <TouchableOpacity
      style={[
        styles.chatItem,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {isAvatarText ? (
          <View style={[styles.avatarCircle, { backgroundColor: '#1F2937' }]}>
            <Text style={styles.avatarText}>
              {avatar || name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        ) : (
          <Image source={getAvatarUrl(avatar)} style={styles.avatar} />
        )}
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Chat Info */}
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText
            style={[
              styles.chatName,
              !isRead && styles.unreadName,
            ]}
          >
            {name}
          </ThemedText>
          <View style={styles.timestampContainer}>
            {isRead && isSentByMe && (
              <Text style={styles.checkmark}>✓✓</Text>
            )}
            <Text
              style={[
                styles.timestamp,
                { color: !isRead ? theme.primary : theme.icon },
                !isRead && styles.unreadTime,
              ]}
            >
              {timestamp}
            </Text>
            {showDisappearingTimer && (
              <Clock size={12} color={theme.primary} strokeWidth={2.5} />
            )}
          </View>
        </View>

        <View style={styles.messageRow}>
          <ThemedText
            style={[
              styles.lastMessage,
              !isRead && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {lastMessage}
          </ThemedText>
          {unreadCount && unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          ) : null}
          {isPinned && (
            <View style={styles.pinIcon}>
              <Text style={styles.pinEmoji}>📌</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  unreadName: {
    fontWeight: '800',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkmark: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadTime: {
    fontWeight: '700',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#064E3B',
    fontSize: 12,
    fontWeight: '900',
  },
  pinIcon: {
    marginLeft: 4,
  },
  pinEmoji: {
    fontSize: 14,
  },
});

export default ChatListItem;

