import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions, TextInput, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { 
  Calendar, Users, Award, Sparkles, Bell, 
  Search, TrendingUp, MapPin, Clock, ChevronRight,
  Zap, Star, ShieldCheck, LayoutGrid, Rocket, Target,
  Flame, BookmarkCheck
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { ThemedText } from '@/src/components/themed-text';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useRouter, useFocusEffect } from 'expo-router';
import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import { useAuth } from '@/src/context/AuthContext';
import { ActivityIndicator, RefreshControl } from 'react-native';

const { width } = Dimensions.get('window');

const MOCK_RECENT = [
    {
        id: '101',
        title: "Intro to Graphic Design",
        category: "Workshop",
        time: "Added 2h ago",
        location: "Lab 4",
        color: "#0EA5E9"
    },
    {
        id: '102',
        title: "Annual Chess Masters",
        category: "Tournament",
        time: "Added 5h ago",
        location: "Cafeteria",
        color: "#10B981"
    },
    {
        id: '103',
        title: "Blockchain Fundamentals",
        category: "Seminar",
        time: "Added Yesterday",
        location: "Main Hall",
        color: "#8B5CF6"
    }
];

export default function StudentDashboard() {
  const { user, lastLogin } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
      points: 0,
      events: 0,
      saved: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(false);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const shakeLoop = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (hasUnread) {
        startShake();
    } else {
        shakeLoop.current?.stop();
        shakeAnim.setValue(0);
    }
    return () => shakeLoop.current?.stop();
  }, [hasUnread]);

  const startShake = () => {
      // Stop any existing loop first
      shakeLoop.current?.stop();
      shakeLoop.current = Animated.loop(
          Animated.sequence([
              Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
              Animated.delay(1000) 
          ])
      );
      shakeLoop.current.start();
  };

  const loadDashboardData = React.useCallback(async () => {
    try {
        setLoading(true);
        const [actsData, appsData, attendanceData, notifsData] = await Promise.all([
            client.get(ENDPOINTS.ACTIVITIES),
            client.get('/applications'),
            client.get('/attendance?status=present'),
            client.get('/notifications')
        ]);

        if (Array.isArray(actsData)) {
            setRecentActivities(actsData.slice(0, 3).map((act, index) => ({
                ...act,
                color: index === 0 ? "#0EA5E9" : index === 1 ? "#10B981" : "#8B5CF6"
            })));
        }

        const presentCount = Array.isArray(attendanceData) ? attendanceData.length : 0;
        const appsCount = Array.isArray(appsData) ? appsData.length : 0;

        setStats({
            points: presentCount * 100, // Derived points
            events: presentCount,
            saved: appsCount
        });

        // Check for unread notifications
        // Assuming notification object has 'read' or 'isRead', otherwise just check length > 0
        const unreadCount = Array.isArray(notifsData) 
            ? notifsData.filter((n: any) => !n.read).length 
            : 0;
        setHasUnread(unreadCount > 0);

    } catch (error) {
        console.log('Failed to load dashboard data:', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
        loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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
        {/* Welcome Header */}
        <View style={styles.header}>
            <View>
                <ThemedText style={[styles.welcomeText, { color: theme.textSecondary }]}>
                    {lastLogin ? `Last login: ${lastLogin}` : `Welcome back,`}
                </ThemedText>
                <ThemedText style={[styles.userName, { color: theme.text }]}>{user?.name || 'Student'}</ThemedText>
            </View>
            <TouchableOpacity 
                style={[styles.notifBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                    setHasUnread(false); // Stop shaking on click
                    router.push('/(student)/(tabs)/notifications');
                }}
            >
                {hasUnread && <View style={[styles.notifDot, { borderColor: theme.card }]} />}
                <Animated.View style={{ transform: [{ rotate: shakeAnim.interpolate({
                    inputRange: [-10, 10],
                    outputRange: ['-10deg', '10deg']
                }) }] }}>
                    <Bell size={22} color={theme.text} />
                </Animated.View>
            </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={18} color={theme.textSecondary} />
            <TextInput 
                placeholder="Find workshops, seminars..." 
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
            />
        </View>

        {/* Performance Stats */}
        <View style={[styles.statsSummaryRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SummaryStat icon={Flame} label="Points" value={stats.points.toLocaleString()} color="#F59E0B" theme={theme} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <SummaryStat icon={Target} label="History" value={stats.events.toString()} color="#10B981" theme={theme} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <SummaryStat icon={BookmarkCheck} label="Applied" value={stats.saved.toString()} color="#3B82F6" theme={theme} />
        </View>

        {/* Categories Grid */}
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Explore Categories</ThemedText>
                <TouchableOpacity onPress={() => router.navigate('/(student)/(tabs)/activities')}>
                    <ThemedText style={[styles.seeAll, { color: theme.primary }]}>View All</ThemedText>
                </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
                <CategoryBox icon={Zap} label="Technical" color="#3B82F6" count="15" theme={theme} />
                <CategoryBox icon={Users} label="Social" color="#8B5CF6" count="24" theme={theme} />
                <CategoryBox icon={Star} label="Academic" color="#F59E0B" count="08" theme={theme} />
                <CategoryBox icon={ShieldCheck} label="Sports" color="#10B981" count="12" theme={theme} />
            </View>
        </View>

        {/* Quick Access Actions */}
        <View style={styles.quickAccessRow}>
            <QuickActionCard 
                icon={LayoutGrid} 
                label="My Applications" 
                desc="Track your status" 
                color="#6366F1"
                theme={theme}
                onPress={() => router.push('/(student)/(tabs)/applications')}
            />
            <QuickActionCard 
                icon={Rocket} 
                label="Available Now" 
                desc="Join new activities" 
                color="#EC4899"
                theme={theme}
                onPress={() => router.push('/(student)/(tabs)/activities')}
            />
        </View>

        {/* Recent Activities Section */}
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Recently Added Activities</ThemedText>
            </View>
            <View style={styles.activityList}>
                {loading && !refreshing ? (
                    <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                ) : recentActivities.length > 0 ? (
                    recentActivities.map((act) => (
                        <ActivityCompactItem 
                            key={act.id}
                            title={act.title}
                            category={act.category}
                            time={act.date.split('T')[0]}
                            location={act.location}
                            color={act.color || "#0EA5E9"}
                            theme={theme}
                            onPress={() => router.push({ 
                                pathname: '/(student)/details' as any, 
                                params: { ...act } 
                            })} 
                        />
                    ))
                ) : (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <ThemedText style={{ color: theme.textSecondary }}>No recent activities</ThemedText>
                    </View>
                )}
            </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function SummaryStat({ icon: Icon, label, value, color, theme }: any) {
    return (
        <View style={styles.summaryStatItem}>
            <View style={[styles.summaryIcon, { backgroundColor: color + '10' }]}>
                <Icon size={16} color={color} />
            </View>
            <View>
                <ThemedText style={[styles.summaryValue, { color: theme.text }]}>{value}</ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
            </View>
        </View>
    );
}

function CategoryBox({ icon: Icon, label, color, count, theme }: any) {
    return (
        <TouchableOpacity style={styles.categoryBox}>
            <View style={[styles.categoryIcon, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <Icon size={22} color={color} />
            </View>
            <ThemedText style={[styles.categoryLabel, { color: theme.text }]}>{label}</ThemedText>
            <ThemedText style={[styles.categoryCount, { color: theme.textSecondary }]}>{count}+ Labs</ThemedText>
        </TouchableOpacity>
    );
}

function QuickActionCard({ icon: Icon, label, desc, color, onPress, theme }: any) {
    return (
        <TouchableOpacity 
            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <ThemedText style={[styles.quickLabel, { color: theme.text }]}>{label}</ThemedText>
            <ThemedText style={[styles.quickDesc, { color: theme.textSecondary }]}>{desc}</ThemedText>
        </TouchableOpacity>
    );
}

function ActivityCompactItem({ title, category, time, location, color, theme }: any) {
    return (
        <TouchableOpacity style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7}>
            <View style={[styles.activitySideLine, { backgroundColor: color }]} />
            <View style={styles.activityInfo}>
                <View style={styles.activityTop}>
                    <ThemedText style={[styles.activityTag, { color: theme.textSecondary }]}>{category}</ThemedText>
                    <ThemedText style={[styles.activityTime, { color: theme.textSecondary }]}>{time}</ThemedText>
                </View>
                <ThemedText style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>{title}</ThemedText>
                <View style={styles.activityMeta}>
                    <MapPin size={12} color={theme.textSecondary} />
                    <ThemedText style={[styles.activityLoc, { color: theme.textSecondary }]}>{location}</ThemedText>
                </View>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 140 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 24 
  },
  welcomeText: { fontSize: 14, fontWeight: '600' },
  userName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  notifBtn: { 
    width: 46, 
    height: 46, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', zIndex: 1, borderWidth: 2 },
  
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    paddingHorizontal: 16, 
    height: 52, 
    borderRadius: 16, 
    gap: 12,
    marginBottom: 28,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },

  statsSummaryRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3
  },
  summaryStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 24, marginHorizontal: 8 },

  sectionContainer: { marginBottom: 32 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAll: { fontSize: 12, fontWeight: '700' },

  categoryGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingHorizontal: 20 
  },
  categoryBox: { 
    width: (width - 64) / 4,
    alignItems: 'center',
  },
  categoryIcon: { 
    width: 58, 
    height: 58, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8
  },
  categoryLabel: { fontSize: 12, fontWeight: '800' },
  categoryCount: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  quickAccessRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, marginBottom: 36 },
  quickCard: { 
    flex: 1, 
    padding: 18, 
    borderRadius: 24, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  quickIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  quickLabel: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  quickDesc: { fontSize: 11, fontWeight: '500' },

  activityList: { paddingHorizontal: 20, gap: 12 },
  activityCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    padding: 14, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden'
  },
  activitySideLine: { width: 4, height: '60%', borderRadius: 2, position: 'absolute', left: 0 },
  activityInfo: { flex: 1, marginLeft: 6 },
  activityTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  activityTag: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  activityTime: { fontSize: 10, fontWeight: '600' },
  activityTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityLoc: { fontSize: 12, fontWeight: '600' },
});
