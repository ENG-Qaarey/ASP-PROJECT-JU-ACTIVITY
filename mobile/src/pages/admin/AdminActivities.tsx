import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Eye, Calendar, Clock, MapPin, Users, User, Search, Filter, Edit3, Trash2, X, Info, AlignLeft, ShieldCheck } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { useRouter, useFocusEffect } from 'expo-router';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';

export default function AdminActivities() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [activities, setActivities] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState<any>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const fetchActivities = async () => {
      try {
          const data = await client.get(ENDPOINTS.ACTIVITIES);
          if (Array.isArray(data)) {
              setActivities(data);
          }
      } catch (error) {
          console.log('Error fetching admin activities:', error);
      }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchActivities();
    }, [])
  );

  const onRefresh = async () => {
      setRefreshing(true);
      await fetchActivities();
      setRefreshing(false);
  };

  const handleDelete = (id: string) => {
      Alert.alert(
          "Delete Activity",
          "Are you sure you want to delete this activity? This action cannot be undone.",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                  try {
                      await client.delete(`${ENDPOINTS.ACTIVITIES}/${id}`);
                      setActivities(prev => prev.filter(a => a.id !== id));
                      Alert.alert("Success", "Activity deleted successfully");
                  } catch (e: any) {
                      Alert.alert("Error", e.message || "Failed to delete activity");
                  }
              }}
          ]
      );
  };

  const handleEdit = (activity: any) => {
      router.push({
          pathname: '/(admin)/create' as any,
          params: { mode: 'edit', activityId: activity.id, ...activity }
      });
  };

  const handleView = (activity: any) => {
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
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={theme.primary}
            />
        }
      >
        {/* Blue Header Banner */}
        <View style={styles.headerBanner}>
            <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Admin Activities</Text>
                <Text style={styles.bannerSubtitle}>
                    Complete administrative oversight of all university activity signals.
                </Text>
            </View>
            <TouchableOpacity style={styles.calendarBtn} onPress={() => router.push('/(admin)/create' as any)}>
                <Calendar size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.calendarBtnText}>Create New</Text>
            </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput 
                    placeholder="Search mission logs..." 
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                />
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Filter size={16} color={theme.primary} />
            </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
            <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Telemetry Feed</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Managed activities repository</Text>
            </View>
        </View>

        <View style={styles.list}>
            {activities.length > 0 ? activities.map((act) => {
                const d = new Date(act.date);
                const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = d.getDate();

                return (
                    <AdminActivityCard 
                        key={act.id}
                        month={month} 
                        day={day.toString()} 
                        category={act.category} 
                        creator={act.coordinatorName || "Authorized User"}
                        title={act.title} 
                        time={act.time} 
                        location={act.location} 
                        attendees={`${act.enrolled}/${act.capacity}`}
                        status="Active" 
                        theme={theme}
                        onDelete={() => handleDelete(act.id)}
                        onEdit={() => handleEdit(act)}
                        onView={() => handleView(act)}
                    />
                );
            }) : (
                <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>No mission logs found.</Text>
            )}
        </View>
      </ScrollView>

      {/* DETAILED ACTIVITY MODAL - High Fidelity Admin Overview */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border + '66' }]} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Info size={20} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Intelligence Detail</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeIconBtn, { backgroundColor: theme.border + '33' }]}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <View style={{ flex: 1 }}>
                {/* Image Behind Content */}
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

                <ScrollView showsVerticalScrollIndicator={false} style={[styles.modalScroll, { zIndex: 1 }]}>
                    {/* Spacer to expose the background image */}
                    <View style={{ height: 160 }} />
                    
                    <View style={[styles.modalCardContent, { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, marginTop: -20 }]}>
                        <View style={[styles.detailCategoryBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.detailCategoryText, { color: theme.primary }]}>{selectedActivity.category}</Text>
                        </View>

                        <Text style={[styles.detailActivityTitle, { color: theme.text }]}>{selectedActivity.title}</Text>
                        
                        <View style={styles.detailGrid}>
                            <DetailBlock icon={Calendar} label="Target Date" value={new Date(selectedActivity.date).toLocaleDateString()} theme={theme} />
                            <DetailBlock icon={Clock} label="Operational Time" value={selectedActivity.time} theme={theme} />
                            <DetailBlock icon={MapPin} label="Beacon Site" value={selectedActivity.location} theme={theme} />
                            <DetailBlock icon={Users} label="Participation" value={`${selectedActivity.enrolled}/${selectedActivity.capacity} Enrolled`} theme={theme} />
                        </View>

                        <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                                <AlignLeft size={16} color={theme.textSecondary} />
                                <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>Mission Briefing</Text>
                            </View>
                            <Text style={[styles.detailDescription, { color: theme.text }]}>{selectedActivity.description || 'No additional mission details provided.'}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                                <ShieldCheck size={16} color={theme.textSecondary} />
                                <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>Authorized Coordinator</Text>
                            </View>
                            <View style={styles.detailCoordinatorBox}>
                                <View style={[styles.detailAvatar, { backgroundColor: theme.border }]}>
                                    <User size={14} color={theme.textSecondary} />
                                </View>
                                <Text style={[styles.detailCoordinatorName, { color: theme.text }]}>{selectedActivity.coordinatorName || 'System Intelligence'}</Text>
                            </View>
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

function DetailBlock({ icon: Icon, label, value, theme }: any) {
    return (
        <View style={styles.detailBlock}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.background }]}>
                <Icon size={18} color={theme.primary} />
            </View>
            <View>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
            </View>
        </View>
    );
}

function AdminActivityCard({ month, day, category, creator, title, time, location, attendees, status, theme, onDelete, onEdit, onView }: any) {
    const isOngoing = status === 'Ongoing';
    const isCompleted = status === 'Completed';
    
    let statusColor = '#0EA5E9';
    let statusBg = theme.background;
    if (isOngoing) { statusColor = '#22C55E'; statusBg = '#22C55E15'; }
    else if (isCompleted) { statusColor = theme.textSecondary; statusBg = theme.textSecondary + '15'; }
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
                
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Clock size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MapPin size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>{location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Users size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{attendees}</Text>
                    </View>
                </View>

                <View style={styles.creatorInfo}>
                    <View style={[styles.avatarSmall, { backgroundColor: theme.border }]}>
                        <User size={10} color={theme.textSecondary} />
                    </View>
                    <Text style={[styles.creatorLabel, { color: theme.textSecondary }]}>{creator}</Text>
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
  contentContainer: { padding: 12, paddingTop: 14, paddingBottom: 60 },
  headerBanner: { 
    backgroundColor: '#0EA5E9', 
    padding: 24, 
    borderRadius: 24, 
    marginBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 11, color: '#FFFFFF', opacity: 0.9, marginTop: 4, lineHeight: 16, maxWidth: '85%' },
  calendarBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  calendarBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 24, alignItems: 'center' },
  searchContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 16, 
    paddingHorizontal: 14, 
    height: 48, 
    borderWidth: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, fontWeight: '500' },
  filterBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
  },
  sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  list: { gap: 14 },
  card: { 
    flexDirection: 'row', 
    padding: 14, 
    borderRadius: 24, 
    borderWidth: 1,
  },
  dateBlock: { 
    width: 60, 
    height: 68, 
    borderRadius: 18, 
    justifyContent: 'center', 
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  dateMonth: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { fontSize: 22, fontWeight: '900', marginTop: -2 },
  dateLine: { width: 14, height: 2, backgroundColor: '#0EA5E9', marginTop: 3, borderRadius: 1 },
  cardMain: { flex: 1, paddingLeft: 16, paddingRight: 10 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  activityTitle: { fontSize: 17, fontWeight: '900', marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 11, fontWeight: '600' },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatarSmall: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  creatorLabel: { fontSize: 11, fontWeight: '600' },
  actionsColumn: { paddingLeft: 14, borderLeftWidth: 1, gap: 8, justifyContent: 'center' },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 62,
  },
  actionBtnText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    height: Dimensions.get('window').height * 0.75, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24, 
    paddingTop: 12, 
    borderWidth: 1 
  },
  modalHandle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  closeIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { flex: 1 },
  modalCardContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  detailCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  detailCategoryText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailActivityTitle: { fontSize: 26, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  detailGrid: { gap: 14, marginBottom: 28 },
  detailBlock: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  detailLabel: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  detailValue: { fontSize: 15, fontWeight: '700' },
  detailSection: { marginBottom: 24 },
  detailSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailSectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  detailDescription: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  detailCoordinatorBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16 },
  detailAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  detailCoordinatorName: { fontSize: 15, fontWeight: '700' },
});