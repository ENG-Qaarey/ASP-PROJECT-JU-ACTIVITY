import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import React, { useEffect, useRef, useState } from 'react';
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
  StatusBar,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

const { width, height } = Dimensions.get('window');

import { Mail, Lock, User, SquareUser, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';

/* ---------------- Floating Orb ---------------- */
function FloatingOrb({ size, x, y, duration, delay }: any) {
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
    />
  );
}

  export default function Login() {
  const { refreshTheme } = useTheme();
  const { setUser, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ---------------- LOGIN LOGIC ---------------- */
  const handleLogin = async () => {
    setSubmitted(true);
    setError('');

    // Sequential Field Validation & Focus
    if (!email.trim()) {
      emailRef.current?.focus();
      showToast({ message: 'Please enter your email', type: 'error', duration: 3000 });
      return;
    }
    if (!email.trim().endsWith('@gmail.com')) {
      emailRef.current?.focus();
      showToast({ message: 'Email must be a @gmail.com address', type: 'error', duration: 3000 });
      return;
    }
    if (!password.trim()) {
      passwordRef.current?.focus();
      showToast({ message: 'Please enter your password', type: 'error', duration: 3000 });
      return;
    }

    const loginSuccess = async (target: string, userEmail: string) => {
      showToast({ message: 'Login successful! Welcome back.', type: 'success' });
      const now = new Date().toLocaleString();
      await AsyncStorage.setItem('last_login', now);
      await AsyncStorage.setItem('current-user', userEmail);
      await refreshTheme();
      router.push(target as any);
    };

    try {
      // Real API Call
      const response = await client.post(ENDPOINTS.AUTH.LOGIN, { email, password }, true);
      console.log('Login success:', response);
      
      if (response && response.token) {
          await AsyncStorage.setItem('user_token', response.token);
          
          // Update global auth state before navigating
          if (response.user) {
              setUser(response.user);
          } else {
              await refreshProfile();
          }
          
          const role = response.user?.role || 'student';
          
          if (role === 'admin') await loginSuccess('/(admin)/dashboard', email);
          else if (role === 'coordinator') await loginSuccess('/(coordinator)/dashboard', email);
          else await loginSuccess('/(student)/home', email);
      } else {
          showToast({ message: 'Invalid server response', type: 'error' });
      }
    } catch (err: any) {
      console.log('API Login failed:', err.message);
      showToast({ 
        message: err.message || 'Invalid email or password', 
        type: 'error',
        duration: 4000
      });
      // Set secondary internal error for input highlighting if needed
      setError(err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* BACKGROUND */}
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />

      {/* FLOATING ORBS */}
      <View style={StyleSheet.absoluteFill}>
        <FloatingOrb size={300} x={-120} y={-120} duration={6000} delay={0} />
        <FloatingOrb size={260} x={width - 140} y={height / 3} duration={7000} delay={600} />
        <FloatingOrb size={360} x={-80} y={height - 260} duration={8000} delay={1200} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: slide }],
            }}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>JU-AMS</Text>
              <Text style={styles.subtitle}>
                Jazeera University Activity Management System
              </Text>
            </View>

            {/* GLASS CARD */}
            <BlurView intensity={80} tint="light" style={styles.glass}>
              <View style={styles.glassBorder} />

              <Label text="Email Address" />
              <Input
                ref={emailRef}
                icon={Mail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t: string) => {
                  setEmail(t);
                  if (submitted) setError('');
                }}
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                error={submitted && !email.trim()}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Label text="Password" />
              <Input
                ref={passwordRef}
                icon={Lock}
                isPassword
                placeholder="Enter your password"
                value={password}
                onChangeText={(t: string) => {
                  setPassword(t);
                  if (submitted) setError('');
                }}
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                error={submitted && !password.trim()}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity 
                style={{ alignSelf: 'flex-end', marginTop: 12, marginBottom: 4 }}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={{ color: '#0284C7', fontWeight: '700', fontSize: 13 }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#0284C7', '#0EA5E9']}
                  style={styles.buttonGrad}
                >
                  <Text style={styles.buttonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New Student? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.linkText}>Register Now</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const Input = React.forwardRef(({ focused, error, icon: Icon, isPassword, ...props }: any, ref: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[
      styles.inputContainer, 
      focused && styles.inputFocused,
      error && styles.inputError
    ]}>
      {Icon && <Icon size={20} color={error ? '#EF4444' : (focused ? '#0EA5E9' : '#94A3B8')} style={styles.inputIcon} />}
      <TextInput
        {...props}
        ref={ref}
        secureTextEntry={isPassword ? !showPassword : props.secureTextEntry}
        style={styles.input}
        placeholderTextColor="#94A3B8"
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          {showPassword ? (
            <EyeOff size={20} color="#64748B" />
          ) : (
            <Eye size={20} color="#64748B" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
});

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0C4A6E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#0369A1',
    textAlign: 'center',
    fontWeight: '600',
  },
  glass: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C4A6E',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.3)',
    marginBottom: 0,
  },
  inputFocused: {
    borderColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 4,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  inputIcon: {
    marginLeft: 14,
  },
  eyeIcon: {
    padding: 10,
    marginRight: 4,
  },
  errorBox: {
    marginTop: 14,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    marginTop: 28,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#64748B',
  },
  linkText: {
    color: '#0284C7',
    fontWeight: '800',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
});
