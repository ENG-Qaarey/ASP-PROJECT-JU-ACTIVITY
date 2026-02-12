import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Bookmark, CheckCircle2, Star } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { JuButton } from '@/src/components/JuButton';
import { ThemedText } from '@/src/components/themed-text';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { client } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { ActivityReviewModal } from '@/src/components/ActivityReviewModal';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';

export default function ActivityDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [applied, setApplied] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [reviewModalVisible, setReviewModalVisible] = React.useState(false);
  const [hasAttended, setHasAttended] = React.useState(false);
  const [activityStatus, setActivityStatus] = React.useState<string | null>(params.status as string || null);

  const { 
    id,
    title = 'Activity Details', 
    category = 'General', 
    description = 'No description available for this activity.',
    date = 'TBD',
    time = 'TBD',
    location = 'To Be Announced',
    enrolled = '0',
    capacity = '0',
  } = params;

  React.useEffect(() => {
    checkAppStatus();
  }, [id, user?.id]);

  const checkAppStatus = async () => {
    if (!id || !user?.id) return;
    try {
        setCheckingStatus(true);
        // Parallel check for application and attendance
        const [apps, attendance, activityRes] = await Promise.all([
            client.get(`/applications?studentId=${user.id}&activityId=${id}`),
            client.get(`/attendance?studentId=${user.id}&activityId=${id}`),
            client.get(`/activities/${id}`)
        ]);

        if (apps && apps.length > 0) {
            setApplied(true);
        }

        if (attendance && attendance.length > 0) {
            const hasAttendedRecord = attendance.some((a: any) => a.status === 'present');
            if (hasAttendedRecord) setHasAttended(true);
        }

        if (activityRes) {
            setActivityStatus(activityRes.status);
        }
    } catch (error) {
        console.log('Failed to check activity/application status:', error);
    } finally {
        setCheckingStatus(false);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this activity at Jazeera University: ${title}!`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleApply = async () => {
    if (!id) return;
    
    try {
        setIsApplying(true);
        await client.post('/applications', {
            activityId: id,
            activityTitle: title
        });
        setApplied(true);
        Alert.alert('Success', 'Your application has been submitted and is pending review!');
    } catch (error: any) {
        console.log('Application failed:', error);
        Alert.alert('Error', error.message || 'Failed to apply for activity');
    } finally {
        setIsApplying(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(student)/(tabs)/activities');
    }
  };

  return (
    <GradientBackground>
      {/* Background Image Header */}
      <View style={styles.headerImageContainer}>
          <Image 
              source={require('../../../assets/images/activity-banner.png')} 
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
          />
          <View style={styles.imageOverlay}>
              <View style={styles.logoCircularContainer}>
                  <Image 
                      source={require('../../../assets/images/university-logo.png')}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                  />
              </View>
          </View>
      </View>

      {/* Navigation Actions */}
      <View style={styles.topActions}>
          <TouchableOpacity 
            style={[styles.actionCircle, { backgroundColor: theme.card }]} 
            onPress={handleBack}
          >
              <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.rightActions}>
              <TouchableOpacity style={[styles.actionCircle, { backgroundColor: theme.card }]} onPress={onShare}>
                  <Share2 size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCircle, { backgroundColor: theme.card }]}>
                  <Bookmark size={22} color={theme.text} />
              </TouchableOpacity>
          </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSpacer} />

        <View style={[styles.content, { backgroundColor: theme.background }]}>
            {applied && (
                <View style={[styles.successPanel, { backgroundColor: colorScheme === 'dark' ? '#064e3b' : '#DCFCE7', borderColor: colorScheme === 'dark' ? '#065f46' : '#86EFAC' }]}>
                    <CheckCircle2 size={20} color={colorScheme === 'dark' ? '#34d399' : '#22C55E'} />
                    <ThemedText style={[styles.successText, { color: colorScheme === 'dark' ? '#34d399' : '#166534' }]}>Application Submitted Successfully!</ThemedText>
                </View>
            )}

            <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
                <ThemedText style={[styles.categoryText, { color: theme.primary }]}>{category}</ThemedText>
            </View>
            <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
            
            <View style={styles.metaGrid}>
                <MetaItem icon={Calendar} label="Date" value={typeof date === 'string' ? date.split('T')[0] : date} theme={theme} />
                <MetaItem icon={Clock} label="Time" value={time as string} theme={theme} />
                <MetaItem icon={MapPin} label="Location" value={location as string} theme={theme} />
                <MetaItem icon={Users} label="Participants" value={`${enrolled}/${capacity} Joined`} theme={theme} />
            </View>

            <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>About Activity</ThemedText>
                <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
                    {description as string}
                </ThemedText>
            </View>

            {/* Attendance-based Reviews */}
            {activityStatus === 'completed' && hasAttended && (
                <View style={[styles.section, styles.reviewSection]}>
                    <TouchableOpacity 
                        style={[styles.reviewBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                        onPress={() => setReviewModalVisible(true)}
                    >
                        <Star size={22} color={theme.primary} fill={theme.primary} />
                        <Text style={[styles.reviewBtnText, { color: theme.primary }]}>{t.feedback.rateActivity}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Perks & Benefits</ThemedText>
                <BenefitItem text="Certificate of Participation" theme={theme} />
                <BenefitItem text="Professional Networking" theme={theme} />
                <BenefitItem text="Refreshments Provided" theme={theme} />
            </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <ActivityReviewModal 
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        activityId={id as string}
        activityTitle={title as string}
      />

      {/* Sticky Bottom Footer */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.footerInfo}>
              <ThemedText style={[styles.footerLabel, { color: theme.textSecondary }]}>Registration Status</ThemedText>
              <View style={styles.statusRow}>
                  {applied ? (
                      <>
                        <CheckCircle2 size={16} color={theme.success} />
                        <ThemedText style={[styles.statusVal, { color: theme.success }]}>Applied</ThemedText>
                      </>
                  ) : (
                      <>
                        <Clock size={16} color={theme.primary} />
                        <ThemedText style={[styles.statusVal, { color: theme.text }]}>Open</ThemedText>
                      </>
                  )}
              </View>
          </View>
          <View style={{ flex: 1 }}>
              <JuButton 
                title={applied ? "Already Applied" : (isApplying ? "Applying..." : "Apply Activity")} 
                onPress={handleApply}
                variant={applied ? "outline" : "primary"}
                disabled={applied || isApplying || checkingStatus}
                loading={isApplying}
              />
          </View>
      </View>
    </GradientBackground>
  );
}

function MetaItem({ icon: Icon, label, value, theme }: any) {
    return (
        <View style={styles.metaItem}>
            <View style={[styles.metaIconBg, { backgroundColor: theme.card }]}>
                <Icon size={18} color={theme.primary} />
            </View>
            <View>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>{value}</Text>
            </View>
        </View>
    )
}

function BenefitItem({ text, theme }: any) {
    return (
        <View style={styles.benefitItem}>
            <CheckCircle2 size={18} color={theme.primary} />
            <Text style={[styles.benefitText, { color: theme.textSecondary }]}>{text}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, zIndex: 1 },
  headerImageContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, zIndex: 0 },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoCircularContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerSpacer: { height: 280 },
  contentContainer: { paddingBottom: 120 },
  topActions: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  rightActions: { flexDirection: 'row', gap: 12 },
  actionCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  content: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: 600 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  categoryText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 24 },
  metaGrid: { gap: 16, marginBottom: 32 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  metaLabel: { fontSize: 12, fontWeight: '600' },
  metaValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  section: { marginBottom: 32 },
  reviewSection: {
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  benefitText: { fontSize: 15, fontWeight: '600' },
  reviewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      gap: 12,
  },
  reviewBtnText: {
      fontSize: 16,
      fontWeight: '800',
  },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 20, zIndex: 10 },
  footerInfo: { flex: 0.8 },
  footerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusVal: { fontSize: 13, fontWeight: '800' },
  successPanel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 24, 
    gap: 12,
    borderWidth: 1,
  },
  successText: { fontSize: 14, fontWeight: '700' },
});
