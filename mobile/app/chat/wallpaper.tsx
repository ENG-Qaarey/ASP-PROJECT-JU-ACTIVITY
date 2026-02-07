import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Moon, Sun, Image as ImageIcon, Layout } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// 6 Default Wallpapers (Gradients for premium feel)
// 6 Rich, Mobile-Style Gradient Wallpapers (Dark Mode Adapted)
const DEFAULT_WALLPAPERS = [
  { 
    id: 'wp1', 
    type: 'gradient', 
    colors: ['#2E3192', '#1BFFFF'], 
    darkColors: ['#0f0c29', '#302b63'], // Deep Purple Night
    name: 'Northern Lights',
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
  },
  { 
    id: 'wp2', 
    type: 'gradient', 
    colors: ['#FF9A9E', '#FECFEF', '#FECFEF'], 
    darkColors: ['#4a0e16', '#7f2835'], // Deep Burgundy
    name: 'Soft Rose', 
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 }
  },
  { 
    id: 'wp3', 
    type: 'gradient', 
    colors: ['#434343', '#000000'], 
    darkColors: ['#000000', '#121212'], // Pitch Black
    name: 'Midnight Mesh', 
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
  },
  { 
    id: 'wp4', 
    type: 'gradient', 
    colors: ['#ff9966', '#ff5e62'], 
    darkColors: ['#421307', '#631c0b'], // Dark Ember
    name: 'Sunset Horizon', 
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 }
  },
  { 
    id: 'wp5', 
    type: 'gradient', 
    colors: ['#00c6ff', '#0072ff'], 
    darkColors: ['#041029', '#081f4a'], // Abyssal Blue
    name: 'Deep Ocean', 
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 }
  },
  { 
    id: 'wp6', 
    type: 'gradient', 
    colors: ['#8E2DE2', '#4A00E0'], 
    darkColors: ['#1e0a36', '#310d59'], // Galactic Violet
    name: 'Electric Violet', 
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 }
  },
];

// Adaptive Solid Colors (Light & Dark pairs)
const ADAPTIVE_SOLIDS = [
  { id: 'solid_1', light: '#F8FAFC', dark: '#020617', name: 'Slate' }, // White / Midnight
  { id: 'solid_2', light: '#F0F9FF', dark: '#082F49', name: 'Sky' },   // Light Blue / Deep Navy
  { id: 'solid_3', light: '#FDF2F8', dark: '#4A044E', name: 'Pink' },  // Light Pink / Deep Plum
  { id: 'solid_4', light: '#F0FDF4', dark: '#052E16', name: 'Mint' },  // Light Mint / Deep Green
  { id: 'solid_5', light: '#FAF5FF', dark: '#2E1065', name: 'Violet' },// Light Violet / Deep Purple
  { id: 'solid_6', light: '#FFFFFF', dark: '#000000', name: 'Classic' },// Pure White / Pure Black
];

// Theme Colors (Bubble Colors)
const THEME_COLORS = [
  { color: '#0EA5E9', name: 'Sky Blue' },
  { color: '#3B82F6', name: 'Royal Blue' },
  { color: '#8B5CF6', name: 'Violet' },
  { color: '#EC4899', name: 'Pink' },
  { color: '#F59E0B', name: 'Amber' },
  { color: '#10B981', name: 'Emerald' },
];

export default function WallpaperSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [selectedWallpaper, setSelectedWallpaper] = useState<any>(null);
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>(theme.primary);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [id]);

  const loadSettings = async () => {
    if (!id) return;
    try {
      const storedWp = await AsyncStorage.getItem(`chat_wallpaper_${id}`);
      const storedTheme = await AsyncStorage.getItem(`chat_theme_color_${id}`);
      
      if (storedWp) {
        setSelectedWallpaper(JSON.parse(storedWp));
      }
      if (storedTheme) {
        setSelectedThemeColor(storedTheme);
      }
    } catch (e) {
      console.log("Failed to load settings", e);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (selectedWallpaper) {
        await AsyncStorage.setItem(`chat_wallpaper_${id}`, JSON.stringify(selectedWallpaper));
      } else {
        await AsyncStorage.removeItem(`chat_wallpaper_${id}`);
      }
      
      if (selectedThemeColor) {
        await AsyncStorage.setItem(`chat_theme_color_${id}`, selectedThemeColor);
      }

      router.back();
    } catch (error) {
      console.log('Error saving wallpaper', error);
    } finally {
      setSaving(false);
    }
  };

  const selectWallpaper = (wp: any) => {
    Haptics.selectionAsync();
    setSelectedWallpaper(wp);
  };

  const selectThemeColor = (color: string) => {
    Haptics.selectionAsync();
    setSelectedThemeColor(color);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
           style={[styles.backBtn, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
           onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallpaper & Theme</Text>
        <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
            onPress={handleSave}
            disabled={saving}
        >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Preview Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREVIEW</Text>
            <View style={[styles.previewCard, { borderColor: theme.border }]}>
                {selectedWallpaper?.type === 'gradient' ? (
                     <LinearGradient 
                        colors={(colorScheme === 'dark' && selectedWallpaper.darkColors) ? selectedWallpaper.darkColors : selectedWallpaper.colors} 
                        style={StyleSheet.absoluteFill} 
                        start={selectedWallpaper.start || { x: 0, y: 0 }} 
                        end={selectedWallpaper.end || { x: 1, y: 1 }}
                     />
                ) : selectedWallpaper?.type === 'solid' ? (
                     <View style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme === 'dark' ? (selectedWallpaper.dark || selectedWallpaper.color) : (selectedWallpaper.light || selectedWallpaper.color) }]} />
                ) : (
                    <DefaultWallpaper theme={theme} colorScheme={colorScheme} />
                )}

                {/* Mock Chat Bubbles */}
                <View style={styles.mockChatContainer}>
                    <View style={[styles.mockBubbleLeft, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }]}>
                        <Text style={{ color: theme.text, fontSize: 13 }}>Hey! How does this look?</Text>
                    </View>
                    <View style={[styles.mockBubbleRight, { backgroundColor: selectedThemeColor }]}>
                         <Text style={{ color: '#FFF', fontSize: 13 }}>It looks amazing! 🔥</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Wallpapers Grid */}
        <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CHOOSE WALLPAPER</Text>
             <View style={styles.grid}>
                 <TouchableOpacity 
                    style={[styles.wallpaperOption, !selectedWallpaper && styles.selectedOption, { borderColor: theme.primary }]}
                    onPress={() => selectWallpaper(null)}
                 >
                     <View style={[styles.wallpaperPreview, { overflow: 'hidden', borderRadius: 9 }]}>
                         <DefaultWallpaper theme={theme} colorScheme={colorScheme} />
                         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                             <ImageIcon size={24} color={theme.textSecondary} />
                             <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>Default</Text>
                         </View>
                     </View>
                 </TouchableOpacity>
                 
                 {DEFAULT_WALLPAPERS.map((wp) => (
                     <TouchableOpacity 
                        key={wp.id}
                        style={[styles.wallpaperOption, selectedWallpaper?.id === wp.id && styles.selectedOption, { borderColor: selectedThemeColor }]}
                        onPress={() => selectWallpaper(wp)}
                     >
                         <LinearGradient 
                            colors={(colorScheme === 'dark' && wp.darkColors) ? wp.darkColors : wp.colors as any}
                            style={styles.wallpaperPreview}
                            start={wp.start || { x: 0, y: 0 }} 
                            end={wp.end || { x: 1, y: 1 }}
                         >
                            {selectedWallpaper?.id === wp.id && (
                                <View style={[styles.checkBadge, { backgroundColor: selectedThemeColor }]}>
                                    <Check size={12} color="#FFF" />
                                </View>
                            )}
                         </LinearGradient>
                     </TouchableOpacity>
                 ))}
             </View>
        </View>
        
        {/* Colors Grid */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SOLID COLORS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsScroll}>
                {ADAPTIVE_SOLIDS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.colorOption, 
                            { 
                                backgroundColor: colorScheme === 'dark' ? item.dark : item.light, 
                                borderColor: theme.border 
                            },
                            selectedWallpaper?.id === item.id && { borderWidth: 2, borderColor: selectedThemeColor }
                        ]}
                        onPress={() => selectWallpaper({ type: 'solid', ...item })}
                    />
                ))}
            </ScrollView>
        </View>

        {/* Theme Color Selector */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>BUBBLE COLOR</Text>
            <View style={styles.themeRow}>
                {THEME_COLORS.map((tColor) => (
                    <TouchableOpacity
                        key={tColor.color}
                        style={[
                            styles.themeCircle,
                            { backgroundColor: tColor.color },
                            selectedThemeColor === tColor.color && styles.selectedThemeCircle
                        ]}
                        onPress={() => selectThemeColor(tColor.color)}
                    >
                         {selectedThemeColor === tColor.color && <Check size={16} color="#FFF" />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const DefaultWallpaper = ({ theme, colorScheme }: any) => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, overflow: 'hidden' }]}>
      {colorScheme === 'light' ? (
        <>
          <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E0F2FE', opacity: 0.6 }} />
          <View style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#A9D6FF', opacity: 0.4 }} />
        </>
      ) : (
        <>
          <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#0EA5E9', opacity: 0.15 }} />
          <View style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#1E40AF', opacity: 0.1 }} />
        </>
      )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  previewCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    padding: 20,
  },
  mockChatContainer: {
    gap: 12,
  },
  mockBubbleLeft: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
  mockBubbleRight: {
    alignSelf: 'flex-end',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wallpaperOption: {
    width: (width - 64) / 3,
    height: (width - 64) / 2.2, // Aspect ratio
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderWidth: 3,
  },
  wallpaperPreview: {
    flex: 1,
    borderRadius: 9,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorsScroll: {
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedThemeCircle: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
