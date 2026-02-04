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
import { 
  GestureHandlerRootView, 
  GestureDetector, 
  Gesture,
} from 'react-native-gesture-handler';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, Paperclip, Smile, Camera, Mic, Info, MoreVertical, Play, Pause, Square, Trash2, Clock, Reply, X, Star, Pin, Share2, FilePlus, Image as ImageIcon, FileText, Download, File, User, Search, Ban, Settings, Bell, BellOff } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GradientBackground } from '@/src/components/GradientBackground';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VoiceMessage = ({ messageId, url, isMe, theme, avatar, colorScheme, activeId, onPlay }: { messageId: string; url: string; isMe: boolean; theme: any, avatar?: string, colorScheme: 'light' | 'dark', activeId: string | null, onPlay: (id: string | null) => void }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Stop playback if another message becomes active
  useEffect(() => {
    if (activeId !== messageId && isPlaying) {
      if (sound) {
        sound.pauseAsync();
      }
      setIsPlaying(false);
    }
  }, [activeId]);

  const playPause = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          onPlay(null);
        } else {
          onPlay(messageId);
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        onPlay(messageId);
        const fullUrl = url.startsWith('http') ? url : `${IMAGE_BASE}${url}`;
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play audio', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        onPlay(null);
      }
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const accentColor = isMe ? '#FFF' : (colorScheme === 'dark' ? theme.primary : theme.primary);

  return (
    <View style={styles.voicePlayerContainer}>
      {/* Play/Pause Button */}
      <TouchableOpacity 
        onPress={playPause} 
        style={[
          styles.voicePlayBtn, 
          { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') }
        ]}
      >
        {isPlaying ? (
          <Pause size={18} color={accentColor} fill={accentColor} />
        ) : (
          <Play size={18} color={accentColor} fill={accentColor} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>
      
      {/* Slider & Duration */}
      <View style={styles.voiceSliderContainer}>
        <View style={styles.voiceSliderTrackOutter}>
           <View style={[
             styles.voiceSliderTrackDotted, 
             { 
               borderColor: isMe 
                ? 'rgba(255,255,255,0.3)' 
                : (colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') 
             }
           ]} />
           <View 
             style={[
               styles.voiceSliderThumb, 
               { 
                 backgroundColor: accentColor,
                 left: duration ? `${Math.min(100, (position / duration) * 100)}%` : '0%',
                 width: 8, height: 8, borderRadius: 4, marginLeft: -4
               }
             ]} 
           />
        </View>
        <View style={styles.voiceMetaRow}>
            <Text style={[styles.voiceDurationText, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                {isPlaying ? formatDuration(position) : (duration ? formatDuration(duration) : '0:00')}
            </Text>
        </View>
      </View>

      {/* Avatar Mini */}
      <View style={styles.voiceAvatarContainer}>
        <Image 
          source={getAvatarUrl(avatar || '')} 
          style={styles.voiceAvatar} 
          contentFit="cover"
        />
        <View style={[styles.voiceMicIcon, { backgroundColor: isMe ? '#22C55E' : '#3B82F6', borderColor: isMe ? '#10B98100' : '#FFF0' }]}>
          <Mic size={7} color="#FFF" />
        </View>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ZoomableImage = ({ uri }: { uri: string }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Reanimated.View style={[{ width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
        <Image 
          source={{ uri }} 
          style={{ width: SCREEN_WIDTH, height: '100%' }}
          contentFit="contain"
        />
      </Reanimated.View>
    </GestureDetector>
  );
};

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
  avatar: '', 
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
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [contact, setContact] = useState<Contact>({
    id: id || '',
    name: 'Loading...',
    avatar: '',
    isOnline: id ? onlineUsers.some(uid => String(uid) === String(id)) : false,
    isTyping: false,
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
            setMessages([]);
            // Save cleared state locally
            if (id) {
              await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
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

  const handleDeleteMessage = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    setIsContextMenuVisible(false);

    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress: () => void }[] = [
      {
        text: 'Delete for Me',
        style: 'destructive' as const,
        onPress: () => {
          setMessages(prev => prev.filter(m => m.id !== msgId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    ];

    // Only allow "Delete for Everyone" if I am the sender
    if (msg.sender === 'me') {
      options.push({
        text: 'Delete for Everyone',
        style: 'destructive' as const,
        onPress: () => {
          // TODO: Socket emit 'deleteMessage' to handle everyone
          setMessages(prev => prev.filter(m => m.id !== msgId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
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

  const fetchHistory = async () => {
    if (!id) return;
    try {
      const data = await client.get(`/chat/history/${id}`);
      
      // Check if chat was cleared locally
      const clearedTimeStr = await AsyncStorage.getItem(`chat_cleared_${id}`);
      const clearedTime = clearedTimeStr ? parseInt(clearedTimeStr) : 0;

      const transformed: Message[] = data
        .filter((msg: any) => new Date(msg.createdAt).getTime() > clearedTime)
        .map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderId === user?.id ? 'me' : 'them',
        timestamp: new Date(msg.createdAt),
        status: 'read',
        type: msg.type || 'text',
        fileSize: msg.metadata?.fileSize,
        fileExt: msg.metadata?.fileExt,
        pdfPages: msg.metadata?.pdfPages,
        replyTo: msg.replyTo,
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
        isOnline: onlineUsers.some(uid => String(uid) === String(id))
      }));
    }
  }, [onlineUsers, id]);

  // Load chat-specific settings on focus
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        AsyncStorage.getItem(`chat_disappearing_${id}`).then(timer => {
          if (timer) setDisappearingTimer(timer);
        });
      }
    }, [id])
  );

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
    sendMessage(id, content, 'text', newMessage.replyTo);
    emitStopTyping(id);
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
      emitTyping(id);
    } else {
      emitStopTyping(id);
    }

  };

  // Waveform Animation Logic
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setWaveData(new Array(25).fill(0).map(() => Math.max(4, Math.random() * 24 + 4)));
      }, 100);
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
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Vibrate on start
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Simple duration timer is now handled by useEffect
      (recording as any)._interval = null; // No longer manually managing interval on object
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (shouldSend && uri) {
        uploadAndSendVoice(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadAndSendVoice = async (uri: string) => {
    if (!id || !connected) return;
    
    setIsUploadingVoice(true);
    try {
      // 1. Prepare form data for upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'voice.m4a';
      const type = 'audio/m4a';
      
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      // 2. Upload to server
      const response = await client.post('/chat/upload', formData);

      const audioUrl = response.url;
      const localId = Date.now().toString();

      // 3. Optimistic update
      const newMessage: Message = {
        id: localId,
        localId: localId,
        text: audioUrl, // Store URL in text for audio messages
        sender: 'me',
        timestamp: new Date(),
        status: 'sending',
        type: 'audio',
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, newMessage]);
      
      // 4. Send via socket
      sendMessage(id, audioUrl, 'audio');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Voice upload failed', err);
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const uploadAndSendMessage = async (uri: string, type: 'image' | 'file' | 'audio', originalName?: string, size?: number) => {
    if (!id || !connected) return;
    
    try {
      // 1. Prepare form data for upload
      const formData = new FormData();
      const filename = originalName || uri.split('/').pop() || `file.${type === 'image' ? 'jpg' : 'bin'}`;
      
      let mimeType = 'application/octet-stream';
      if (type === 'image') mimeType = 'image/jpeg';
      else if (type === 'audio') mimeType = 'audio/m4a';
      else {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimes: { [key: string]: string } = {
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

      const formatSize = (bytes?: number) => {
        if (!bytes) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      // 2. Upload to server
      const response = await client.post('/chat/upload', formData);
      const fileUrl = response.url;
      const localId = Date.now().toString();

      // 3. Optimistic update
      const newMessage: Message = {
        id: localId,
        localId: localId,
        text: fileUrl, 
        fileName: type === 'file' ? filename : undefined,
        fileSize: formatSize(size),
        fileExt: filename.split('.').pop()?.toLowerCase(),
        pdfPages: filename.endsWith('.pdf') ? 72 : undefined, // Mocking pages for demo
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
      setMessages(prev => [...prev, newMessage]);
      
      // 4. Send via socket
      sendMessage(id, fileUrl, type, newMessage.replyTo, { 
        fileName: newMessage.fileName, 
        fileSize: newMessage.fileSize,
        fileExt: newMessage.fileExt,
        pdfPages: newMessage.pdfPages
      });
     
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('File upload failed', err);
      Alert.alert('Upload Failed', 'There was an error uploading your file. Please try again.');
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
        uploadAndSendMessage(asset.uri, asset.type === 'video' ? 'video' as any : 'image');
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
                {isLastInGroup && (
                  <Image source={getAvatarUrl(contact.avatar)} style={styles.avatarMini} />
                )}
              </View>
            )}
            
            {/* Message bubble */}
            <View style={[styles.messageContent, isMe && { alignItems: 'flex-end' }]}>
               {/* Use LinearGradient for sender if not selecting, or flat color if selected */}
               {isMe ? (
                   <View style={{ alignItems: 'flex-end' }}>
                     <LinearGradient
                       colors={[theme.primary, theme.primary]}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 1, y: 1 }}
                       style={[
                         styles.messageBubble,
                         styles.myMessageBubble,
                         !isFirstInGroup && { borderTopRightRadius: 20 },
                         selectedMessages.has(msgItem.id) && { borderColor: '#FFF', borderWidth: 2 }
                       ]}
                     >
                      {msgItem.replyTo && (
                        <View style={[styles.replyPreview, { backgroundColor: 'rgba(0,0,0,0.15)', borderLeftColor: '#FFF', borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.replyName, { color: '#FFF' }]}>{msgItem.replyTo.senderName}</Text>
                            <Text style={[styles.replyText, { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>{getFormattedReplyText(msgItem.replyTo)}</Text>
                          </View>
                          {msgItem.replyTo.type === 'image' && (
                            <TouchableOpacity 
                              onPress={() => setViewerImageUrl(msgItem.replyTo!.text.startsWith('http') ? msgItem.replyTo!.text : `${IMAGE_BASE}${msgItem.replyTo!.text}`)}
                            >
                              <Image 
                                source={{ uri: msgItem.replyTo.text.startsWith('http') ? msgItem.replyTo.text : `${IMAGE_BASE}${msgItem.replyTo.text}` }} 
                                style={styles.replyThumbnail}
                                contentFit="cover"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {msgItem.type === 'audio' ? (
                        <VoiceMessage 
                           messageId={msgItem.id}
                           url={msgItem.text} 
                           isMe={isMe} 
                           theme={theme} 
                           avatar={user?.avatar}
                           colorScheme={colorScheme}
                           activeId={playingAudioId}
                           onPlay={setPlayingAudioId}
                        />
                      ) : msgItem.type === 'file' ? (
                        <View style={styles.fileCardRow}>
                          <TouchableOpacity 
                            onPress={() => handleOpenFile(msgItem.text)}
                            activeOpacity={0.9}
                          >
                             <LinearGradient
                                colors={[theme.primary, theme.primary]} 
                                style={[
                                  styles.fileCard, 
                                  { borderBottomRightRadius: 4 }
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                            <View style={styles.fileCardContent}>
                              <View style={[styles.fileCardIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <FileText size={24} color="#FFF" />
                              </View>
                              <View style={styles.fileCardInfo}>
                                <Text style={[styles.fileCardName, { color: '#FFF' }]} numberOfLines={1}>
                                  {msgItem.fileName || 'Document'}
                                </Text>
                                <Text style={[styles.fileCardMeta, { color: 'rgba(255,255,255,0.7)' }]}>
                                  {msgItem.fileSize || 'Unknown size'} • {msgItem.fileExt?.toUpperCase() || 'FILE'}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.fileCardFooter}>
                               <Text style={[styles.fileCardTime, { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(msgItem.timestamp)}</Text>
                               <Text style={[styles.fileCardCheckmark, { color: '#FFF' }]}>✓✓</Text>
                            </View>

                            <View style={styles.downloadIconContainer}>
                              <Download size={20} color="#FFF" />
                            </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      ) : msgItem.type === 'image' ? (
                        <TouchableOpacity 
                          style={styles.imageBubbleContainer}
                          onPress={() => setViewerImageUrl(msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}`)}
                        >
                          <Image 
                            source={{ uri: msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}` }} 
                            style={styles.messageImage}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text style={[styles.messageText, { color: '#FFF' }]}>
                          {msgItem.text}
                        </Text>
                      )}

                      <View style={styles.timestampRow}>
                        {msgItem.pinned && <Pin size={10} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} fill="rgba(255,255,255,0.7)" />}
                        {msgItem.starred && <Star size={10} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} fill="rgba(255,255,255,0.7)" />}
                        <Text style={[styles.inlineTimestamp, { color: 'rgba(255,255,255,0.7)' }]}>
                          {formatTime(msgItem.timestamp)}
                        </Text>
                        <Text style={[styles.checkmark, { color: msgItem.status === 'read' ? '#38BDF8' : 'rgba(255,255,255,0.5)' }]}>
                          ✓✓
                        </Text>
                      </View>
                   </LinearGradient>
                   
                   {msgItem.reactions && msgItem.reactions.length > 0 && (
                     <View style={[styles.bubbleReactions, { alignSelf: 'flex-end', marginRight: 4 }]}>
                       {msgItem.reactions.map((emoji, i) => (
                         <Text key={i} style={styles.bubbleReactionEmoji}>{emoji}</Text>
                       ))}
                     </View>
                   )}
                 </View>
               ) : (
                 <View style={{ alignItems: 'flex-start' }}>
                   <View style={[
                     styles.messageBubble,
                     styles.theirMessageBubble,
                     { 
                       backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', 
                       borderWidth: 0, // Removed border for cleaner look
                       shadowColor: "#000",
                       shadowOffset: { width: 0, height: 1 },
                       shadowOpacity: 0.1,
                       shadowRadius: 2,
                       elevation: 2
                     },
                     !isFirstInGroup && { borderTopLeftRadius: 16 },
                     selectedMessages.has(msgItem.id) && { borderColor: theme.primary, borderWidth: 2 }
                   ]}>
                      {msgItem.replyTo && (
                        <View style={[styles.replyPreview, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderLeftColor: theme.primary, flexDirection: 'row', alignItems: 'center' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.replyName, { color: theme.primary }]}>{msgItem.replyTo.senderName}</Text>
                            <Text style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>{getFormattedReplyText(msgItem.replyTo)}</Text>
                          </View>
                          {msgItem.replyTo.type === 'image' && (
                            <TouchableOpacity 
                              onPress={() => setViewerImageUrl(msgItem.replyTo!.text.startsWith('http') ? msgItem.replyTo!.text : `${IMAGE_BASE}${msgItem.replyTo!.text}`)}
                            >
                              <Image 
                                source={{ uri: msgItem.replyTo.text.startsWith('http') ? msgItem.replyTo.text : `${IMAGE_BASE}${msgItem.replyTo.text}` }} 
                                style={styles.replyThumbnail}
                                contentFit="cover"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {msgItem.type === 'audio' ? (
                        <VoiceMessage 
                           messageId={msgItem.id}
                           url={msgItem.text} 
                           isMe={isMe} 
                           theme={theme} 
                           avatar={contact.avatar}
                           colorScheme={colorScheme}
                           activeId={playingAudioId}
                           onPlay={setPlayingAudioId}
                        />
                      ) : msgItem.type === 'image' ? (
                        <TouchableOpacity 
                          style={styles.imageBubbleContainer}
                          onPress={() => setViewerImageUrl(msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}`)}
                        >
                          <Image 
                            source={{ uri: msgItem.text.startsWith('http') ? msgItem.text : `${IMAGE_BASE}${msgItem.text}` }} 
                            style={styles.messageImage}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      ) : msgItem.type === 'file' ? (
                        <View style={styles.fileCardRow}>
                          <TouchableOpacity 
                            style={[
                              styles.fileCard, 
                              { 
                                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                                borderTopLeftRadius: 4,
                                borderWidth: 1,
                                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
                              }
                            ]}
                            onPress={() => handleOpenFile(msgItem.text)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.fileCardContent}>
                              <View style={[styles.fileCardIconContainer, { backgroundColor: theme.primary + '15' }]}>
                                <FileText size={24} color={theme.primary} />
                              </View>
                              <View style={styles.fileCardInfo}>
                                <Text style={[styles.fileCardName, { color: theme.text }]} numberOfLines={1}>
                                  {msgItem.fileName || 'Document'}
                                </Text>
                                <Text style={[styles.fileCardMeta, { color: theme.textSecondary }]}>
                                  {msgItem.fileSize || 'Unknown size'} • {msgItem.fileExt?.toUpperCase() || 'FILE'}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.fileCardFooter}>
                               <Text style={[styles.fileCardTime, { color: theme.textSecondary }]}>{formatTime(msgItem.timestamp)}</Text>
                               <Text style={[styles.fileCardCheckmark, { color: msgItem.status === 'read' ? theme.primary : theme.textSecondary }]}>✓✓</Text>
                            </View>

                            <View style={styles.downloadIconContainer}>
                              <Download size={20} color={theme.textSecondary} />
                            </View>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={[styles.messageText, { color: theme.text }]}>
                          {msgItem.text}
                        </Text>
                      )}

                      <View style={styles.timestampRow}>
                        {msgItem.pinned && <Pin size={10} color={theme.textSecondary} style={{ marginRight: 4 }} fill={theme.textSecondary} />}
                        {msgItem.starred && <Star size={10} color="#EAB308" style={{ marginRight: 4 }} fill="#EAB308" />}
                        <Text style={[styles.inlineTimestamp, { color: theme.textSecondary }]}>
                          {formatTime(msgItem.timestamp)}
                        </Text>
                      </View>
                   </View>

                   {msgItem.reactions && msgItem.reactions.length > 0 && (
                     <View style={[styles.bubbleReactions, { alignSelf: 'flex-start', marginLeft: 4 }]}>
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

  useEffect(() => {
    if (contact.isTyping) {
      // Scale in animation
      RNAnimated.spring(typingScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Bouncing dots animation - wave effect
      const createBounceAnimation = (animValue: RNAnimated.Value, delay: number) => {
        return RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.delay(delay),
            RNAnimated.timing(animValue, {
              toValue: -8,
              duration: 300,
              useNativeDriver: true,
            }),
            RNAnimated.timing(animValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            RNAnimated.delay(600 - delay),
          ])
        );
      };

      const anim1 = createBounceAnimation(typingDot1, 0);
      const anim2 = createBounceAnimation(typingDot2, 150);
      const anim3 = createBounceAnimation(typingDot3, 300);

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
    }
  }, [contact.isTyping]);

  const renderTypingIndicator = () => {
    if (!contact.isTyping) return null;

    return (
      <RNAnimated.View 
        style={[
          styles.typingContainer,
          {
            opacity: typingScale,
            transform: [{ scale: typingScale }],
          }
        ]}
      >
        {/* Avatar with gradient ring */}
        <View style={styles.typingAvatarWrapper}>
          <LinearGradient
            colors={['#0EA5E9', '#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typingAvatarRing}
          >
            <View style={[styles.typingAvatarInner, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
              <Image 
                source={getAvatarUrl(contact.avatar)} 
                style={styles.typingAvatar}
                contentFit="cover"
              />
            </View>
          </LinearGradient>
          <View style={[styles.typingOnlineDot, { borderColor: colorScheme === 'dark' ? '#0F172A' : '#FFFFFF' }]} />
        </View>

        {/* Typing bubble with glassmorphism */}
        <View style={styles.typingBubbleWrapper}>
          <ExpoBlurView 
            intensity={colorScheme === 'dark' ? 40 : 60} 
            style={[
              styles.typingBubble,
              { 
                backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            <View style={styles.typingDotsContainer}>
              <RNAnimated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: theme.primary,
                    transform: [{ translateY: typingDot1 }],
                  }
                ]} 
              />
              <RNAnimated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: theme.primary,
                    transform: [{ translateY: typingDot2 }],
                  }
                ]} 
              />
              <RNAnimated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: theme.primary,
                    transform: [{ translateY: typingDot3 }],
                  }
                ]} 
              />
            </View>
          </ExpoBlurView>
          
          {/* Bubble tail */}
          <View 
            style={[
              styles.typingBubbleTail, 
              { 
                borderRightColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              }
            ]} 
          />
        </View>
      </RNAnimated.View>
    );
  };

  return (
    <GradientBackground>
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
                <View style={styles.avatarWrapperMini}>
                  <Image 
                    source={getAvatarUrl(contact.avatar)} 
                    style={styles.headerAvatar} 
                  />
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
                  <Text style={[styles.headerSubtext, { color: theme.textSecondary }]}>
                    {contact.id === user?.id ? 'Message yourself' : (contact.isTyping ? 'typing...' : (contact.isOnline ? 'Online' : 'Offline'))}
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
          <FlatList
            ref={flatListRef}
            data={groupMessages(messages)}
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
            opacity: scrollAnim 
          }
        ]}>
          <TouchableOpacity 
            style={[styles.scrollBtn, { backgroundColor: theme.primary }]}
            onPress={scrollToBottom}
          >
            <ArrowLeft size={20} color="white" style={{ transform: [{ rotate: '-90deg' }] }} />
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
            <TouchableOpacity 
              style={[
                styles.plusBtn, 
                { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}
              onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
            >
              <Paperclip size={22} color={colorScheme === 'dark' ? '#FFF' : theme.text} />
            </TouchableOpacity>

            {isRecording ? (
              <View style={[styles.recordingPanel, { backgroundColor: 'transparent' }]}>
                {/* Top Row: Timer + Waveform */}
                <View style={styles.recordingTopRow}>
                  <Text style={[styles.recordingTimerText, { color: theme.text }]}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                  
                  {/* Live Waveform Visualization */}
                  <View style={styles.liveWaveform}>
                      {waveData.map((height, i) => (
                          <View 
                            key={i} 
                            style={[
                              styles.liveWaveBar, 
                              { 
                                height: isPaused ? 4 : height,
                                backgroundColor: theme.textSecondary 
                              }
                            ]} 
                          />
                      ))}
                  </View>
                </View>

                {/* Bottom Row: Controls */}
                <View style={styles.recordingBottomRow}>
                    <TouchableOpacity onPress={() => stopRecording(false)} style={styles.recordActionBtn}>
                      <Trash2 size={24} color={theme.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePause} style={styles.recordPauseBtn}>
                       {isPaused ? (
                          <View style={styles.resumeCircle}>
                             <View style={styles.resumeTriangle} />
                          </View>
                       ) : (
                          <View style={styles.pauseCircle}>
                             <Pause size={18} color="#EF4444" fill="#EF4444" />
                          </View>
                       )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => stopRecording(true)} style={styles.recordSendBtn}>
                      <Send size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.whatsappInputFrame, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#f0f2f5', borderColor: 'transparent' }]}>
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
                    <Smile size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {!inputText.trim() ? (
                  <View style={styles.inputRightActions}>
                    <TouchableOpacity style={styles.inputActionBtn}>
                      <Camera size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.inputActionBtn, { backgroundColor: theme.primary + '20', borderRadius: 20 }]} 
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
          </View>
        </View>
      </KeyboardAvoidingView>

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
                router.push({ pathname: '/chat/settings', params: { id } });
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

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <>
          <TouchableOpacity 
            style={styles.menuOverlay} 
            activeOpacity={1} 
            onPress={() => setShowAttachmentMenu(false)}
          />
          <View style={[styles.attachmentMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handlePickDocument}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3B82F6' }]}>
                <FilePlus size={20} color="#FFF" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>Add file</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handlePickImage}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#10B981' }]}>
                <FileText size={20} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Upload / attach document</Text>
                <Text style={[styles.menuItemSubtext, { color: theme.textSecondary }]}>Images, PDFs, files, etc.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

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
              <ZoomableImage uri={viewerImageUrl} />
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>

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
    paddingTop: 6,
    paddingBottom: 15,
    borderTopWidth: 1,
    zIndex: 100,
  },
  inputActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 2,
    marginBottom: 8,
  },
   plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  whatsappInputFrame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 8,
    marginHorizontal: 7,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  chatInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#000',
    maxHeight: 127,
  },
  stickerBtn: {
    padding: 4,
  },
  inputRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputActionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappSendBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  whatsappSendIcon: {
    color: '#0EA5E9',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
    borderRadius: 20,
    minHeight: 38,
    justifyContent: 'center',
    overflow: 'hidden',
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
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  theirMessageBubble: {
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontWeight: '300',
    marginRight: 20,
    fontVariant: ['tabular-nums'],
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
    width: 3,
    borderRadius: 1.5,
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
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  resumeTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 14,
    borderRightWidth: 0,
    borderBottomWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: '#EF4444',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 4, 
  },

  recordSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typingAvatarWrapper: {
    position: 'relative',
  },
  typingAvatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingAvatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
  },
  typingOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  typingBubbleWrapper: {
    position: 'relative',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  typingBubbleTail: {
    position: 'absolute',
    bottom: 0,
    left: -6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
