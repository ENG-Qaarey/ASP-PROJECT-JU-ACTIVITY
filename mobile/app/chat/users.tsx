import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
  LayoutAnimation,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Search, MessageSquare, MoreVertical, UserPlus } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { Image } from 'expo-image';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import * as Haptics from 'expo-haptics';
import { client } from '@/src/lib/api';
import { getAvatarUrl } from '@/src/lib/media';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function UserDirectoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups'>('all');

  const fetchUsers = async () => {
    try {
      const data = await client.get(`/users/chat-directory${searchQuery ? `?search=${searchQuery}` : ''}`);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  return (
    <GradientBackground>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Floating Header - Rendered in component for consistent cross-platform behavior */}
      <View style={[styles.floatingHeaderWrapper, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Community Hub</Text>
          </View>
          
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <Search size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by name or role..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
            />
          </View>
        </View>

        <View style={styles.filterWrapper}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => {
              setActiveFilter('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'groups' && styles.filterChipActive]}
            onPress={() => {
              setActiveFilter('groups');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterText, activeFilter === 'groups' && styles.filterTextActive]}>Groups</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userCard, 
                  { 
                    backgroundColor: theme.card,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.avatarWrapper}>
                    <Image source={getAvatarUrl(item.avatar)} style={styles.avatar} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.userRole, { color: theme.textSecondary }]}>
                      {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                  </View>
                  <View style={[styles.actionIcon, { backgroundColor: theme.primary + '15' }]}>
                    <MessageSquare size={20} color={theme.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No users found</ThemedText>
              </View>
            )}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeaderWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filterWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#0EA5E9', // App Primary Blue
    borderColor: '#38BDF8',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 15,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
