import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Eye, Calendar, Clock, MapPin, Users, User, Search, Filter, Edit3, Trash2, ArrowLeft, Plus, X, Info, AlignLeft } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useRouter } from 'expo-router';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function CoordinatorActivities() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState<any>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await client.get(`/activities?coordinatorId=${user?.id}`);
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch coordinator activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (user?.id) fetchActivities();
  }, [user]);

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await client.delete(`/activities/${id}`);
              setActivities(prev => prev.filter(a => a.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete activity');
            }
          }
        }
      ]
    );
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const handleApply = (activity: any) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActivities(); }} tintColor={theme.primary} />
        }
      >
        {/* Blue Header Banner */}
         <View style={styles.headerBanner}>
             <View style={{ flex: 1 }}>
                 <Text style={styles.bannerTitle}>Activities</Text>
                 <Text style={styles.bannerSubtitle}>
                     Overview of all activities you are currently coordinating.
                 </Text>
             </View>
             <View style={styles.countBadge}>
                 <Text style={styles.countText}>{activities.length}</Text>
                 <Text style={styles.countLabel}>Total</Text>
             </View>
         </View>

        {/* Search and Filters */}
        <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
                 <TextInput 
                     placeholder="Quick search titles..." 
                     style={[styles.searchInput, { color: theme.text }]}
                     placeholderTextColor={theme.textSecondary}
                     value={searchQuery}
                     onChangeText={setSearchQuery}
                 />
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Filter size={16} color={theme.primary} />
            </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
            <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Managed Feed</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Track participation and logistics</Text>
            </View>
        </View>

         <View style={styles.list}>
             {loading && !refreshing ? (
                 <View style={{ padding: 40 }}>
                     <ActivityIndicator size="large" color={theme.primary} />
                 </View>
             ) : filteredActivities.length > 0 ? (
                 filteredActivities.map((activity) => {
                     const { day, month } = formatDate(activity.date);
                     return (
                        <CActivityCard 
                            key={activity.id}
                            month={month} 
                            day={day} 
                            category={activity.category} 
                            title={activity.title} 
                            time={activity.time} 
                            location={activity.location} 
                            attendees={`${activity.enrolled}/${activity.capacity}`}
                            status={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)} 
                            theme={theme}
                            onDelete={() => handleDelete(activity.id, activity.title)}
                            onEdit={() => router.push({ pathname: '/(coordinator)/propose', params: { editId: activity.id } })}
                            onView={() => handleApply(activity)}
                        />
                     );
                 })
             ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: theme.textSecondary }}>No activities found</Text>
                </View>
             )}
         </View>
      </ScrollView>

      {/* Detailed Activity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Info size={20} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Activity Detail</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <View style={{ flex: 1 }}>
                {/* Background Banner */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 0, borderRadius: 16, overflow: 'hidden' }}>
                    <Image 
                        source={require('../../../assets/images/activity-banner.png')} 
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                    />
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                         <Image 
                            source={require('../../../assets/images/university-logo.png')} 
                            style={{ width: 120, height: 40 }}
                            contentFit="contain"
                         />
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, zIndex: 1 }}>
                    <View style={{ height: 160 }} />
                    
                    <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, marginTop: -20, minHeight: 400 }}>
                        <View style={[styles.detailCategoryBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.detailCategoryText, { color: theme.primary }]}>{selectedActivity.category}</Text>
                        </View>

                        <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedActivity.title}</Text>
                        
                        <View style={styles.detailGrid}>
                            <DetailItem icon={Calendar} label="Date" value={new Date(selectedActivity.date).toLocaleDateString()} theme={theme} />
                            <DetailItem icon={Clock} label="Time" value={selectedActivity.time} theme={theme} />
                            <DetailItem icon={MapPin} label="Location" value={selectedActivity.location} theme={theme} />
                            <DetailItem icon={Users} label="Participation" value={`${selectedActivity.enrolled}/${selectedActivity.capacity} Enrolled`} theme={theme} />
                        </View>

                        <View style={styles.detailSection}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <AlignLeft size={16} color={theme.textSecondary} />
                                <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>Description</Text>
                            </View>
                            <Text style={[styles.detailDesc, { color: theme.text }]}>{selectedActivity.description || 'No additional details provided.'}</Text>
                        </View>

                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
              </View>
            )}
          </GlassCard>
        </View>
      </Modal>
    </GradientBackground>
  );
}

function DetailItem({ icon: Icon, label, value, theme }: any) {
    return (
        <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
                <Icon size={18} color={theme.primary} />
            </View>
            <View>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
            </View>
        </View>
    );
}

function CActivityCard({ month, day, category, title, time, location, attendees, status, theme, onDelete, onEdit, onView }: any) {
    const isOngoing = status === 'Ongoing';
    const isCompleted = status === 'Completed';
    const isDraft = status === 'Draft';
    
    let statusColor = '#0EA5E9';
    let statusBg = theme.background;
    if (isOngoing) { statusColor = '#22C55E'; statusBg = '#22C55E15'; }
    else if (isCompleted) { statusColor = theme.textSecondary; statusBg = theme.textSecondary + '15'; }
    else if (isDraft) { statusColor = '#F59E0B'; statusBg = '#F59E0B15'; }
    else { statusBg = '#0EA5E915'; }

    return (
        <GlassCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.dateBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.dateMonth, { color: theme.textSecondary }]}>{month}</Text>
                <Text style={[styles.dateDay, { color: theme.text }]}>{day}</Text>
                <View style={styles.dateLine} />
            </View>

            <View style={styles.cardMain}>
                <View style={styles.tagRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.border }]}>
                        <Text style={[styles.categoryText, { color: theme.textSecondary }]}>{category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                    </View>
                </View>

                <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                
                <View style={styles.metaGridCard}>
                    <View style={styles.metaItemCard}>
                        <Clock size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaTextCard, { color: theme.textSecondary }]}>{time}</Text>
                    </View>
                    <View style={styles.metaItemCard}>
                        <MapPin size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaTextCard, { color: theme.textSecondary }]} numberOfLines={1}>{location}</Text>
                    </View>
                    <View style={styles.metaItemCard}>
                        <Users size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaTextCard, { color: theme.textSecondary }]}>{attendees}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.actionsColumn, { borderLeftColor: theme.border }]}>
                <TouchableOpacity onPress={onView} style={[styles.actionBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                    <Eye size={12} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>VIEW</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onEdit} style={[styles.actionBtn, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}>
                    <Edit3 size={12} color="#8B5CF6" />
                    <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
                    <Trash2 size={12} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Del</Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 12, paddingBottom: 60, paddingTop: 10 },
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
  countBadge: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  countText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  countLabel: { fontSize: 8, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', opacity: 0.8 },
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
  sectionSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  list: { gap: 12 },
  card: { 
    flexDirection: 'row', 
    padding: 12, 
    borderRadius: 24, 
    borderWidth: 1,
  },
  dateBlock: { 
    width: 58, 
    height: 65, 
    borderRadius: 16, 
    justifyContent: 'center', 
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  dateMonth: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { fontSize: 20, fontWeight: '900', marginTop: -2 },
  dateLine: { width: 12, height: 2, backgroundColor: '#0EA5E9', marginTop: 2, borderRadius: 1 },
  cardMain: { flex: 1, paddingLeft: 14, paddingRight: 10 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  activityTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  metaGridCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItemCard: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTextCard: { fontSize: 11, fontWeight: '600' },
  actionsColumn: { paddingLeft: 12, borderLeftWidth: 1, gap: 6, justifyContent: 'center' },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 58,
  },
  actionBtnText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    height: height * 0.75, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24, 
    borderWidth: 1 
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  detailCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  detailCategoryText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  detailGrid: { gap: 14, marginBottom: 28 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  detailValue: { fontSize: 15, fontWeight: '700' },
  detailSection: { marginBottom: 24 },
  detailSectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  detailDesc: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
});
