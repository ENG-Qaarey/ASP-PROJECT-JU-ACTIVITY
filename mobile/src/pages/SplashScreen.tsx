import React from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  useDerivedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedView = Animated.createAnimatedComponent(View);

// Premium Cinematic Background - Variety of unique "Flying Things"
function FlyingParticle({ index }: { index: number }) {
  const size = index % 3 === 0 ? Math.random() * 100 + 80 : Math.random() * 40 + 20;
  const tX = useSharedValue(Math.random() * SCREEN_WIDTH);
  const tY = useSharedValue(Math.random() * SCREEN_HEIGHT);
  const scale = useSharedValue(Math.random() * 0.5 + 0.8);
  const opacity = useSharedValue(Math.random() * 0.2 + 0.05);
  const rotation = useSharedValue(0);
  
  const colors = ['#0EA5E9', '#7DD3FC', '#F0F9FF', '#BAE6FD', '#38BDF8'];
  const particleColor = colors[index % colors.length];

  React.useEffect(() => {
    // Unique float for each thing
    tX.value = withRepeat(withTiming(Math.random() * SCREEN_WIDTH, { duration: Math.random() * 15000 + 15000, easing: Easing.inOut(Easing.sin) }), -1, true);
    tY.value = withRepeat(withTiming(Math.random() * SCREEN_HEIGHT, { duration: Math.random() * 15000 + 15000, easing: Easing.inOut(Easing.sin) }), -1, true);
    
    // Constant rotation for shards and stars
    if (index % 2 !== 0) {
        rotation.value = withRepeat(withTiming(360, { duration: Math.random() * 20000 + 10000, easing: Easing.linear }), -1, false);
    }

    scale.value = withRepeat(withTiming(1.2, { duration: Math.random() * 5000 + 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tX.value - size / 2 },
      { translateY: tY.value - size / 2 },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  const renderShape = () => {
    const type = index % 4;
    switch(type) {
        case 0: // Soft Glowing Orb
            return <View style={{ flex: 1, backgroundColor: particleColor, borderRadius: size / 2, shadowColor: particleColor, shadowRadius: 30, shadowOpacity: 0.2 }} />;
        case 1: // Hollow Floating Ring
            return <View style={{ flex: 1, borderWidth: 2, borderColor: particleColor, borderRadius: size / 2, opacity: 0.6 }} />;
        case 2: // Sparkling Star/Diamond
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ position: 'absolute', width: '100%', height: 2, backgroundColor: '#FFFFFF' }} />
                    <View style={{ position: 'absolute', width: 2, height: '100%', backgroundColor: '#FFFFFF' }} />
                </View>
            );
        case 3: // Floating Glass Shard/Triangle
            return (
                <View style={{ 
                    width: 0, height: 0, backgroundColor: 'transparent',
                    borderLeftWidth: size / 2, borderLeftColor: 'transparent',
                    borderRightWidth: size / 2, borderRightColor: 'transparent',
                    borderBottomWidth: size, borderBottomColor: particleColor + '40'
                }} />
            );
        default: return null;
    }
  };

  return (
    <AnimatedView style={[{ position: 'absolute', width: size, height: size }, particleStyle as any]}>
        {renderShape()}
    </AnimatedView>
  );
}

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading } = useAuth();

  const contentTranslateY = useSharedValue(40);
  const contentOpacity = useSharedValue(0.01); // Higher base for Android stability
  const progressLine = useSharedValue(0);
  const textFloating = useSharedValue(0);

  // Auto-redirect logic (10s cinematic hold)
  React.useEffect(() => {
    if (!loading) {
        const timer = setTimeout(() => {
            if (user) {
                const role = user.role || 'student';
                const target = role === 'admin' ? '/(admin)/dashboard' : 
                             role === 'coordinator' ? '/(coordinator)/dashboard' : 
                             '/(student)/home';
                router.replace(target as any);
            } else {
                router.replace('/login' as any);
            }
        }, 10000);
        return () => clearTimeout(timer);
    }
  }, [user, loading]);

  React.useEffect(() => {
    // Smoother Entrances (Slower for Cinematic feel)
    contentTranslateY.value = withTiming(0, { duration: 2500, easing: Easing.out(Easing.exp) });
    contentOpacity.value = withTiming(1, { duration: 2000 });
    
    // Constant Progress
    progressLine.value = withTiming(1, { duration: 10000, easing: Easing.linear });

    // Rhythmic Floating for Branding
    textFloating.value = withRepeat(
        withTiming(-12, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
    );
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value + textFloating.value }],
    opacity: contentOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressLine.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background Gradient - Direct Layer */}
      <LinearGradient
        colors={['#BAE6FD', '#FFFFFF', '#BAE6FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cinematic Busy Particles Background (40 particles) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(40)].map((_, i) => (
            <FlyingParticle key={i} index={i} />
        ))}
      </View>

      <View style={[styles.content, { marginTop: insets.top }]}>
        <AnimatedView 
            style={[styles.textContainer as any, contentStyle]}
            collapsable={false}
        >
          <Text style={styles.appName}>JU-AMS</Text>
          <Text style={styles.tagline}>Excellence in Activity Management</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
                Empowering Jazeera University students with a seamless, digital campus life experience.
            </Text>
          </View>
        </AnimatedView>
      </View>

      <View style={[styles.progressFooter, { marginBottom: Math.max(insets.bottom, 40) }]}>
          <View style={styles.progressContainer}>
              <View style={[styles.progressBase, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <AnimatedView style={[styles.progressFill as any, progressStyle]} />
              </View>
              <Text style={styles.loadingText}>Initializing Secure Session...</Text>
          </View>

          <AnimatedView 
            style={[styles.footer as any, contentStyle]}
            collapsable={false}
          >
            <Text style={styles.footerBranding}>v1.0.0 • POWERED BY ENG-QAAREY</Text>
          </AnimatedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#BAE6FD' 
  },
  particleBase: { 
    position: 'absolute', 
    width: 3.5, 
    height: 3.5, 
    borderRadius: 2,
    zIndex: 1,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40, 
    zIndex: 10 
  },
  textContainer: { 
    alignItems: 'center' 
  },
  appName: {
    fontSize: SCREEN_WIDTH > 400 ? 64 : 54,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: -2,
    marginBottom: 4,
    // Cross-platform consistent shadow
    textShadowColor: 'rgba(3, 105, 161, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0EA5E9',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  descriptionBox: {
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    // Consistent box shadow
    shadowColor: '#00000012',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3, // Android fallback
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  progressFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 60,
    alignItems: 'center',
    zIndex: 20,
  },
  progressBase: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  loadingText: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: { 
    paddingHorizontal: 40, 
    marginTop: 32, 
    alignItems: 'center', 
    zIndex: 10 
  },
  footerBranding: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 2,
  },
});
