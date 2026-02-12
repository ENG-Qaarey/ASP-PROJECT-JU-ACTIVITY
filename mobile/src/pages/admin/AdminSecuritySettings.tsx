import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, Text, Switch } from 'react-native';
import { 
  ArrowLeft, Lock, KeyRound, ShieldCheck, Smartphone, CheckCircle2
} from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { GlassCard } from '@/src/components/GlassCard';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { client } from '@/src/lib/api';
import { useLanguage } from '@/src/context/LanguageContext';

export default function AdminSecuritySettings() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [twoFactor, setTwoFactor] = React.useState(false);
  const [passwords, setPasswords] = React.useState({
    old: '',
    new: '',
    confirm: ''
  });
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { t, isRTL } = useLanguage();

  const handleSave = async () => {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      Alert.alert(t.common.error, 'Please fill in all password fields.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      Alert.alert(t.common.error, 'New passwords do not match.');
      return;
    }

    if (passwords.new.length < 8) {
      Alert.alert(t.common.error, 'New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await client.patch('/users/me/password', {
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      Alert.alert(t.common.success, 'Your password has been successfully changed.');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || 'Error updating security settings');
    } finally {
      setLoading(false);
    }
  };

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
                <ShieldCheck size={32} color={theme.primary} />
            </View>
            <ThemedText style={[styles.pageTitle, { color: theme.text }]}>{t.profile.securityPassword}</ThemedText>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{t.profile.advancedSecurity}</Text>
        </View>

        {/* Change Password Section */}
        <GlassCard style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <KeyRound size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.profile.changePassword}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.currentPassword}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                secureTextEntry
                value={passwords.old}
                onChangeText={(val: string) => setPasswords(prev => ({ ...prev, old: val }))}
                placeholder={t.profile.currentPassword}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

             <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.newPassword}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                secureTextEntry
                value={passwords.new}
                onChangeText={(val: string) => setPasswords(prev => ({ ...prev, new: val }))}
                placeholder={t.profile.newPassword}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

             <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.confirmNewPassword}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                secureTextEntry
                value={passwords.confirm}
                onChangeText={(val: string) => setPasswords(prev => ({ ...prev, confirm: val }))}
                placeholder={t.profile.confirmNewPassword}
                placeholderTextColor={theme.textSecondary}
              />
            </View>
        </GlassCard>

        {/* Two-Factor Auth */}
        <GlassCard style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <Smartphone size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.profile.twoFactorAuth}</Text>
            </View>
            
            <View style={[styles.toggleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.toggleInfo, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}>
                    <Text style={[styles.toggleLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.enabled}</Text>
                    <Text style={[styles.toggleDesc, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.profile.twoFactorDesc}</Text>
                </View>
                <Switch 
                    value={twoFactor} 
                    onValueChange={setTwoFactor}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={'#FFFFFF'}
                />
            </View>
        </GlassCard>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, shadowColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleSave} disabled={loading}>
            {loading ? (
               <Text style={styles.saveBtnText}>{t.profile.saving}</Text>
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.saveBtnText}>{t.profile.saveChanges}</Text>
              </>
            )}
        </TouchableOpacity>

      </ScrollView>
    </GradientBackground>
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
    marginBottom: -20,
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
  formCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '700' },
  toggleDesc: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
