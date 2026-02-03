import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Check, X, Clock, User, FileText, ChevronRight, Filter, ArrowLeft, Search, Zap } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { getAvatarUrl } from '@/src/lib/media';

export default function CoordinatorApplications() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await client.get('/applications');
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await client.put(`/applications/${id}/status`, { status });
      // Refresh local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status } : app
      ));
    } catch (error) {
      console.error(`Failed to update application ${id} to ${status}:`, error);
      alert('Failed to update status');
    }
  };

  const filteredApplications = applications.filter(app => 
    app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.activity?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <GradientBackground>
       {/* Premium Navigation */}
       {/* <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navIconBtn, { backgroundColor: theme.card , marginTop: -25, marginLeft: 300 }]} onPress={() => router.back()}>
          <Search size={20} color={theme.text} />
        </TouchableOpacity>
      </View> */}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} tintColor={theme.primary} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Review Applications</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Filter and process student participation</Text>
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Filter size={18} color={theme.primary} />
            </TouchableOpacity>
        </View>

         {/* Analytic Stats Grid */}
         <View style={styles.statsGrid}>
             <StatCard icon={Clock} label="Pending" value={stats.pending.toString()} color="#F59E0B" theme={theme} />
             <StatCard icon={Check} label="Approved" value={stats.approved.toString()} color="#22C55E" theme={theme} />
             <StatCard icon={X} label="Rejected" value={stats.rejected.toString()} color="#EF4444" theme={theme} />
         </View>

         <View style={styles.searchRow}>
             <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
                 <TextInput 
                     placeholder="Search applicant names or IDs..." 
                     style={[styles.searchInput, { color: theme.text }]}
                     placeholderTextColor={theme.textSecondary}
                     value={searchQuery}
                     onChangeText={setSearchQuery}
                 />
             </View>
             <TouchableOpacity 
                style={[styles.quickFilterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setSearchQuery('')}
             >
                 <X size={18} color={theme.primary} />
             </TouchableOpacity>
         </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Awaiting Action</Text>
            <TouchableOpacity>
                <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
        </View>

         {/* Application Feed */}
         <View style={styles.list}>
            {loading && !refreshing ? (
                <View style={{ padding: 40 }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                    <ApplicationItem 
                        key={app.id}
                        student={app.studentName || 'Student'} 
                        id={app.student?.studentId || 'N/A'} 
                        activity={app.activity?.title || 'Unknown Activity'} 
                        time={formatTime(app.appliedAt)} 
                        status={app.status.charAt(0).toUpperCase() + app.status.slice(1)} 
                        avatar={getAvatarUrl(app.student?.avatar)}
                        theme={theme}
                        onApprove={() => handleUpdateStatus(app.id, 'approved')}
                        onReject={() => handleUpdateStatus(app.id, 'rejected')}
                    />
                ))
            ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: theme.textSecondary }}>No applications found</Text>
                </View>
            )}
         </View>
      </ScrollView>
    </GradientBackground>
  );
}

function StatCard({ icon: Icon, label, value, color, theme }: any) {
    return (
        <GlassCard style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={18} color={color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        </GlassCard>
    );
}

 function ApplicationItem({ student, id, activity, time, status, avatar, theme, onApprove, onReject }: any) {
  const isPending = status === 'Pending';
  const isApproved = status === 'Approved';
  const isRejected = status === 'Rejected';
  
  const statusColor = isApproved ? '#22C55E' : isRejected ? '#EF4444' : '#F59E0B';
  const statusBg = isApproved ? '#22C55E15' : isRejected ? '#EF444415' : '#F59E0B15';
  
  return (
    <GlassCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
            <View style={[styles.avatarBox, { borderColor: theme.border }]}>
                <Image source={avatar} style={styles.avatar} contentFit="cover" />
            </View>
            <View>
                <Text style={[styles.studentName, { color: theme.text }]}>{student}</Text>
                <Text style={[styles.studentId, { color: theme.textSecondary }]}>{id}</Text>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
 
      <View style={[styles.activityDetails, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[styles.activityIconBox, { backgroundColor: theme.primary + '15' }]}>
                <FileText size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
              <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>Requesting Access to</Text>
              <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>{activity}</Text>
          </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.timeBox}>
            <Clock size={12} color={theme.textSecondary} />
            <Text style={[styles.timeValue, { color: theme.textSecondary }]}>{time}</Text>
          </View>
          
           {isPending ? (
               <View style={styles.actionGrid}>
                   <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}
                        onPress={onReject}
                    >
                     <X size={16} color="#EF4444" />
                     <Text style={styles.rejectText}>Reject</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={onApprove}
                    >
                     <Check size={16} color="#FFFFFF" />
                     <Text style={styles.approveText}>Approve</Text>
                   </TouchableOpacity>
               </View>
          ) : (
                <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={[styles.detailsBtnText, { color: theme.textSecondary }]}>Full Entry</Text>
                    <ChevronRight size={14} color={theme.icon} />
                </TouchableOpacity>
          )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 60 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  navIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  filterBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statCard: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 24, borderWidth: 1 },
  statIconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 25, alignItems: 'center' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1.5 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, fontWeight: '600' },
  quickFilterBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 14 },
  card: { padding: 16, borderRadius: 24, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  studentName: { fontSize: 15, fontWeight: '800' },
  studentId: { fontSize: 11, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  activityDetails: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  activityIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  activityTitle: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeValue: { fontSize: 11, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  rejectText: { color: '#EF4444', fontSize: 12, fontWeight: '800' },
  approveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, gap: 6, borderWidth: 1 },
  detailsBtnText: { fontSize: 11, fontWeight: '800' },
});
