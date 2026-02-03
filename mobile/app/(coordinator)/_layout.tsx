import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { usePathname, Tabs, useRouter } from 'expo-router';
import { Drawer } from 'react-native-drawer-layout';
import { 
  LayoutDashboard, Calendar, FileText, Bell, User, MessageCircle, 
  Menu, CheckCircle, Plus, Activity, BarChart3, Clock,
  CalendarPlus, ClipboardList, CheckSquare
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { useAuth } from '@/src/context/AuthContext';
import { IMAGE_BASE } from '@/src/lib/config';
import { ShakingBellIcon } from '@/src/components/ShakingBellIcon';
import { ChatIcon } from '@/src/components/ChatIcon';

export default function CoordinatorLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const renderDrawerContent = () => (
    <View style={[styles.drawerContainer, { backgroundColor: theme.card }]}>
      <View style={styles.drawerHeader}>
        <Text style={styles.brandTitle}>JU-AMS</Text>
        <Text style={[styles.roleLabel, { color: theme.textSecondary }]}>COORDINATOR PORTAL</Text>
      </View>
      
      <View style={styles.drawerLinks}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DrawerLink 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onPress={() => { router.push('/(coordinator)/dashboard'); setOpen(false); }}
            active={pathname.includes('/dashboard')} 
            theme={theme}
          />
          <DrawerLink 
            icon={CalendarPlus} 
            label="Create Activity" 
            onPress={() => { router.push('/(coordinator)/propose'); setOpen(false); }}
            active={pathname.includes('/propose')}
            theme={theme}
          />
          <DrawerLink 
            icon={ClipboardList} 
            label="Manage Activities" 
            onPress={() => { router.push('/(coordinator)/activities'); setOpen(false); }}
            active={pathname.includes('/activities')}
            theme={theme}
          />
          <DrawerLink 
            icon={FileText} 
            label="Applications" 
            onPress={() => { router.push('/(coordinator)/applications'); setOpen(false); }}
            active={pathname.includes('/applications')}
            theme={theme}
          />
          {/* Custom Notifications Link with Shaking Bell */}
          <TouchableOpacity 
            style={[styles.drawerLink, pathname.includes('/notifications') && { backgroundColor: theme.primary }]}
            onPress={() => { router.push('/(coordinator)/notifications'); setOpen(false); }}
          >
            <ShakingBellIcon 
              size={20} 
              color={pathname.includes('/notifications') ? '#FFFFFF' : theme.icon} 
              badgeColor="#EF4444"
              route="/(coordinator)/notifications"
            />
            <Text style={[
              styles.drawerLinkLabel, 
              { color: pathname.includes('/notifications') ? '#FFFFFF' : theme.textSecondary },
              pathname.includes('/notifications') && styles.drawerLinkLabelActive
            ]}>Notifications</Text>
          </TouchableOpacity>
          <DrawerLink 
            icon={CheckSquare} 
            label="Attendance" 
            onPress={() => { router.push('/(coordinator)/attendance'); setOpen(false); }}
            active={pathname.includes('/attendance')}
            theme={theme}
          />
        </ScrollView>
      </View>

      <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
        <View style={[styles.profileBox, { backgroundColor: theme.background }]}>
          <Image 
            source={{ uri: user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${IMAGE_BASE}${user.avatar}`) : 'https://github.com/shadcn.png' }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'Coordinator'}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email || 'coordi@gmail.com'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={renderDrawerContent}
      drawerType="front"
      drawerStyle={{ width: 280, backgroundColor: theme.card }}
    >
      <Tabs
        screenOptions={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              style={[styles.menuBtn, { backgroundColor: theme.background }]}
              onPress={() => setOpen(true)}
            >
              <Menu size={24} color={theme.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <View>
                <Text style={[styles.headerHub, { color: theme.textSecondary }]}>JU ACTIVITY HUB</Text>
                <View style={styles.onlineStatus}>
                  <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Coordinator'}</Text>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerIcons}>
              <ChatIcon 
                size={20} 
                color={theme.icon} 
                backgroundColor={theme.background}
              />
              <Image 
                source={{ uri: user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${IMAGE_BASE}${user.avatar}`) : 'https://github.com/shadcn.png' }} 
                style={[styles.headerAvatar, { borderColor: theme.border }]} 
              />
            </View>
          ),
          headerStyle: {
            backgroundColor: theme.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            height: 90,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 85,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          }
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dash',
            tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Apps',
            tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="propose"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings/personal"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings/notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings/security"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings/preferences"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </Drawer>
  );
}

function DrawerLink({ icon: Icon, label, active, onPress, theme }: any) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={[
        styles.drawerLink, 
        active && { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
      ]}
      onPress={onPress}
    >
      <Icon size={24} color={active ? '#FFFFFF' : '#64748B'} strokeWidth={active ? 2.5 : 2} />
      <Text style={[
        styles.drawerLinkLabel, 
        { color: active ? '#FFFFFF' : '#475569' }, 
        active && { fontWeight: '800' }
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: { padding: 24, paddingTop: 60, marginBottom: 10 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#0EA5E9', letterSpacing: -1 },
  roleLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  drawerLinks: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  drawerLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    borderRadius: 16, 
    marginBottom: 8 
  },
  drawerLinkLabel: { fontSize: 17, fontWeight: '600', marginLeft: 16, letterSpacing: 0.2 },
  drawerLinkLabelActive: { fontWeight: '800' },
  drawerFooter: { padding: 16, borderTopWidth: 1, marginBottom: 20 },
  profileBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 13, fontWeight: '700' },
  profileEmail: { fontSize: 11 },
  menuBtn: { marginLeft: 16, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerHub: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  userName: { fontSize: 14, fontWeight: '700', marginRight: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 4 },
  statusText: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
});
