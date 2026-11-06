import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

// Caps content width and centers it, so nothing stretches edge to
// edge on tablets. Same pattern as Mistless.
export function MaxWidth({ children, style }: ViewProps) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
  },
});
