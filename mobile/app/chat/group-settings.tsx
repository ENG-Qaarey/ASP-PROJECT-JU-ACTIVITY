import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { client } from '@/src/lib/api';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChat } from '@/src/context/ChatContext';
import { GroupChatSettings } from '@/src/components/chat/GroupChatSettings';
import { useAuth } from '@/src/context/AuthContext';

export default function GroupChatSettingsScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const navBtnBg = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const { onlineUsers } = useChat();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [groupImage, setGroupImage] = useState<string | undefined>();
  const [groupDescription, setGroupDescription] = useState<string | undefined>();
  const [groupTitle, setGroupTitle] = useState(title || 'Activity Group');

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchGroupDetails();
        loadSettings();
      }
    }, [id])
  );

  const fetchGroupDetails = async () => {
    try {
      if (!id) return;
      
      // Fetch activity details for info
      const activityData = await client.get(`/activities/${id}`);
      setGroupImage(activityData.image);
      setGroupDescription(activityData.description);
      setGroupTitle(activityData.title);

      const membersData = await client.get(`/activities/${id}/members`);
      setMembers(membersData);
    } catch (error) {
      console.log('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    try {
      await client.put(`/activities/${id}`, { title: newTitle });
      setGroupTitle(newTitle);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Failed to update title:', error);
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleUpdateDescription = async (newDesc: string) => {
    try {
      await client.put(`/activities/${id}`, { description: newDesc });
      setGroupDescription(newDesc);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Failed to update description:', error);
      Alert.alert('Error', 'Failed to update group description');
    }
  };

  const handleRemoveMember = async (studentId: string) => {
    const member = members.find(m => m.id === studentId);
    if (!member || !member.applicationId) {
      Alert.alert('Error', 'Member info not found');
      return;
    }

    // 1. Optimistic Update
    const originalMembers = [...members];
    setMembers(prev => prev.filter(m => m.id !== studentId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 2. API Call
      await client.put(`/applications/${member.applicationId}/status`, { 
        status: 'rejected', 
        notes: 'Removed from group by admin' 
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Wait a bit then refresh to be sure
      setTimeout(() => fetchGroupDetails(), 1000);
    } catch (error) {
      console.log('Failed to remove member:', error);
      Alert.alert('Error', 'Failed to remove member. Restoring list.');
      setMembers(originalMembers);
    }
  };

  const loadSettings = async () => {
    if (!id) return;
    try {
      const muted = await AsyncStorage.getItem(`chat_muted_${id}`);
      setIsMuted(!!muted);
    } catch (error) {
      console.log('Failed to load group settings:', error);
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
    if (!id) return;

    Alert.alert(
      "Clear Group Chat",
      "Are you sure you want to clear this chat history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Chat", 
          style: "destructive", 
          onPress: async () => {
            try {
               await client.delete(`/chat/clear/${id}`);
               await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
               // router.replace('/chat'); 
            } catch (err) {
               console.log('Failed to clear chat:', err);
               // Fallback to local clear
               await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
               // router.replace('/chat');
            }
          } 
        }
      ]
    );
  };

  const handleToggleAdmin = async (studentId: string) => {
    // 1. Optimistic Update
    setMembers(prev => prev.map(m => 
      m.id === studentId ? { ...m, isGroupAdmin: !m.isGroupAdmin } : m
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 2. Background API Call
      await client.post(`/activities/${id}/admin/${studentId}`, {});
      
      // Optionally refresh to ensure sync, but keep it quiet
      const membersData = await client.get(`/activities/${id}/members`);
      setMembers(membersData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Failed to toggle admin:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update admin privileges. Please try again.');
      
      // 3. Revert on error
      const membersData = await client.get(`/activities/${id}/members`);
      setMembers(membersData);
    }
  };

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: navBtnBg }]} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Group Settings</Text>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: navBtnBg }]}>
          <Share2 size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <GroupChatSettings
          id={id as string}
          title={groupTitle}
          theme={theme}
          colorScheme={colorScheme as any}
          members={members}
          onlineUsers={onlineUsers}
          isMuted={isMuted}
          autoDownload={autoDownload}
          toggleMute={toggleMute}
          setAutoDownload={setAutoDownload}
          handleClearChat={handleClearChat}
          currentUserRole={user?.role}
          groupImage={groupImage}
          description={groupDescription}
          currentUserId={user?.id}
          onToggleAdmin={handleToggleAdmin}
          onUpdateTitle={handleUpdateTitle}
          onUpdateDescription={handleUpdateDescription}
          onRemoveMember={handleRemoveMember}
          onImageUpdate={(url) => setGroupImage(url)}
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

