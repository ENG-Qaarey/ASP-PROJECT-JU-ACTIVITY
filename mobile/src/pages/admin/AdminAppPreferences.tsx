import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Switch, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Palette, Moon, Languages, Wifi, Monitor, CheckCircle } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { GlassCard } from '@/src/components/GlassCard';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function AdminAppPreferences() {
  const router = useRouter();
  const { themeSetting, setTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [themeModalVisible, setThemeModalVisible] = React.useState(false);
  const [langModalVisible, setLangModalVisible] = React.useState(false);

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'so': return 'Af-Soomaali';
      case 'ar': return 'العربية';
      default: return 'English';
    }
  };

  const getThemeName = (mode: string) => {
    switch (mode) {
      case 'light': return t.settings.lightMode;
      case 'dark': return t.settings.darkMode;
      case 'system': return t.settings.systemMode;
      default: return t.settings.systemMode;
    }
  };

  return (
    <GradientBackground>
       <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.navigate('/(admin)/profile')}
        >
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20', borderColor: theme.card }]}>
                <Palette size={32} color={theme.primary} />
            </View>
            <ThemedText style={[styles.pageTitle, { color: theme.text }]}>{t.settings.title}</ThemedText>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              {t.profile.accountDetails}
            </Text>
        </View>

        {/* Display & Language */}
        <GlassCard style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <Monitor size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.settings.theme}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }]} 
              onPress={() => setThemeModalVisible(true)}
            >
                <View style={[styles.rowInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>{t.settings.theme}</Text>
                    <Text style={[styles.rowValue, { color: theme.primary }]}>{getThemeName(themeSetting)}</Text>
                </View>
                <Moon size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
             
            <TouchableOpacity 
              style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }]} 
              onPress={() => setLangModalVisible(true)}
            >
                <View style={[styles.rowInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>{t.settings.language}</Text>
                    <Text style={[styles.rowValue, { color: theme.primary }]}>{getLanguageName(language)}</Text>
                </View>
                <Languages size={20} color={theme.textSecondary} />
            </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      {/* Theme Choice Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade" onRequestClose={() => setThemeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setThemeModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.selectTheme}</Text>
            <View style={styles.choiceList}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity 
                  key={mode}
                  style={[styles.choiceItem, { borderBottomColor: theme.border }, themeSetting === mode && { backgroundColor: theme.primary + '10' }]}
                  onPress={async () => {
                    await setTheme(mode);
                    setThemeModalVisible(false);
                  }}
                >
                  <Text style={[styles.choiceText, { color: theme.text }, themeSetting === mode && { color: theme.primary, fontWeight: '800' }]}>
                    {getThemeName(mode)}
                  </Text>
                  {themeSetting === mode && <CheckCircle size={20} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setLangModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.selectLanguage}</Text>
            <View style={styles.choiceList}>
              {(['en', 'so', 'ar'] as const).map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  style={[styles.choiceItem, { borderBottomColor: theme.border }, language === lang && { backgroundColor: theme.primary + '10' }]}
                  onPress={async () => {
                    await setLanguage(lang);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={[styles.choiceText, { color: theme.text }, language === lang && { color: theme.primary, fontWeight: '800' }]}>
                    {getLanguageName(lang)}
                  </Text>
                  {language === lang && <CheckCircle size={20} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, marginTop: -20 },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  pageHeader: { alignItems: 'center', marginBottom: 30 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 4 },
  pageTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, textAlign: 'center', maxWidth: '70%' },
  formCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowValue: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCloseArea: { flex: 1 },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  choiceList: { gap: 8 },
  choiceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 20, borderBottomWidth: 1 },
  choiceText: { fontSize: 18, fontWeight: '600' },
});
