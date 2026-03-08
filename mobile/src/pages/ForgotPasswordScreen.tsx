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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mail, Lock, ArrowLeft, ShieldCheck, Eye, EyeOff, Hash } from 'lucide-react-native';
import { client } from '@/src/lib/api';
import { useToast } from '@/src/context/ToastContext';

const { width, height } = Dimensions.get('window');

const FloatingOrb = ({ size, x, y, duration = 6000, delay = 0 }: any) => {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: -25,
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
        colors={['rgba(255,255,255,0.8)', 'rgba(186,230,253,0.4)']}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
};

export default function ForgotPassword() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const inputs = useRef<Array<any | null>>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleSendCode = async () => {
    if (!email) {
      showToast({ message: 'Please enter your email', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email }, true);
      showToast({ message: 'Reset code sent to your email!', type: 'success' });
      setStep(2);
      fadeAnim.setValue(0);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to send code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleReset = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6 || !newPassword || !confirmPassword) {
      showToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ message: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await client.post('/auth/reset-password', { 
        email, 
        code: fullCode, 
        newPassword 
      }, true);
      setSubmitted(true);
      showToast({ message: 'Password reset successful!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Reset failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.container}>
          <BlurView intensity={90} tint="light" style={styles.glass}>
            <View style={styles.successIconBox}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.successIconGrad}
              >
                <ShieldCheck size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Reset Successful</Text>
            <Text style={styles.successDescription}>
              Your password has been updated. You can now use your new password to sign in.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/login')}
            >
              <LinearGradient
                colors={['#0284C7', '#0EA5E9']}
                style={styles.buttonGrad}
              >
                <Text style={styles.buttonText}>Proceed to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      <View style={StyleSheet.absoluteFill}>
        <FloatingOrb size={300} x={-120} y={-120} duration={6000} delay={0} />
        <FloatingOrb size={260} x={width - 140} y={height / 3} duration={7000} delay={600} />
        <FloatingOrb size={360} x={-80} y={height - 260} duration={8000} delay={1200} />
      </View>

      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => step === 1 ? router.back() : setStep(1)}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#0C4A6E" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{step === 1 ? 'Forgot Password' : 'Reset Password'}</Text>
              <Text style={styles.subtitle}>
                {step === 1 
                  ? 'Enter your registered email to receive a secure recovery code' 
                  : `Enter the 6-digit code sent to ${email} and choose a new password`}
              </Text>
            </View>

            <BlurView intensity={90} tint="light" style={styles.glass}>
              {step === 1 ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      placeholder="e.g. name@gmail.com"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#0284C7', '#0EA5E9']}
                      style={styles.buttonGrad}
                    >
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send Recovery Code</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputStack}>
                  <Text style={styles.label}>6-Digit Recovery Code</Text>
                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref: any) => (inputs.current[index] = ref)}
                        style={[styles.codeInput, digit ? styles.codeInputActive : null]}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onChangeText={(text: string) => handleInputChange(text, index)}
                        onKeyPress={(e: any) => handleKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        placeholder="At least 8 characters"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                        secureTextEntry={!showPasswords}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Repeat your new password"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                        secureTextEntry={!showPasswords}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)} style={styles.eyeIcon}>
                        {showPasswords ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.button, { marginTop: 10 }]}
                    onPress={handleReset}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#0284C7', '#0EA5E9']}
                      style={styles.buttonGrad}
                    >
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.resendBtn}
                    onPress={handleSendCode}
                    disabled={loading}
                  >
                    <Text style={styles.resendText}>Didn't get the code? Resend</Text>
                  </TouchableOpacity>
                </View>
              )}
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#0369A1',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
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
  inputStack: { gap: 16 },
  field: { gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    height: 56,
  },
  inputIcon: { marginLeft: 16 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  eyeIcon: { padding: 12 },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  codeInput: {
    width: 42,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(203,213,225,0.5)',
    fontSize: 22,
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
    marginTop: 20,
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
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14,
  },
  successIconBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0C4A6E',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
});
