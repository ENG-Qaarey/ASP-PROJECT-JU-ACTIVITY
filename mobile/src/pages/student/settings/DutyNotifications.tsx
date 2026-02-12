import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ArrowLeft, Bell, Calendar, MessageSquare, Megaphone, Info } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { ThemedText } from '@/src/components/themed-text';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function DutyNotifications() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isRTL, t } = useLanguage();

  const [settings, setSettings] = React.useState({
    activityReminders: true,
    groupMessages: true,
    announcements: true,
    dutyAlerts: true,
    emailNotifications: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBack = () => {
    router.navigate('/(student)/(tabs)/profile');
  };

  return (
    <GradientBackground>
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t.profile.dutyNotifications}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.descriptionContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primary + '15' }]}>
                <Info size={20} color={theme.primary} />
            </View>
            <Text style={[styles.descriptionText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t.notifications.dutySubtitle}
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t.profile.pushNotifications}
            </Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <NotificationToggle 
                    icon={Calendar} 
                    label={t.profile.activityReminders} 
                    description={t.profile.activityRemindersDesc}
                    value={settings.activityReminders}
                    onValueChange={() => toggleSetting('activityReminders')}
                    theme={theme}
                    isRTL={isRTL}
                />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <NotificationToggle 
                    icon={Bell} 
                    label={t.profile.dutyAssignments} 
                    description={t.profile.dutyAssignmentsDesc}
                    value={settings.dutyAlerts}
                    onValueChange={() => toggleSetting('dutyAlerts')}
                    theme={theme}
                    isRTL={isRTL}
                />
                 <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <NotificationToggle 
                    icon={MessageSquare} 
                    label={t.profile.groupMessages} 
                    description={t.profile.groupMessagesDesc}
                    value={settings.groupMessages}
                    onValueChange={() => toggleSetting('groupMessages')}
                    theme={theme}
                    isRTL={isRTL}
                />
                 <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <NotificationToggle 
                    icon={Megaphone} 
                    label={t.profile.generalAnnouncements} 
                    description={t.profile.generalAnnouncementsDesc}
                    value={settings.announcements}
                    onValueChange={() => toggleSetting('announcements')}
                    theme={theme}
                    isRTL={isRTL}
                />
            </GlassCard>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t.profile.otherChannels}
            </Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <NotificationToggle 
                    icon={Bell} 
                    label={t.profile.emailNotifications} 
                    description={t.profile.emailNotificationsDesc}
                    value={settings.emailNotifications}
                    onValueChange={() => toggleSetting('emailNotifications')}
                    theme={theme}
                    isRTL={isRTL}
                />
            </GlassCard>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function NotificationToggle({ icon: Icon, label, description, value, onValueChange, theme, isRTL }: any) {
    return (
        <View style={[styles.toggleRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.toggleLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Icon size={20} color={theme.primary} />
                </View>
                <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.toggleLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
                    <Text style={[styles.toggleDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
                </View>
            </View>
            <Switch 
                value={value} 
                onValueChange={onValueChange}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={value ? theme.primary : '#f4f3f4'}
                style={isRTL ? { marginRight: 16 } : { marginLeft: 16 }} // Add specific margin if needed, but flex-end handles it mostly
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 24,
    gap: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.5,
  },
});
