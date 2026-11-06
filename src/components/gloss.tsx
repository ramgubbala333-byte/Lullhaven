import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, gradients, radii } from '../theme';

// The primary play control: a lamplight-amber glossy disc with a
// breathing halo while sound plays, so the room's one big button
// always shows the state of the night at a glance.
export function PlayButton({
  playing,
  onPress,
  size = 64,
  iconSize = 28,
}: {
  playing: boolean;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}) {
  const halo = useSharedValue(0);
  const press = useSharedValue(1);
  React.useEffect(() => {
    halo.value = playing
      ? withRepeat(withTiming(1, { duration: 2100 }), -1, true)
      : withTiming(0, { duration: 400 });
  }, [playing, halo]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + halo.value * 0.22,
    transform: [{ scale: 1 + halo.value * 0.16 }],
  }));
  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2 },
          haloStyle,
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        onPressIn={() => {
          press.value = withSpring(0.93, { damping: 16, stiffness: 320 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 13, stiffness: 260 });
        }}
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.disc,
            { width: size, height: size, borderRadius: size / 2 },
            discStyle,
          ]}
        >
          <LinearGradient
            colors={gradients.amberButton}
            start={{ x: 0.25, y: 0 }}
            end={{ x: 0.75, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.55 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={iconSize}
            color="#241503"
            style={!playing && { marginLeft: size * 0.05 }}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// Glossy surface kit, in the Hume language: large rounded cards with a
// soft gradient finish, a lit top edge (the "inner glow"), and for the
// active variant a gentle teal halo so what is on feels switched on.

type CardVariant = 'card' | 'active' | 'hero';

const CARD_GRADIENTS: Record<CardVariant, readonly [string, string]> = {
  card: gradients.card,
  active: gradients.cardActive,
  hero: gradients.hero,
};

const CARD_BORDERS: Record<CardVariant, string> = {
  card: 'rgba(233, 228, 214, 0.09)',
  active: 'rgba(62, 214, 197, 0.38)',
  hero: 'rgba(62, 214, 197, 0.22)',
};

export function GlossCard({
  variant = 'card',
  radius = radii.xl,
  style,
  children,
}: {
  variant?: CardVariant;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.cardBase,
        { borderRadius: radius, borderColor: CARD_BORDERS[variant] },
        variant !== 'card' && styles.cardGlow,
        style,
      ]}
    >
      <LinearGradient
        colors={CARD_GRADIENTS[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {/* The lit top edge: a hairline of light, plus a soft sheen wash
          over the top third, like lamplight on glass. */}
      <View
        pointerEvents="none"
        style={[styles.topLight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

// Equaliser bars that breathe while sound plays and settle flat when
// paused: the now-playing card's quiet sign of life.
export function WaveBars({
  playing,
  color = colors.teal,
  height = 22,
}: {
  playing: boolean;
  color?: string;
  height?: number;
}) {
  return (
    <View style={[styles.waveRow, { height }]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <WaveBar key={i} index={i} playing={playing} color={color} max={height} />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  playing,
  color,
  max,
}: {
  index: number;
  playing: boolean;
  color: string;
  max: number;
}) {
  const h = useSharedValue(4);
  React.useEffect(() => {
    if (playing) {
      const peak = max * (0.45 + ((index * 29) % 55) / 100);
      h.value = withRepeat(
        withTiming(peak, { duration: 620 + index * 170 }),
        -1,
        true,
      );
    } else {
      h.value = withTiming(4, { duration: 350 });
    }
  }, [playing, h, index, max]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, style]} />;
}

// Hume's signature control: a smoked-glass pill dock holding
// segments; the chosen segment fills with glossy amber, the rest stay
// quiet glass. Used for the sleep timer and settings choices.
export function SegmentedPills<T extends string | number>({
  options,
  value,
  onPick,
  labelFor,
}: {
  options: readonly T[];
  value: T;
  onPick: (v: T) => void;
  labelFor: (v: T) => string;
}) {
  return (
    <View style={styles.dock}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <TouchableOpacity
            key={String(option)}
            onPress={() => onPick(option)}
            activeOpacity={0.8}
            style={styles.segment}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            {selected && (
              <LinearGradient
                colors={gradients.amberButton}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            )}
            <Animated.Text
              style={[
                styles.segmentLabel,
                { color: selected ? '#241503' : colors.muted },
              ]}
            >
              {labelFor(option)}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(233, 228, 214, 0.12)',
    padding: 5,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentLabel: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13.5,
  },
  halo: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cardBase: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    shadowColor: colors.teal,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  topLight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    zIndex: 2,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3.5,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 4,
  },
});
