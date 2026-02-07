import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { 
  ArrowLeft, 
  Share2, 
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { client } from '@/src/lib/api';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useChat } from '@/src/context/ChatContext';
import { PrivateChatSettings } from '@/src/components/chat/PrivateChatSettings';
import { GroupChatSettings } from '@/src/components/chat/GroupChatSettings';

interface ContactInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function ChatSettingsScreen() {
  const router = useRouter();
  const { id, isGroup, title } = useLocalSearchParams<{ id: string; isGroup?: string; title?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  
  const { onlineUsers } = useChat();
  
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [disappearingTimer, setDisappearingTimer] = useState('Off');

  const isOnline = id ? onlineUsers.some(uid => String(uid) === String(id)) : false;

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchChatDetails();
        loadSettings();
      }
    }, [id])
  );

  const fetchChatDetails = async () => {
    try {
      if (!id) return;
      
      if (isGroup === 'true') {
        const membersData = await client.get(`/activities/${id}/members`);
        setMembers(membersData);
        setContact({
          id,
          name: title || 'Activity Group',
          email: '',
          role: 'GROUP',
          avatar: '',
        });
      } else {
        const data = await client.get(`/users/${id}`);
        setContact(data);
      }
    } catch (error) {
      console.log('Failed to fetch chat details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!id) return;
    try {
      const muted = await AsyncStorage.getItem(`chat_muted_${id}`);
      setIsMuted(!!muted);

      const timer = await AsyncStorage.getItem(`chat_disappearing_${id}`);
      if (timer) {
        const labels: Record<string, string> = { '24h': '24 Hours', '7d': '7 Days', '90d': '90 Days', 'off': 'Off' };
        setDisappearingTimer(labels[timer] || 'Off');
      }
    } catch (error) {
      console.log('Failed to load local settings:', error);
    }
  };

  const toggleMute = async () => {
    const newValue = !isMuted;
    setIsMuted(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id) {
      if (newValue) await AsyncStorage.setItem(`chat_muted_${id}`, 'true');
      else await AsyncStorage.removeItem(`chat_muted_${id}`);
    }
  };

  const handleClearChat = async () => {
    if (id) {
      await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/chat');
    }
  };

  const handleBlockUser = () => {
    setIsBlocked(!isBlocked);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Settings</Text>
        <TouchableOpacity style={styles.navBtn}>
          <Share2 size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isGroup === 'true' ? (
        <GroupChatSettings 
          id={id as string}
          title={title || ''}
          theme={theme}
          colorScheme={colorScheme as any}
          members={members}
          onlineUsers={onlineUsers}
          isMuted={isMuted}
          autoDownload={autoDownload}
          toggleMute={toggleMute}
          setAutoDownload={setAutoDownload}
          handleClearChat={handleClearChat}
        />
      ) : (
        <PrivateChatSettings 
          id={id as string}
          contact={contact}
          theme={theme}
          colorScheme={colorScheme as any}
          isOnline={isOnline}
          isMuted={isMuted}
          isBlocked={isBlocked}
          autoDownload={autoDownload}
          disappearingTimer={disappearingTimer}
          toggleMute={toggleMute}
          setAutoDownload={setAutoDownload}
          handleClearChat={handleClearChat}
          handleBlockUser={handleBlockUser}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    zIndex: 10,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
