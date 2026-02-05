import { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '@/src/lib/config';
import { useAuth } from './AuthContext';

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
  const [socket, setSocket] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

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
