import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { ArrowLeft, Moon, Languages, CheckCircle, ChevronRight, Monitor } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { ThemedText } from '@/src/components/themed-text';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function AppPreferences() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { themeSetting, setTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [themeModalVisible, setThemeModalVisible] = React.useState(false);

  const handleBack = () => {
    router.navigate('/(student)/(tabs)/profile');
  };

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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t.settings.title}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t.settings.theme}
            </Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <TouchableOpacity 
                   style={[styles.optionRow, isRTL && { flexDirection: 'row-reverse' }]} 
                   onPress={() => setThemeModalVisible(true)}
                >
                    <View style={[styles.optionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                            <Monitor size={20} color={theme.primary} />
                        </View>
                        <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.optionLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                              {t.settings.theme}
                            </Text>
                            <Text style={[styles.optionDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                              {getThemeName(themeSetting)}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={theme.textSecondary} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
            </GlassCard>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t.settings.language}
            </Text>
            <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
                <TouchableOpacity 
                  style={[styles.optionRow, isRTL && { flexDirection: 'row-reverse' }]} 
                  onPress={() => setLanguageModalVisible(true)}
                >
                    <View style={[styles.optionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                            <Languages size={20} color={theme.primary} />
                        </View>
                        <View style={[styles.textContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.optionLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                              {t.settings.language}
                            </Text>
                            <Text style={[styles.optionDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                              {getLanguageName(language)}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={theme.textSecondary} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
            </GlassCard>
        </View>
      </ScrollView>

      {/* Theme Choice Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setThemeModalVisible(false)} 
          />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.selectTheme}</Text>
            <View style={styles.choiceList}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity 
                  key={mode}
                  style={[
                    styles.choiceItem, 
                    { borderBottomColor: theme.border },
                    themeSetting === mode && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={async () => {
                    await setTheme(mode);
                    setThemeModalVisible(false);
                  }}
                >
                  <Text style={[
                      styles.choiceText, 
                      { color: theme.text },
                      themeSetting === mode && { color: theme.primary, fontWeight: '800' }
                  ]}>
                    {getThemeName(mode)}
                  </Text>
                  {themeSetting === mode && <CheckCircle size={20} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setLanguageModalVisible(false)} 
          />
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.selectLanguage}</Text>
            <View style={styles.choiceList}>
              {(['en', 'so', 'ar'] as const).map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  style={[
                    styles.choiceItem, 
                    { borderBottomColor: theme.border },
                    language === lang && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={async () => {
                    await setLanguage(lang);
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={[
                      styles.choiceText, 
                      { color: theme.text },
                      language === lang && { color: theme.primary, fontWeight: '800' }
                  ]}>
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
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCloseArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  choiceList: {
    gap: 8,
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderBottomWidth: 1,
  },
  choiceText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
