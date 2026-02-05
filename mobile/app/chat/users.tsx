import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
  LayoutAnimation,
  Animated,
  Easing,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, MessageSquare, MoreVertical, UserPlus, Plus, Users, Zap } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import * as Haptics from 'expo-haptics';
import { client } from '@/src/lib/api';
import { getAvatarUrl } from '@/src/lib/media';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '@/src/context/ChatContext';
import { useAuth } from '@/src/context/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: string;
    isDeleted?: boolean;
  };
  applications?: {
    activityId: string;
    activity: {
      title: string;
      image?: string;
    }
  }[];
  activitiesAsCoordinator?: {
    id: string;
    title: string;
    image?: string;
  }[];
}

interface Group {
  id: string;
  title: string;
  image?: string;
  type: 'group';
  members: User[];
  lastMessage?: User['lastMessage'];
  unreadCount?: number;
}

export default function UserDirectoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { socket, connected, onlineUsers } = useChat();
  const { user: currentUser } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [recordingUsers, setRecordingUsers] = useState<Set<string>>(new Set());
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups'>('all');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const getGroupedData = () => {
    const activityGroups: { [key: string]: Group } = {};
    const admins = users.filter(u => u.role === 'admin');

    users.forEach(user => {
      // Students
      user.applications?.forEach(app => {
        if (!activityGroups[app.activityId]) {
          activityGroups[app.activityId] = {
            id: app.activityId,
            title: app.activity.title,
            image: app.activity.image,
            type: 'group',
            members: [...admins],
            unreadCount: 0
          };
        }
        if (!activityGroups[app.activityId].members.some(m => m.id === user.id)) {
          activityGroups[app.activityId].members.push(user);
        }
      });

      // Coordinators
      user.activitiesAsCoordinator?.forEach(act => {
        if (!activityGroups[act.id]) {
          activityGroups[act.id] = {
            id: act.id,
            title: act.title,
            image: act.image,
            type: 'group',
            members: [...admins],
            unreadCount: 0
          };
        }
        if (!activityGroups[act.id].members.some(m => m.id === user.id)) {
          activityGroups[act.id].members.push(user);
        }
      });
    });

    return Object.values(activityGroups);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fetchUsers = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [usersData, recentChatsData] = await Promise.all([
        client.get(`/users/chat-directory${searchQuery ? `?search=${searchQuery}` : ''}`),
        client.get('/chat/recent')
      ]);

      const usersWithCounts = usersData.map((u: User) => {
        const recent = recentChatsData.find((chat: any) => 
          String(chat.user?.id) === String(u.id)
        );
        
        return {
          ...u,
          unreadCount: recent?.unreadCount || 0,
          lastMessage: recent?.lastMessage ? {
            content: recent.lastMessage.content,
            type: recent.lastMessage.type,
            createdAt: recent.lastMessage.createdAt,
            isDeleted: recent.lastMessage.isDeleted,
          } : undefined
        };
      });

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Failed to fetch users and counts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with loader
  useEffect(() => {
    fetchUsers(true);
  }, [searchQuery]);

  useEffect(() => {
    if (!socket || !connected) return;

    const onUserTyping = (data: { userId: string }) => {
      if (String(data.userId) === String(currentUser?.id)) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.add(String(data.userId));
        return next;
      });
    };

    const onUserStopTyping = ({ userId }: { userId: string }) => {
      if (String(userId) === String(currentUser?.id)) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };

    const onUserRecording = ({ userId }: { userId: string }) => {
      if (String(userId) === String(currentUser?.id)) return;
      setRecordingUsers(prev => {
        const next = new Set(prev);
        next.add(String(userId));
        return next;
      });
    };

    const onUserStopRecording = ({ userId }: { userId: string }) => {
      if (String(userId) === String(currentUser?.id)) return;
      setRecordingUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };

    if (socket && connected) {
      socket.on('userTyping', onUserTyping);
      socket.on('userStopTyping', onUserStopTyping);
      socket.on('userRecording', onUserRecording);
      socket.on('userStopRecording', onUserStopRecording);
    }
    
    return () => {
      if (socket) {
        socket.off('userTyping', onUserTyping);
        socket.off('userStopTyping', onUserStopTyping);
        socket.off('userRecording', onUserRecording);
        socket.off('userStopRecording', onUserStopRecording);
      }
    };
  }, [socket, connected]);

  // Background refresh on focus without showing loader
  useFocusEffect(
    React.useCallback(() => {
      fetchUsers(false);
    }, [searchQuery])
  );

  return (
    <GradientBackground>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Floating Header - Rendered in component for consistent cross-platform behavior */}
      <View style={[styles.floatingHeaderWrapper, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Community Hub</Text>
          </View>
          
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <Search size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by name or role..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
            />
          </View>
        </View>

        <View style={styles.filterWrapper}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: activeFilter === 'all' ? theme.primary : theme.card, borderColor: activeFilter === 'all' ? theme.tint : theme.border },
              activeFilter === 'all' && styles.filterChipActive
            ]}
            onPress={() => {
              setActiveFilter('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'all' ? '#FFFFFF' : theme.textSecondary }]}>All Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: activeFilter === 'groups' ? theme.primary : theme.card, borderColor: activeFilter === 'groups' ? theme.tint : theme.border },
              activeFilter === 'groups' && styles.filterChipActive
            ]}
            onPress={() => {
              setActiveFilter('groups');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'groups' ? '#FFFFFF' : theme.textSecondary }]}>Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: theme.card, borderColor: theme.border, width: 44, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }
            ]}
            onPress={() => {
              // Action for adding new chat or group
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Plus size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList<any>
            data={activeFilter === 'groups' ? getGroupedData() : users}
            renderItem={({ item }) => {
              // Handle Group Rendering
              if ('type' in item && item.type === 'group') {
                return (
                  <TouchableOpacity
                    style={[
                      styles.userCard, 
                      { 
                        backgroundColor: theme.card,
                        borderColor: theme.primary,
                        borderWidth: 1,
                      }
                    ]}
                    onPress={() => {
                      // Navigate to Group Chat
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: "/chat/[id]",
                        params: { 
                          id: item.id,
                          isGroup: 'true',
                          title: item.title,
                          image: item.image
                        }
                      });
                    }}
                  >
                    <View style={styles.cardContent}>
                        <View style={[
                          styles.avatarWrapper, 
                          { 
                            backgroundColor: 'transparent',
                            borderColor: colorScheme === 'dark' ? theme.primary + '30' : theme.border,
                            borderWidth: 1,
                            overflow: 'hidden'
                          }
                        ]}>
                          {!item.image ? (
                            <>
                              <LinearGradient
                                colors={colorScheme === 'dark' ? [theme.primary, '#0369A1'] : ['#E0F2FE', '#BAE6FD']}
                                style={StyleSheet.absoluteFill}
                              />
                              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Users size={28} color={colorScheme === 'dark' ? '#FFF' : theme.primary} strokeWidth={2} />
                                <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: theme.primary, borderRadius: 6, padding: 1, borderWidth: 1, borderColor: colorScheme === 'dark' ? theme.card : '#FFF' }}>
                                   <Zap size={8} color="#FFF" fill="#FFF" />
                                </View>
                              </View>
                            </>
                          ) : (
                            <Image 
                              source={getAvatarUrl(item.image, true)} 
                              style={styles.avatar}
                              contentFit="cover"
                              transition={200}
                            />
                          )}
                        </View>
                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                          <Text style={[styles.memberCount, { color: theme.textSecondary }]}>{item.members.length} members</Text>
                        </View>
                        <View style={styles.messagePreviewRow}>
                          <Text style={[styles.lastMessageText, { color: theme.textSecondary }]} numberOfLines={1}>
                            Includes coordinator and admin
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              // Handle User Rendering (existing logic)
              const user = item as User;
              const isOnline = onlineUsers.some(uid => String(uid) === String(user.id));
              const isTyping = typingUsers.has(String(user.id));
              const isRecording = recordingUsers.has(String(user.id));
              
              const getRoleBadgeStyle = (role: string) => {
                switch(role?.toLowerCase()) {
                  case 'admin':
                    return { bg: ['#EF4444', '#B91C1C'] as const, text: '#FFF' };
                  case 'coordinator':
                    return { bg: ['#3B82F6', '#1D4ED8'] as const, text: '#FFF' };
                  case 'moderator':
                    return { bg: ['#8B5CF6', '#6D28D9'] as const, text: '#FFF' };
                  default:
                    return { bg: ['#6B7280', '#374151'] as const, text: '#FFF' };
                }
              };

              const roleStyle = getRoleBadgeStyle(user.role);

              return (
                <TouchableOpacity
                  style={[
                    styles.userCard, 
                    { 
                      backgroundColor: theme.card,
                      borderColor: (user.unreadCount ?? 0) > 0 ? theme.primary : theme.border,
                      borderWidth: (user.unreadCount ?? 0) > 0 ? 1.5 : 1,
                    }
                  ]}
                  onPress={() => router.push(`/chat/${user.id}`)}
                >
                  <View style={styles.cardContent}>
                    <View style={[styles.avatarWrapper, { backgroundColor: theme.card }]}>
                      <Image source={getAvatarUrl(user.avatar, false)} style={[styles.avatar, { backgroundColor: theme.border }]} />
                      <Animated.View 
                        style={[
                          styles.onlineBadge, 
                          { 
                            backgroundColor: isOnline ? '#22C55E' : '#94A3B8',
                            borderColor: theme.card,
                            opacity: isOnline ? pulseAnim : 1,
                            transform: [{ scale: isOnline ? pulseAnim : 1 }]
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
                          <LinearGradient
                            colors={roleStyle.bg}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.roleBadge}
                          >
                            <Text style={styles.roleBadgeText}>{user.role}</Text>
                          </LinearGradient>
                        </View>
                        {user.lastMessage && (
                          <Text style={[
                            styles.lastMessageTime, 
                            { color: (user.unreadCount ?? 0) > 0 ? theme.primary : theme.textSecondary }
                          ]}>
                            {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.messagePreviewRow}>
                        <Text style={[styles.lastMessageText, { 
                          color: isRecording ? '#EC4899' : (isTyping ? theme.primary : theme.textSecondary), 
                          fontWeight: (user.unreadCount ?? 0) > 0 ? '700' : '400', 
                          fontStyle: user.lastMessage?.isDeleted ? 'italic' : 'normal' 
                        }]} numberOfLines={1}>
                          {isRecording ? '🎙️ Recording audio...' : 
                            isTyping ? 'typing...' : 
                            user.lastMessage ? (
                              user.lastMessage.isDeleted ? '🚫 This message was deleted' :
                              user.lastMessage.type === 'voice' || user.lastMessage.type === 'audio' ? '🎤 Voice Message' :
                              user.lastMessage.type === 'image' ? '📸 Photo' :
                              user.lastMessage.type === 'video' ? '🎥 Video' :
                              user.lastMessage.type === 'file' ? '📁 File' :
                              user.lastMessage.content
                            ) : `No messages yet`
                          }
                        </Text>
                        {(user.unreadCount ?? 0) > 0 && (
                          <LinearGradient
                            colors={['#22C55E', '#16A34A']}
                            style={styles.unreadCountBadge}
                          >
                            <Text style={styles.unreadCountText}>{user.unreadCount}</Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
              </View>
            )}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeaderWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filterWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 15,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
    zIndex: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  lastMessageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lastMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  unreadBadge: {
    backgroundColor: '#22C55E',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadBadgeText: {
    color: '#052E16', // Very dark green for better contrast
    fontSize: 12,
    fontWeight: '900',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  roleBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  unreadCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
