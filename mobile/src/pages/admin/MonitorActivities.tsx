import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { 
  Activity, Clock, MapPin, Users, Zap, TrendingUp, 
  AlertCircle, ChevronRight, Calendar, LayoutGrid, Search, Filter, X 
} from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';

export default function MonitorActivities() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [activities, setActivities] = React.useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = React.useState<any>(null);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    const fetchActivities = async () => {
        try {
            const data = await client.get(ENDPOINTS.ACTIVITIES);
            if (Array.isArray(data)) {
                setActivities(data);
            }
        } catch (error) {
            console.log('Error fetching activities for monitor:', error);
        }
    };
    fetchActivities();
  }, []);

  return (
    <GradientBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Premium Skyblue Banner */}
        <View style={styles.headerBanner}>
            <View style={styles.bannerContent}>
                <View style={styles.bannerPlaceholder}>
                    <Activity size={24} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.bannerTextContent}>
                    <Text style={styles.bannerTitle}>Monitor Activities</Text>
                    <Text style={styles.bannerSubtitle}>
                        Keep oversight on every event across JU, track coordinators, and see activity statuses instantly.
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.calendarActionBtn}>
                <Calendar size={16} color="#0EA5E9" />
                <Text style={styles.calendarActionText}>View calendar</Text>
            </TouchableOpacity>
        </View>

        {/* Dynamic Pulse Metrics */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Global Pulse</Text>
            <View style={styles.liveIndicatorPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveIndicatorText}>Live Feed</Text>
            </View>
        </View>
        <GlassCard style={[styles.pulseCard, { backgroundColor: theme.card }]}>
            <View style={styles.pulseRow}>
                 <MonitorStat icon={Users} label="Active Users" value="842" color="#0EA5E9" theme={theme} />
                 <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
                 <MonitorStat icon={Zap} label="Peak Time" value="12:45" color="#8B5CF6" theme={theme} />
                 <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
                 <MonitorStat icon={Activity} label="Status" value="Optimal" color="#22C55E" theme={theme} />
            </View>
        </GlassCard>

        {/* Directory Header */}
        <View style={styles.directoryHeader}>
            <View>
                <Text style={[styles.mainSectionTitle, { color: theme.text }]}>All Activities</Text>
                <Text style={[styles.mainSectionSubtitle, { color: theme.textSecondary }]}>Upcoming and ongoing sessions across faculties</Text>
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, shadowColor: '#000' }]}>
                <Filter size={18} color={theme.textSecondary} />
            </TouchableOpacity>
        </View>

        {/* Activity Feed */}
        <View style={styles.list}>
           {activities.length > 0 ? activities.map((act) => (
               <LiveItem 
                    key={act.id}
                    title={act.title} 
                    location={act.location} 
                    progress={(act.enrolled / (act.capacity || 1)) * 100} 
                    attendees={`${act.enrolled}/${act.capacity}`}
                    status="Active"
                    time={`Starts at ${act.time}`}
                    theme={theme}
                    onViewFeed={() => {
                        setSelectedActivity(act);
                        setShowModal(true);
                    }}
                />
           )) : (
               <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>No activities found.</Text>
           )}
        </View>

        <FeedModal 
            visible={showModal} 
            activity={selectedActivity} 
            onClose={() => setShowModal(false)} 
            theme={theme} 
        />
      </ScrollView>
    </GradientBackground>
  );
}

function FeedModal({ visible, activity, onClose, theme }: any) {
    const [feedData, setFeedData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (visible && activity?.id) {
            const fetchFeed = async () => {
                setLoading(true);
                try {
                    // Fetch applications for this activity to show as a feed
                    const apps = await client.get(`/applications?activityId=${activity.id}`);
                    setFeedData(Array.isArray(apps) ? apps : []);
                } catch (e) {
                    console.log('Error fetching activity feed:', e);
                } finally {
                    setLoading(false);
                }
            };
            fetchFeed();
        }
    }, [visible, activity]);

    if (!activity) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <GlassCard style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <View style={[styles.modalHandle, { backgroundColor: theme.border + '66' }]} />
                    
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleBox}>
                            <Activity size={18} color={theme.primary} />
                            <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                                {activity.title} Feed
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeIconButton, { backgroundColor: theme.border + '33' }]}>
                            <X size={18} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.text} style={{ marginTop: 40 }} />
                        ) : feedData.length > 0 ? (
                            feedData.map((item, idx) => (
                                <View key={item.id || idx} style={[styles.feedItem, { borderLeftColor: theme.primary }]}>
                                    <View style={styles.feedCircle}>
                                        <Users size={12} color="#FFFFFF" strokeWidth={3} />
                                    </View>
                                    <View style={styles.feedText}>
                                        <Text style={[styles.feedUser, { color: theme.text }]}>{item.studentName || 'JU Student'}</Text>
                                        <Text style={[styles.feedAction, { color: theme.textSecondary }]}>
                                            Applied for enrollment • <Text style={{ color: theme.primary }}>{item.status}</Text>
                                        </Text>
                                        <Text style={styles.feedTime}>{new Date(item.appliedAt || item.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <AlertCircle size={32} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent activity signals for this event.</Text>
                            </View>
                        )}
                    </ScrollView>
                </GlassCard>
            </View>
        </Modal>
    );
}

function MonitorStat({ icon: Icon, label, value, color, theme }: any) {
    return (
        <View style={styles.mStat}>
            <View style={[styles.mStatIconBox, { backgroundColor: color + '10' }]}>
                <Icon size={16} color={color} />
            </View>
            <Text style={[styles.mStatVal, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.mStatLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    )
}

function LiveItem({ title, location, progress, attendees, status, time, theme, onViewFeed }: any) {
  const isStarting = status === 'Starting';
  const statusColor = isStarting ? '#0EA5E9' : '#22C55E';
  
  return (
    <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            <View style={styles.locRow}>
                <MapPin size={12} color={theme.textSecondary} />
                <Text style={[styles.locText, { color: theme.textSecondary }]}>{location}</Text>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor } ]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
          <View style={styles.labels}>
              <View style={styles.progLabelGroup}>
                <Users size={12} color={theme.textSecondary} />
                <Text style={[styles.progLabel, { color: theme.textSecondary }]}>Attendance</Text>
              </View>
              <Text style={[styles.progVal, { color: theme.text }]}>{attendees}</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme.border }]}>
              <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
          </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.timeTag}>
              <Clock size={12} color={theme.textSecondary} />
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>{time}</Text>
          </View>
          <TouchableOpacity style={styles.manageBtn} onPress={onViewFeed}>
              <Text style={styles.manageText}>View Feed</Text>
              <ChevronRight size={14} color="#0EA5E9" />
          </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingTop: 14, paddingBottom: 60 },
  headerBanner: { 
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
  bannerContent: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  bannerPlaceholder: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  bannerTextContent: { flex: 1 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  bannerSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4, lineHeight: 18 },
  calendarActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#FFFFFF', 
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  calendarActionText: { fontSize: 13, fontWeight: '800', color: '#0EA5E9' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  liveIndicatorPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveIndicatorText: { fontSize: 10, fontWeight: '800', color: '#059669', textTransform: 'uppercase' },
  pulseCard: { padding: 16, marginBottom: 32, borderRadius: 24 },
  pulseRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  vDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  mStat: { alignItems: 'center' },
  mStatIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  mStatVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  mStatLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  directoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 4 },
  mainSectionTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  mainSectionSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  filterBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  list: { gap: 16 },
  card: { padding: 16, borderRadius: 24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  progressContainer: { marginBottom: 16 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  progVal: { fontSize: 12, color: '#1E293B', fontWeight: '800' },
  barBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 16 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageText: { fontSize: 13, fontWeight: '700', color: '#0EA5E9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { height: Dimensions.get('window').height * 0.7, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  closeIconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { flex: 1 },
  feedItem: { flexDirection: 'row', gap: 16, marginBottom: 20, borderLeftWidth: 2, paddingLeft: 16 },
  feedCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center' },
  feedText: { flex: 1 },
  feedUser: { fontSize: 14, fontWeight: '800' },
  feedAction: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  feedTime: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
