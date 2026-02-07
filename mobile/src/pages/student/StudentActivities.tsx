import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { Search, MapPin, Calendar, Clock, Users } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useRouter } from 'expo-router';

import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import { ActivityIndicator, RefreshControl } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width > 600 ? (width - 60) / 2 : width - 40;

const CATEGORIES = ['All', 'Workshop', 'Seminar', 'Training', 'Extracurricular'];

export default function StudentActivities() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
        setLoading(true);
        const data = await client.get(ENDPOINTS.ACTIVITIES);
        if (Array.isArray(data)) {
            setActivities(data);
        }
    } catch (error) {
        console.log('Failed to fetch activities:', error);
    } finally {
        setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const filteredActivities = activities.filter(act => 
    (activeCategory === 'All' || act.category?.toLowerCase() === activeCategory.toLowerCase()) &&
    (act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     act.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
            <ThemedText style={[styles.title, { color: theme.text }]}>Available Activities</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Browse and apply for activities that interest you
            </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={18} color={theme.textSecondary} />
            <TextInput 
                placeholder="Search activities.." 
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
            {CATEGORIES.map(cat => (
                <TouchableOpacity 
                    key={cat} 
                    onPress={() => setActiveCategory(cat)}
                    style={[
                        styles.chip, 
                        { backgroundColor: theme.card, borderColor: theme.border },
                        activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                >
                    <ThemedText style={[
                        styles.chipText, 
                        { color: theme.textSecondary },
                        activeCategory === cat && { color: '#FFFFFF', fontWeight: '800' }
                    ]}>{cat}</ThemedText>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Activities Grid */}
        <View style={styles.listContainer}>
            {loading && !refreshing ? (
                <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : filteredActivities.length > 0 ? (
                filteredActivities.map(activity => (
                    <ActivityCard 
                        key={activity.id} 
                        activity={activity} 
                        theme={theme} 
                        onPress={() => router.push({ 
                            pathname: '/(student)/details' as any, 
                            params: { ...activity } 
                        })} 
                    />
                ))
            ) : (
                <View style={[styles.emptyState, { width: '100%' }]}>
                    <ThemedText style={styles.emptyText}>No activities found matching your criteria.</ThemedText>
                </View>
            )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function ActivityCard({ activity, theme, onPress }: any) {
    const progress = (activity.enrolled / activity.capacity) * 100;

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                    <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                        {activity.category ? activity.category.charAt(0).toUpperCase() + activity.category.slice(1) : ''}
                    </ThemedText>
                </View>
                <ThemedText style={[styles.cardMainTitle, { color: theme.text }]}>{activity.title}</ThemedText>
            </View>
            
            <ThemedText style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                {activity.description}
            </ThemedText>

            <View style={styles.metaList}>
                <View style={styles.metaItem}>
                    <Calendar size={14} color={theme.primary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{activity.date.split('T')[0]}</ThemedText>
                </View>
                <View style={styles.metaItem}>
                    <Clock size={14} color={theme.primary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{activity.time}</ThemedText>
                </View>
                <View style={styles.metaItem}>
                    <MapPin size={14} color={theme.primary} />
                    <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>{activity.location}</ThemedText>
                </View>
            </View>

            <View style={[styles.enrollSection, { borderTopColor: theme.border }]}>
                <View style={styles.enrollInfo}>
                    <Users size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.enrollText, { color: theme.textSecondary }]}>
                        {activity.enrolled}/{activity.capacity} enrolled
                    </ThemedText>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                </View>
            </View>

            <View style={[styles.viewBtn, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.viewBtnText}>View Details</ThemedText>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 40, paddingBottom: 120 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 12, fontWeight: '500' },

  chipScroll: { marginBottom: 24, marginHorizontal: -20 },
  chipContainer: { paddingHorizontal: 20, gap: 10 },
  chip: { 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  listContainer: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: { 
    width: COLUMN_WIDTH,
    borderRadius: 24, 
    padding: 20,
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: { marginBottom: 14 },
  badge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardMainTitle: { fontSize: 18, fontWeight: '900' },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 16, fontWeight: '500' },

  metaList: { gap: 10, marginBottom: 18 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaText: { fontSize: 13, fontWeight: '700' },

  enrollSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  enrollInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  enrollText: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { width: 70, height: 5, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  viewBtn: { 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  viewBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  emptyState: { flex: 1, padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', opacity: 0.6, fontSize: 15, fontWeight: '600' },
});
