import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';

// A floating glass tab bar, Hume-style: a pill of smoked glass that
// hovers above the bottom of the screen instead of sitting flush in
// a strip.
//
// Safe-area contract (bug fix, Oct 31 2026): the bar's bottom offset
// is the device's bottom inset, the Android navigation bar / iPhone
// home indicator zone, plus a fixed air gap. On Ram's S25 the old
// flush bar rendered inside the system nav strip and its icons
// interleaved with the Android back/home/recents buttons. The bar
// now always floats fully clear of that zone, and tab screens pad
// their scroll content by TAB_BAR_CLEARANCE so nothing hides under
// the floating bar.
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_AIR_GAP = 10;
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_AIR_GAP * 2 + 22;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 0) + TAB_BAR_AIR_GAP;
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: bottomOffset,
            height: TAB_BAR_HEIGHT,
            paddingTop: 7,
            paddingBottom: 7,
            backgroundColor: colors.glass,
            borderRadius: 31,
            borderWidth: 1,
            borderTopWidth: 1,
            borderColor: 'rgba(233, 228, 214, 0.14)',
            borderTopColor: 'rgba(255, 255, 255, 0.20)',
            shadowColor: '#000000',
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 16,
          },
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
            // Explicit line height: without it the web text box
            // collapses around the glyphs and the labels clip.
            lineHeight: 15,
            marginTop: 1,
          },
          tabBarIconStyle: { marginTop: 1 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Sounds',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                color={color as string}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mixer"
          options={{
            title: 'Mix',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'options' : 'options-outline'}
                color={color as string}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="presets"
          options={{
            title: 'Scenes',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'bookmarks' : 'bookmarks-outline'}
                color={color as string}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                color={color as string}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
