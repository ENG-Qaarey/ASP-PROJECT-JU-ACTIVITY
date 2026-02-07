import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Clock, 
  Check,
  ShieldCheck,
  Info,
  ExternalLink
} from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from '@/src/lib/api';

const TIMER_OPTIONS = [
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '90 Days', value: '90d' },
  { label: 'Off', value: 'off' },
];

export default function DisappearingMessagesScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  
  const [selectedTimer, setSelectedTimer] = useState('off');

  useEffect(() => {
    loadTimer();
  }, [id]);

  const loadTimer = async () => {
    if (!id) return;
    try {
      const savedTimer = await AsyncStorage.getItem(`chat_disappearing_${id}`);
      if (savedTimer) {
        setSelectedTimer(savedTimer);
      }
    } catch (error) {
      console.log('Failed to load timer:', error);
    }
  };

  const handleSelectTimer = async (value: string) => {
    if (!id) return;
    setSelectedTimer(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await AsyncStorage.setItem(`chat_disappearing_${id}`, value);
    } catch (error) {
       console.log('Failed to save timer:', error);
    }
  };

  return (
    <GradientBackground>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Disappearing messages</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{name || 'Contact'}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration Section */}
        <View style={styles.illustrationContainer}>
          <View style={[styles.iconCircle, { backgroundColor: '#22C55E20' }]}>
            <Clock size={80} color="#22C55E" strokeWidth={1.5} />
            <View style={styles.bubbleOverlay}>
                <View style={[styles.miniBubble, { bottom: 10, left: -20, backgroundColor: '#22C55E' }]} />
                <View style={[styles.miniBubble, { top: 0, right: -25, backgroundColor: '#DCFCE7' }]} />
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Make messages in this chat disappear</Text>
          <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
            For more privacy and storage, all new messages will disappear from this chat after the selected duration, except when kept. You can change this setting at any time.{' '}
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Learn more</Text>
          </Text>
        </View>

        {/* Options List */}
        <View style={styles.timerSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Message timer</Text>
          <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {TIMER_OPTIONS.map((option, index) => (
              <React.Fragment key={option.value}>
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => handleSelectTimer(option.value)}
                >
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                  {selectedTimer === option.value && (
                    <Check size={20} color={theme.primary} strokeWidth={3} />
                  )}
                </TouchableOpacity>
                {index < TIMER_OPTIONS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
          
          <TouchableOpacity style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>
              Update your <Text style={{ color: theme.primary, fontWeight: '600' }}>default message timer</Text> in Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Lock Info */}
        <View style={styles.privacyFooter}>
          <ShieldCheck size={14} color={theme.textSecondary} />
          <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
            End-to-end encrypted
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBubble: {
    position: 'absolute',
    width: 30,
    height: 25,
    borderRadius: 12,
    borderBottomRightRadius: 2,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  timerSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
  },
  footerLink: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  footerLinkText: {
    fontSize: 13,
    lineHeight: 18,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 40,
    opacity: 0.7,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
