import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients } from '../theme';

// The one slider for every volume in the app, rebuilt as a glossy
// instrument: a luminous gradient fill that runs teal into amber, a
// glass thumb with a lit rim, and a soft glow where the fill ends.
//
// It is gesture-driven on purpose. The previous native slider could
// report a value before the user ever touched it (on Android it fired
// on mount), which silently zeroed layers Ram had just added. This
// slider only ever speaks when a finger actually moves it, so a layer
// can never be muted by the act of appearing.

export function VolumeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const widthRef = React.useRef(0);
  const lastSentRef = React.useRef(value);
  // `dragging` is a shared value so the thumb can swell while touched.
  const dragging = useSharedValue(0);
  // While dragging we render from the gesture, not the prop, so the
  // fill never lags a frame behind the finger.
  const dragRatio = useSharedValue(-1);

  const send = React.useCallback(
    (v: number, force = false) => {
      const clamped = Math.min(1, Math.max(0, v));
      if (force || Math.abs(clamped - lastSentRef.current) >= 0.005) {
        lastSentRef.current = clamped;
        onChange(clamped);
      }
    },
    [onChange],
  );

  React.useEffect(() => {
    lastSentRef.current = value;
  }, [value]);

  const ratioFromX = (x: number) => {
    'worklet';
    const w = widthRef.current;
    if (w <= 0) return 0;
    return Math.min(1, Math.max(0, x / w));
  };

  const pan = Gesture.Pan()
    // Claim the gesture only once the finger clearly moves sideways,
    // so vertical page scrolling that starts on a slider still scrolls.
    .activeOffsetX([-6, 6])
    .onBegin((e) => {
      dragging.value = withSpring(1, { damping: 15, stiffness: 300 });
      const r = ratioFromX(e.x);
      dragRatio.value = r;
      runOnJS(send)(r);
    })
    .onUpdate((e) => {
      const r = ratioFromX(e.x);
      dragRatio.value = r;
      runOnJS(send)(r);
    })
    .onEnd((e) => {
      dragging.value = withSpring(0, { damping: 15, stiffness: 300 });
      runOnJS(send)(ratioFromX(e.x), true);
      dragRatio.value = -1;
    })
    .onFinalize(() => {
      dragging.value = withSpring(0, { damping: 15, stiffness: 300 });
      dragRatio.value = -1;
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      const r = ratioFromX(e.x);
      dragRatio.value = r;
      runOnJS(send)(r, true);
      dragRatio.value = -1;
    });

  const fillStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : value;
    return { width: `${Math.min(1, Math.max(0, r)) * 100}%` };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : value;
    return {
      left: `${Math.min(1, Math.max(0, r)) * 100}%`,
      transform: [{ scale: 1 + dragging.value * 0.22 }],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        style={styles.hit}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fillWrap, fillStyle]}>
            <LinearGradient
              colors={gradients.sliderFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fill}
            />
          </Animated.View>
        </View>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <LinearGradient
            colors={['#FFE9BE', colors.accent]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.thumbFace}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: {
    flex: 1,
    // Explicit height + minHeight: as a plain block child (Mix layer
    // cards) flex alone let the area collapse to the track's 7px,
    // which dropped the thumb below the track line.
    height: 40,
    minHeight: 40,
    justifyContent: 'center',
  },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(233, 228, 214, 0.12)',
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 7,
  },
  fill: { flex: 1 },
  thumb: {
    position: 'absolute',
    top: 7,
    width: 26,
    height: 26,
    marginLeft: -13,
    borderRadius: 13,
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  thumbFace: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
