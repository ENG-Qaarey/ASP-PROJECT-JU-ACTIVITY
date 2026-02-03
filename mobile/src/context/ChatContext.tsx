import { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '@/src/lib/config';
import { useAuth } from './AuthContext';

interface ChatContextType {
  socket: any | null;
  connected: boolean;
  sendMessage: (receiverId: string, content: string, type?: string, replyTo?: any, metadata?: any) => void;
  emitTyping: (receiverId: string) => void;
  emitStopTyping: (receiverId: string) => void;
  onlineUsers: string[];
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  connected: false,
  sendMessage: () => {},
  emitTyping: () => {},
  emitStopTyping: () => {},
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

  const sendMessage = (receiverId: string, content: string, type: string = 'text', replyTo?: any, metadata?: any) => {
    if (socket && connected) {
      socket.emit('sendMessage', { receiverId, content, type, replyTo, metadata });
    }
  };

  const emitTyping = (receiverId: string) => {
    if (socket && connected) {
      socket.emit('typing', { receiverId });
    }
  };

  const emitStopTyping = (receiverId: string) => {
    if (socket && connected) {
      socket.emit('stopTyping', { receiverId });
    }
  };

  return (
    <ChatContext.Provider value={{ socket, connected, sendMessage, emitTyping, emitStopTyping, onlineUsers }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
