import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Text, ActivityIndicator } from 'react-native';
import { 
  ArrowLeft, Save, User, Mail, Shield, Phone, MapPin, 
  Camera, CheckCircle2 
} from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import { GlassCard } from '@/src/components/GlassCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { client } from '@/src/lib/api';
import { ENDPOINTS, BASE_URL } from '@/src/lib/config';
import { getAvatarUrl } from '@/src/lib/media';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminPersonalSettings() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);
  const { user, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    role: '',
    phone: '+252 61 5000000', // Mock as not in schema
    location: 'Main Campus, Block A', // Mock as not in schema
    avatar: 'https://github.com/shadcn.png'
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await client.get('/users/me');
        if (data) {
          setFormData({
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'Admin',
            avatar: data.avatar || 'https://github.com/shadcn.png',
            phone: data.phone || '+252 61 5000000',
            location: data.location || 'Main Campus, Block A'
          });
        }
      } catch (e) {
        console.error('Failed to fetch admin profile', e);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await client.patch('/users/me', {
        name: formData.name,
        email: formData.email,
        // Backend only supports name, email, department, studentId, avatar
      });
      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const [libraryStatus, cameraStatus] = await Promise.all([
        ImagePicker.requestMediaLibraryPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync(),
      ]);

      if (libraryStatus.status !== 'granted') {
        Alert.alert(
          'Permission Denied', 
          'Gallery access is required to change your photo. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Update Profile Photo',
        'Select a source for your new photo:',
        [
          {
            text: 'Camera',
            onPress: async () => {
              if (cameraStatus.status !== 'granted') {
                Alert.alert('Permission Error', 'Camera access is not granted.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
              if (!result.canceled) uploadImage(result.assets[0].uri);
            }
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
              if (!result.canceled) uploadImage(result.assets[0].uri);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (e) {
      console.error('Pick image error:', e);
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append('file', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, name: filename, type });

      const response = await client.post('/users/me/avatar', formData);
      if (response && response.avatar) {
          setFormData(prev => ({ ...prev, avatar: response.avatar }));
          await refreshProfile();
          Alert.alert('Success', 'Profile photo updated successfully.');
      }
    } catch (e: any) {
      console.error('Photo upload failed:', e);
      Alert.alert('Error', 'Failed to upload photo: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fullAvatarUrl = getAvatarUrl(formData.avatar);

  if (fetching) {
      return (
          <View style={[styles.masterContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFF' : theme.primary} />
          </View>
      );
  }

  return (
    <GradientBackground>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(admin)/profile')}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={fullAvatarUrl} 
                style={[styles.avatar, { borderColor: theme.card }]} 
              />
              <TouchableOpacity style={[styles.cameraBtn, { borderColor: theme.card }]} onPress={pickImage}>
                <Camera size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={pickImage}>
                <Text style={[styles.changePhotoText, { color: theme.primary }]}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <GlassCard style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={styles.inputGroup}>
              <Label icon={User} label="Full Name" theme={theme} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                value={formData.name} 
                onChangeText={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="Enter full name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Shield} label="Admin Role" theme={theme} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background + '80', color: theme.textSecondary, borderColor: theme.border }]} 
                value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1) + ' Administrator'} 
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Mail} label="Email Address" theme={theme} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                value={formData.email} 
                onChangeText={(val) => setFormData(prev => ({ ...prev, email: val }))}
                keyboardType="email-address"
                placeholder="Enter email"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Phone} label="Phone Number" theme={theme} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                value={formData.phone} 
                onChangeText={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

             <View style={styles.inputGroup}>
              <Label icon={MapPin} label="Office Location" theme={theme} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                value={formData.location} 
                onChangeText={(val) => setFormData(prev => ({ ...prev, location: val }))}
                placeholder="Enter office location"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </GlassCard>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleSave} disabled={loading}>
            {loading ? (
               <Text style={styles.saveBtnText}>Saving...</Text>
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function Label({ icon: Icon, label, theme }: any) {
  return (
    <View style={styles.labelContainer}>
      <Icon size={14} color={theme.textSecondary} />
      <Text style={[styles.labelText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    flex: 1,
  },
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0EA5E9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 30,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
