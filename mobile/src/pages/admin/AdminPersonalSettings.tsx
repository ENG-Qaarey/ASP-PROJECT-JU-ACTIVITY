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
import { getAvatarUrl } from '@/src/lib/media';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function AdminPersonalSettings() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);
  const { user, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { t, isRTL } = useLanguage();

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
        console.log('Failed to fetch admin profile', e);
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
      Alert.alert(t.common.success, 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || 'Error updating profile');
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
          t.profile.permissionDenied, 
          t.profile.galleryAccess,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        t.profile.changePhoto,
        t.profile.selectSource,
        [
          {
            text: t.profile.camera,
            onPress: async () => {
              if (cameraStatus.status !== 'granted') {
                Alert.alert(t.profile.permissionDenied, 'Camera access is not granted.');
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
            text: t.profile.gallery,
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
          { text: t.common.cancel, style: 'cancel' }
        ]
      );
    } catch (e) {
      console.log('Pick image error:', e);
      Alert.alert(t.common.error, 'Failed to open image picker.');
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
          Alert.alert(t.common.success, 'Profile photo updated successfully.');
      }
    } catch (e: any) {
      console.log('Photo upload failed:', e);
      Alert.alert(t.common.error, 'Failed to upload photo: ' + (e.message || 'Unknown error'));
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
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(admin)/profile')}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
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
                <Text style={[styles.changePhotoText, { color: theme.primary }]}>{t.profile.changePhoto}</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <GlassCard style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={styles.inputGroup}>
              <Label icon={User} label={t.profile.fullName} theme={theme} isRTL={isRTL} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                value={formData.name} 
                onChangeText={(val: string) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder={t.profile.fullName}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Shield} label={t.profile.adminRole} theme={theme} isRTL={isRTL} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background + '80', color: theme.textSecondary, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                value={t.profile.adminRole} 
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Mail} label={t.profile.emailAddress} theme={theme} isRTL={isRTL} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                value={formData.email} 
                onChangeText={(val: string) => setFormData(prev => ({ ...prev, email: val }))}
                keyboardType="email-address"
                placeholder={t.profile.emailAddress}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Label icon={Phone} label={t.profile.phoneNumber} theme={theme} isRTL={isRTL} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                value={formData.phone} 
                onChangeText={(val: string) => setFormData(prev => ({ ...prev, phone: val }))}
                keyboardType="phone-pad"
                placeholder={t.profile.phoneNumber}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

             <View style={styles.inputGroup}>
              <Label icon={MapPin} label={t.profile.officeLocation} theme={theme} isRTL={isRTL} />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
                value={formData.location} 
                onChangeText={(val: string) => setFormData(prev => ({ ...prev, location: val }))}
                placeholder={t.profile.officeLocation}
                placeholderTextColor={theme.textSecondary}
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
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function Label({ icon: Icon, label, theme, isRTL }: any) {
  return (
    <View style={[styles.labelContainer, isRTL && { flexDirection: 'row-reverse' }]}>
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
