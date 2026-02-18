import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mail, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import { useToast } from '@/src/context/ToastContext';
import { useAuth } from '@/src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const FloatingOrb = ({ size, x, y, duration = 6000, delay = 0 }: any) => {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: -30,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          top: y,
          left: x,
          transform: [{ translateY: translate }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.7)', 'rgba(186,230,253,0.3)']}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
};

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { showToast } = useToast();
  const { setUser } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleInputChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text.length === 1 && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      showToast({ message: 'Please enter the 6-digit code', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await client.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code: fullCode }, true);
      
      if (response && response.token) {
        showToast({ message: 'Email verified successfully! Welcome to JU Activity Hub.', type: 'success' });
        
        // Save token and user info for auto-login
        await AsyncStorage.setItem('user_token', response.token);
        if (response.user) {
          setUser(response.user);
          const role = response.user.role || 'student';
          
          // Redirect based on role
          if (role === 'admin') router.replace('/(admin)/dashboard');
          else if (role === 'coordinator') router.replace('/(coordinator)/dashboard');
          else router.replace('/(student)/home');
        } else {
          // Fallback to login if user object is missing
          router.replace('/login');
        }
      } else {
        showToast({ message: 'Email verified! Please log in.', type: 'success' });
        router.replace('/login');
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Verification failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await client.post(ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }, true);
      showToast({ message: 'Verification code resent!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to resend code', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      <View style={StyleSheet.absoluteFill}>
        <FloatingOrb size={300} x={-120} y={-120} duration={6000} delay={0} />
        <FloatingOrb size={260} x={width - 140} y={height / 3} duration={7000} delay={600} />
      </View>

      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#0C4A6E" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Mail size={40} color="#0EA5E9" />
            </View>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{' '}
              <Text style={{ fontWeight: '800', color: '#0369A1' }}>{email}</Text>
            </Text>
          </View>

          <BlurView intensity={90} tint="light" style={styles.glass}>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputActive : null
                  ]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#0284C7', '#0EA5E9']}
                style={styles.buttonGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <>
                  <RefreshCw size={16} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={styles.resendText}>Resend Code</Text>
                </>
              )}
            </TouchableOpacity>
          </BlurView>

          <View style={styles.footer}>
            <ShieldCheck size={18} color="#64748B" />
            <Text style={styles.footerText}>Secure Verification System</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0C4A6E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  glass: {
    borderRadius: 32,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  codeInput: {
    width: 45,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(203,213,225,0.5)',
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  codeInputActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resendBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    padding: 10,
  },
  resendText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
