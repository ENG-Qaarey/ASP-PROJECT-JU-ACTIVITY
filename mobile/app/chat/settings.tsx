import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  Trash2, 
  Ban, 
  Image as ImageIcon, 
  ChevronRight, 
  Shield, 
  Smartphone,
  Share2,
  Clock,
  Lock,
  Download,
  Star,
  EyeOff,
  Video,
  FileText
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { client } from '@/src/lib/api';
import { getAvatarUrl } from '@/src/lib/media';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useChat } from '@/src/context/ChatContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContactInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function ChatSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  
  const { onlineUsers } = useChat();
  
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [disappearingTimer, setDisappearingTimer] = useState('Off');

  const isOnline = id ? onlineUsers.some(uid => String(uid) === String(id)) : false;

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchContactDetails();
        loadSettings();
      }
    }, [id])
  );

  const fetchContactDetails = async () => {
    try {
      const data = await client.get(`/users/${id}`);
      setContact(data);
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
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
      console.error('Failed to load local settings:', error);
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

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages in this chat? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            if (id) {
              await AsyncStorage.setItem(`chat_cleared_${id}`, Date.now().toString());
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Chat history has been cleared.");
            }
          }
        }
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      isBlocked ? "Unblock User" : "Block User",
      `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${contact?.name || 'this user'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isBlocked ? "Unblock" : "Block", 
          style: "destructive",
          onPress: () => {
            setIsBlocked(!isBlocked);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      ]
    );
  };

  return (
    <GradientBackground>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Chat Info</Text>
        <TouchableOpacity style={styles.navBtn}>
          <Share2 size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Compact Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
             <LinearGradient
              colors={[theme.primary, '#8B5CF6']}
              style={styles.avatarRing}
            >
              <Image 
                source={getAvatarUrl(contact?.avatar)} 
                style={[styles.avatar, { borderColor: theme.card }]} 
              />
            </LinearGradient>
            <View style={[styles.onlineDot, { borderColor: theme.card, backgroundColor: isOnline ? '#22C55E' : '#94A3B8' }]} />
          </View>
          
          <Text style={[styles.heroName, { color: theme.text }]}>{contact?.name || 'Contact'}</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            {contact?.role ? contact.role.toUpperCase() : 'STUDENT'} • {isOnline ? 'ONLINE NOW' : 'OFFLINE'}
          </Text>

          <View style={styles.actionRow}>
            <ActionIcon 
              icon={isMuted ? BellOff : Bell} 
              label={isMuted ? "Muted" : "Mute"} 
              color={isMuted ? theme.error : theme.primary} 
              onPress={toggleMute} 
              theme={theme} 
            />
            <ActionIcon icon={Video} label="Video" color={theme.primary} theme={theme} onPress={() => Alert.alert("Coming Soon", "Video calls will be available in the next update.")} />
            <ActionIcon icon={Star} label="Star" color="#F59E0B" theme={theme} onPress={() => Alert.alert("Coming Soon", "You will be able to star important messages soon.")} />
            <ActionIcon icon={Trash2} label="Clear" color={theme.error} onPress={handleClearChat} theme={theme} />
          </View>
        </View>

        {/* Media Snippet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MEDIA & LINKS</Text>
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{`248 >`}</Text>
          </View>
          <View style={styles.mediaGrid}>
            {[1,2,3,4].map(i => (
              <View key={i} style={[styles.mediaPlaceholder, { backgroundColor: theme.border + '50' }]}>
                <ImageIcon size={18} color={theme.textSecondary} />
              </View>
            ))}
          </View>
        </View>

        {/* Compact Options List */}
        <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <OptionItem 
            icon={isMuted ? BellOff : Bell} 
            label="Mute Notifications" 
            sub="Silence alerts for this chat" 
            theme={theme} 
            right={<Switch value={isMuted} onValueChange={toggleMute} />} 
          />
          <View style={styles.divider} />
          <OptionItem icon={Download} label="Auto-Save to Media" sub="Save incoming photos" theme={theme} right={<Switch value={autoDownload} onValueChange={() => setAutoDownload(!autoDownload)} />} />
          <View style={styles.divider} />
          <OptionItem 
            icon={Clock} 
            label="Disappearing Messages" 
            sub={disappearingTimer} 
            theme={theme} 
            onPress={() => router.push({
              pathname: '/chat/disappearing-messages',
              params: { id, name: contact?.name }
            })}
          />
        </View>

        <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <OptionItem icon={Shield} label="Encryption" sub="Verified 12 digit code" theme={theme} />
          <View style={styles.divider} />
          <OptionItem icon={FileText} label="Shared Documents" sub="PDFs, Slides, etc." theme={theme} />
          <View style={styles.divider} />
          <OptionItem icon={Smartphone} label="Wallpaper & Sound" theme={theme} />
        </View>

        {/* Danger Options */}
        <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleBlockUser}>
            <Ban size={18} color={theme.error} />
            <Text style={[styles.dangerText, { color: theme.error }]}>{isBlocked ? 'Unblock' : 'Block'} {contact?.name || 'Contact'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dangerItem}>
            <Trash2 size={18} color={theme.error} />
            <Text style={[styles.dangerText, { color: theme.error }]}>Report Abuse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Lock size={12} color={theme.textSecondary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>End-to-end encrypted</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const ActionIcon = ({ icon: Icon, label, color, onPress, theme }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.actionIconPill, { backgroundColor: color + '15' }]}>
      <Icon size={18} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

const OptionItem = ({ icon: Icon, label, sub, theme, right, onPress }: any) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress} disabled={!onPress && !right}>
    <View style={styles.optionLeft}>
      <View style={[styles.optionIconBox, { backgroundColor: theme.primary + '10' }]}>
        <Icon size={18} color={theme.primary} />
      </View>
      <View>
        <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
        {sub && <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{sub}</Text>}
      </View>
    </View>
    {right ? right : <ChevronRight size={16} color={theme.textSecondary} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.01)', // Very subtle to anchor it
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
  },
  avatar: {
    width: 86,
    height:  86,
    borderRadius: 43,
    borderWidth: 3,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 25,
  },
  actionBtn: {
    alignItems: 'center',
    width: 60,
  },
  actionIconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaPlaceholder: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 58,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 20,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
