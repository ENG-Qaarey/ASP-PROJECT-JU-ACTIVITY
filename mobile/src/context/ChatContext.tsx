import { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '@/src/lib/config';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useRouter, usePathname } from 'expo-router';
import { getAvatarUrl } from '@/src/lib/media';

/** Chat route segments that are not a chat id (user id or group id). */
const CHAT_SUBROUTES = new Set(['users', 'group-settings', 'settings', 'wallpaper', 'disappearing-messages', 'index', '']);

/** Get current chat id from pathname (e.g. /chat/abc-123 -> abc-123), or null if not on a chat screen. */
function getCurrentChatIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  const segment = match?.[1];
  if (!segment || CHAT_SUBROUTES.has(segment)) return null;
  return segment;
}

interface ChatContextType {
  socket: any | null;
  connected: boolean;
  sendMessage: (chatId: string, content: string, type?: string, replyTo?: any, metadata?: any, isGroup?: boolean) => void;
  emitTyping: (chatId: string, isGroup?: boolean) => void;
  emitStopTyping: (chatId: string, isGroup?: boolean) => void;
  emitDeleteMessage: (messageId: string, chatId: string, deleteType?: 'me' | 'everyone', isGroup?: boolean) => void;
  emitRecording: (chatId: string, isGroup?: boolean) => void;
  emitStopRecording: (chatId: string, isGroup?: boolean) => void;
  onlineUsers: string[];
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  connected: false,
  sendMessage: () => {},
  emitTyping: () => {},
  emitStopTyping: () => {},
  emitDeleteMessage: () => {},
  emitRecording: () => {},
  emitStopRecording: () => {},
  onlineUsers: [],
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [socket, setSocket] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Keep pathname ref up to date so socket callbacks see current route
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let newSocket: any = null;

    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('user_token');
      if (!token || !user) return;

      if (newSocket) newSocket.close();

      // Using io from socket.io-client directly
      newSocket = io(SOCKET_URL, {
        query: { token },
        path: '/socket.io',
        transports: ['websocket'],
      });

      if (!newSocket) return;

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Socket connected');
      });

      newSocket.on('newMessage', (message: any) => {
        const currentPathname = pathnameRef.current;

        // 1. When on the Users page, hide ALL notification alerts
        if (currentPathname.includes('/chat/users')) return;

        // 2. When in a one-to-one chat with a specific user, hide alerts from that same user only
        const currentChatId = getCurrentChatIdFromPathname(currentPathname);
        const isOneToOneWithSender =
          currentChatId && !message.groupId && currentChatId === message.senderId;
        const isInGroupChat =
          currentChatId && message.groupId && currentChatId === message.groupId;
        if (isOneToOneWithSender || isInGroupChat) return;

        // Notifications from other users (or when not in that chat) appear normally
        if (message.senderId !== user?.id) {
          showNotification({
            title: message.sender?.name || 'New Message',
            message: message.content,
            avatar: getAvatarUrl(message.sender?.avatar),
            type: 'chat',
            onPress: () => {
              const id = message.groupId || message.senderId;
              router.push(`/chat/${id}`);
            },
          });
        }
      });

      newSocket.on('newNotification', (notification: any) => {
        // When on the Users page, hide all notification alerts
        if (pathnameRef.current.includes('/chat/users')) return;
        showNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type || 'announcement',
          onPress: () => {
            router.push('/notifications' as any);
          },
        });
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('onlineUsers', (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('userOnline', ({ userId }: { userId: string }) => {
        setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      });

      newSocket.on('userOffline', ({ userId }: { userId: string }) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [user]);

  const sendMessage = (chatId: string, content: string, type: string = 'text', replyTo?: any, metadata?: any, isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup 
        ? { groupId: chatId, content, type, replyTo, metadata }
        : { receiverId: chatId, content, type, replyTo, metadata };
      socket.emit('sendMessage', payload);
    }
  };

  const emitTyping = (chatId: string, isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup ? { groupId: chatId } : { receiverId: chatId };
      socket.emit('typing', payload);
    }
  };

  const emitStopTyping = (chatId: string, isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup ? { groupId: chatId } : { receiverId: chatId };
      socket.emit('stopTyping', payload);
    }
  };

  const emitDeleteMessage = (messageId: string, chatId: string, deleteType: 'me' | 'everyone' = 'everyone', isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup 
        ? { messageId, groupId: chatId, deleteType }
        : { messageId, receiverId: chatId, deleteType };
      socket.emit('deleteMessage', payload);
    }
  };

  const emitRecording = (chatId: string, isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup ? { groupId: chatId } : { receiverId: chatId };
      socket.emit('recording', payload);
    }
  };

  const emitStopRecording = (chatId: string, isGroup = false) => {
    if (socket && connected) {
      const payload = isGroup ? { groupId: chatId } : { receiverId: chatId };
      socket.emit('stopRecording', payload);
    }
  };

  return (
    <ChatContext.Provider value={{ socket, connected, sendMessage, emitTyping, emitStopTyping, emitDeleteMessage, emitRecording, emitStopRecording, onlineUsers }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
