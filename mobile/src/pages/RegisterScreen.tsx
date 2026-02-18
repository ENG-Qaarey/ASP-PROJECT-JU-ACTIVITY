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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { client } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/src/context/ToastContext';
import { Mail, Lock, User, CreditCard, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

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

/**
 * Render the registration screen with animated background orbs and a glass-styled form.
 *
 * The form collects full name, student ID, Gmail address, password, and password confirmation.
 * It validates required fields, enforces that the email ends with `@gmail.com`, and enforces password
 * complexity (minimum 8 chars, uppercase, lowercase, number, and special char). On successful
 * validation the component submits the registration to the API, stores the returned access token
 * and current user when present, and navigates to the appropriate route; errors are displayed
 * inline or via toast messages.
 *
 * @returns A React element representing the registration screen.
 */
export default function Register() {
  const { showToast } = useToast();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  const nameRef = useRef<any>(null);
  const studentIdRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);
  
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const [focused, setFocused] = useState<string | null>(null);

  const handleRegister = async () => {
      setSubmitted(true);
      setError('');

      if (!name.trim()) {
          nameRef.current?.focus();
          showToast({ message: 'Please enter your name', type: 'error', duration: 3000 });
          return;
      }
      if (!studentId.trim()) {
          studentIdRef.current?.focus();
          showToast({ message: 'Please enter your student ID', type: 'error', duration: 3000 });
          return;
      }
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

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
          passwordRef.current?.focus();
          showToast({ message: 'Password must meet complexity requirements', type: 'error', duration: 4000 });
          return;
      }
      
      if (!confirmPassword.trim()) {
          confirmPasswordRef.current?.focus();
          showToast({ message: 'Please confirm your password', type: 'error', duration: 3000 });
          return;
      }

      if (password !== confirmPassword) {
          confirmPasswordRef.current?.focus();
          setError("Passwords don't match");
          return;
      }
      
      setLoading(true);
      try {
          // Real API Call
          const response = await client.post(ENDPOINTS.AUTH.REGISTER, { 
              name, 
              email, 
              password,
              studentId // Assuming backend accepts this field or logic handles it
          }, true);

          if (response && response.success) {
              showToast({ message: 'Registration successful! Please verify your email.', type: 'success' });
              router.push({
                pathname: '/verify-email',
                params: { email }
              });
          } else {
              // If backend just returns success: true without token, redirect to login
              router.push('/login');
          }
      } catch (err: any) {
          console.log('Registration error:', err);
          setError(err.message || 'Registration failed. Please try again.');
      } finally {
          setLoading(false);
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
            {/* ... (Header) ... */}
            
            {/* GLASS CARD */}
            <BlurView intensity={80} tint="light" style={styles.glass}>
              <View style={styles.glassBorder} />

              <Label text="Full Name" />
              <Input
                ref={nameRef}
                icon={User}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                focused={focused === 'name'}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                error={submitted && !name.trim()}
                returnKeyType="next"
                onSubmitEditing={() => studentIdRef.current?.focus()}
              />

              <Label text="Student ID" />
              <Input
                ref={studentIdRef}
                icon={CreditCard}
                placeholder="Enter your student ID"
                value={studentId}
                onChangeText={setStudentId}
                focused={focused === 'id'}
                onFocus={() => setFocused('id')}
                onBlur={() => setFocused(null)}
                error={submitted && !studentId.trim()}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <Label text="Email Address" />
              <Input
                ref={emailRef}
                icon={Mail}
                placeholder="yourname@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                error={submitted && (!email.trim() || !email.endsWith('@gmail.com'))}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Label text="Password" />
              <Input
                ref={passwordRef}
                icon={Lock}
                isPassword
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                error={submitted && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />

              <Label text="Confirm Password" />
              <Input
                ref={confirmPasswordRef}
                icon={ShieldCheck}
                isPassword
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                focused={focused === 'confirm'}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                error={submitted && !confirmPassword.trim()}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              <Text style={styles.hint}>
                Must be at least 8 chars with uppercase, lowercase, number & special char (@$!%*?&)
              </Text>

              {error ? (
                <View style={[styles.errorBox, { marginTop: 10 }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                activeOpacity={0.9}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#0284C7', '#0EA5E9']}
                  style={styles.buttonGrad}
                >
                  <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Register'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.linkText}>Sign In</Text>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0C4A6E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#0369A1',
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
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
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
    marginTop: 26,
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