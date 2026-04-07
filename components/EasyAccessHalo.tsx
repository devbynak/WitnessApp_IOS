import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, FontFamily, Animation } from '../constants/tokens';

const { width } = Dimensions.get('window');

const ACTIONS = [
  { icon: '🕊️', label: 'Grief', route: '/grief-mode', color: '#a855f7' },
  { icon: '✉️', label: 'Unsent', route: '/unsent-letter', color: '#fabd00' },
  { icon: '🎥', label: 'Video', route: '/record', color: '#fabd00' },
  { icon: '🎙️', label: 'Voice', route: '/record?isVoiceOnly=true', color: '#66d9cc' },
];

export function EasyAccessHalo() {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(animation, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const navigate = (route: string) => {
    toggle();
    // Delay slightly for animation to feel "viscous"
    setTimeout(() => {
       if (route.includes('?')) {
        const [path, query] = route.split('?');
        const params = Object.fromEntries(new URLSearchParams(query));
        router.push({ pathname: path as any, params });
      } else {
        router.push(route as any);
      }
    }, 300);
  };

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      {isOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={toggle}
        >
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </Pressable>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer} pointerEvents="box-none">
        {ACTIONS.map((action, index) => {
          const rotate = animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${(index - (ACTIONS.length - 1) / 2) * 45}deg`],
          });

          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -100],
          });

          const scale = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.4, 1],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionItem,
                {
                  opacity: animation,
                  transform: [
                    { translateY },
                    { scale },
                  ],
                },
              ]}
            >
              <Pressable
                style={styles.actionButton}
                onPress={() => navigate(action.route)}
              >
                <View style={[styles.actionIconBg, { borderColor: action.color + '40' }]}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Main Toggle Button */}
      <Pressable onPress={toggle} style={styles.mainToggle}>
        <Animated.View
          style={[
            styles.halo,
            {
              transform: [
                {
                  rotate: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
                {
                   scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.9],
                  }),
                }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.primary, '#a07800']}
            style={styles.haloGradient}
          >
             <Text style={styles.haloIcon}>+</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// I need LinearGradient from expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainToggle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    ...Shadows.amberFab,
  },
  halo: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  haloGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloIcon: {
    fontSize: 32,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headline,
    marginTop: -2,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 120,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.amberAura,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
