import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Switch, Alert } from 'react-native';
import { ArrowLeft, Bell, BellRing, BellOff, Volume2, Globe, Mail, MessageSquare } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { GlassCard } from '@/src/components/GlassCard';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useLanguage } from '@/src/context/LanguageContext';

export default function AdminGlobalNotifications() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { t, isRTL } = useLanguage();
  
  // State for toggles
  const [allPush, setAllPush] = React.useState(true);
  const [emailAlerts, setEmailAlerts] = React.useState(true);
  const [systemAnnouncements, setSystemAnnouncements] = React.useState(true);
  const [newRegistrations, setNewRegistrations] = React.useState(false);
  const [activityProposals, setActivityProposals] = React.useState(true);
  const [attendanceReports, setAttendanceReports] = React.useState(false);

  return (
    <GradientBackground>
       <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(admin)/profile')}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20', borderColor: theme.card }]}>
                <BellRing size={28} color={theme.primary} />
            </View>
            <ThemedText style={[styles.pageTitle, { color: theme.text }]}>{t.notifications.globalTitle}</ThemedText>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{t.notifications.globalSubtitle}</Text>
        </View>

        {/* General Settings */}
        <GlassCard style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <Globe size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.notifications.generalChannels}</Text>
            </View>
            
            <ToggleItem 
                icon={Bell} 
                label={t.notifications.pushNotifications} 
                desc={t.notifications.pushDesc}
                value={allPush}
                onValueChange={setAllPush}
                theme={theme}
                isRTL={isRTL}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ToggleItem 
                icon={Mail} 
                label={t.notifications.emailDigests} 
                desc={t.notifications.emailDesc}
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                theme={theme}
                isRTL={isRTL}
            />
        </GlassCard>

        {/* Administrative Alerts */}
        <GlassCard style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <MessageSquare size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.notifications.administrativeAlerts}</Text>
            </View>
            
            <ToggleItem 
                label={t.notifications.systemAnnouncements} 
                value={systemAnnouncements}
                onValueChange={setSystemAnnouncements}
                theme={theme}
                isRTL={isRTL}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ToggleItem 
                label={t.notifications.newRegistrations} 
                value={newRegistrations}
                onValueChange={setNewRegistrations}
                theme={theme}
                isRTL={isRTL}
            />
             <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ToggleItem 
                label={t.notifications.activityProposals} 
                value={activityProposals}
                onValueChange={setActivityProposals}
                theme={theme}
                isRTL={isRTL}
            />
             <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ToggleItem 
                label={t.notifications.attendanceReports} 
                value={attendanceReports}
                onValueChange={setAttendanceReports}
                theme={theme}
                isRTL={isRTL}
            />
        </GlassCard>

      </ScrollView>
    </GradientBackground>
  );
}

function ToggleItem({ icon: Icon, label, desc, value, onValueChange, theme, isRTL }: any) {
    return (
        <View style={[styles.toggleRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.toggleInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                {Icon && (
                    <View style={[styles.toggleIconContainer, { backgroundColor: theme.primary + '10' }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}>
                         <Icon size={20} color={theme.primary} />
                    </View>
                )}
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.toggleLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
                    {desc && <Text style={[styles.toggleDesc, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{desc}</Text>}
                </View>
            </View>
            <Switch 
                value={value} 
                onValueChange={onValueChange}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={value ? theme.primary : '#f4f3f4'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginTop: -20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  pageHeader: { alignItems: 'center', marginBottom: 30 },
  iconContainer: {
      width: 64, height: 64, borderRadius: 32,
      justifyContent: 'center', alignItems: 'center', marginBottom: 16,
      borderWidth: 4,
  },
  pageTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, textAlign: 'center', maxWidth: '70%' },
  sectionCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  toggleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  toggleIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  toggleLabel: { fontSize: 16, fontWeight: '700' },
  toggleDesc: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, marginVertical: 12 },
});
