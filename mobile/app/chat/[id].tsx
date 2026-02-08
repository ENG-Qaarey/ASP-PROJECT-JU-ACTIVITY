import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Linking,
  Dimensions,
  Animated as RNAnimated,
  StatusBar,
  Keyboard,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  PanResponder,
} from 'react-native';
import type { Animated as RNAnimatedType } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronDown, Send, Paperclip, Smile, Camera, Mic, Info, MoreVertical, Play, Pause, Square, Trash2, Clock, Reply, X, Star, Pin, Share2, FilePlus, Image as ImageIcon, FileText, Download, File, User, Search, Ban, Settings, Bell, BellOff, Users, Zap, Plus, Keyboard as KeyboardIcon, MapPin, Calendar, BarChart2 } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GradientBackground } from '@/src/components/GradientBackground';
import { PremiumMessageBubble } from '@/src/components/PremiumMessageBubble';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { useChat } from '@/src/context/ChatContext';
import { getAvatarUrl } from '@/src/lib/media';
import { IMAGE_BASE } from '@/src/lib/config';
import dayjs from 'dayjs';
import { SwipeableMessage } from '@/src/components/SwipeableMessage';
import { VoiceMessagePlayer } from '@/src/components/chat/VoiceMessagePlayer';
import { ZoomableImageViewer } from '@/src/components/chat/ZoomableImageViewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

const SentTail = ({ color }: { color: string }) => (
  <View style={styles.sentTailContainer}>
    <Svg width={15} height={20} viewBox="0 0 15 20">
      <Path
        d="M0,0 C7.5,0 15,10 15,20 L15,0 L0,0 Z"
        fill={color}
        transform="scale(-1, 1) translate(-15, 0)"
      />
    </Svg>
  </View>
);

const ReceivedTail = ({ color }: { color: string }) => (
  <View style={styles.receivedTailContainer}>
    <Svg width={15} height={20} viewBox="0 0 15 20">
      <Path
        d="M0,0 C7.5,0 15,10 15,20 L15,0 L0,0 Z"
        fill={color}
      />
    </Svg>
  </View>
);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'audio' | 'image' | 'video' | 'file';
  localId?: string;
  forwarded?: boolean;
  fileName?: string;
  replyTo?: {
    senderName: string;
    text: string;
    type?: 'text' | 'audio' | 'image' | 'video' | 'file';
    fileName?: string;
  };
  starred?: boolean;
  pinned?: boolean;
  reactions?: string[];
  fileSize?: string;
  fileExt?: string;
  pdfPages?: number;
  isDeleted?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isTyping: boolean;
  isRecording?: boolean;
}

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

const getFormattedReplyText = (replyTo: any) => {
  if (!replyTo) return '';
  if (replyTo.type === 'image') return '📸 Photo';
  if (replyTo.type === 'audio') return '🎤 Voice Message';
  if (replyTo.type === 'video') return '🎥 Video';
  if (replyTo.type === 'file') return '📁 File';
  return replyTo.text;
};

function ChatVideoPlayerContent({ url, onClose }: { url: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.muted = false;
  });
  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={true}
        contentFit="contain"
      />
      <TouchableOpacity
        onPress={onClose}
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <X size={28} color="#FFF" />
      </TouchableOpacity>
    </>
  );
}

const mockContact: Contact = {
  id: '1',
  name: 'Amin Daahir',
  avatar: '', 
  isOnline: true,
  isTyping: false,
};

export default function ChatScreen() {
  const router = useRouter();
  const { id, isGroup, title, image } = useLocalSearchParams() as { id: string; isGroup?: string; title?: string; image?: string };
  const { user } = useAuth();
  const { socket, connected, sendMessage, emitTyping, emitStopTyping, emitDeleteMessage, emitRecording, emitStopRecording, onlineUsers } = useChat();
  const colorScheme = useColorScheme() ?? 'light';
  const baseTheme = Colors[colorScheme];
  
  // Wallpaper & Theme State
  const [wallpaper, setWallpaper] = useState<any>(null);
  const [customThemeColor, setCustomThemeColor] = useState<string | null>(null);

  const theme = useMemo(() => ({
    ...baseTheme,
    primary: customThemeColor || baseTheme.primary,
  }), [baseTheme, customThemeColor]);
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const insets = useSafeAreaInsets();
  
  const isGroupChat = isGroup === 'true';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [contact, setContact] = useState<Contact>({
    id: id || '',
    name: title || 'Loading...',
    avatar: image || '',
    isOnline: !isGroupChat && id ? onlineUsers.some(uid => String(uid) === String(id)) : false,
    isTyping: false,
    isRecording: false,
  });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState('off');
  
  // Undo Deletion State
  const [undoData, setUndoData] = useState<{ message: Message; type: 'me' | 'everyone'; timer: number } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const recorderIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  
  const [isRestricted, setIsRestricted] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

  type GroupedMessageItem = Message | { type: 'date'; date: string };

  // Quick Actions
  const handleMute = () => {
    setIsMuted(!isMuted);
    setShowOptionsMenu(false);
    // Here you would typically sync with backend
  };

  const handleClearChat = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear this chat?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (id) {
                await client.delete(`/chat/clear/${id}`);
                setMessages([]);
                // Save cleared state locally as a fallback
                await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
              }
            } catch (err) {
              console.error('Failed to clear chat on server:', err);
              // Still clear locally for better UX
              setMessages([]);
            }
          } 
        }
      ]
    );
  };
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  
  // Voice Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [waveData, setWaveData] = useState<number[]>(new Array(25).fill(4));
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [viewerVideoUrl, setViewerVideoUrl] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadVisualSettings();
    }, [id])
  );

  const loadVisualSettings = async () => {
      if(!id) return;
      try {
        const wp = await AsyncStorage.getItem(`chat_wallpaper_${id}`);
        const color = await AsyncStorage.getItem(`chat_theme_color_${id}`);
        
        if(wp) {
            setWallpaper(JSON.parse(wp));
        } else {
            setWallpaper(null);
        }
        
        if(color) {
            setCustomThemeColor(color);
        } else {
            setCustomThemeColor(null);
        }

        if (isGroupChat) {
          const restricted = await AsyncStorage.getItem(`chat_restricted_${id}`);
          setIsRestricted(restricted === 'true');
          
          // Check if user is admin or coordinator
          try {
            const members = await client.get(`/activities/${id}/members`);
            const memberInfo = members.find((m: any) => m.id === user?.id);
            const isPlatformAdmin = user?.role === 'admin' || user?.role === 'coordinator';
            setIsUserAdmin(isPlatformAdmin || (memberInfo?.isGroupAdmin ?? false));
          } catch (e) {
            console.log('Failed to check admin status', e);
          }
        }
      } catch (e) {
        console.error("Failed to load visual settings", e);
      }
  };

  const clearUndoTimer = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoTimerRef.current = null;
    undoIntervalRef.current = null;
  };

  const clearRecorderInterval = () => {
    if (recorderIntervalRef.current) {
      clearInterval(recorderIntervalRef.current);
      recorderIntervalRef.current = null;
    }
  };

  const executeDelete = (msgId: string, type: 'me' | 'everyone') => {
    emitDeleteMessage(msgId, String(id), type, isGroupChat);
    setUndoData(null);
    clearUndoTimer();
  };

  const handleUndo = () => {
    if (undoData) {
      setMessages(prev => {
        // If it was 'everyone' delete, the message exists as a placeholder. We should replace it.
        if (undoData.type === 'everyone') {
          return prev.map(m => m.id === undoData.message.id ? undoData.message : m);
        }
        
        // If it was 'me' delete, it was removed. We insert it back.
        // Check if it somehow still exists to be safe
        const exists = prev.find(m => m.id === undoData.message.id);
        if (exists) return prev.map(m => m.id === undoData.message.id ? undoData.message : m);
        
        return [...prev, undoData.message].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setUndoData(null);
    clearUndoTimer();
  };

  const handleDeleteMessage = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    setIsContextMenuVisible(false);

    const startUndoFlow = (type: 'me' | 'everyone') => {
      clearUndoTimer();
      const messageToUndo = { ...msg };
      
      // 1. Locally update state based on delete type
      if (type === 'everyone') {
        // Optimistic update for everyone delete: show placeholder
        setMessages(prev => prev.map(m => 
          m.id === msgId 
            ? { ...m, isDeleted: true, text: "This message was deleted", type: 'text', pdfPages: undefined, replyTo: undefined } 
            : m
        ));
      } else {
        // Optimistic update for me delete: remove from view
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
      
      // 2. Set undo data
      setUndoData({ message: messageToUndo, type, timer: 10 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 3. Start countdown
      undoIntervalRef.current = setInterval(() => {
        setUndoData(prev => {
          if (!prev || prev.timer <= 1) {
            if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
            return null;
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);

      // 4. Set final execution timer
      undoTimerRef.current = setTimeout(() => {
        executeDelete(msgId, type);
      }, 10000);
    };

    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress: () => void }[] = [
      {
        text: 'Delete for Me',
        style: 'destructive' as const,
        onPress: () => startUndoFlow('me')
      }
    ];

    if (msg.sender === 'me') {
      options.push({
        text: 'Delete for Everyone',
        style: 'destructive' as const,
        onPress: () => startUndoFlow('everyone')
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel' as const,
      onPress: () => {}
    });

    Alert.alert(
      'Delete Message?',
      'Choose how you want to delete this message.',
      options,
      { cancelable: true }
    );
  };

  const toggleStarMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, starred: !m.starred } : m
    ));
    setIsContextMenuVisible(false);
  };

  const togglePinMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, pinned: !m.pinned } : m
    ));
    setIsContextMenuVisible(false);
  };

  const addReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reactionsArr = m.reactions || [];
        // If the same emoji is clicked, remove it. Otherwise, set it as the only reaction.
        if (reactionsArr.includes(emoji)) {
          return { ...m, reactions: [] };
        }
        return { ...m, reactions: [emoji] };
      }
      return m;
    }));
    setIsContextMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const activeMessage = messages.find(m => m.id === activeMessageId);

  const scrollAnim = useRef(new RNAnimated.Value(0)).current;
  const typingOpacity = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  // Simulate typing indicator
  useEffect(() => {
    if (contact.isTyping) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(typingOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(typingOpacity, {
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
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(pulseAnim, {
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

  const fetchHistory = async (showLoader = false) => {
    const startTime = Date.now();
    if (showLoader) setLoading(true);
    if (!id) return;
    try {
      const endpoint = isGroupChat ? `/chat/ghistory/${id}` : `/chat/history/${id}`;
      const data = await client.get(endpoint);
      
      if (!isGroupChat) {
        client.post(`/chat/read/${id}`, {}).catch(err => console.error('Failed to mark as read:', err));
      }
      
      // Check if chat was cleared locally
      const clearedTimeStr = await AsyncStorage.getItem(`chat_cleared_${id}`);
      const clearedTime = clearedTimeStr ? parseInt(clearedTimeStr) : 0;

      const transformed: Message[] = (data as any[])
        .filter((msg: any) => new Date(msg.createdAt).getTime() > clearedTime)
        .map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderId === user?.id ? 'me' : 'them',
        senderName: msg.sender?.name,
        senderAvatar: msg.sender?.avatar,
        timestamp: new Date(msg.createdAt),
        status: 'read',
        type: msg.type || 'text',
        fileName: msg.metadata?.fileName,
        fileSize: msg.metadata?.fileSize,
        fileExt: msg.metadata?.fileExt,
        pdfPages: msg.metadata?.pdfPages,
        replyTo: msg.replyTo,
        isDeleted: msg.isDeleted,
      }));
      setMessages(transformed);
      
      // Fetch profile / group info
      if (isGroupChat) {
        // For activity group chats, use the passed title and image
        setContact(prev => ({
          ...prev,
          name: title || prev.name || 'Activity Group',
          avatar: image || prev.avatar || '', 
          isOnline: false,
        }));
      } else {
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
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDelay = 2000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      // Auto-scroll to bottom when keyboard opens
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    fetchHistory(true);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearUndoTimer();
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !connected) return;

    const onNewMessage = (msg: any) => {
      // Logic for determining if message is for THIS chat
      const isForThisChat = isGroupChat
        ? msg.groupId === id
        : (msg.senderId === id || msg.receiverId === id);

      if (isForThisChat) {
        // Mark as read if it's from them and we are in the chat (only for private chats)
        if (!isGroupChat && msg.senderId === id) {
          client.post(`/chat/read/${id}`, {}).catch(err => console.error('Failed to mark as read:', err));
        }
        setMessages(prev => {
          // 1. Check if ID already exists (DB ID)
          if (prev.find(m => m.id === msg.id)) return prev;

          const isMe = msg.senderId === user?.id;

          // 2. For 'me' messages, check if we have an optimistic message to replace
          if (isMe) {
            const optimisticIndex = prev.findIndex(m => 
              m.sender === 'me' && 
              (m.status === 'sending' || m.id === msg.id) && 
              m.text === msg.content
            );

            if (optimisticIndex !== -1) {
              if (prev[optimisticIndex].id === msg.id && prev[optimisticIndex].status === 'read') {
                return prev;
              }

              const updated = [...prev];
              const meta = msg.metadata || {};
              updated[optimisticIndex] = {
                ...updated[optimisticIndex],
                id: msg.id,
                status: 'read',
                timestamp: new Date(msg.createdAt),
                fileName: meta.fileName ?? updated[optimisticIndex].fileName,
                fileSize: meta.fileSize ?? updated[optimisticIndex].fileSize,
                fileExt: meta.fileExt ?? updated[optimisticIndex].fileExt,
                pdfPages: meta.pdfPages ?? updated[optimisticIndex].pdfPages,
              };
              return updated;
            }
          }

          const newMsg: Message = {
            id: msg.id,
            text: msg.content,
            sender: isMe ? 'me' : 'them',
            senderName: msg.sender?.name, // Important for group chat
            senderAvatar: msg.sender?.avatar,
            timestamp: new Date(msg.createdAt),
            status: 'read',
            type: msg.type || 'text',
            fileName: msg.metadata?.fileName,
            fileSize: msg.metadata?.fileSize,
            fileExt: msg.metadata?.fileExt,
            pdfPages: msg.metadata?.pdfPages,
            replyTo: msg.replyTo,
          };
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    const onUserTyping = (data: { userId: string; groupId?: string }) => {
      if (String(data.userId) === String(user?.id)) return;
      const isRelevant = isGroupChat ? data.groupId === id : data.userId === id;
      if (isRelevant) {
        setContact(prev => ({ ...prev, isTyping: true }));
      }
    };

    const onUserStopTyping = (data: { userId: string; groupId?: string }) => {
      if (String(data.userId) === String(user?.id)) return;
      const isRelevant = isGroupChat ? data.groupId === id : data.userId === id;
      if (isRelevant) {
        setContact(prev => ({ ...prev, isTyping: false }));
      }
    };

    const onUserRecording = (data: { userId: string; groupId?: string }) => {
      if (String(data.userId) === String(user?.id)) return;
      const isRelevant = isGroupChat ? data.groupId === id : data.userId === id;
      if (isRelevant) {
        setContact(prev => ({ ...prev, isRecording: true }));
      }
    };

    const onUserStopRecording = (data: { userId: string; groupId?: string }) => {
      if (String(data.userId) === String(user?.id)) return;
      const isRelevant = isGroupChat ? data.groupId === id : data.userId === id;
      if (isRelevant) {
        setContact(prev => ({ ...prev, isRecording: false }));
      }
    };

    const onMessageDeleted = (data: { messageId: string; deleteType?: 'me' | 'everyone'; groupId?: string }) => {
      const isRelevant = isGroupChat ? data.groupId === id : true;
      if (!isRelevant) return;
      if (data.deleteType === 'everyone') {
        setMessages(prev => prev.map(m => 
          m.id === data.messageId 
            ? { ...m, isDeleted: true, text: 'This message was deleted', type: 'text' } 
            : m
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    socket.on('newMessage', onNewMessage);
    socket.on('messageSent', onNewMessage);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);
    socket.on('userRecording', onUserRecording);
    socket.on('userStopRecording', onUserStopRecording);
    socket.on('messageDeleted', onMessageDeleted);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messageSent', onNewMessage);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
      socket.off('userRecording', onUserRecording);
      socket.off('userStopRecording', onUserStopRecording);
      socket.off('messageDeleted', onMessageDeleted);
    };
  }, [socket, connected, id, user?.id]);

  // Update online status from context
  useEffect(() => {
    if (id && !isGroupChat) {
      setContact(prev => ({
        ...prev,
        isOnline: onlineUsers.some(uid => String(uid) === String(id))
      }));
    }
  }, [onlineUsers, id]);

  // Load chat-specific settings on focus
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        AsyncStorage.getItem(`chat_disappearing_${id}`).then((timer: string | null) => {
          if (timer) setDisappearingTimer(timer);
        });
      }
    }, [id])
  );

  const handleSend = async () => {
    if (!inputText.trim() || !id || !connected) return;
    
    if (isRestricted && !isUserAdmin) {
      Alert.alert('Restricted', 'Only admins can send messages in this group.');
      return;
    }

    const content = inputText.trim();
    const localId = Date.now().toString();
    const newMessage: Message = {
      id: localId,
      localId: localId,
      text: content,
      sender: 'me',
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      ...(replyTo ? { 
        replyTo: { 
          senderName: replyTo.sender === 'me' ? 'You' : contact.name, 
          text: replyTo.text,
          type: replyTo.type 
        } 
      } : {}),
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setReplyTo(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    sendMessage(id, content, 'text', newMessage.replyTo, undefined, isGroupChat);
    emitStopTyping(id, isGroupChat);
  };

  const onScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    const isNearBottom = contentHeight - layoutHeight - offsetY < 100;
    setShowScrollToBottom(!isNearBottom);
    
    // Animate the button visibility
    RNAnimated.spring(scrollAnim, {
      toValue: !isNearBottom ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Handle input changes
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!id) return;
    
    if (text.length > 0) {
      emitTyping(id, isGroupChat);
    } else {
      emitStopTyping(id, isGroupChat);
    }

  };

  // Waveform Animation Logic
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        LayoutAnimation.configureNext(LayoutAnimation.create(70, LayoutAnimation.Types.linear, LayoutAnimation.Properties.opacity));
        setWaveData(new Array(30).fill(0).map((_, i) => {
            const t = Date.now() / 150;
            const wave1 = Math.sin(t + i / 5) * 8;
            const wave2 = Math.cos(t * 1.5 - i / 3) * 5;
            const noise = Math.random() * 4;
            return Math.max(2, 12 + wave1 + wave2 + noise); 
        }));
      }, 70);
    } else if (!isRecording) {
      setWaveData(new Array(25).fill(4));
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Voice Recording functions
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {
          // Ignore error if already unloaded or if it fails during cleanup
        });
      }
    };
  }, [recording]);

  const startRecording = async () => {
    if (isRestricted && !isUserAdmin) {
      Alert.alert('Restricted', 'Only admins can send messages in this group.');
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Emit start recording event
      emitRecording(String(id), isGroupChat);

      // Start duration timer
      recorderIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
            setRecordingDuration(prev => prev + 1);
        }
      }, 1000);

      // Vibrate on start
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  // We need a ref to track paused state for the interval
  const isPausedRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Timer logic
  useEffect(() => {
      let interval: any;
      if (isRecording) {
          interval = setInterval(() => {
              if (!isPausedRef.current) {
                  setRecordingDuration(prev => prev + 1);
              }
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  const togglePause = async () => {
      if (!recording) return;
      try {
          if (isPaused) {
              await recording.startAsync(); // Resume
              setIsPaused(false);
          } else {
              await recording.pauseAsync(); // Pause
              setIsPaused(true);
          }
      } catch (err) {
          console.error('Failed to toggle pause', err);
      }
  };


  const stopRecording = async (shouldSend = true) => {
    if (!recording) return;
    
    setIsRecording(false);
    setIsPaused(false);
    // Interval cleared by useEffect
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI(); 
        setRecording(null);
        clearRecorderInterval();
        
        // Emit stop recording event
        emitStopRecording(String(id));

        if (shouldSend && uri) {
          // If duration is too short (< 1s), might be accidental tap
          uploadAndSendVoice(uri);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadAndSendVoice = async (uri: string) => {
    if (!id || !connected) return;
    
    const localId = Date.now().toString();
    const optimisticMessage: Message = {
      id: localId,
      localId: localId,
      text: uri, // Use local URI for potential preview/local playback if needed
      sender: 'me',
      timestamp: new Date(),
      status: 'sending',
      type: 'audio',
    };

    // 1. Show message immediately
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, optimisticMessage]);

    setIsUploadingVoice(true);
    try {
      // 2. Prepare form data for upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'voice.m4a';
      const type = 'audio/m4a';
      
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      // 3. Upload to server
      const response = await client.post('/chat/upload', formData);
      const audioUrl = response.url;

      // 4. Update message state with real URL - but keep it 'sending' until socket confirms
      setMessages(prev => prev.map(m => 
        m.localId === localId ? { ...m, text: audioUrl } : m
      ));
      
      // 5. Send via socket
      sendMessage(id, audioUrl, 'audio');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Voice upload failed', err);
      // Mark as failed
      setMessages(prev => prev.map(m => 
        m.localId === localId ? { ...m, status: 'sending' } : m // Could add 'error' status if supported
      ));
      Alert.alert('Error', 'Failed to upload voice message.');
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const uploadAndSendMessage = async (uri: string, type: 'image' | 'video' | 'file' | 'audio', originalName?: string, size?: number) => {
    if (!id || !connected) return;

    const localId = Date.now().toString();
    const ext = (originalName || uri.split('/').pop() || '').split('.').pop()?.toLowerCase();
    const defaultName = type === 'image' ? 'image.jpg' : type === 'video' ? 'video.mp4' : type === 'audio' ? 'audio.m4a' : 'file.bin';
    const filename = originalName || uri.split('/').pop() || defaultName;

    const formatSize = (bytes?: number) => {
      if (!bytes) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const optimisticMessage: Message = {
      id: localId,
      localId: localId,
      text: uri,
      fileName: type === 'file' || type === 'video' ? filename : undefined,
      fileSize: formatSize(size),
      fileExt: ext,
      pdfPages: filename.endsWith('.pdf') ? 72 : undefined,
      sender: 'me',
      timestamp: new Date(),
      status: 'sending',
      type: type,
      ...(replyTo ? {
        replyTo: {
          senderName: replyTo.sender === 'me' ? 'You' : contact.name,
          text: replyTo.text,
          type: replyTo.type,
          fileName: replyTo.fileName
        }
      } : {}),
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyTo(null);

    try {
      const formData = new FormData();
      let mimeType = 'application/octet-stream';
      if (type === 'image') mimeType = 'image/jpeg';
      else if (type === 'audio') mimeType = 'audio/m4a';
      else if (type === 'video') {
        const videoMimes: Record<string, string> = {
          'mp4': 'video/mp4', 'mov': 'video/quicktime', 'm4v': 'video/x-m4v',
          'webm': 'video/webm', '3gp': 'video/3gpp',
        };
        mimeType = (ext && videoMimes[ext]) ? videoMimes[ext] : 'video/mp4';
      } else {
        const mimes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'zip': 'application/zip',
        };
        if (ext && mimes[ext]) mimeType = mimes[ext];
      }

      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await client.post<{ url: string; mimetype?: string; size?: number }>('/chat/upload', formData);
      const fileUrl = response?.url;
      if (!fileUrl) {
        throw new Error('Server did not return a file URL');
      }

      setMessages(prev => prev.map(m =>
        m.localId === localId ? { ...m, text: fileUrl } : m
      ));

      sendMessage(id, fileUrl, type, optimisticMessage.replyTo, {
        fileName: optimisticMessage.fileName,
        fileSize: optimisticMessage.fileSize,
        fileExt: optimisticMessage.fileExt,
        pdfPages: optimisticMessage.pdfPages
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      console.error('File upload failed', err);
      setMessages(prev => prev.filter(m => m.localId !== localId));
      const msg = err?.message || '';
      if (msg.includes('413') || msg.toLowerCase().includes('too large')) {
        Alert.alert('Upload Failed', 'File is too large. Maximum size is 100 MB.');
      } else {
        Alert.alert('Upload Failed', 'There was an error uploading your file. Please try again.');
      }
    }
  };

  const handleCamera = async () => {
    try {
      setShowAttachmentMenu(false);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permission.status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        const name = (asset as any).fileName ?? (mediaType === 'video' ? 'video.mp4' : 'image.jpg');
        const size = (asset as any).fileSize;
        uploadAndSendMessage(asset.uri, mediaType, name, size);
      }
    } catch (err) {
      console.error('Camera launch failed', err);
    }
  };

  const handlePickImage = async () => {
    try {
      setShowAttachmentMenu(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        const name = (asset as any).fileName ?? (mediaType === 'video' ? 'video.mp4' : 'image.jpg');
        const size = (asset as any).fileSize;
        uploadAndSendMessage(asset.uri, mediaType, name, size);
      }
    } catch (err) {
      console.error('Image picking failed', err);
    }
  };

  const handleOpenFile = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${IMAGE_BASE}${url}`;
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', "Don't know how to open this URL: " + fullUrl);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const handlePickDocument = async () => {
    try {
      setShowAttachmentMenu(false);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        uploadAndSendMessage(asset.uri, 'file', asset.name, asset.size);
      }
    } catch (err) {
      console.error('Document picking failed', err);
    }
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
    
    // Logic for tails and grouping
    const prevMsg = groupedMessages[index - 1] as any;
    const nextMsg = groupedMessages[index + 1] as any;
    
    const isFirstInGroup = !prevMsg || (prevMsg.type === 'date') || prevMsg.sender !== msgItem.sender;
    const isLastInGroup = !nextMsg || (nextMsg.type === 'date') || nextMsg.sender !== msgItem.sender;
    
    return (
      <SwipeableMessage
        onSwipeReply={() => setReplyTo(msgItem)}
        theme={theme}
        isMe={isMe}
      >
        <View style={[
          styles.messageRow, 
          isMe ? styles.myRow : styles.theirRow,
          isLastInGroup ? { marginBottom: 12 } : { marginBottom: 2 }
        ]}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setActiveMessageId(msgItem.id);
              setIsContextMenuVisible(true);
            }}
            delayLongPress={500}
            style={[
              styles.messageContainer, 
              isMe ? styles.myMessage : styles.theirMessage,
              selectedMessages.has(msgItem.id) && { opacity: 0.7 }
            ]}
          >
            {/* Avatar for received messages - only show for the last message in a block */}
            {!isMe && (
              <View style={styles.avatarContainer}>
                {(isLastInGroup || isGroupChat) && (
                  <Image
                    source={
                      isGroupChat
                        ? getAvatarUrl(msgItem.senderAvatar || '', false)
                        : getAvatarUrl(contact.avatar, false)
                    }
                    style={styles.avatarMini}
                  />
                )}
              </View>
            )}
            
            {/* Message bubble */}
            <View style={[styles.messageContent, isMe && { alignItems: 'flex-end' }]}>
                {isMe ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <PremiumMessageBubble
                      msgItem={msgItem}
                      isMe={isMe}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                      theme={theme}
                      colorScheme={colorScheme as any}
                      formatTime={formatTime}
                      getFormattedReplyText={getFormattedReplyText}
                      setViewerImageUrl={setViewerImageUrl}
                      setViewerVideoUrl={setViewerVideoUrl}
                      handleOpenFile={handleOpenFile}
                      VoiceMessageComponent={VoiceMessagePlayer}
                      playingAudioId={playingAudioId}
                      setPlayingAudioId={setPlayingAudioId}
                      userAvatar={user?.avatar}
                      contactAvatar={msgItem.senderAvatar || contact.avatar}
                      isGroup={isGroupChat}
                    />

                    {msgItem.reactions && msgItem.reactions.length > 0 && (
                      <View style={[styles.bubbleReactions, { alignSelf: 'flex-end', marginRight: 4, marginTop: -4 }]}>
                        {msgItem.reactions.map((emoji, i) => (
                          <Text key={i} style={styles.bubbleReactionEmoji}>{emoji}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ alignItems: 'flex-start' }}>
                    <PremiumMessageBubble
                      msgItem={msgItem}
                      isMe={isMe}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                      theme={theme}
                      colorScheme={colorScheme as any}
                      formatTime={formatTime}
                      getFormattedReplyText={getFormattedReplyText}
                      setViewerImageUrl={setViewerImageUrl}
                      setViewerVideoUrl={setViewerVideoUrl}
                      handleOpenFile={handleOpenFile}
                      VoiceMessageComponent={VoiceMessagePlayer}
                      playingAudioId={playingAudioId}
                      setPlayingAudioId={setPlayingAudioId}
                      userAvatar={user?.avatar}
                      contactAvatar={msgItem.senderAvatar || contact.avatar}
                      isGroup={isGroupChat}
                    />

                    {msgItem.reactions && msgItem.reactions.length > 0 && (
                      <View style={[styles.bubbleReactions, { alignSelf: 'flex-start', marginLeft: 4, marginTop: -4 }]}>
                        {msgItem.reactions.map((emoji, i) => (
                          <Text key={i} style={styles.bubbleReactionEmoji}>{emoji}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
            </View>
          </TouchableOpacity>
        </View>
      </SwipeableMessage>
    );
  };

  // Animated dots for typing indicator
  const typingDot1 = useRef(new RNAnimated.Value(0)).current;
  const typingDot2 = useRef(new RNAnimated.Value(0)).current;
  const typingDot3 = useRef(new RNAnimated.Value(0)).current;
  const typingScale = useRef(new RNAnimated.Value(0)).current;
  const typingDotScale1 = useRef(new RNAnimated.Value(1)).current;
  const typingDotScale2 = useRef(new RNAnimated.Value(1)).current;
  const typingDotScale3 = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (contact.isTyping) {
      // Scale in animation
      RNAnimated.spring(typingScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Enhanced bouncing dots animation with scale
      const createBounceAnimation = (animValue: RNAnimatedType.Value, scaleValue: RNAnimatedType.Value, delay: number) => {
        return RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.delay(delay),
            RNAnimated.parallel([
              RNAnimated.timing(animValue, {
                toValue: -6,
                duration: 350,
                useNativeDriver: true,
              }),
              RNAnimated.timing(scaleValue, {
                toValue: 1.2,
                duration: 350,
                useNativeDriver: true,
              }),
            ]),
            RNAnimated.parallel([
              RNAnimated.timing(animValue, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
              }),
              RNAnimated.timing(scaleValue, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
              }),
            ]),
            RNAnimated.delay(600 - delay),
          ])
        );
      };

      const anim1 = createBounceAnimation(typingDot1, typingDotScale1, 0);
      const anim2 = createBounceAnimation(typingDot2, typingDotScale2, 150);
      const anim3 = createBounceAnimation(typingDot3, typingDotScale3, 300);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      // Scale out animation
      RNAnimated.timing(typingScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
      typingDotScale1.setValue(1);
      typingDotScale2.setValue(1);
      typingDotScale3.setValue(1);
    }
  }, [contact.isTyping]);

  const renderTypingIndicator = () => {
    if (!contact.isTyping && !contact.isRecording) return null;

    if (contact.isRecording) {
      return (
        <RNAnimated.View 
          style={[
            styles.typingContainerClean,
            {
              opacity: typingScale,
              transform: [{ scale: typingScale }],
            }
          ]}
        >
          <Mic size={12} color="#EC4899" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 12, color: '#EC4899', fontWeight: '500' }}>
            Recording audio...
          </Text>
        </RNAnimated.View>
      );
    }

    return (
      <RNAnimated.View 
        style={[
          styles.typingContainerClean,
          {
            opacity: typingScale,
            transform: [{ scale: typingScale }],
          }
        ]}
      >
        <View style={styles.typingDotsContainer}>
          <RNAnimated.View 
            style={[
              styles.typingDot,
              { 
                backgroundColor: theme.textSecondary,
                opacity: 0.6,
                transform: [
                  { translateY: typingDot1 },
                  { scale: typingDotScale1 }
                ],
              }
            ]} 
          />
          
          <RNAnimated.View 
            style={[
              styles.typingDot,
              { 
                backgroundColor: theme.textSecondary,
                opacity: 0.6,
                transform: [
                  { translateY: typingDot2 },
                  { scale: typingDotScale2 }
                ],
              }
            ]} 
          />
          
          <RNAnimated.View 
            style={[
              styles.typingDot,
              { 
                backgroundColor: theme.textSecondary,
                opacity: 0.6,
                transform: [
                  { translateY: typingDot3 },
                  { scale: typingDotScale3 }
                ],
              }
            ]} 
          />
        </View>
      </RNAnimated.View>
    );
  };

  return (
    <GradientBackground>
      {wallpaper && (
        wallpaper.type === 'gradient' ? (
             <LinearGradient 
                colors={(colorScheme === 'dark' && wallpaper.darkColors) ? wallpaper.darkColors : wallpaper.colors} 
                style={StyleSheet.absoluteFill} 
                start={wallpaper.start || { x: 0, y: 0 }} 
                end={wallpaper.end || { x: 1, y: 1 }}
             />
        ) : wallpaper.type === 'solid' ? (
             <View style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? (wallpaper.dark || wallpaper.color) : (wallpaper.light || wallpaper.color) }]} />
        ) : null
      )}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {/* Floating Header - Rendered in component for consistent cross-platform behavior */}
        <View style={[styles.floatingHeaderWrapper, { paddingTop: insets.top + 8 }]}>
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
                <View style={[
                  styles.avatarWrapperMini, 
                  isGroupChat && { overflow: 'hidden', borderWidth: 1, borderColor: colorScheme === 'dark' ? theme.primary + '30' : 'rgba(0,0,0,0.05)' }
                ]}>
                  {isGroupChat && !contact.avatar ? (
                    <>
                      <LinearGradient
                        colors={colorScheme === 'dark' ? [theme.primary, '#0369A1'] : ['#E0F2FE', '#BAE6FD']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Users size={22} color={colorScheme === 'dark' ? '#FFF' : theme.primary} strokeWidth={2} />
                        <View style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: theme.primary, borderRadius: 5, padding: 0.5, borderWidth: 1, borderColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }}>
                           <Zap size={6} color="#FFF" fill="#FFF" />
                        </View>
                      </View>
                    </>
                  ) : (
                    <Image 
                      source={getAvatarUrl(contact.avatar, isGroupChat)} 
                      style={styles.headerAvatar} 
                    />
                  )}
                  <RNAnimated.View 
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.headerTitleText, { color: theme.text }]} numberOfLines={1}>
                      {contact.id === user?.id ? `${user?.name} (You)` : (contact.name || 'Chat')}
                    </Text>
                    {disappearingTimer !== 'off' && (
                      <Clock size={12} color={theme.primary} strokeWidth={2.5} />
                    )}
                  </View>
                  <Text style={[styles.headerSubtext, { color: (contact.isRecording || contact.isTyping) ? (contact.isRecording ? '#EC4899' : theme.primary) : theme.textSecondary }]}>
                    {contact.isRecording ? 'Recording audio...' : 
                     contact.isTyping ? 'typing...' : 
                     isGroupChat ? 'Activity Group Chat' :
                     contact.id === user?.id ? 'Message yourself' : 
                     contact.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.pillIconBtn} onPress={() => setShowOptionsMenu(!showOptionsMenu)}>
                <MoreVertical size={26} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList<GroupedMessageItem>
            ref={flatListRef}
            data={groupedMessages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.type === 'date' ? `date-${item.date}-${index}` : item.id}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderTypingIndicator}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Scroll to Bottom Button */}
        <RNAnimated.View style={[
          styles.scrollToBottom,
          { 
            transform: [{ translateY: scrollAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }],
            opacity: scrollAnim,
            pointerEvents: showScrollToBottom ? 'auto' : 'none'
          }
        ]}>
          <TouchableOpacity 
            style={[styles.scrollBtn, { backgroundColor: theme.primary }]}
            onPress={scrollToBottom}
          >
            <ChevronDown size={24} color="white" />
          </TouchableOpacity>
        </RNAnimated.View>
        <View style={[
          styles.whatsappInputWrapper, 
          { 
            backgroundColor: theme.card,
            borderTopColor: theme.border
          }
        ]}>
          {/* Reply Preview - Now outside the actions row to stay on top */}
          {!isRecording && replyTo && (
            <View style={[styles.replyToContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : '#f8f9fa', borderLeftColor: theme.primary }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.replyToName, { color: theme.primary }]}>
                  {replyTo.sender === 'me' ? 'You' : contact.name}
                </Text>
                <Text style={[styles.replyToText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {getFormattedReplyText(replyTo)}
                </Text>
              </View>
              {replyTo.type === 'image' && (
                <TouchableOpacity 
                  onPress={() => setViewerImageUrl(replyTo.text.startsWith('http') ? replyTo.text : `${IMAGE_BASE}${replyTo.text}`)}
                >
                  <Image 
                    source={{ uri: replyTo.text.startsWith('http') ? replyTo.text : `${IMAGE_BASE}${replyTo.text}` }} 
                    style={styles.replyThumbnail}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyCloseBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputActionsRow}>
            {(!isRestricted || isUserAdmin) ? (
              <>
                <TouchableOpacity 
                  style={styles.plusBtn}
                  onPress={() => {
                    if (showAttachmentMenu) {
                      setShowAttachmentMenu(false);
                    } else {
                      Keyboard.dismiss();
                      setTimeout(() => setShowAttachmentMenu(true), 50);
                    }
                  }}
                >
                  {showAttachmentMenu ? (
                    <KeyboardIcon size={26} color={theme.text} />
                  ) : (
                    <Plus size={26} color={theme.primary} />
                  )}
                </TouchableOpacity>

                {isRecording ? (
                  <View style={[styles.recordingPanel, { backgroundColor: 'transparent' }]}>
                    {/* Top Row: Timer + Waveform */}
                    <View style={styles.recordingTopRow}>
                      <Text style={[styles.recordingTimerText, { color: theme.text }]}>
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </Text>
                      <View style={styles.waveformContainer}>
                          {waveData.map((h, i) => (
                              <View 
                                key={i} 
                                style={[
                                  styles.waveBar, 
                                  { 
                                    height: h, 
                                    backgroundColor: i % 2 === 0 ? theme.primary : theme.primary + '66',
                                    opacity: isPaused ? 0.3 : 1
                                  }
                                ]} 
                              />
                          ))}
                      </View>
                    </View>

                    {/* Bottom Row: Controls */}
                    <View style={styles.recordingBottomRow}>
                        <TouchableOpacity onPress={() => stopRecording(false)} style={styles.recordActionBtn}>
                          <Trash2 size={24} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={togglePause} style={styles.recordPauseBtn}>
                           {isPaused ? (
                              <View style={[styles.resumeCircle, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#EF4444' }]}>
                                 <Mic size={20} color="#EF4444" />
                              </View>
                           ) : (
                              <View style={[styles.pauseCircle, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#EF4444' }]}>
                                 <Pause size={20} color="#EF4444" fill="#EF4444" />
                              </View>
                           )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => stopRecording(true)} style={[styles.recordSendBtn, { backgroundColor: '#FFF', width: 48, height: 48, borderRadius: 24 }]}>
                          <Send size={22} color="#000" fill="#000" />
                        </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.whatsappInputFrame, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF', borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
                      <TextInput
                        style={[styles.chatInput, { color: theme.text }]}
                        placeholder="Message..."
                        placeholderTextColor={theme.textSecondary}
                        value={inputText}
                        onChangeText={handleInputChange}
                        multiline
                        keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
                      />
                    </View>

                    {!inputText.trim() ? (
                      <View style={styles.inputRightActions}>
                        <TouchableOpacity style={styles.inputActionBtn} onPress={handleCamera}>
                          <Camera size={24} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.inputActionBtn} 
                          onPress={startRecording}
                        >
                          <Mic size={24} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.whatsappSendBtn} onPress={handleSend}>
                        <Send size={24} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            ) : (
              <View style={[styles.restrictedNoticeBar, { 
                backgroundColor: colorScheme === 'dark' ? '#111827' : '#F1F5F9',
              }]}>
                <Text style={[styles.restrictedNoticeText, { color: theme.textSecondary }]}>
                  Only <Text style={{ color: '#22C55E', fontWeight: '800' }}>admins</Text> can send messages
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {showAttachmentMenu && (
        <View style={[styles.attachmentGrid, { backgroundColor: theme.card }]}>
          {[
            { id: 'camera', label: 'Camera', icon: Camera, color: '#EC407A', onPress: handleCamera },
            { id: 'photos', label: 'Photos', icon: ImageIcon, color: '#AB47BC', onPress: handlePickImage },
            { id: 'document', label: 'Document', icon: FileText, color: '#5C6BC0', onPress: handlePickDocument },
            { id: 'location', label: 'Location', icon: MapPin, color: '#26A69A', onPress: () => {} },
            { id: 'contact', label: 'Contact', icon: User, color: '#42A5F5', onPress: () => {} },
            { id: 'poll', label: 'Poll', icon: BarChart2, color: '#FBC02D', onPress: () => {} },
            { id: 'event', label: 'Event', icon: Calendar, color: '#EF5350', onPress: () => {} },
            { id: 'quick', label: 'Quick replies', icon: Zap, color: '#FF9800', onPress: () => {} },
          ].map((item, index) => (
            <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              item.onPress();
              setShowAttachmentMenu(false);
            }}>
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <item.icon size={26} color="#FFF" />
              </View>
              <Text style={[styles.gridLabel, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Header Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.headerMenuContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }]}>
              <TouchableOpacity 
              style={styles.contextActionItem} 
              onPress={() => {
                setShowOptionsMenu(false);
                if (isGroupChat) {
                  router.push({ pathname: '/chat/group-settings', params: { id, title } });
                } else {
                  router.push({ pathname: '/chat/settings', params: { id } });
                }
              }}
            >
              <Text style={[styles.contextActionText, { color: theme.text }]}>Chat Settings</Text>
              <Settings size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.contextActionItem} onPress={handleMute}>
              <Text style={[styles.contextActionText, { color: theme.text }]}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
              {isMuted ? <Bell size={18} color={theme.textSecondary} /> : <BellOff size={18} color={theme.textSecondary} />}
            </TouchableOpacity>

            <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.contextActionItem} onPress={handleClearChat}>
              <Text style={[styles.contextActionText, { color: '#EF4444' }]}>Clear Chat</Text>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message Context Menu Modal */}
      <Modal
        visible={isContextMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContextMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsContextMenuVisible(false)}
        >
          <ExpoBlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          
          <View style={styles.contextMenuContainer}>
            {/* Reactions Bar */}
            <View style={[styles.reactionsBar, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }]}>
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '🖤'].map((emoji, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.reactionBtn}
                  onPress={() => activeMessageId && addReaction(activeMessageId, emoji)}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Context Actions Menu */}
            <View style={[styles.contextActionsMenu, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }]}>
              <TouchableOpacity style={styles.contextActionItem} onPress={() => {
                 if (activeMessage) setReplyTo(activeMessage);
                 setIsContextMenuVisible(false);
              }}>
                <Text style={[styles.contextActionText, { color: theme.text }]}>Reply</Text>
                <Reply size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={styles.contextActionItem} onPress={() => setIsContextMenuVisible(false)}>
                <Text style={[styles.contextActionText, { color: theme.text }]}>Forward</Text>
                <Share2 size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={styles.contextActionItem} onPress={() => setIsContextMenuVisible(false)}>
                <Text style={[styles.contextActionText, { color: theme.text }]}>Info</Text>
                <Info size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity 
                style={styles.contextActionItem} 
                onPress={() => activeMessageId && toggleStarMessage(activeMessageId)}
              >
                <Text style={[styles.contextActionText, { color: theme.text }]}>
                  {activeMessage?.starred ? 'Unstar' : 'Star'}
                </Text>
                <Star size={18} color={activeMessage?.starred ? '#EAB308' : theme.textSecondary} fill={activeMessage?.starred ? '#EAB308' : 'none'} />
              </TouchableOpacity>

              <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity 
                style={styles.contextActionItem} 
                onPress={() => activeMessageId && togglePinMessage(activeMessageId)}
              >
                <Text style={[styles.contextActionText, { color: theme.text }]}>
                  {activeMessage?.pinned ? 'Unpin' : 'Pin'}
                </Text>
                <Pin size={18} color={activeMessage?.pinned ? '#3B82F6' : theme.textSecondary} fill={activeMessage?.pinned ? '#3B82F6' : 'none'} />
              </TouchableOpacity>

              <View style={[styles.contextMenuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity 
                style={styles.contextActionItem} 
                onPress={() => activeMessageId && handleDeleteMessage(activeMessageId)}
              >
                <Text style={[styles.contextActionText, { color: '#EF4444' }]}>Delete</Text>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>


      {/* Full Screen Image Viewer */}
      <Modal
        visible={!!viewerImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImageUrl(null)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.viewerContainer}>
            <ExpoBlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
            <TouchableOpacity 
              style={styles.viewerCloseBtn} 
              onPress={() => setViewerImageUrl(null)}
            >
              <X size={28} color="#FFF" />
            </TouchableOpacity>
            {viewerImageUrl && (
              <ZoomableImageViewer uri={viewerImageUrl} />
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Full Screen Video Player */}
      <Modal
        visible={!!viewerVideoUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVideoUrl(null)}
      >
        <View style={styles.viewerContainer}>
          <ExpoBlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
          {viewerVideoUrl ? (
            <ChatVideoPlayerContent url={viewerVideoUrl} onClose={() => setViewerVideoUrl(null)} />
          ) : null}
        </View>
      </Modal>

      {/* Undo Delete Snackbar */}
      {undoData && (
        <RNAnimated.View 
          style={[
            styles.undoSnackbar,
            { 
              bottom: isKeyboardVisible ? 10 : 100,
            }
          ]}
        >
          {/* Blur Background */}
          <ExpoBlurView 
            intensity={colorScheme === 'dark' ? 80 : 95} 
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'} 
          />
          
          {/* Vibrant Gradient Border */}
          <LinearGradient
            colors={
              colorScheme === 'dark' 
                ? ['rgba(14, 165, 233, 0.6)', 'rgba(6, 182, 212, 0.4)', 'rgba(14, 165, 233, 0.6)']
                : ['rgba(14, 165, 233, 0.8)', 'rgba(6, 182, 212, 0.6)', 'rgba(14, 165, 233, 0.8)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20, padding: 1.5 }]}
          >
            <View style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(15, 23, 42, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 18.5,
                margin: 1.5,
              }
            ]} />
          </LinearGradient>
          
          <View style={styles.undoContent}>
            {/* Icon with vibrant gradient */}
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['#0EA5E9', '#06B6D4', '#0284C7']
                  : ['#0284C7', '#0EA5E9', '#06B6D4']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.undoIconGradient}
            >
              <Trash2 size={16} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
            
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.undoLabel,
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#0F172A' }
              ]}>
                Message deleted
              </Text>
              <Text style={[
                styles.undoSubtext,
                { color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)' }
              ]}>
                Undoing in {undoData.timer}s...
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.undoBtn} 
            onPress={handleUndo}
          >
            <LinearGradient
              colors={
                colorScheme === 'dark'
                  ? ['#0EA5E9', '#06B6D4']
                  : ['#0284C7', '#0EA5E9']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.undoBtnGradient}
            >
              <Text style={styles.undoBtnText}>UNDO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </RNAnimated.View>
      )}

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
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 0,
    zIndex: 100,
  },
  inputActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 4,
    marginHorizontal: 4,
    gap: 0,
  },
   plusBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappInputFrame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    minHeight: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    paddingVertical: 0,
    marginHorizontal: 4,
  },
  chatInput: {
    flex: 1,
    paddingVertical: 4,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    color: '#000',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  stickerBtn: {
    padding: 8,
    marginBottom: 2,
  },
  inputRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 0,
  },
  inputActionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  whatsappSendBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  whatsappSendIcon: {
    color: '#FFF',
  },
  restrictedNoticeBar: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  restrictedNoticeText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  scrollToBottom: {
    position: 'absolute',
    bottom: 90,
    right: 15,
    zIndex: 9999,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    minHeight: 42,
    justifyContent: 'center',
    position: 'relative',
  },
  sentTailContainer: {
    position: 'absolute',
    bottom: 0,
    right: -8,
  },
  receivedTailContainer: {
    position: 'absolute',
    bottom: 0,
    left: -8,
  },
  imageBubbleContainer: {
    width: 240,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  messageImage: {
    width: '100%',
    height: '100%',
  },
  myMessageBubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  theirMessageBubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
  recordingOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    // We could add animation here if desired
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteRecordingBtn: {
    padding: 8,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 200,
    gap: 10,
  },
  playPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  waveformPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
  },
  durationText: {
    fontSize: 11,
    marginLeft: 10,
  },
  
  // New Recording UI Styles
  recordingPanel: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  recordingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  recordingTimerText: {
    fontSize: 24,
    fontWeight: '400', // Monospace usually needs normal weight
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    width: 80, 
    textAlign: 'left',
    marginRight: 6,
    color: '#F1F5F9',
  },
  liveWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    justifyContent: 'center',
  },
  liveWaveBar: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  recordingBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  recordActionBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordPauseBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2
  },
  resumeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  recordSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A', // Dark/Black color
    justifyContent: 'center',
    alignItems: 'center',
  },

  voicePlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 220,
    paddingVertical: 4,
    gap: 10,
  },
  voiceAvatarContainer: {
    position: 'relative',
  },
  voiceAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEE',
  },
  voiceMicIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSliderContainer: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  voiceSliderTrackOutter: {
    height: 12,
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  voiceSliderTrackDotted: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 1,
    width: '100%',
  },
  voiceSliderThumb: {
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  voiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  voiceDurationText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 0,
  },

  // Options Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  optionsMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
  },
  replyToContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 4,
    marginBottom: 0,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
  },
  replyToName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyToText: {
    fontSize: 13,
  },
  replyCloseBtn: {
    padding: 4,
  },
  replyPreview: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginLeft: 8,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  // replyText: { fontSize: 12 }, // Removed duplicate property

  // Context Menu Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contextMenuContainer: {
    width: '80%',
    alignItems: 'center',
    zIndex: 1001,
  },
  reactionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 10,
    gap: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  reactionBtn: {
    padding: 4,
  },
  addReactionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  contextActionsMenu: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  contextActionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contextActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  contextMenuDivider: {
    height: 1,
    width: '100%',
  },
  bubbleReactions: {
    flexDirection: 'row',
    // Use a default color, override in component if needed
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: -8,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  bubbleReactionEmoji: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    width: 250,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
    overflow: 'hidden',
    padding: 8,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerFullImage: {
    width: '100%',
    height: '80%',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fileBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    maxWidth: 240,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileCard: {
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fileCardBanner: {
    width: '100%',
    height: 120,
  },
  fileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    paddingBottom: 6,
  },
  fileCardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCardExtLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  fileCardInfo: {
    flex: 1,
  },
  fileCardName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  fileCardMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  fileCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  fileCardTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  fileCardCheckmark: {
    fontSize: 14,
    color: '#38BDF8',
  },
  forwardBtnMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIconContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerMenuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70, // Adjust based on header height + status bar
    right: 16,
    width: 180,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  // Enhanced Typing Indicator Styles
  typingContainerClean: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Undo Deletion Styles
  undoSnackbar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 10000,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  undoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  undoIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  undoLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  undoSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  undoBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  undoBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  undoBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Attachment Menu Grid Styles
  attachmentGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 20,
    paddingHorizontal: 10,
    minHeight: 330,
    paddingBottom: 40,
  },
  gridItem: {
    width: '25%', 
    alignItems: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gridLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
