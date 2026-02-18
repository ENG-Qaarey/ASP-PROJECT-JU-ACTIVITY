import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { X, Zap, MapPin, ShieldCheck, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react-native';
import { client } from '@/src/lib/api';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/data/theme';
import { GradientBackground } from '@/src/components/GradientBackground';
import { ThemedText } from '@/src/components/themed-text';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function AttendanceScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [baseZoom, setBaseZoom] = useState(0);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(setBaseZoom)(zoom);
    })
    .onUpdate((event) => {
      const scale = event.scale;
      const velocity = event.velocity;
      // Adjust sensitivity and limits
      let newZoom = baseZoom + (scale - 1) * 0.5;
      if (newZoom < 0) newZoom = 0;
      if (newZoom > 1) newZoom = 1;
      runOnJS(setZoom)(newZoom);
    });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <ShieldCheck size={64} color={theme.primary} style={{ marginBottom: 20 }} />
          <ThemedText style={styles.title}>Camera Permission</ThemedText>
          <ThemedText style={styles.subtitle}>
            We need your permission to show the camera so you can scan activity QR codes.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Data is expected to be a JSON string with activityId and token
      let qrData: { activityId: string; token: string };
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        // Fallback if it's just a token string (depends on how we encode it)
        // For now, let's assume it's JSON
        throw new Error('Invalid QR code format');
      }

      let location = null;
      if (locationPermission) {
        const loc = await Location.getCurrentPositionAsync({});
        location = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude
        };
      }

      const response = await client.post('/attendance/qr/scan', {
        activityId: qrData.activityId,
        token: qrData.token,
        location
      });

      Alert.alert(
        "Success",
        "Your attendance has been marked successfully!",
        [{ text: "OK", onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(student)/(tabs)/dashboard');
          }
        } }]
      );
    } catch (error: any) {
      console.error('QR Scan error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to mark attendance";
      
      Alert.alert(
        "Attendance Failed",
        errorMessage,
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureDetector gesture={pinchGesture}>
      <View style={styles.container}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            zoom={zoom}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.overlay}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(student)/(tabs)/dashboard');
                  }
                }}
              >
                <X size={28} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.scanContainer}>
                <View style={styles.scanFrame} />
                <ThemedText style={styles.scanText}>
                  Scan the activity QR code
                </ThemedText>
              </View>

              <View style={styles.zoomContainer}>
                <TouchableOpacity 
                  style={styles.zoomButton} 
                  onPress={() => setZoom(Math.min(zoom + 0.1, 1))}
                >
                  <ZoomIn size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.zoomButton} 
                  onPress={() => setZoom(Math.max(zoom - 0.1, 0))}
                >
                  <ZoomOut size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={locationPermission ? "#10B981" : "#EF4444"} />
                  <Text style={styles.infoText}>
                    {locationPermission ? "Location enabled" : "Location required"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Zap size={18} color="#F59E0B" />
                  <Text style={styles.infoText}>Instant Check-in</Text>
                </View>
              </View>
              
              {scanned && (
                <TouchableOpacity 
                  style={styles.reScanButton} 
                  onPress={() => setScanned(false)}
                >
                  <RefreshCw size={20} color="#FFF" style={{ marginRight: 10 }} />
                  <Text style={styles.buttonText}>Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </CameraView>
        </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  scanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    position: 'absolute',
    bottom: 40,
  },
  zoomContainer: {
    position: 'absolute',
    right: 20,
    top: '35%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    padding: 10,
    gap: 20,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
