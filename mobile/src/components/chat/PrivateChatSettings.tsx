import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { 
  Bell, 
  BellOff, 
  Trash2, 
  Ban, 
  Image as ImageIcon, 
  ChevronRight, 
  Shield, 
  Smartphone,
  Clock,
  Lock,
  Download,
  Star,
  Video,
  FileText,
  User,
  Info
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarUrl } from '@/src/lib/media';
import { useRouter } from 'expo-router';

interface PrivateChatSettingsProps {
  id: string;
  contact: any;
  theme: any;
  colorScheme: 'light' | 'dark';
  isOnline: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  autoDownload: boolean;
  disappearingTimer: string;
  toggleMute: () => void;
  setAutoDownload: (val: boolean) => void;
  handleClearChat: () => void;
  handleBlockUser: () => void;
}

export const PrivateChatSettings = ({
  id,
  contact,
  theme,
  colorScheme,
  isOnline,
  isMuted,
  isBlocked,
  autoDownload,
  disappearingTimer,
  toggleMute,
  setAutoDownload,
  handleClearChat,
  handleBlockUser,
}: PrivateChatSettingsProps) => {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.avatarContainer}>
           <LinearGradient
            colors={[theme.primary, '#A855F7']}
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
          {contact?.role?.toUpperCase() || 'STUDENT'} • {isOnline ? 'ONLINE' : 'OFFLINE'}
        </Text>

        <View style={styles.actionRow}>
          <ActionIcon 
            icon={isMuted ? BellOff : Bell} 
            label={isMuted ? "Muted" : "Mute"} 
            color={isMuted ? theme.error : theme.primary} 
            onPress={toggleMute} 
            theme={theme} 
          />
          <ActionIcon icon={Video} label="Video" color={theme.primary} theme={theme} onPress={() => Alert.alert("Coming Soon", "Video calls will be available soon.")} />
          <ActionIcon icon={Star} label="Star" color="#F59E0B" theme={theme} />
          <ActionIcon icon={User} label="Profile" color={theme.primary} theme={theme} onPress={() => router.push(`/user/${id}`)} />
        </View>
      </View>

      {/* Info Section */}
      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.primary + '10' }]}>
            <Info size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{contact?.email || 'No email shared'}</Text>
          </View>
        </View>
      </View>

      {/* Settings Grid */}
      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <OptionItem 
          icon={Bell} 
          label="Custom Notifications" 
          theme={theme} 
          right={<Switch value={!isMuted} onValueChange={toggleMute} />} 
        />
        <View style={styles.divider} />
        <OptionItem icon={Download} label="Save to Gallery" sub="Auto-download photos" theme={theme} right={<Switch value={autoDownload} onValueChange={() => setAutoDownload(!autoDownload)} />} />
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
        <OptionItem icon={Shield} label="Encryption" sub="Messages are end-to-end encrypted" theme={theme} />
        <View style={styles.divider} />
        <OptionItem icon={FileText} label="Shared Documents" theme={theme} />
        <View style={styles.divider} />
        <OptionItem icon={ImageIcon} label="Media & Links" theme={theme} />
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginLeft: 20, marginBottom: 8 }]}>DANGER ZONE</Text>
      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border, borderTopWidth: 0 }]}>
        <TouchableOpacity style={styles.dangerItem} onPress={handleBlockUser}>
          <Ban size={18} color={theme.error} />
          <Text style={[styles.dangerText, { color: theme.error }]}>{isBlocked ? 'Unblock' : 'Block'} {contact?.name}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.dangerItem} onPress={handleClearChat}>
          <Trash2 size={18} color={theme.error} />
          <Text style={[styles.dangerText, { color: theme.error }]}>Clear Conversation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Lock size={12} color={theme.textSecondary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Personal secure chat</Text>
      </View>
    </ScrollView>
  );
};

const ActionIcon = ({ icon: Icon, label, color, onPress, theme }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.actionIconPill, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

const OptionItem = ({ icon: Icon, label, sub, theme, right, onPress }: any) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress} disabled={!onPress && !right}>
    <View style={styles.optionLeft}>
      <View style={[styles.optionIconBox, { backgroundColor: theme.primary + '10' }]}>
        <Icon size={20} color={theme.primary} />
      </View>
      <View>
        <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
        {sub && <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{sub}</Text>}
      </View>
    </View>
    {right ? right : <ChevronRight size={18} color={theme.textSecondary} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 4,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    alignItems: 'center',
    width: 65,
  },
  actionIconPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionsCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 66,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    opacity: 0.4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
