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
import { Search, ArrowLeft, MessageSquarePlus, Clock } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { useChat } from '@/src/context/ChatContext';
import { ActivityIndicator, RefreshControl } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatListItem } from './ChatListItem';

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
  const { onlineUsers } = useChat();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [disappearingSettings, setDisappearingSettings] = useState<Record<string, boolean>>({});

  const fetchChats = async () => {
    try {
      const data = await client.get('/chat/recent');
      // Map over items and filter based on local clear status
      const chatsWithClearStats = await Promise.all(data.map(async (item: any) => {
        const clearedTimeStr = await AsyncStorage.getItem(`chat_cleared_${item.user.id}`);
        const clearedTime = clearedTimeStr ? parseInt(clearedTimeStr) : 0;
        const msgTime = new Date(item.lastMessage.createdAt).getTime();
        
        if (msgTime <= clearedTime) return null;
        return item;
      }));

      const transformedChats: ChatPreview[] = chatsWithClearStats
        .filter(item => item !== null)
        .map((item: any) => {
          const otherUser = item.user;
          const lastMsg = item.lastMessage;
          
          let previewText = lastMsg.content;
          if (lastMsg.type === 'image') previewText = '📷 Photo';
          else if (lastMsg.type === 'audio') previewText = '🎵 Voice message';
          else if (lastMsg.type === 'file') previewText = `📄 ${lastMsg.metadata?.fileName || 'Document'}`;
          
          return {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar || otherUser.name.substring(0, 2).toUpperCase(),
            lastMessage: previewText,
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
            isOnline: false, 
            isRead: lastMsg.read,
            unreadCount: item.unreadCount || 0, 
            isSentByMe: lastMsg.senderId === user?.id,
          };
        });
      setChats(transformedChats);
    } catch (error) {
      console.log('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchChats();
      const loadAllSettings = async () => {
        if (chats.length === 0) return;
        const settings: Record<string, boolean> = {};
        for (const chat of chats) {
          const val = await AsyncStorage.getItem(`chat_disappearing_${chat.id}`);
          settings[chat.id] = !!val && val !== 'off';
        }
        setDisappearingSettings(settings);
      };
      loadAllSettings();
    }, [chats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <ChatListItem
                  name={item.name}
                  avatar={item.avatar}
                  lastMessage={item.lastMessage}
                  timestamp={item.timestamp}
                  unreadCount={item.unreadCount}
                  isOnline={onlineUsers.some(uid => String(uid) === String(item.id))}
                  isRead={item.isRead}
                  isPinned={item.isPinned}
                  isSentByMe={item.isSentByMe}
                  showDisappearingTimer={!!disappearingSettings[item.id]}
                  theme={theme}
                  onPress={() => router.push(`/chat/${item.id}`)}
                />
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
