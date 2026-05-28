/**
 * TourHighlight — wraps a component with an animated glow border.
 *
 * ARCHITECTURE
 * ────────────
 * The glow is an absoluteFillObject View layered ON TOP of children.
 * Positioning is purely local — no window coordinates, no measurement,
 * no overlay portals.  Works correctly inside ScrollViews, nested layouts,
 * and on any Android device regardless of status-bar or inset behaviour.
 *
 * ANIMATION
 * ─────────
 * active=true  → fade in over 350 ms, then pulse between 45% and 100% opacity
 * active=false → fade out over 250 ms
 * Uses useNativeDriver:true (opacity only) for smooth 60 fps on both platforms.
 */

import { useRef, useEffect, ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

interface Props {
  active: boolean;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Corner radius for the glow border — defaults to 16. */
  borderRadius?: number;
}

export default function TourHighlight({ active, children, style, borderRadius = 16 }: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Stop any running loop before starting a new animation
    loopRef.current?.stop();
    loopRef.current = null;

    if (active) {
      // Fade in, then begin the pulse loop
      Animated.timing(glowAnim, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        loopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.45, duration: 950, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 1,    duration: 950, useNativeDriver: true }),
          ])
        );
        loopRef.current.start();
      });
    } else {
      Animated.timing(glowAnim, {
        toValue: 0, duration: 250, useNativeDriver: true,
      }).start();
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [active, glowAnim]);

  return (
    <View style={style}>
      {children}
      {/*
       * The overlay is an Animated.View with the glow border.
       * absoluteFillObject (top:0 left:0 right:0 bottom:0) fills the parent
       * exactly — no coordinate calculation required.
       * pointerEvents="none" so taps fall through to the wrapped component.
       */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          s.glowBorder,
          { borderRadius, opacity: glowAnim },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  glowBorder: {
    borderWidth:  2,
    borderColor:  '#16a34a',
    // Static shadow — visible once the overlay fades in (shadow is not animated,
    // only opacity is, which keeps the native driver path clean).
    shadowColor:  '#16a34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius:  10,
    elevation:     6,
  },
});
