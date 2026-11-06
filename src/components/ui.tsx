import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StyleSheet,
  Text,
  type TextProps,
  TouchableOpacity,
  View,
  type ViewProps,
} from 'react-native';
import { colors, fonts, gradients, radii, spacing } from '../theme';

export function Display({
  style,
  maxFontSizeMultiplier = 1.3,
  ...props
}: TextProps) {
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[styles.display, style]}
    />
  );
}

export function Body({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function Caption({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.caption, style]} />;
}

export function SectionHeading({
  children,
  style,
}: {
  children: string;
  style?: TextProps['style'];
}) {
  return (
    <Text style={[styles.sectionHeading, style]}>{children.toUpperCase()}</Text>
  );
}

export function Hairline({ style }: { style?: ViewProps['style'] }) {
  return <View style={[styles.hairline, style]} />;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <LinearGradient
        colors={gradients.amberButton}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.pill }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.pill }]}
      />
      <Text style={styles.primaryButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.ghostButton}>
      <Text style={[styles.ghostButtonLabel, danger && { color: colors.danger }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
  },
  sectionHeading: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    letterSpacing: 1.6,
    color: colors.faint,
    marginBottom: spacing.sm,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  primaryButton: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: '#1A1206',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: colors.glass,
  },
  ghostButtonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkSoft,
  },
});
