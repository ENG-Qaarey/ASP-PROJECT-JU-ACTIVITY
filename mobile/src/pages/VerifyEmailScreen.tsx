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
  const { email } = useLocalSearchParams() as any;
  const { showToast } = useToast();
  const { setUser } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<any | null>>([]);
  
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register as a new student</Text>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>Enter the verification code we emailed to</Text>
              <Text style={styles.emailText}>{email}</Text>
              <Text style={styles.spamNotice}>Check your inbox and spam folder if you don't see it</Text>
            </View>
          </View>

          <BlurView intensity={90} tint="light" style={styles.glass}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref: any) => (inputs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputActive : null
                  ]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text: string) => handleInputChange(text, index)}
                  onKeyPress={(e: any) => handleKeyPress(e, index)}
                  selectionColor="#38BDF8"
                />
              ))}
            </View>

            <Text style={styles.helpText}>Enter the 6-digit security code</Text>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#7DD3FC', '#38BDF8']}
                style={styles.buttonGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={handleResend}
                disabled={resending}
              >
                <Text style={styles.actionText}>{resending ? 'Resending...' : 'Resend code'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.actionText}>Edit registration info</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>Sign in here</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 10,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  spamNotice: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  glass: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    width: width * 0.9,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  codeInput: {
    width: 42,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  codeInputActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#FFFFFF',
  },
  helpText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },
  actionText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    color: '#64748B',
    fontSize: 15,
  },
  loginLink: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
  },
});
