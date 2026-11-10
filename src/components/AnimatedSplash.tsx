import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onAnimationFinish }: { onAnimationFinish: () => void }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(1);

  useEffect(() => {
    // Logo entrance animation
    SplashScreen.hideAsync().catch(() => {});
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    // Sound waves ripple effect loop
    waveScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false
    );

    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false
    );

    // Timer to finish splash and show main app (e.g., after 2 seconds)
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Expanding Sound Wave Ring */}
      <Animated.View style={[styles.waveCircle, waveAnimatedStyle]} />
      <Animated.View style={[styles.waveCircle, styles.secondWave, waveAnimatedStyle]} />

      {/* Center Ear Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image 
          source={require('@/assets/images/ear-logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19', // Blinkit style dark background
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 999,
  },
  waveCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#00d2ff', // Matching blue ear accent color
  },
  secondWave: {
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
});