import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Keyboard,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Paperclip, Smile, Camera, Mic, Info, MoreVertical } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { GradientBackground } from '@/src/components/GradientBackground';
import * as Haptics from 'expo-haptics';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { useChat } from '@/src/context/ChatContext';
import { IMAGE_BASE } from '@/src/lib/config';
import dayjs from 'dayjs';

const getAvatarUrl = (path?: string) => {
  if (!path) return 'https://github.com/shadcn.png';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  localId?: string;
  forwarded?: boolean;
  replyTo?: {
    senderName: string;
    text: string;
  };
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isTyping: boolean;
}

const mockContact: Contact = {
  id: '1',
  name: 'Amin Daahir',
  avatar: 'https://github.com/shadcn.png',
  isOnline: true,
  isTyping: false,
};

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, connected, sendMessage, emitTyping, emitStopTyping, onlineUsers } = useChat();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [contact, setContact] = useState<Contact>({
    id: id || '',
    name: 'Loading...',
    avatar: '',
    isOnline: onlineUsers.includes(id || ''),
    isTyping: false,
  });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const typingOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Simulate typing indicator
  useEffect(() => {
    if (contact.isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingOpacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingOpacity.setValue(0);
    }
  }, [contact.isTyping]);

  // Pulse animation for online dot
  useEffect(() => {
    if (contact.isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [contact.isOnline]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchHistory = async () => {
    if (!id) return;
    try {
      const data = await client.get(`/chat/history/${id}`);
      const transformed: Message[] = data.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderId === user?.id ? 'me' : 'them',
        timestamp: new Date(msg.createdAt),
        status: 'read',
      }));
      setMessages(transformed);
      
      // Fetch user profile to get name and avatar
      try {
        const otherUser = await client.get(`/users/${id}`);
        if (otherUser) {
          setContact(prev => ({
            ...prev,
            name: otherUser.name,
            avatar: otherUser.avatar,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    fetchHistory();

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !connected) return;

    const onNewMessage = (msg: any) => {
      // Only add if it's for this conversation
      if (msg.senderId === id || msg.receiverId === id) {
        setMessages(prev => {
          // 1. Check if ID already exists (DB ID)
          if (prev.find(m => m.id === msg.id)) return prev;

          const isMe = msg.senderId === user?.id;

          // 2. For 'me' messages, check if we have an optimistic message to replace
          if (isMe) {
            // Find by temporary ID (numeric strings) or same content within 5 seconds
            const optimisticIndex = prev.findIndex(m => 
              m.sender === 'me' && 
              m.status === 'sending' && 
              m.text === msg.content
            );

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = {
                ...updated[optimisticIndex],
                id: msg.id,
                status: 'read',
                timestamp: new Date(msg.createdAt),
              };
              return updated;
            }
          }

          const newMsg: Message = {
            id: msg.id,
            text: msg.content,
            sender: isMe ? 'me' : 'them',
            timestamp: new Date(msg.createdAt),
            status: 'read',
          };
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    const onUserTyping = (data: { userId: string }) => {
      if (data.userId === id) {
        setContact(prev => ({ ...prev, isTyping: true }));
      }
    };

    const onUserStopTyping = (data: { userId: string }) => {
      if (data.userId === id) {
        setContact(prev => ({ ...prev, isTyping: false }));
      }
    };

    socket.on('newMessage', onNewMessage);
    socket.on('messageSent', onNewMessage);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messageSent', onNewMessage);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
    };
  }, [socket, connected, id, user?.id]);

  // Update online status from context
  useEffect(() => {
    if (id) {
      setContact(prev => ({
        ...prev,
        isOnline: onlineUsers.includes(id)
      }));
    }
  }, [onlineUsers, id]);

  const handleSend = async () => {
    if (!inputText.trim() || !id || !connected) return;

    const content = inputText.trim();
    const localId = Date.now().toString();
    const newMessage: Message = {
      id: localId,
      localId: localId,
      text: content,
      sender: 'me',
      timestamp: new Date(),
      status: 'sending',
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    sendMessage(id, content);
    emitStopTyping(id);
  };

  const onScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    const isNearBottom = contentHeight - layoutHeight - offsetY < 100;
    setShowScrollToBottom(!isNearBottom);
    
    // Animate the button visibility
    Animated.spring(scrollAnim, {
      toValue: !isNearBottom ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!id) return;
    
    if (text.length > 0) {
      emitTyping(id);
    } else {
      emitStopTyping(id);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupMessages = (msgs: Message[]) => {
    const groups: (Message | { type: 'date'; date: string })[] = [];
    let lastDate = '';

    msgs.forEach((msg) => {
      const dateStr = dayjs(msg.timestamp).format('MMMM D, YYYY');
      const displayDate = dayjs(msg.timestamp).isSame(dayjs(), 'day') 
        ? 'Today' 
        : dayjs(msg.timestamp).isSame(dayjs().subtract(1, 'day'), 'day')
          ? 'Yesterday'
          : dateStr;

      if (displayDate !== lastDate) {
        groups.push({ type: 'date', date: displayDate });
        lastDate = displayDate;
      }
      groups.push(msg);
    });

    return groups;
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    // Correct type handling for union
    const dateItem = item as { type: string; date: string };
    const msgItem = item as Message;

    if (dateItem.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
          <View style={[styles.dateBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>{dateItem.date}</Text>
          </View>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
        </View>
      );
    }

    const isMe = msgItem.sender === 'me';
    const groupedMessages = groupMessages(messages);
    
    // Logic for tails and grouping
    const prevMsg = groupedMessages[index - 1] as any;
    const nextMsg = groupedMessages[index + 1] as any;
    
    const isFirstInGroup = !prevMsg || (prevMsg.type === 'date') || prevMsg.sender !== msgItem.sender;
    const isLastInGroup = !nextMsg || (nextMsg.type === 'date') || nextMsg.sender !== msgItem.sender;
    
    return (
      <View style={[
        styles.messageRow, 
        isMe ? styles.myRow : styles.theirRow,
        isLastInGroup ? { marginBottom: 12 } : { marginBottom: 2 }
      ]}>
        <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
          {/* Avatar for received messages - only show for the last message in a block */}
          {!isMe && (
            <View style={styles.avatarContainer}>
              {isLastInGroup && (
                <Image source={{ uri: getAvatarUrl(contact.avatar) }} style={styles.avatarMini} />
              )}
            </View>
          )}
          
          {/* Message bubble */}
          <View style={[styles.messageContent, isMe && { alignItems: 'flex-end' }]}>
            <View style={[
              styles.messageBubble,
              isMe 
                ? [
                    styles.myMessageBubble, 
                    { backgroundColor: colorScheme === 'dark' ? theme.primary + 'D9' : '#DCF8C6' },
                  ] 
                : [
                    styles.theirMessageBubble, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF', 
                      borderColor: colorScheme === 'dark' ? theme.border : '#EEE', 
                      borderWidth: 1 
                    },
                  ]
            ]}>
              {msgItem.forwarded && (
                <View style={styles.forwardedRow}>
                  <Text style={styles.forwardedText}>
                    <Text style={{ fontStyle: 'italic' }}>➦ Forwarded</Text>
                  </Text>
                </View>
              )}
              
              {msgItem.replyTo && (
                <View style={[
                  styles.replyContainer,
                  { backgroundColor: isMe ? '#C9E9B0' : '#F0F0F0' }
                ]}>
                  <View style={styles.replyBar} />
                  <View style={styles.replyContent}>
                    <Text style={styles.replySender}>{msgItem.replyTo.senderName}</Text>
                    <Text style={styles.replyText} numberOfLines={2}>
                      {msgItem.replyTo.text}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={[
                styles.messageText,
                { color: isMe ? (colorScheme === 'dark' ? '#000' : '#000') : theme.text }
              ]}>
                {msgItem.text}
              </Text>
              
              <View style={styles.timestampRow}>
                <Text style={[styles.inlineTimestamp, { color: isMe ? (colorScheme === 'dark' ? '#075E54' : '#667788') : theme.textSecondary }]}>
                  {formatTime(msgItem.timestamp)}
                </Text>
                {isMe && (
                  <Text style={[styles.checkmark, { color: msgItem.status === 'read' ? '#007AFF' : (colorScheme === 'dark' ? '#075E54' : '#999') }]}>
                    ✓✓
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!contact.isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {contact.name?.charAt(0) || 'U'}
            </Text>
          </View>
        </View>
        <Animated.View 
          style={[
            styles.typingBubble,
            { 
              backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
              opacity: typingOpacity,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }
          ]}
        >
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { backgroundColor: theme.icon }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.icon }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.icon }]} />
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackground: () => (
            <View style={styles.floatingHeaderWrapper}>
              <View style={styles.premiumPill}>
                <ExpoBlurView 
                  intensity={80} 
                  style={StyleSheet.absoluteFill} 
                  tint={colorScheme === 'dark' ? 'dark' : 'light'} 
                />
                <View style={styles.pillContent}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.pillIconBtn}>
                    <ArrowLeft size={26} color={theme.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.pillMainInfo}>
                    <View style={styles.avatarWrapperMini}>
                      <Image 
                        source={{ uri: getAvatarUrl(contact.avatar) }} 
                        style={styles.headerAvatar} 
                      />
                      <Animated.View 
                        style={[
                          styles.headerPulseDot, 
                          { 
                            backgroundColor: contact.isOnline ? '#22C55E' : '#94A3B8',
                            opacity: pulseAnim 
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.headerNameContainer}>
                      <Text style={[styles.headerTitleText, { color: theme.text }]} numberOfLines={1}>
                        {contact.id === user?.id ? `${user?.name} (You)` : (contact.name || 'Chat')}
                      </Text>
                      <Text style={[styles.headerSubtext, { color: theme.textSecondary }]}>
                        {contact.id === user?.id ? 'Message yourself' : (contact.isTyping ? 'typing...' : (contact.isOnline ? 'Online' : 'Offline'))}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.pillIconBtn}>
                    <MoreVertical size={26} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ),
          headerLeft: () => null,
          headerRight: () => null,
          headerBackVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupMessages(messages)}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.type === 'date' ? `date-${item.date}-${index}` : item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderTypingIndicator}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Scroll to Bottom Button */}
        <Animated.View style={[
          styles.scrollToBottom,
          { 
            transform: [{ translateY: scrollAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }],
            opacity: scrollAnim 
          }
        ]}>
          <TouchableOpacity 
            style={[styles.scrollBtn, { backgroundColor: theme.primary }]}
            onPress={scrollToBottom}
          >
            <ArrowLeft size={20} color="white" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
        </Animated.View>

        <View style={[
          styles.whatsappInputWrapper, 
          { 
            backgroundColor: theme.card,
            borderTopColor: theme.border
          }
        ]}>
          <TouchableOpacity style={styles.plusBtn}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <View style={[styles.whatsappInputFrame, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#FFF', borderColor: colorScheme === 'dark' ? '#334155' : '#CCC' }]}>
            <TextInput
              style={[styles.chatInput, { color: theme.text }]}
              placeholder="Message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
            />
            <TouchableOpacity style={styles.stickerBtn}>
              <Smile size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!inputText.trim() ? (
            <View style={styles.inputRightActions}>
              <TouchableOpacity style={styles.inputActionBtn}>
                <Camera size={24} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputActionBtn}>
                <Mic size={24} color="#555" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.whatsappSendBtn} onPress={handleSend}>
              <Send size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHeaderWrapper: {
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginTop: Platform.OS === 'ios' ? -25 : -20,
    paddingBottom: 10,
  },
  premiumPill: {
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    overflow: 'hidden',
    shadowColor: '#2485e7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pillIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatarWrapperMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    backgroundColor: '#FFF',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#DDD',
  },
  headerPulseDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  headerNameContainer: {
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.3,
  },
  headerSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  whatsappWallpaper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -2,
  },
  whatsappInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    zIndex: 100,
  },
  plusBtn: {
    padding: 6,
  },
  plusIcon: {
    fontSize: 30,
    color: '#007AFF',
    fontWeight: '300',
  },
  whatsappInputFrame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  chatInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#000',
    maxHeight: 120,
  },
  stickerBtn: {
    padding: 4,
  },
  inputRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 4,
  },
  inputActionBtn: {
    padding: 4,
  },
  whatsappSendBtn: {
    padding: 4,
    marginRight: 4,
  },
  whatsappSendIcon: {
    color: '#0EA5E9',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 110 : 100,
    paddingBottom: 20,
  },
  scrollToBottom: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    zIndex: 10,
  },
  scrollBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dateHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#D1E6F1',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556677',
    textTransform: 'uppercase',
  },
  messageRow: {
    marginBottom: 4,
    width: '100%',
  },
  myRow: {
    alignItems: 'flex-end',
  },
  theirRow: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  myMessage: {
    flexDirection: 'row-reverse',
  },
  theirMessage: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageContent: {
    flexShrink: 1,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  myMessageBubble: {
    borderTopRightRadius: 5,
    backgroundColor: '#DCF8C6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  theirMessageBubble: {
    borderTopLeftRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#000',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  inlineTimestamp: {
    fontSize: 10,
    color: '#667788',
  },
  checkmark: {
    fontSize: 12,
    color: '#4FC3F7',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#999',
  },
  forwardedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  forwardedText: {
    fontSize: 12,
    color: '#667788',
  },
  replyContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    maxHeight: 60,
  },
  replyBar: {
    width: 4,
    backgroundColor: '#075E54', // WhatsApp dark green accent
  },
  replyContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#075E54',
    marginBottom: 1,
  },
  replyText: {
    fontSize: 13,
    color: '#666',
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
    opacity: 0.5,
  },
});
