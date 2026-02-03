import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, ArrowLeft, MessageSquarePlus } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { ActivityIndicator, RefreshControl } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getAvatarUrl } from '@/src/lib/media';

dayjs.extend(relativeTime);

interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline: boolean;
  isRead: boolean;
  isPinned?: boolean;
  isSentByMe?: boolean;
}

const mockChats: ChatPreview[] = [
  {
    id: '1',
    name: 'Design chat',
    avatar: 'DC',
    lastMessage: 'Jessie Rollins sent...',
    timestamp: '4m',
    unreadCount: 1,
    isOnline: true,
    isRead: false,
    isPinned: true,
    isSentByMe: false,
  },
  {
    id: '2',
    name: 'Osman Campos',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'You: Hey! We are read...',
    timestamp: '20m',
    isOnline: true,
    isRead: true,
    isSentByMe: true,
  },
  {
    id: '3',
    name: 'Jayden Church',
    avatar: 'https://i.pravatar.cc/150?img=13',
    lastMessage: 'I prepared some varia...',
    timestamp: '1h',
    isOnline: false,
    isRead: false,
    isPinned: true,
    isSentByMe: false,
  },
  {
    id: '4',
    name: 'Jacob Mcleod',
    avatar: 'https://i.pravatar.cc/150?img=14',
    lastMessage: 'And send me the proto...',
    timestamp: '10m',
    unreadCount: 3,
    isOnline: false,
    isRead: false,
    isSentByMe: false,
  },
  {
    id: '5',
    name: 'Jasmin Lowery',
    avatar: 'https://i.pravatar.cc/150?img=45',
    lastMessage: 'You: Ok! Let\'s discuss it on th...',
    timestamp: '20m',
    isOnline: false,
    isRead: true,
    isSentByMe: true,
  },
  {
    id: '6',
    name: 'Zaid Myers',
    avatar: 'https://i.pravatar.cc/150?img=33',
    lastMessage: 'You: Hey! We are ready to in...',
    timestamp: '45m',
    isOnline: false,
    isRead: true,
    isSentByMe: true,
  },
];

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = async () => {
    try {
      const data = await client.get('/chat/recent');
      // Transform backend data to ChatPreview format
      const transformedChats: ChatPreview[] = data.map((item: any) => {
        const otherUser = item.user;
        const lastMsg = item.lastMessage;
        
        return {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar || otherUser.name.substring(0, 2).toUpperCase(),
          lastMessage: lastMsg.content,
          timestamp: dayjs(lastMsg.createdAt).fromNow(true)
            .replace(' minutes', 'm')
            .replace(' minute', 'm')
            .replace(' hours', 'h')
            .replace(' hour', 'h')
            .replace(' days', 'd')
            .replace(' day', 'd')
            .replace(' month', 'mo')
            .replace(' year', 'y')
            .replace(' seconds', 's')
            .replace(' a ', '1'),
          isOnline: false, // Backend doesn't provide this yet
          isRead: true, // Backend doesn't provide this yet
          unreadCount: 0, // Backend doesn't provide this yet
          isSentByMe: lastMsg.senderId === user?.id,
        };
      });
      setChats(transformedChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: ChatPreview }) => {
    const isAvatarText = item.avatar.length <= 2;

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {isAvatarText ? (
            <View style={[styles.avatarCircle, { backgroundColor: '#1F2937' }]}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
          ) : (
            <Image source={getAvatarUrl(item.avatar)} style={styles.avatar} />
          )}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Chat Info */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <ThemedText
              style={[
                styles.chatName,
                !item.isRead && styles.unreadName,
              ]}
            >
              {item.name}
            </ThemedText>
            <View style={styles.timestampContainer}>
              {item.isRead && item.isSentByMe && (
                <Text style={styles.checkmark}>✓✓</Text>
              )}
              <Text
                style={[
                  styles.timestamp,
                  { color: !item.isRead ? theme.primary : theme.icon },
                  !item.isRead && styles.unreadTime,
                ]}
              >
                {item.timestamp}
              </Text>
            </View>
          </View>

          <View style={styles.messageRow}>
            <ThemedText
              style={[
                styles.lastMessage,
                !item.isRead && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </ThemedText>
            {item.unreadCount && item.unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            ) : null}
            {item.isPinned && (
              <View style={styles.pinIcon}>
                <Text style={styles.pinEmoji}>📌</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.card },
          headerShadowVisible: false,
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <ThemedText style={styles.headerTitle}>Messages</ThemedText>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/chat/users')} 
              style={styles.newChatButton}
            >
              <MessageSquarePlus size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={18} color={theme.icon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Find messages..."
              placeholderTextColor={theme.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Chat List */}
        <View style={styles.chatList}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((item, index) => (
              <View key={item.id}>
                {renderChatItem({ item })}
                {index < filteredChats.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 40, paddingTop: 100 },
  
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  newChatButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  
  chatList: {
    flex: 1,
  },
  
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
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  pinIcon: {
    marginLeft: 4,
  },
  pinEmoji: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginLeft: 84,
    marginRight: 0,
    opacity: 0.5,
  },
  loaderContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 16,
  },
});
