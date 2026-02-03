import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Drawer } from 'react-native-drawer-layout';
import { LayoutDashboard, Calendar, FileText, Bell, User, Search, Menu, Folders, Monitor, Users, Settings, TrendingUp, ListChecks } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { getAvatarUrl } from '@/src/lib/media';

export default function HybridLayout() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const renderDrawerContent = () => (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.brandTitle}>JU-AMS</Text>
      </View>
      
      <View style={styles.drawerLinks}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DrawerLink 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onPress={() => { router.push('/(tabs)/home'); setOpen(false); }}
            active 
          />
          <DrawerLink 
            icon={Folders} 
            label="Create Activity" 
            onPress={() => { router.push('/(admin)/create'); setOpen(false); }} 
          />
          <DrawerLink 
            icon={Calendar} 
            label="Admin Activities" 
            onPress={() => { router.push('/(admin)/activities'); setOpen(false); }} 
          />
          <DrawerLink 
            icon={Monitor} 
            label="Monitor Activities" 
            onPress={() => { router.push('/(admin)/monitor'); setOpen(false); }} 
          />
          <DrawerLink 
            icon={Bell} 
            label="Notifications" 
            onPress={() => { router.push('/(tabs)/notifications'); setOpen(false); }} 
          />
          <DrawerLink 
            icon={FileText} 
            label="Applications" 
            onPress={() => { router.push('/(tabs)/applications'); setOpen(false); }} 
          />
          <DrawerLink 
            icon={User} 
            label="Profile" 
            onPress={() => { router.push('/(tabs)/profile'); setOpen(false); }} 
          />
        </ScrollView>
      </View>

      <View style={styles.drawerFooter}>
        <View style={styles.profileBox}>
          <Image 
            source={getAvatarUrl()} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>muscab axmed</Text>
            <Text style={styles.profileEmail}>muscabqaarey@gmail.co..</Text>
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
      drawerStyle={{ width: 280 }}
    >
      <Tabs
        screenOptions={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.menuBtn}
              onPress={() => setOpen(true)}
            >
              <Menu size={24} color="#1E293B" />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <View>
                <Text style={styles.headerHub}>JU ACTIVITY HUB</Text>
                <View style={styles.onlineStatus}>
                  <Text style={styles.userName}>muscab axmed</Text>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Search size={20} color="#64748B" />
              </TouchableOpacity>
              <Image 
                source={getAvatarUrl()} 
                style={styles.headerAvatar} 
              />
            </View>
          ),
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
            height: 90,
          },
          tabBarActiveTintColor: '#0369A1',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            height: 65,
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
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
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
            tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
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
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </Drawer>
  );
}

function DrawerLink({ icon: Icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.drawerLink, active && styles.drawerLinkActive]}
      onPress={onPress}
    >
      <Icon size={22} color={active ? '#FFFFFF' : '#64748B'} />
      <Text style={[styles.drawerLinkLabel, active && styles.drawerLinkLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4FA3F7',
    letterSpacing: -1,
  },
  drawerLinks: {
    flex: 1,
    paddingHorizontal: 16,
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerLinkActive: {
    backgroundColor: '#4FA3F7',
  },
  drawerLinkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 12,
  },
  drawerLinkLabelActive: {
    color: '#FFFFFF',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 20,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  menuBtn: {
    marginLeft: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerHub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
});
