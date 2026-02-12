import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, Lock, ShieldCheck, Fingerprint, Smartphone } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { ThemedText } from '@/src/components/themed-text';
import { JuButton } from '@/src/components/JuButton';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function SecurityPassword() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isRTL, t } = useLanguage();

  const handleBack = () => {
    router.navigate('/(student)/(tabs)/profile');
  };

  return (
    <GradientBackground>
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t.profile.securityPassword}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.changePassword}</Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.currentPassword}</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.newPassword}</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.confirmNewPassword}</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>

                <JuButton 
                    title={t.profile.updatePassword} 
                    onPress={() => {}} 
                    style={styles.updateButton}
                />
            </GlassCard>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.advancedSecurity}</Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <SecurityOption 
                    icon={Fingerprint}
                    label={t.profile.biometricAuth}
                    description={t.profile.biometricDesc}
                    status={t.profile.enabled}
                    theme={theme}
                    isRTL={isRTL}
                />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <SecurityOption 
                    icon={Smartphone}
                    label={t.profile.twoFactorAuth}
                    description={t.profile.twoFactorDesc}
                    status={t.profile.setup}
                    theme={theme}
                    isRTL={isRTL}
                />
            </GlassCard>
        </View>

        <View style={[styles.footerInfo, isRTL && { flexDirection: 'row-reverse' }]}>
             <ShieldCheck size={20} color="#22C55E" />
             <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                 Your account is secured with end-to-end encryption.
             </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function SecurityOption({ icon: Icon, label, description, status, theme, isRTL }: any) {
    return (
        <TouchableOpacity style={[styles.optionRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.optionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Icon size={20} color={theme.primary} />
                </View>
                <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.optionLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
                    <Text style={[styles.optionDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status === 'Enabled' || status === 'Daaran' || status === 'مفعل' ? '#DCFCE7' : theme.primary + '15' }]}>
                <Text style={[styles.statusText, { color: status === 'Enabled' || status === 'Daaran' || status === 'مفعل' ? '#166534' : theme.primary }]}>{status}</Text>
            </View>
        </TouchableOpacity>
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
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLeft: {
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
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    opacity: 0.5,
    marginVertical: 4,
  },
  footerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 8,
  },
  footerText: {
      fontSize: 12,
      fontWeight: '600',
  },
});
