import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { CheckCircle2, ClipboardList, ChevronDown, X, UserCheck, UserX, Clock, Send, Users } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { ActivityIndicator, Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

const MOCK_ACTIVITIES = [
  "Full-Stuck - 2026-01-20 15:29",
  "UI/UX Masterclass - 2026-01-22 10:00",
  "React Native Deep Dive - 2026-01-25 09:00",
  "Leadership Seminar - 2026-01-30 14:00"
];

const MOCK_STUDENTS = [
  { id: 1, name: 'Muscab Axmed', applied: '2026-01-19' },
  { id: 2, name: 'Fatuma Farah', applied: '2026-01-20' },
  { id: 3, name: 'Axmed Qaarey', applied: '2026-01-18' },
  { id: 4, name: 'Deeqa Warsame', applied: '2026-01-21' },
  { id: 5, name: 'Hassan Farah', applied: '2026-01-22' },
  { id: 6, name: 'Aisha Ali', applied: '2026-01-23' },
  { id: 7, name: 'Somali Student', applied: '2026-01-24' },
];

export default function CoordinatorAttendance() {
  const router = useRouter();
  const { activityId: paramActivityId } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [activities, setActivities] = React.useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = React.useState<any | null>(null);
  const [showActivityPicker, setShowActivityPicker] = React.useState(false);
  const [students, setStudents] = React.useState<any[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, 'present' | 'absent' | 'excused' | null>>({});
  const [loading, setLoading] = React.useState(true);
  const [fetchingStudents, setFetchingStudents] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  
  // Excuse Modal State
  const [isExcuseModalVisible, setIsExcuseModalVisible] = React.useState(false);
  const [currentStudent, setCurrentStudent] = React.useState<any>(null);
  const [excuseReason, setExcuseReason] = React.useState('');

  React.useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await client.get(`/activities?coordinatorId=${user?.id}`);
      setActivities(data);
      
      // If activityId passed in params, select it
      if (paramActivityId) {
        const found = data.find((a: any) => a.id === paramActivityId);
        if (found) {
          handleSelectActivity(found);
        }
      }
    } catch (error) {
      console.log('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActivity = async (activity: any) => {
    setSelectedActivity(activity);
    setShowActivityPicker(false);
    setAttendance({});
    
    try {
      setFetchingStudents(true);
      // Fetch approved applications for this activity
      const apps = await client.get(`/applications?activityId=${activity.id}&status=approved`);
      setStudents(apps);
      
      // Fetch existing attendance if any
      const existingAttendance = await client.get(`/attendance?activityId=${activity.id}`);
      const attendanceMap: Record<string, any> = {};
      existingAttendance.forEach((record: any) => {
        attendanceMap[record.studentId] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.log('Failed to fetch students/attendance:', error);
    } finally {
      setFetchingStudents(false);
    }
  };

  const toggleAttendance = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    if (status === 'excused' && attendance[studentId] !== 'excused') {
      const student = students.find(s => s.studentId === studentId);
      setCurrentStudent(student);
      setIsExcuseModalVisible(true);
      return;
    }

    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedActivity) return;
    
    const attendanceData = students.map(student => ({
      studentId: student.studentId,
      studentName: student.studentName,
      applicationId: student.id,
      // Map excused to absent since backend only supports present/absent for now
      status: attendance[student.studentId] === 'present' ? 'present' : 'absent'
    })).filter(item => attendance[item.studentId] !== null);

    if (attendanceData.length === 0) {
      Alert.alert('No Changes', 'Please mark attendance for at least one student.');
      return;
    }

    try {
      setSaving(true);
      await client.post('/attendance/batch', {
        activityId: selectedActivity.id,
        attendanceData
      });
      Alert.alert('Success', 'Attendance session successfully recorded!');
    } catch (error: any) {
      console.log('Failed to save attendance:', error);
      Alert.alert('Error', error.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExcuse = () => {
    if (!excuseReason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for the excuse.");
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [currentStudent.studentId]: 'excused'
    }));
    setIsExcuseModalVisible(false);
    setExcuseReason('');
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const excusedCount = Object.values(attendance).filter(s => s === 'excused').length;

  const renderExcuseModal = () => (
    <Modal visible={isExcuseModalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <GlassCard style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconBox, { backgroundColor: '#F59E0B15' }]}>
                  <Clock size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Authorize Excuse</Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>For {currentStudent?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsExcuseModalVisible(false)}>
                  <X size={20} color={theme.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Reason for Absence</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="e.g. Medical appointment, family emergency..."
                  style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  placeholderTextColor={theme.icon}
                  value={excuseReason}
                  onChangeText={setExcuseReason}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]} 
                  onPress={() => setIsExcuseModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalSubmitBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={handleSaveExcuse}
                >
                  <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalSubmitText}>Approve Excuse</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Blue Header Banner - More compact and premium */}
        <View style={styles.headerBanner}>
            <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Attendance Hub</Text>
                <Text style={styles.bannerSubtitle}>
                    Real-time participation tracking for your active sessions.
                </Text>
            </View>
            <View style={styles.bannerIcon}>
                <ClipboardList size={32} color="rgba(255, 255, 255, 0.4)" />
            </View>
        </View>

        {/* Activity Selection Card */}
        <GlassCard style={[styles.selectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                    <ClipboardList size={18} color={theme.primary} />
                </View>
                <Text style={[styles.cardHeaderText, { color: theme.text }]}>Active Activity</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowActivityPicker(!showActivityPicker)}
              disabled={loading}
            >
                <Text style={[styles.dropdownText, { color: selectedActivity ? theme.text : theme.textSecondary }]} numberOfLines={1}>
                  {loading ? 'Loading activities...' : (selectedActivity?.title || "Choose an activity to begin...")}
                </Text>
                <ChevronDown size={18} color={theme.primary} />
            </TouchableOpacity>

            {showActivityPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {activities.map((act) => (
                  <TouchableOpacity 
                    key={act.id} 
                    style={[styles.pickerItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelectActivity(act)}
                  >
                    <Text style={[styles.pickerItemText, { color: theme.text }]}>{act.title}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>{act.date.split('T')[0]} at {act.time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </GlassCard>

        {selectedActivity ? (
            <View style={styles.studentsWrapper}>
                {/* Stats Summary Row */}
                <View style={styles.statsRow}>
                    <StatBox label="Present" value={presentCount} color="#22C55E" theme={theme} />
                    <StatBox label="Absent" value={absentCount} color="#EF4444" theme={theme} />
                    <StatBox label="Excused" value={excusedCount} color="#F59E0B" theme={theme} />
                    <StatBox label="Total" value={students.length} color={theme.primary} theme={theme} />
                </View>

                {/* Approved Students Header */}
                <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendee List</Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Drag or tap to mark</Text>
                </View>

                {/* Student List Container */}
                <GlassCard style={[styles.studentsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.studentList}>
                        {fetchingStudents ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ margin: 20 }} />
                        ) : students.length > 0 ? (
                            students.map((student) => {
                                const status = attendance[student.studentId];
                                return (
                                <View key={student.id} style={[styles.studentRow, { borderBottomColor: theme.border }]}>
                                    <View style={styles.studentInfo}>
                                        <View style={[styles.avatarBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                            <Text style={[styles.avatarText, { color: theme.textSecondary }]}>{student.student?.studentId?.slice(-2) || '??'}</Text>
                                        </View>
                                        <View style={styles.nameContent}>
                                            <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{student.studentName}</Text>
                                            <Text style={[styles.studentDetail, { color: theme.textSecondary }]}>{student.student?.studentId || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.actions}>
                                        <TouchableOpacity 
                                          style={[
                                              styles.actionIconBtn, 
                                              { backgroundColor: status === 'present' ? '#22C55E' : theme.background, borderColor: status === 'present' ? '#22C55E' : theme.border }
                                          ]}
                                          onPress={() => toggleAttendance(student.studentId, 'present')}
                                        >
                                            <UserCheck size={18} color={status === 'present' ? '#FFFFFF' : theme.textSecondary} />
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                          style={[
                                              styles.actionIconBtn, 
                                              { backgroundColor: status === 'absent' ? '#EF4444' : theme.background, borderColor: status === 'absent' ? '#EF4444' : theme.border }
                                          ]}
                                          onPress={() => toggleAttendance(student.studentId, 'absent')}
                                        >
                                            <UserX size={18} color={status === 'absent' ? '#FFFFFF' : theme.textSecondary} />
                                        </TouchableOpacity>
    
                                        <TouchableOpacity 
                                          style={[
                                              styles.actionIconBtn, 
                                              { backgroundColor: status === 'excused' ? '#F59E0B' : theme.background, borderColor: status === 'excused' ? '#F59E0B' : theme.border }
                                          ]}
                                          onPress={() => toggleAttendance(student.studentId, 'excused')}
                                        >
                                            <Clock size={18} color={status === 'excused' ? '#FFFFFF' : theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                );
                            })
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: theme.textSecondary }}>No approved students</Text>
                            </View>
                        )}
                    </View>
                </GlassCard>

                 {/* Large Action Button */}
                 <TouchableOpacity 
                     style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
                     onPress={handleSaveAttendance}
                     disabled={saving}
                 >
                     {saving ? (
                         <ActivityIndicator size="small" color="#FFFFFF" />
                     ) : (
                         <>
                            <CheckCircle2 size={20} color="#FFFFFF" />
                            <Text style={styles.saveBtnText}>Record Attendance</Text>
                         </>
                     )}
                 </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
                    <Users size={40} color={theme.border} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Choose an activity from the dropdown to start managing attendance for approved students.
                </Text>
            </View>
        )}
      </ScrollView>
      {renderExcuseModal()}
    </GradientBackground>
  );
}

function StatBox({ label, value, color, theme }: any) {
    return (
        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 50 },
  headerBanner: { 
    backgroundColor: '#3B82F6', 
    padding: 24, 
    borderRadius: 28, 
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10
  },
  bannerInfo: { flex: 1 },
  bannerIcon: { marginLeft: 15 },
  bannerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 13, color: '#E0F2FE', marginTop: 6, lineHeight: 18, fontWeight: '500' },
  selectionCard: { padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardHeaderText: { fontSize: 16, fontWeight: '800' },
  dropdown: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: 54, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    borderWidth: 1.5,
    marginTop: 10
  },
  dropdownText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  pickerDropdown: { marginTop: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, elevation: 4 },
  pickerItem: { padding: 16, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 14, fontWeight: '700' },
  studentsWrapper: { gap: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  studentsCard: { padding: 4, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  studentList: { paddingHorizontal: 10 },
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  avatarText: { fontSize: 14, fontWeight: '800' },
  nameContent: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '800' },
  studentDetail: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 8 },
  actionIconBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  saveBtn: { 
    backgroundColor: '#3B82F6', 
    height: 60, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  emptyState: { marginTop: 60, alignItems: 'center', gap: 20, paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 22, fontWeight: '600', opacity: 0.8 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalWrapper: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '100%', borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  modalBody: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  modalInput: { borderRadius: 16, borderWidth: 1.5, padding: 16, height: 120, textAlignVertical: 'top', fontSize: 14, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '800' },
  modalSubmitBtn: { flex: 2, height: 50, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});

