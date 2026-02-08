import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { 
  Users, Activity, FileText, Bell, TrendingUp, AlertTriangle, 
  ShieldCheck, ChevronRight, UserPlus, Monitor, FileSearch, 
  Folders, Settings, ListChecks, Clock 
} from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useRouter } from 'expo-router';

import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import { ShakingBellIcon } from '@/src/components/ShakingBellIcon';
import { useAuth } from '@/src/context/AuthContext';

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return Math.floor(seconds) + "s ago";

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
};

// ... (existing imports)

export default function AdminDashboard() {
  const { lastLogin } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [stats, setStats] = React.useState({
      users: 0,
      activities: 0,
      pendingApps: 0
  });
  const router = useRouter();
  
  const [notifications, setNotifications] = React.useState<any[]>([]);


  React.useEffect(() => {
      const fetchData = async () => {
          try {
              // Parallel fetching for performance
              const [usersRes, activitiesRes, appsRes, notifRes] = await Promise.allSettled([
                  client.get('/users'),
                  client.get(ENDPOINTS.ACTIVITIES),
                  client.get('/applications'),
                  client.get('/notifications')
              ]);
 
              setStats({
                  users: usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value.length : 0,
                  activities: activitiesRes.status === 'fulfilled' && Array.isArray(activitiesRes.value) ? activitiesRes.value.length : 0,
                  pendingApps: appsRes.status === 'fulfilled' && Array.isArray(appsRes.value) ? appsRes.value.length : 0
              });

              if (notifRes.status === 'fulfilled') {
                  setNotifications(notifRes.value.slice(0, 3));
              }
          } catch (e) {
              console.log('Failed to fetch dashboard data', e);
          }
      };
      
      fetchData();
  }, []);

  return (
    <GradientBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* ... (Header Banner) ... */}
        <View style={styles.headerBanner}>
            <View style={{ flex: 1 }}>
                <View style={styles.bannerTopRow}>
                    <View style={styles.shieldIconBox}>
                        <ShieldCheck size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>System Online</Text>
                    </View>
                </View>
                <Text style={styles.bannerTitle}>Admin Center</Text>
                <Text style={styles.bannerSubtitle}>
                    {lastLogin ? `Last login: ${lastLogin}` : "Monitor metrics and orchestrate campus activities."}
                </Text>
            </View>
            <ShakingBellIcon
                size={24}
                color="#FFFFFF"
                badgeColor="#EF4444"
                route="/(admin)/notifications"
                style={styles.headerBellBtn}
            />
        </View>

        {/* Dynamic Stats Scroll */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Overview</Text>
            <TrendingUp size={16} color="#22C55E" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsScrollContent}>
            <StatCard label="Total Users" value={stats.users.toString()} icon={Users} color="#0EA5E9" trend="+12%" theme={theme} />
            <StatCard label="Activities" value={stats.activities.toString()} icon={Activity} color="#8B5CF6" trend="+5%" theme={theme} />
            <StatCard label="Pending Apps" value={stats.pendingApps.toString()} icon={FileSearch} color="#F59E0B" trend="-2%" theme={theme} />
            <StatCard label="System Load" value="14%" icon={Monitor} color="#22C55E" trend="Stable" theme={theme} />
        </ScrollView>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Terminal Hub</Text>
        </View>
        <View style={styles.actionGrid}>
            <ActionTile icon={Folders} label="Create" subLabel="New Activity" color="#0EA5E9" theme={theme} />
            <ActionTile icon={Monitor} label="Monitor" subLabel="All Events" color="#8B5CF6" theme={theme} />
            <ActionTile icon={FileSearch} label="Review" subLabel="Student Apps" color="#F59E0B" theme={theme} />
            <ActionTile icon={Users} label="Directory" subLabel="JU Database" color="#22C55E" theme={theme} />
            <ActionTile icon={Settings} label="Staff" subLabel="Manage Team" color={theme.textSecondary} theme={theme} />
            <ActionTile icon={ListChecks} label="Audit" subLabel="System Logs" color="#EC4899" theme={theme} />
        </View>

        {/* System Intelligence / Alerts */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Intelligence</Text>
        </View>
        <View style={styles.alertsList}>
            {notifications.length > 0 ? notifications.map((notif: any) => (
                <AlertItem 
                    key={notif.id}
                    type={notif.type || 'info'} 
                    msg={notif.title} 
                    time={timeAgo(new Date(notif.createdAt))} 
                    theme={theme}
                />
            )) : (
                <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 20 }}>No clinical alerts.</Text>
            )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function StatCard({ label, value, icon: Icon, color, trend, theme }: any) {
  return (
    <GlassCard style={[styles.statCard, { backgroundColor: theme.card }]}>
        <View style={styles.statCardHeader}>
            <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                <Icon size={18} color={color} />
            </View>
            <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#22C55E' : trend.startsWith('-') ? '#EF4444' : theme.textSecondary }]}>
                {trend}
            </Text>
        </View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </GlassCard>
  )
}

function ActionTile({ icon: Icon, label, subLabel, color, theme }: any) {
    return (
        <TouchableOpacity style={styles.actionTileWrapper}>
            <GlassCard style={[styles.actionTile, { backgroundColor: theme.card }]}>
                <View style={[styles.actionIconBox, { backgroundColor: color + '10' }]}>
                    <Icon size={24} color={color} />
                </View>
                <Text style={[styles.actionTileLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.actionTileSub, { color: theme.textSecondary }]}>{subLabel}</Text>
            </GlassCard>
        </TouchableOpacity>
    )
}

function AlertItem({ type, msg, time, theme }: any) {
    const isWarning = type === 'warning';
    const isSuccess = type === 'success';
    const color = isWarning ? '#F59E0B' : isSuccess ? '#22C55E' : '#3B82F6';
    
    return (
        <GlassCard style={[styles.alertCard, { backgroundColor: theme.card }]}>
            <View style={[styles.alertIndicator, { backgroundColor: color }]} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={[styles.alertMsg, { color: theme.text }]}>{msg}</Text>
                <View style={styles.alertFooter}>
                    <Clock size={10} color={theme.textSecondary} />
                    <Text style={[styles.alertTime, { color: theme.textSecondary }]}>{time}</Text>
                </View>
            </View>
            <ChevronRight size={14} color={theme.icon} />
        </GlassCard>
    )
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingTop: 14, paddingBottom: 60 },
  headerBanner: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EA5E9', 
    padding: 24, 
    borderRadius: 28, 
    marginBottom: 24, 
    shadowColor: '#0EA5E9', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 15, 
    elevation: 8 
  },
  bannerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  shieldIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
  bannerTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.8, marginTop: 6, lineHeight: 18, maxWidth: '85%' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  statsScroll: { flexGrow: 0, marginBottom: 24 },
  statsScrollContent: { paddingRight: 16 },
  statCard: { width: 140, padding: 16, marginRight: 12, borderRadius: 20 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  trendText: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionTileWrapper: { width: '48%' },
  actionTile: { padding: 16, borderRadius: 20, alignItems: 'center' },
  actionIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTileLabel: { fontSize: 14, fontWeight: '800' },
  actionTileSub: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  alertsList: { gap: 10 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18 },
  alertIndicator: { width: 4, height: 28, borderRadius: 2 },
  alertMsg: { fontSize: 13, fontWeight: '700' },
  alertFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  alertTime: { fontSize: 11, fontWeight: '500' },
  headerBellBtn: {
      padding: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      marginLeft: 16,
      justifyContent: 'center',
      alignItems: 'center',
      height: 48,
      width: 48,
  },
  notifDot: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      zIndex: 10,
      borderWidth: 1.5,
      borderColor: '#FFFFFF'
  }
});
