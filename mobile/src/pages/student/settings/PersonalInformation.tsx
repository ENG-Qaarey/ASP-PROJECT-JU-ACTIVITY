import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Camera } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { ThemedText } from '@/src/components/themed-text';
import { JuButton } from '@/src/components/JuButton';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useAuth } from '@/src/context/AuthContext';
import { client } from '@/src/lib/api';
import { getAvatarUrl } from '@/src/lib/media';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLanguage } from '@/src/context/LanguageContext';

export default function PersonalInformation() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { t, isRTL } = useLanguage();
  
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState(user?.studentId || ''); // Reusing studentId for placeholder
  const [department, setDepartment] = React.useState(user?.department || '');
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleBack = () => {
    router.navigate('/(student)/(tabs)/profile');
  };

  const handlePickImage = async () => {
    try {
        const [libraryStatus, cameraStatus] = await Promise.all([
          ImagePicker.requestMediaLibraryPermissionsAsync(),
          ImagePicker.requestCameraPermissionsAsync(),
        ]);

        if (libraryStatus.status !== 'granted') {
            Alert.alert(t.profile.permissionDenied, t.profile.galleryAccess);
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
                            Alert.alert(t.profile.permissionDenied, 'Camera permission not granted');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });
                        if (!result.canceled) uploadAvatar(result.assets[0].uri);
                    }
                },
                { 
                    text: t.profile.gallery, 
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });
                        if (!result.canceled) uploadAvatar(result.assets[0].uri);
                    }
                },
                { text: t.common.cancel, style: 'cancel' }
            ]
        );
    } catch (error) {
        console.log('Pick image error:', error);
        Alert.alert(t.common.error, 'An unexpected error occurred.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
        setIsUploading(true);
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename,
            type,
        });

        const updatedUser = await client.post('/users/me/avatar', formData);
        if (updatedUser) {
            setUser(updatedUser);
            Alert.alert(t.common.success, 'Profile picture updated successfully');
        }
    } catch (error: any) {
        Alert.alert(t.common.error, error.message || 'Could not upload image');
    } finally {
        setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
        setIsSaving(true);
        const updated = await client.patch('/users/me', {
            name,
            email,
            department,
            studentId: phone,
        });
        if (updated) {
            setUser(updated);
            Alert.alert(t.common.success, 'Profile information updated successfully');
        }
    } catch (error: any) {
        Alert.alert(t.common.error, error.message || 'Failed to update profile');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <GradientBackground>
       <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} style={isRTL && { transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t.profile.personalInfo}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <Image 
                    source={getAvatarUrl(user?.avatar)} 
                    style={[styles.avatar, { borderColor: theme.card }]} 
                />
                <TouchableOpacity 
                    style={[styles.cameraBtn, { backgroundColor: theme.primary }]} 
                    onPress={handlePickImage}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Camera size={20} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                </TouchableOpacity>
            </View>
            <ThemedText style={[styles.avatarTip, { color: theme.textSecondary }]}>
                {t.profile.changePhoto}
            </ThemedText>
        </View>

        <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.inputGroup}>
            <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <User size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t.profile.fullName}</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
              value={name} 
              onChangeText={setName}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Mail size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t.profile.emailAddress}</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Phone size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t.profile.phoneNumber}</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
              value={phone} 
              onChangeText={setPhone}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <MapPin size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t.profile.department}</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]} 
              value={department} 
              onChangeText={setDepartment}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </GlassCard>

        <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Changes to your primary identification may require administration approval.
            </Text>
        </View>

        <JuButton 
            title={t.profile.saveChanges} 
            onPress={handleSave} 
            icon={Save}
            loading={isSaving}
            style={styles.saveButton}
        />
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
    paddingBottom: 100,
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
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarTip: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 32,
  },
});
