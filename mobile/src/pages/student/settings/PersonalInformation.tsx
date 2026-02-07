import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Camera, LogOut } from 'lucide-react-native';
import { GradientBackground } from '@/src/components/GradientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { ThemedText } from '@/src/components/themed-text';
import { JuButton } from '@/src/components/JuButton';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { useAuth } from '@/src/context/AuthContext';
import { client } from '@/src/lib/api';
import { IMAGE_BASE } from '@/src/lib/config';
import { getAvatarUrl } from '@/src/lib/media';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ActivityIndicator, Alert, Platform } from 'react-native';

export default function PersonalInformation() {
  const router = useRouter();
  const { user, setUser, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState(user?.studentId || ''); // Reusing studentId for placeholder
  const [department, setDepartment] = React.useState(user?.department || '');
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleBack = () => {
    router.back();
  };

  const handlePickImage = async () => {
    try {
        // Request permissions
        const [libraryStatus, cameraStatus] = await Promise.all([
          ImagePicker.requestMediaLibraryPermissionsAsync(),
          ImagePicker.requestCameraPermissionsAsync(),
        ]);

        if (libraryStatus.status !== 'granted') {
            if (!libraryStatus.canAskAgain) {
                Alert.alert(
                    'Permission Required', 
                    'Gallery access is disabled. Please enable it in Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Platform.OS === 'ios' ? ImagePicker.requestMediaLibraryPermissionsAsync() : {} } 
                        // Note: Expo doesn't have a direct 'openSettings' in picker, usually handled by OS or Linking
                    ]
                );
            } else {
                Alert.alert('Permission Denied', 'We need permission to access your gallery.');
            }
            return;
        }

        // Show choice to user
        Alert.alert(
            'Update Profile Picture',
            'Choose a source',
            [
                { 
                    text: 'Camera', 
                    onPress: async () => {
                        if (cameraStatus.status !== 'granted') {
                            Alert.alert('Error', 'Camera permission not granted');
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
                    text: 'Gallery', 
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
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    } catch (error) {
        console.log('Pick image error:', error);
        Alert.alert('Error', 'An unexpected error occurred while picking an image.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
        setIsUploading(true);
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename,
            type,
        } as any);

        const updatedUser = await client.post('/users/me/avatar', formData);
        if (updatedUser) {
            setUser(updatedUser);
            Alert.alert('Success', 'Profile picture updated successfully');
        }
    } catch (error: any) {
        Alert.alert('Upload Failed', error.message || 'Could not upload image');
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
            studentId: phone, // Assuming studentId field for now based on user object
        });
        if (updated) {
            setUser(updated);
            Alert.alert('Success', 'Profile information updated successfully');
        }
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Personal Information</ThemedText>
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
                Tap camera to change profile picture
            </ThemedText>
        </View>

        <GlassCard style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
              value={name} 
              onChangeText={setName}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Phone size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Student ID / Phone</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
              value={phone} 
              onChangeText={setPhone}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <MapPin size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Department</Text>
            </View>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
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
            title="Save Changes" 
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
