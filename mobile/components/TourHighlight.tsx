/**
 * TourHighlight — wraps a component with an animated glow border.
 *
 * When active it also calls measureInWindow to report the element's
 * screen-space frame to TourContext so TourOverlay can punch a spotlight
 * hole in the blur/dim overlay — keeping this component visible and unblurred.
 */

import { useRef, useEffect, ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTour } from '../context/TourContext';

interface Props {
  active: boolean;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Corner radius for the glow border — defaults to 16. */
  borderRadius?: number;
}

export default function TourHighlight({ active, children, style, borderRadius = 16 }: Props) {
  const { setSpotlightFrame } = useTour();
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef  = useRef<Animated.CompositeAnimation | null>(null);
  const viewRef  = useRef<View>(null);

  // ── Glow animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    loopRef.current?.stop();
    loopRef.current = null;

    if (active) {
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

    return () => { loopRef.current?.stop(); };
  }, [active, glowAnim]);

  // ── Spotlight measurement ───────────────────────────────────────────────────
  // When this step becomes active, measure the element's window-relative frame
  // and push it into TourContext so the overlay can reveal it unblurred.
  useEffect(() => {
    if (!active) {
      setSpotlightFrame(null);
      return;
    }
    // Small delay: let tab navigation / scroll animations settle first.
    const timer = setTimeout(() => {
      viewRef.current?.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          setSpotlightFrame({ x, y, w, h, r: borderRadius });
        }
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [active, borderRadius, setSpotlightFrame]);

  return (
    <View ref={viewRef} style={style}>
      {children}
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
    borderWidth:   2,
    borderColor:   '#16a34a',
    shadowColor:   '#16a34a',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius:  12,
    elevation:     8,
  },
});
