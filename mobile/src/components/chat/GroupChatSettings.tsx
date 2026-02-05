import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { 
  Bell, 
  Trash2, 
  ChevronRight, 
  Shield, 
  Smartphone,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Megaphone,
  Zap,
  LogOut,
  Settings as SettingsIcon,
  Search,
  Lock,
  Download,
  MoreHorizontal,
  Camera,
  Edit2
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { client } from '@/src/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarUrl } from '@/src/lib/media';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  imageSelectorWrapper: {
    marginBottom: 16,
  },
  groupIconContainer: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    borderRadius: SCREEN_WIDTH * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  largeGroupAvatar: {
    width: '100%',
    height: '100%',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  quickAccess: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  quickBtn: {
    alignItems: 'center',
    gap: 8,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersCard: {
    borderRadius: 28,
    borderWidth: 1,
    paddingTop: 8,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  adminBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  memberMore: {
    padding: 8,
  },
  divider: {
    height: 1,
  },
  viewMoreBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionItem: {
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionBody: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    marginLeft: 48,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalBody: {
    gap: 12,
  },
  modalActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const AlertModal = ({ visible, onClose, title, children, theme }: any) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                </View>
                <View style={styles.modalBody}>
                    {children}
                </View>
            </View>
        </TouchableOpacity>
    </Modal>
);

interface GroupChatSettingsProps {
  id: string;
  title: string;
  theme: any;
  colorScheme: 'light' | 'dark';
  members: any[];
  onlineUsers: string[];
  isMuted: boolean;
  autoDownload: boolean;
  toggleMute: () => void;
  setAutoDownload: (val: boolean) => void;
  handleClearChat: () => void;
  currentUserRole?: string;
  groupImage?: string;
  onImageUpdate?: (url: string) => void;
  onToggleAdmin?: (memberId: string) => void;
  currentUserId?: string;
}

export const GroupChatSettings = ({
  id,
  title,
  theme,
  colorScheme,
  members,
  onlineUsers,
  isMuted,
  autoDownload,
  toggleMute,
  setAutoDownload,
  handleClearChat,
  currentUserRole,
  groupImage,
  onImageUpdate,
  onToggleAdmin,
  currentUserId,
}: GroupChatSettingsProps) => {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = React.useState<any>(null);

  // Sort members: Current user first, then admin/coordinator, then others
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        if (a.isGroupAdmin && !b.isGroupAdmin) return -1;
        if (!a.isGroupAdmin && b.isGroupAdmin) return 1;
        return 0;
    });
  }, [members, currentUserId]);

  const isCurrentUserAdmin = members.find(m => m.id === currentUserId)?.isGroupAdmin;
  const canManageAdmins = currentUserRole === 'admin' || isCurrentUserAdmin;
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'coordinator';

  const handleMemberPress = (member: any) => {
      // Don't allow managing yourself or non-students (coordinators are fixed admins)
      if (member.id === currentUserId || member.role !== 'student') {
        router.push({ pathname: '/chat/[id]', params: { id: member.id } });
        return;
      }

      if (canManageAdmins) {
          setSelectedMember(member);
      } else {
          router.push({ pathname: '/chat/[id]', params: { id: member.id } });
      }
  };

  const confirmToggleAdmin = () => {
    if (!selectedMember || !onToggleAdmin) return;
    
    const action = selectedMember.isGroupAdmin ? 'Revoke' : 'Grant';
    Alert.alert(
        `${action} Admin`,
        `Are you sure you want to ${action.toLowerCase()} admin privileges for ${selectedMember.name}?`,
        [
            { text: 'Cancel', style: 'cancel', onPress: () => setSelectedMember(null) },
            { 
                text: 'Confirm', 
                onPress: async () => {
                    await onToggleAdmin(selectedMember.id);
                    setSelectedMember(null);
                }
            }
        ]
    );
  };

  const handleUpdateImage = async () => {
    if (!canEdit) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: 'group-avatar.jpg',
          type: 'image/jpeg',
        } as any);

        const uploadRes = await client.post('/chat/upload', formData);
        const imageUrl = uploadRes.url;

        // Update Activity
        await client.put(`/activities/${id}`, { image: imageUrl });
        
        if (onImageUpdate) onImageUpdate(imageUrl);
        Alert.alert('Success', 'Group profile image updated!');
      }
    } catch (err) {
      console.error('Failed to update group image:', err);
      Alert.alert('Error', 'Failed to update group image.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Group Hero Section */}
      <View style={styles.heroSection}>
        <TouchableOpacity 
          disabled={!canEdit}
          onPress={handleUpdateImage}
          style={styles.imageSelectorWrapper}
        >
          <View style={[styles.groupIconContainer, { borderColor: colorScheme === 'dark' ? theme.primary + '30' : theme.border, borderWidth: 1 }]}>
            {!groupImage ? (
              <>
                <LinearGradient
                  colors={colorScheme === 'dark' ? [theme.primary, '#0369A1'] : ['#E0F2FE', '#BAE6FD']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Users size={64} color={colorScheme === 'dark' ? '#FFF' : theme.primary} strokeWidth={1.5} />
                  <View style={{ position: 'absolute', bottom: '15%', right: '15%', backgroundColor: theme.primary, borderRadius: 12, padding: 4, borderWidth: 3, borderColor: colorScheme === 'dark' ? theme.card : '#FFF' }}>
                     <Zap size={20} color="#FFF" fill="#FFF" />
                  </View>
                </View>
              </>
            ) : (
                <Image 
                  source={getAvatarUrl(groupImage, true)} 
                  style={styles.largeGroupAvatar} 
                  contentFit="cover"
                />
            )}
            {canEdit && (
              <View style={styles.editIconOverlay}>
                <Camera size={20} color="white" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.heroName, { color: theme.text }]}>{title || 'Activity Group'}</Text>
        <View style={[styles.badgeContainer, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>ACTIVITY HUB GROUP</Text>
        </View>

        <View style={styles.quickAccess}>
            <QuickBtn icon={Megaphone} label="Announce" color="#F59E0B" />
            <QuickBtn icon={FileText} label="Materials" color="#3B82F6" />
            <QuickBtn icon={Shield} label="Guidelines" color="#10B981" />
            <QuickBtn icon={SettingsIcon} label="Tools" color="#6366F1" />
        </View>
      </View>

      {/* Participants Section - More Prominent */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
                <Users size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PARTICIPANTS • {members.length}</Text>
            </View>
            <TouchableOpacity style={styles.searchIcon}>
                <Search size={18} color={theme.primary} />
            </TouchableOpacity>
        </View>

        <View style={[styles.membersCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {sortedMembers.map((member, idx) => (
                <View key={member.id}>
                    <TouchableOpacity 
                        style={styles.memberItem}
                        onPress={() => handleMemberPress(member)}
                    >
                        <View style={styles.memberAvatarContainer}>
                            <Image source={getAvatarUrl(member.avatar)} style={[styles.memberAvatar, { backgroundColor: theme.primary + '10' }]} />
                            {onlineUsers.includes(member.id) && (
                                <View style={[styles.onlineDot, { borderColor: theme.card }]} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                                    {member.id === currentUserId ? `${member.name} (You)` : member.name}
                                </Text>
                                {member.isGroupAdmin && (
                                    <View style={[styles.adminBadge, { backgroundColor: theme.primary + '15' }]}>
                                        <Text style={[styles.adminBadgeText, { color: theme.primary }]}>ADMIN</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.memberRole, { color: theme.textSecondary }]}>
                                {member.role === 'coordinator' ? '👨‍🏫 COORDINATOR' : member.role.toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.memberMore}
                            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: member.id } })}
                        >
                             <MessageSquare size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                    {idx < sortedMembers.length - 1 && <View style={[styles.divider, { marginLeft: 68, backgroundColor: theme.border }]} />}
                </View>
            ))}
            
            <TouchableOpacity style={[styles.viewMoreBtn, { borderTopColor: theme.border }]}>
               <Text style={[styles.viewMoreText, { color: theme.primary }]}>View all participants</Text>
            </TouchableOpacity>
        </View>

        {/* Member Action Modal */}
        {selectedMember && (
            <AlertModal
                visible={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                title={selectedMember.name}
                theme={theme}
            >
                <TouchableOpacity style={styles.modalActionItem} onPress={() => {
                    setSelectedMember(null);
                    router.push({ pathname: '/chat/[id]', params: { id: selectedMember.id } });
                }}>
                    <MessageSquare size={20} color={theme.primary} />
                    <Text style={[styles.modalActionText, { color: theme.text }]}>Message {selectedMember.name}</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.modalActionItem} onPress={confirmToggleAdmin}>
                    <Shield size={20} color={theme.primary} />
                    <Text style={[styles.modalActionText, { color: theme.text }]}>
                        {selectedMember.isGroupAdmin ? 'Revoke Admin' : 'Grant Admin'}
                    </Text>
                </TouchableOpacity>
            </AlertModal>
        )}
      </View>

      {/* Group Settings */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginLeft: 20, marginBottom: 8 }]}>GROUP SETTINGS</Text>
      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <OptionItem 
          icon={Bell} 
          label="Mute Group Notifications" 
          theme={theme} 
          right={<Switch value={isMuted} onValueChange={toggleMute} />} 
        />
        <View style={styles.divider} />
        <OptionItem icon={Download} label="Auto-download Files" theme={theme} right={<Switch value={autoDownload} onValueChange={() => setAutoDownload(!autoDownload)} />} />
        <View style={styles.divider} />
        <OptionItem icon={BookOpen} label="Group Description" theme={theme} body="Standard activity group for collaborative learning and project development." />
      </View>

      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <OptionItem icon={Smartphone} label="Group Media & Links" theme={theme} />
        <View style={styles.divider} />
        <OptionItem 
            icon={Smartphone} 
            label="Wallpaper & Theme" 
            theme={theme} 
            onPress={() => router.push({ pathname: '/chat/wallpaper', params: { id } })}
        />
      </View>

      {/* Group Actions */}
      <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10 }]}>
        <TouchableOpacity style={styles.dangerItem} onPress={handleClearChat}>
          <Trash2 size={20} color={theme.error} />
          <Text style={[styles.dangerText, { color: theme.error }]}>Clear Group Chat</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.dangerItem} onPress={() => Alert.alert("Leave Group", "You will no longer receive messages. Re-join requires coordinator approval.")}>
          <LogOut size={20} color={theme.error} />
          <Text style={[styles.dangerText, { color: theme.error }]}>Exit Group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Lock size={12} color={theme.textSecondary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Managed by University Activity Hub</Text>
      </View>
    </ScrollView>
  );
};

const QuickBtn = ({ icon: Icon, label, color }: any) => (
  <TouchableOpacity style={styles.quickBtn}>
    <View style={[styles.quickIconCircle, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const OptionItem = ({ icon: Icon, label, theme, right, onPress, body }: any) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress} disabled={!onPress && !right && !body}>
    <View style={{ flex: 1 }}>
        <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
                <View style={[styles.optionIconBox, { backgroundColor: theme.primary + '10' }]}>
                    <Icon size={20} color={theme.primary} />
                </View>
                <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
            </View>
            {right && right}
            {!right && !body && <ChevronRight size={18} color={theme.textSecondary} />}
        </View>
        {body && <Text style={[styles.optionBody, { color: theme.textSecondary }]}>{body}</Text>}
    </View>
  </TouchableOpacity>
);

