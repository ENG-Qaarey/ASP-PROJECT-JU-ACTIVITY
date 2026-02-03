import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Drawer } from 'react-native-drawer-layout';
import { 
  LayoutGrid, FilePlus, Calendar, Activity, Bell, 
  Inbox, Users, UserCog, BarChart3, Terminal,
  Menu, MessageCircle, User
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { IMAGE_BASE } from '@/src/lib/config';
import { getAvatarUrl } from '@/src/lib/media';
import { ShakingBellIcon } from '@/src/components/ShakingBellIcon';
import { ChatIcon } from '@/src/components/ChatIcon';

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const { user, refreshProfile } = useAuth();
  
  const isActive = (path: string) => pathname === path;
  const theme = Colors[colorScheme];

  const fullAvatarUrl = getAvatarUrl(user?.avatar);

  const renderDrawerContent = () => (
    <View style={[styles.drawerContainer, { backgroundColor: theme.card }]}>
      <View style={styles.drawerHeader}>
        <Text style={styles.brandTitle}>JU-AMS</Text>
        <Text style={[styles.roleLabel, { color: theme.textSecondary }]}>ADMIN CONSOLE</Text>
      </View>
      
      <View style={styles.drawerLinks}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DrawerLink 
            icon={LayoutGrid} 
            label="Dashboard" 
            onPress={() => { router.push('/(admin)/dashboard'); setOpen(false); }}
            active={isActive('/dashboard')} 
            theme={theme}
          />
          <DrawerLink 
            icon={FilePlus} 
            label="Create Activity" 
            onPress={() => { router.push('/(admin)/create'); setOpen(false); }} 
            active={isActive('/create')}
            theme={theme}
          />
           <DrawerLink 
            icon={Calendar} 
            label="Admin Activities" 
            onPress={() => { router.push('/(admin)/activities'); setOpen(false); }}
            active={isActive('/activities') || pathname.includes('/activities')}
            theme={theme}
          />
          <DrawerLink 
            icon={Activity} 
            label="Monitor Activities" 
            onPress={() => { router.push('/(admin)/monitor'); setOpen(false); }}
            active={isActive('/monitor')}
            theme={theme}
          />
          {/* Custom Notifications Link with Shaking Bell */}
          <TouchableOpacity 
            style={[styles.drawerLink, isActive('/notifications') && { backgroundColor: theme.primary }]}
            onPress={() => { router.push('/(admin)/notifications'); setOpen(false); }}
          >
            <ShakingBellIcon 
              size={20} 
              color={isActive('/notifications') ? '#FFFFFF' : theme.icon} 
              badgeColor="#EF4444"
              route="/(admin)/notifications"
            />
            <Text style={[
              styles.drawerLinkLabel, 
              { color: isActive('/notifications') ? '#FFFFFF' : theme.textSecondary },
              isActive('/notifications') && styles.drawerLinkLabelActive
            ]}>Notifications</Text>
          </TouchableOpacity>
          <DrawerLink 
            icon={Inbox} 
            label="Applications" 
            onPress={() => { router.push('/(admin)/applications'); setOpen(false); }}
            active={isActive('/applications') || pathname.includes('/applications')}
            theme={theme}
          />
          <DrawerLink 
            icon={Users} 
            label="Directory" 
            onPress={() => { router.push('/(admin)/users'); setOpen(false); }}
            active={isActive('/users') || pathname.includes('/users')}
            theme={theme}
          />
          <DrawerLink 
            icon={UserCog} 
            label="Manage Users" 
            onPress={() => { router.push('/(admin)/manage-users'); setOpen(false); }}
            active={isActive('/manage-users')}
            theme={theme}
          />
          <DrawerLink 
            icon={BarChart3} 
            label="Advanced Reports" 
            onPress={() => { router.push('/(admin)/reports'); setOpen(false); }}
            active={isActive('/reports')}
            theme={theme}
          />
          <DrawerLink 
            icon={Terminal} 
            label="Audit Logs" 
            onPress={() => { router.push('/(admin)/audit-logs'); setOpen(false); }}
            active={isActive('/audit-logs')}
            theme={theme}
          />
        </ScrollView>
      </View>

      <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
        <View style={[styles.profileBox, { backgroundColor: theme.background }]}>
          <Image 
            source={fullAvatarUrl} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'Admin User'}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email || 'admin@gmail.com'}</Text>
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
                  <Text style={[styles.userName, { color: theme.text }]}>{user?.name?.split(' ')[0] || 'Admin'}</Text>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Admin</Text>
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
                source={fullAvatarUrl} 
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
            tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            title: 'Activities',
            tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Apps',
            tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
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
          name="create" 
          options={{ href: null, headerTitle: "Create Activity" }} 
        />
        <Tabs.Screen 
          name="monitor" 
          options={{ href: null, headerTitle: "Monitor Activities" }} 
        />
        <Tabs.Screen 
          name="notifications" 
          options={{ href: null, headerTitle: "Notifications" }} 
        />
        <Tabs.Screen 
          name="manage-users" 
          options={{ href: null, headerTitle: "Manage Users" }} 
        />
        <Tabs.Screen 
          name="reports" 
          options={{ href: null, headerTitle: "Advanced Reports" }} 
        />
        <Tabs.Screen 
          name="audit-logs" 
          options={{ href: null, headerTitle: "Audit Logs" }} 
        />
        <Tabs.Screen 
          name="settings/personal" 
          options={{ 
            href: null, 
            headerTitle: "Personal Info",
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="settings/notifications" 
          options={{ 
            href: null, 
            headerTitle: "Notifications",
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="settings/security" 
          options={{ 
            href: null, 
            headerTitle: "Security",
            tabBarStyle: { display: 'none' }
          }} 
        />
        <Tabs.Screen 
          name="settings/preferences" 
          options={{ 
            href: null, 
            headerTitle: "Preferences",
            tabBarStyle: { display: 'none' }
          }} 
        />
      </Tabs>
    </Drawer>
  );
}

function DrawerLink({ icon: Icon, label, active, onPress, theme }: any) {
  return (
    <TouchableOpacity 
      style={[styles.drawerLink, active && { backgroundColor: theme.primary }]}
      onPress={onPress}
    >
      <Icon size={20} color={active ? '#FFFFFF' : theme.icon} strokeWidth={active ? 2.5 : 2} />
      <Text style={[styles.drawerLinkLabel, { color: active ? '#FFFFFF' : theme.textSecondary }, active && styles.drawerLinkLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: { padding: 24, paddingTop: 60, marginBottom: 10 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#0EA5E9', letterSpacing: -1 },
  roleLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  drawerLinks: { flex: 1, paddingHorizontal: 16 },
  drawerLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  drawerLinkLabel: { fontSize: 16, fontWeight: '500', marginLeft: 16 },
  drawerLinkLabelActive: { fontWeight: '700' },
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
