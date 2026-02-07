import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { 
  Bell, CheckCheck, FileDown, Search, RotateCcw, 
  Info, AlertCircle, CheckCircle, ChevronRight, 
  Zap, Clock, Layers, BarChart3, BookOpen, AlertTriangle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { client } from '@/src/lib/api';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Approval', 'Rejection', 'Announcement', 'Reminder'];
const STATUSES = ['All', 'Unread', 'Read'];

const safeDate = (dateVal: any) => {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 30) return "just now";
  if (seconds < 60) return seconds + "s ago";

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

export default function AdminNotifications() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [activeStatus, setActiveStatus] = React.useState('All');

  const fetchHistory = async () => {
    setErrorStatus(null);
    try {
      // First, get the current admin profile to find the recipientId
      const profile = await client.get('/auth/me');
      const adminId = profile?.user?.id;

      if (!adminId) {
        throw new Error("Unable to identify current terminal operator.");
      }

      // Fetch only notifications intended for this specific admin
      const data = await client.get(`/notifications?recipientId=${adminId}`);
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.log('Mobile: Error fetching admin inbox:', error);
      setErrorStatus(error.message || "Failed to sync with terminal");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const markAllRead = async () => {
    try {
      await client.put('/notifications/read/all', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      Alert.alert("Sync Error", "Could not synchronize read states with server.");
    }
  };

  const markItemRead = async (id: string | number) => {
    try {
      await client.put(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.log("Local: Mark read error:", e);
    }
  };

  const unreadNotifs = notifications.filter(n => !n.read);
  const readNotifs = notifications.filter(n => n.read);
  
  const filteredFeed = notifications.filter(n => {
    const title = n.title?.toLowerCase() || '';
    const message = n.message?.toLowerCase() || '';
    const type = n.type?.toLowerCase() || 'info';
    
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || 
                         message.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || type === activeCategory.toLowerCase();
    const matchesStatus = activeStatus === 'All' || (activeStatus === 'Unread' ? !n.read : n.read);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCatCount = (cat: string) => notifications.filter(n => n.type?.toLowerCase() === cat.toLowerCase()).length;
  const getCatPercent = (cat: string) => {
    if (notifications.length === 0) return 0;
    return (getCatCount(cat) / notifications.length) * 100;
  };

  const getCatColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'approval': return theme.success;
      case 'rejection': return theme.error;
      case 'announcement': return '#8B5CF6';
      case 'reminder': return theme.warning;
      default: return theme.primary;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.masterContainer, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFF' : theme.primary} />
        <Text style={[styles.loadingText, {color: theme.textSecondary}]}>Initializing Intelligence Hub...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.masterContainer, { backgroundColor: theme.background }]}>
      <GradientBackground>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {/* Header */}
          <View style={[styles.topHeader, { backgroundColor: theme.background + 'B3' }]}>
            <View>
              <Text style={[styles.topLabel, { color: theme.primary }]}>ADMIN TERMINAL</Text>
              <View style={styles.hubTitleRow}>
                <Text style={[styles.hubTitle, { color: theme.text }]}>Notifications hub</Text>
                <View style={[styles.unreadBadge, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.unreadBadgeText, { color: theme.primary }]}>{unreadNotifs.length} unread</Text>
                </View>
              </View>
              <Text style={[styles.hubSubtitle, { color: theme.textSecondary }]}>Track approvals, escalations, and system alerts.</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.ghostBtn, {borderColor: theme.border}]} onPress={markAllRead}>
                <CheckCheck size={14} color={theme.text} />
                <Text style={[styles.ghostBtnText, {color: theme.text}]}>Mark all read</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Connection Error Message */}
          {errorStatus && (
            <View style={[styles.errorCard, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}>
              <AlertTriangle size={20} color={theme.error} />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[styles.errorTitle, {color: theme.error}]}>Terminal Sync Interrupted</Text>
                <Text style={[styles.errorDesc, {color: theme.textSecondary}]}>{errorStatus}</Text>
              </View>
              <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, {backgroundColor: theme.error}]}>
                <RotateCcw size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Metrics Section */}
          <View style={styles.metricsSection}>
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#2563EB', '#1D4ED8', '#1E40AF'] : ['#60A5FA', '#3B82F6', '#2563EB']}
              style={styles.healthCard}
            >
              <Text style={styles.healthLabel}>INBOX HEALTH</Text>
              <Text style={styles.healthValue}>{notifications.length}</Text>
              <Text style={styles.healthSub}>Total tracked</Text>
              
              <View style={styles.healthProgressRow}>
                <Text style={styles.healthProgressText}>{readNotifs.length} read</Text>
                <View style={styles.healthTrack}>
                  <View style={[styles.healthFill, { width: `${(readNotifs.length / (notifications.length || 1)) * 100}%` }]} />
                </View>
                <Text style={styles.healthProgressText}>{unreadNotifs.length} unread</Text>
              </View>
            </LinearGradient>

            <View style={styles.miniStats}>
              <GlassCard style={[styles.miniCard, { backgroundColor: theme.card + '80', borderColor: theme.border }]}>
                <Text style={styles.miniLabel}>UNREAD FOCUS</Text>
                <Text style={[styles.miniValue, {color: theme.text}]}>{unreadNotifs.length}</Text>
                <Text style={styles.miniSub}>Pending attention</Text>
              </GlassCard>
              <GlassCard style={[styles.miniCard, { backgroundColor: theme.card + '80', borderColor: theme.border }]}>
                <Text style={styles.miniLabel}>LATEST UPDATE</Text>
                <Text style={[styles.miniValue, {color: theme.text}]}>{notifications.length > 0 ? timeAgo(safeDate(notifications[0].createdAt)) : '--'}</Text>
                <Text style={styles.miniSub}>{new Date().toLocaleDateString('en-GB')}</Text>
              </GlassCard>
            </View>
          </View>

          {/* Feed Filter UI */}
          <View style={styles.feedHub}>
            <View style={styles.feedHubHeader}>
               <Layers size={18} color={theme.primary} />
               <Text style={[styles.feedHubTitle, {color: theme.text}]}>Notifications feed</Text>
            </View>

            <View style={styles.searchRow}>
              <View style={[styles.searchBox, {backgroundColor: theme.card, borderColor: theme.border}]}>
                <Search size={14} color={theme.textSecondary} />
                <TextInput 
                  placeholder="Filter logs..." 
                  placeholderTextColor={theme.textSecondary} 
                  style={[styles.searchInput, {color: theme.text}]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={[styles.resetHubBtn, {backgroundColor: theme.card, borderColor: theme.border}]} onPress={() => {setSearchQuery(''); setActiveCategory('All'); setActiveStatus('All');}}>
                <RotateCcw size={14} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.catPill, activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <Text style={[styles.catPillText, {color: theme.textSecondary}, activeCategory === cat && {color: '#FFF'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* The List */}
          <View style={styles.feedList}>
            {filteredFeed.length > 0 ? filteredFeed.map((item, idx) => (
              <NotificationRow 
                key={item.id || idx} 
                item={item} 
                theme={theme}
                onMarkRead={() => markItemRead(item.id)}
                isLast={idx === filteredFeed.length - 1} 
              />
            )) : (
              <View style={styles.emptyFeed}>
                <Layers size={40} color={theme.border} />
                <Text style={[styles.emptyText, {color: theme.textSecondary}]}>Satellite links stable, no matching signals.</Text>
              </View>
            )}
          </View>

          {/* Analytics Overview */}
          <View style={[styles.analyticsBox, {backgroundColor: theme.card + '40', borderTopColor: theme.border}]}>
            <View style={styles.analyticsHeader}>
              <BarChart3 size={18} color={theme.text} />
              <Text style={[styles.analyticsTitle, {color: theme.text}]}>Category mix</Text>
            </View>
            {CATEGORIES.slice(1).map(cat => (
               <View key={cat} style={styles.mixItem}>
                  <View style={styles.mixHeader}>
                    <Text style={[styles.mixName, {color: theme.textSecondary}]}>{cat}</Text>
                    <Text style={[styles.mixStat, {color: theme.textSecondary}]}>{getCatCount(cat)} ({Math.round(getCatPercent(cat))}%)</Text>
                  </View>
                  <View style={[styles.mixTrack, {backgroundColor: theme.border}]}>
                    <View style={[styles.mixFill, {width: `${getCatPercent(cat)}%`, backgroundColor: getCatColor(cat)}]} />
                  </View>
               </View>
            ))}

            <View style={styles.playbookHub}>
              <View style={styles.analyticsHeader}>
                <BookOpen size={18} color={theme.text} />
                <Text style={[styles.analyticsTitle, {color: theme.text}]}>Operational Playbook</Text>
              </View>
              <GlassCard style={[styles.playbookCard, {backgroundColor: theme.card + '80', borderColor: theme.border}]}>
                <Text style={[styles.pMain, {color: theme.textSecondary}]}>Prioritize <Text style={{color: theme.text, fontWeight: '800'}}>Approval</Text> requests to reduce system latency. <Text style={{color: theme.text, fontWeight: '800'}}>Rejection</Text> logs should be archived within 24 hours of notification.</Text>
              </GlassCard>
            </View>
          </View>
        </ScrollView>
      </GradientBackground>
    </View>
  );
}

function NotificationRow({ item, theme, onMarkRead, isLast }: any) {
  const isUnread = !item.read;
  const createdAt = safeDate(item.createdAt);
  const type = item.type?.toLowerCase() || 'info';
  
  const getStyle = () => {
    switch(type) {
      case 'approval': return { color: theme.success, icon: CheckCircle };
      case 'rejection': return { color: theme.error, icon: AlertCircle };
      case 'reminder': return { color: theme.warning, icon: Clock };
      default: return { color: theme.primary, icon: Info };
    }
  };
  
  const visuals = getStyle();
  const Icon = visuals.icon;

  return (
    <View style={[styles.rowContainer, isLast && {borderBottomWidth: 0}]}>
      <View style={styles.rowIconOuter}>
        <View style={[styles.rowIconInner, {backgroundColor: visuals.color + '15', borderColor: visuals.color + '30'}]}>
          <Icon size={16} color={visuals.color} />
        </View>
        {!isLast && <View style={[styles.rowStem, {backgroundColor: theme.border}]} />}
      </View>
      
      <TouchableOpacity style={styles.rowBody} activeOpacity={0.7}>
        <View style={styles.rowTop}>
          <View style={styles.rowBadges}>
            <View style={[styles.typeTag, {backgroundColor: visuals.color + '15'}]}>
              <Text style={[styles.typeTagText, {color: visuals.color}]}>{type.toUpperCase()}</Text>
            </View>
            {isUnread && <View style={[styles.unreadDot, {backgroundColor: theme.primary}]}><Text style={styles.unreadDotText}>UNREAD</Text></View>}
          </View>
          <Text style={[styles.rowTime, {color: theme.textSecondary}]}>{timeAgo(createdAt)}</Text>
        </View>

        <Text style={[styles.rowTitle, {color: theme.text}, !isUnread && {color: theme.textSecondary, fontWeight: '600'}]}>{item.title || 'System Broadcast'}</Text>
        <Text style={[styles.rowMsg, {color: theme.textSecondary}]} numberOfLines={2}>{item.message}</Text>
        
        <View style={styles.rowFooter}>
          <Text style={[styles.rowFullDate, {color: theme.textSecondary + '60'}]}>{createdAt.toLocaleDateString('en-GB')} • {createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          {isUnread && (
            <TouchableOpacity onPress={onMarkRead}>
              <Text style={[styles.markReadLink, {color: theme.text}]}>Mark read</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 60 },
  loadingText: { marginTop: 16, fontSize: 13, fontWeight: '700' },

  topHeader: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  hubTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  hubTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  unreadBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 12 },
  unreadBadgeText: { fontSize: 10, fontWeight: '900' },
  hubSubtitle: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  headerActions: { },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  ghostBtnText: { fontSize: 11, fontWeight: '800', marginLeft: 6 },

  errorCard: { margin: 20, marginTop: 0, padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  errorTitle: { fontSize: 14, fontWeight: '800' },
  errorDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  retryBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  metricsSection: { padding: 20, gap: 12 },
  healthCard: { padding: 24, borderRadius: 28, height: 160 },
  healthLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  healthValue: { color: '#FFF', fontSize: 50, fontWeight: '900', marginVertical: 4 },
  healthSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  healthProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  healthProgressText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  healthTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  healthFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },

  miniStats: { flexDirection: 'row', gap: 12 },
  miniCard: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1 },
  miniLabel: { color: '#64748B', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  miniValue: { fontSize: 24, fontWeight: '900', marginVertical: 4 },
  miniSub: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  feedHub: { padding: 20, paddingTop: 10 },
  feedHubHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  feedHubTitle: { fontSize: 16, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, height: 42, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '500' },
  resetHubBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  catScroll: { gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  catPillText: { fontSize: 12, fontWeight: '800' },

  feedList: { paddingHorizontal: 20 },
  rowContainer: { flexDirection: 'row', minHeight: 90 },
  rowIconOuter: { width: 40, alignItems: 'center', marginRight: 16 },
  rowIconInner: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  rowStem: { flex: 1, width: 2, marginVertical: 4, opacity: 0.3 },
  rowBody: { flex: 1, paddingBottom: 24 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeTagText: { fontSize: 8, fontWeight: '900' },
  unreadDot: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  unreadDotText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  rowTime: { fontSize: 11, fontWeight: '700' },
  rowTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  rowMsg: { fontSize: 13, fontWeight: '500', lineHeight: 20 },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rowFullDate: { fontSize: 10, fontWeight: '600' },
  markReadLink: { fontSize: 11, fontWeight: '900', textDecorationLine: 'underline' },

  analyticsBox: { padding: 24, marginTop: 40, borderTopWidth: 1 },
  analyticsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  analyticsTitle: { fontSize: 14, fontWeight: '900' },
  mixItem: { marginBottom: 16 },
  mixHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mixName: { fontSize: 11, fontWeight: '800' },
  mixStat: { fontSize: 11, fontWeight: '800' },
  mixTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  mixFill: { height: '100%', borderRadius: 3 },
  playbookHub: { marginTop: 32 },
  playbookCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  pMain: { fontSize: 13, fontWeight: '500', lineHeight: 22 },
  emptyFeed: { padding: 60, alignItems: 'center', gap: 16 },
  emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
