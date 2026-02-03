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
import { IMAGE_BASE } from '@/src/lib/config';

const getAvatarUrl = (path?: string) => {
  if (!path) return 'https://github.com/shadcn.png';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

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

  const renderUserItem = ({ item }: { item: User }) => {
    const initials = item.name.substring(0, 2).toUpperCase();
    
    return (
      <TouchableOpacity
        style={[
          styles.userCard, 
          { backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)' }
        ]}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <ExpoBlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
        <View style={styles.cardContent}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: getAvatarUrl(item.avatar) }} style={styles.avatar} />
          </View>
          <View style={styles.userInfo}>
            <ThemedText style={styles.userName}>{item.name}</ThemedText>
            <ThemedText style={styles.userRole}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </ThemedText>
          </View>
          <View style={styles.actionIcon}>
            <MessageSquare size={20} color={theme.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <Image 
        source={{ uri: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png' }}
        style={[StyleSheet.absoluteFill, { opacity: 0.1 }]}
        contentFit="cover"
      />
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          title: '',
          headerTitle: () => null,
          headerBackTitle: '',
          headerBackVisible: false,
          headerBackground: () => (
            <View style={styles.floatingHeaderWrapper}>
              <View style={styles.premiumPill}>
                <ExpoBlurView intensity={80} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
                <View style={styles.pillContent}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.pillIconBtn}>
                    <ArrowLeft size={26} color="#007AFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.pillMainInfo}>
                    <Text style={styles.pillTitle}>Community Hub</Text>
                  </View>

                  <TouchableOpacity style={styles.pillIconBtn}>
                    <MoreVertical size={26} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ),
          headerLeft: () => null,
          headerRight: () => null,
        }}
      />

      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={styles.premiumSearchBox}>
            <ExpoBlurView intensity={30} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
            <Search size={18} color="#64748B" />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by name or role..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
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
            {activeFilter !== 'all' && (
              <ExpoBlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
            )}
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'groups' && styles.filterChipActive]}
            onPress={() => {
              setActiveFilter('groups');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            {activeFilter !== 'groups' && (
              <ExpoBlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'} />
            )}
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
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginTop: Platform.OS === 'ios' ? -20 : -10,
  },
  premiumPill: {
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pillIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillMainInfo: {
    flex: 1,
    alignItems: 'center',
  },
  pillTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 125 : 110,
    marginBottom: 20,
  },
  premiumSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Glass effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#334155', // Deeper slate for better contrast on glass
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
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
