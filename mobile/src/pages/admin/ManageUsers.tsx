import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { User, Shield, Search, Filter, Trash2, Ban, UserPlus, Mail, Calendar, X } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { Image } from 'expo-image';
import { IMAGE_BASE } from '@/src/lib/config';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

import { client } from '@/src/lib/api';
import { getAvatarUrl } from '@/src/lib/media';

export default function ManageUsers() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [users, setUsers] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string>('');
  const [modalVisible, setModalVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = React.useState('');

  const fetchUsers = async () => {
    try {
      const data = await client.get('/users');
      if (Array.isArray(data)) {
        setUsers(data);
      }
      
      try {
        const me = await client.get('/users/me');
        setCurrentUserId(me.id);
      } catch (e) {
        console.log('Could not fetch current user');
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleDelete = (userId: string, userName: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await client.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            Alert.alert("Success", "User deleted successfully");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete user");
          }
        }}
      ]
    );
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean, userName: string) => {
    if (userId === currentUserId && currentStatus) {
      Alert.alert(
        "Cannot Deactivate",
        "You cannot deactivate your own account.",
        [{ text: "OK" }]
      );
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: action.charAt(0).toUpperCase() + action.slice(1), style: currentStatus ? "destructive" : "default", onPress: async () => {
          try {
            await client.patch(`/users/${userId}/status`, {});
            Alert.alert("Success", `User ${action}d successfully`);
            await fetchUsers();
          } catch (e: any) {
            Alert.alert("Error", e.message || `Failed to ${action} user`);
          }
        }}
      ]
    );
  };

  const handleCreateCoordinator = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await client.post('/users', { 
        ...formData, 
        role: 'coordinator',
        status: 'active'
      });
      Alert.alert("Success", "Coordinator created successfully");
      setModalVisible(false);
      setFormData({ name: '', email: '', password: '', department: '' });
      await fetchUsers();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create coordinator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.text}
            colors={[theme.text]}
          />
        }
      >
        {/* Blue Header Banner - Matching Activities Style */}
        <View style={styles.headerBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Manage Users</Text>
            <Text style={styles.bannerSubtitle}>
              Oversee accounts, adjust permissions, and maintain directory integrity.
            </Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
            <UserPlus size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.createBtnText}>Create New</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters - Matching Activities Style */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput 
              placeholder="Quick search users..." 
              style={[styles.searchInput, { color: theme.text }]}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Filter size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Section Header - Matching Activities Style */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>User Directory</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>System-wide account management</Text>
          </View>
        </View>

        <View style={styles.list}>
          {users.length > 0 ? users.map((user) => {
            const isMe = user.id === currentUserId;
            const isActive = user.status === 'active';
            
            return (
              <UserCard 
                key={user.id}
                user={user}
                isMe={isMe}
                isActive={isActive}
                theme={theme}
                onDelete={() => handleDelete(user.id, user.name)}
                onToggleStatus={() => handleToggleStatus(user.id, isActive, user.name)}
                onPressImage={() => {
                  const avatarUrl = getAvatarUrl(user.avatar);
                  setSelectedImage(typeof avatarUrl === 'object' ? avatarUrl.uri : null);
                  setSelectedUserName(user.name || 'User');
                  setViewerVisible(true);
                }}
              />
            );
          }) : (
            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>No users found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity 
            style={styles.viewerCloseArea} 
            activeOpacity={1} 
            onPress={() => setViewerVisible(false)}
          >
            <View style={styles.viewerContent}>
              <Image 
                source={{ uri: selectedImage || '' }}
                style={styles.fullImage}
                contentFit="contain"
              />
              <TouchableOpacity 
                style={styles.viewerCloseBtn} 
                onPress={() => setViewerVisible(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.viewerName}>{selectedUserName}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Create Coordinator Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Coordinator</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Add a new activity coordinator to manage university activities.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter coordinator name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Email *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="coordinator@jazeeraUniversity.edu.so"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Password *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Department (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g., Computer Science"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.department}
                    onChangeText={(text) => setFormData({ ...formData, department: text })}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.cancelBtn, { borderColor: theme.border }]} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.submitBtn, { backgroundColor: theme.primary }]} 
                    onPress={handleCreateCoordinator}
                    disabled={loading}
                  >
                    <Text style={styles.submitBtnText}>
                      {loading ? 'Creating...' : 'Create Coordinator'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}

function UserCard({ user, isMe, isActive, theme, onDelete, onToggleStatus, onPressImage }: any) {
  const roleColor = user.role === 'admin' ? '#3B82F6' : user.role === 'coordinator' ? '#8B5CF6' : '#10B981';
  const roleBg = user.role === 'admin' ? '#3B82F615' : user.role === 'coordinator' ? '#8B5CF615' : '#10B98115';
  const statusColor = isActive ? '#22C55E' : '#EF4444';
  const statusBg = isActive ? '#22C55E15' : '#EF444415';

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <GlassCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Left: User Avatar */}
      <TouchableOpacity 
        onPress={onPressImage}
        activeOpacity={0.8}
        style={[styles.iconBlock, { backgroundColor: theme.background, borderColor: theme.border, overflow: 'hidden' }]}
      >
        <Image 
          source={avatarUrl} 
          style={styles.cardAvatar}
        />
      </TouchableOpacity>

      {/* Middle: Content & Metadata */}
      <View style={styles.cardMain}>
        <View style={styles.tagRow}>
          <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>
              {user.role?.toUpperCase() || 'USER'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {isMe && (
            <View style={[styles.meBadge, { backgroundColor: '#0EA5E915', borderColor: '#0EA5E930' }]}>
              <Text style={[styles.meText, { color: '#0EA5E9' }]}>YOU</Text>
            </View>
          )}
        </View>

        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
          {user.name || 'Unknown User'}
        </Text>
        
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Mail size={12} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
              {user.email || 'N/A'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Shield size={12} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
              {user.department || 'No dept'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={12} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: Actions Column - Stacked Vertically */}
      <View style={[styles.actionsColumn, { borderLeftColor: theme.border }]}>
        {user.role !== 'admin' && (
          <TouchableOpacity 
            onPress={onToggleStatus}
            style={[styles.actionBtn, { backgroundColor: '#60A5FA15', borderColor: '#60A5FA30' }]}
          >
            <Ban size={12} color="#60A5FA" />
            <Text style={[styles.actionBtnText, { color: '#60A5FA' }]}>
              {isActive ? 'Deact' : 'Activate'}
            </Text>
          </TouchableOpacity>
        )}
        {!isMe && (
          <TouchableOpacity 
            onPress={onDelete}
            style={[styles.actionBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}
          >
            <Trash2 size={12} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 12, paddingTop: 14, paddingBottom: 60 },
  
  headerBanner: { 
    backgroundColor: '#0EA5E9', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 11, color: '#FFFFFF', opacity: 0.8, marginTop: 4, lineHeight: 16, maxWidth: '80%' },
  createBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'center' },
  searchContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    height: 44, 
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 13, fontWeight: '500' },
  filterBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
  },
  
  sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  
  list: { gap: 12 },
  card: { 
    flexDirection: 'row', 
    padding: 12, 
    borderRadius: 24, 
    borderWidth: 1,
  },
  
  iconBlock: { 
    width: 48, 
    height: 52, 
    borderRadius: 14, 
    justifyContent: 'center', 
    marginTop: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  
  cardMain: { flex: 1, paddingLeft: 12, paddingRight: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  roleText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, gap: 3 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  meBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  meText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  
  userName: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontWeight: '600' },
  
  actionsColumn: { paddingLeft: 10, borderLeftWidth: 1, gap: 5, justifyContent: 'center' },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 7,
    borderWidth: 1,
    minWidth: 56,
  },
  actionBtnText: { fontSize: 9, fontWeight: '800' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 50,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Image Viewer Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 20,
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerName: {
    position: 'absolute',
    bottom: 50,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardAvatar: {
    width: '100%',
    height: '100%',
  },
});
