import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, Mail, Shield, Bell, CircleHelp, LogOut, 
  ChevronRight, Settings, LayoutDashboard, Database, Lock,
  Calendar, Users, BookOpen
} from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { GlassCard } from '@/src/components/GlassCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { IMAGE_BASE } from '@/src/lib/config';
import { getAvatarUrl } from '@/src/lib/media';

export default function CoordinatorProfile() {
  const router = useRouter();
  const { user, loading, logout, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { refreshTheme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [viewerVisible, setViewerVisible] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    await refreshTheme();
    router.replace('/login');
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {loading && !refreshing ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
            <>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => setViewerVisible(true)}
            activeOpacity={0.9}
          >
            <Image 
              source={getAvatarUrl(user?.avatar)} 
              style={[styles.avatar, { borderColor: theme.card }]} 
            />
            <View style={[styles.coordBadge, { borderColor: theme.card }]}>
                <User size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
          </TouchableOpacity>
          <ThemedText style={[styles.userName, { color: theme.text }]}>{user?.name || 'Amiin Daahir'}</ThemedText>
          <View style={[styles.roleLabel, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.roleText, { color: theme.primary }]}>ACTIVITY COORDINATOR</Text>
          </View>
        </View>

        {/* Activity Oversight */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Activity Oversight</ThemedText>
          <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
            <ProfileItem icon={Calendar} label="Managed Activities" color="#0EA5E9" theme={theme} />
            <ProfileItem icon={Users} label="Student Directory" color="#8B5CF6" theme={theme} />
            <ProfileItem icon={BookOpen} label="Coordination Logs" color="#F59E0B" theme={theme} />
          </GlassCard>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account Details</ThemedText>
          <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
            <ProfileItem 
                icon={User} 
                label="Personal Information" 
                onPress={() => router.push('/(coordinator)/settings/personal')}
                theme={theme}
            />
            <ProfileItem 
                icon={Bell} 
                label="Duty Notifications" 
                onPress={() => router.push('/(coordinator)/settings/notifications')}
                theme={theme}
            />
             <ProfileItem 
                icon={Lock} 
                label="Security & Password" 
                onPress={() => router.push('/(coordinator)/settings/security')}
                theme={theme}
            />
            <ProfileItem 
                icon={Settings} 
                label="App Preferences" 
                onPress={() => router.push('/(coordinator)/settings/preferences')}
                theme={theme}
            />
          </GlassCard>
        </View>

        {/* Support & Power */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Coordinator Support</ThemedText>
          <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
            <ProfileItem icon={CircleHelp} label="Coordinator Documentation" theme={theme} />
            <ProfileItem icon={LogOut} label="Logout" color="#EF4444" onPress={handleLogout} theme={theme} />
          </GlassCard>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>JU Activity Hub v1.0.1 • Stable</Text>
        </View>
            </>
        )}
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
                source={getAvatarUrl(user?.avatar)}
                style={styles.fullImage}
                contentFit="contain"
              />
              <TouchableOpacity 
                style={styles.viewerCloseBtn} 
                onPress={() => setViewerVisible(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ThemedText style={styles.viewerName}>{user?.name || 'Coordinator'}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function ProfileItem({ icon: Icon, label, color, onPress, theme }: any) {
  const itemColor = color || theme.text;
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconBg, { backgroundColor: itemColor + '15' }]}>
          <Icon size={20} color={itemColor} />
        </View>
        <Text style={[styles.itemLabel, { color: itemColor }]}>{label}</Text>
      </View>
      <ChevronRight size={18} color={theme.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  coordBadge: { position: 'absolute', right: 4, bottom: 4, backgroundColor: '#3B82F6', padding: 6, borderRadius: 12, borderWidth: 2 },
  userName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  roleLabel: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  card: { padding: 8, borderRadius: 24, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemLabel: { fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  versionText: { fontSize: 11, fontWeight: '600' },

  // Image Viewer Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
    fontSize: 20,
    fontWeight: '900',
  },
});
