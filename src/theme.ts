// Lullhaven theme: a dark, quiet room at night, redesigned Oct 31 2026
// in the language of Hume (Phenomenon Studio's smart-home app): soft
// dark surfaces, large rounded glossy cards with gradient finishes and
// gentle inner glow, pill controls, and two luminous accents, warm
// amber lamplight and deep-sea teal, over a deep pine base.
// Type stays Fraunces + Archivo: the serif wordmark moments are this
// app's version of Hume's big friendly typography.

export const colors = {
  bg: '#081713',
  bgDeep: '#05100D',
  surface: '#0D231C',
  surfaceRaised: '#123025',
  ink: '#E9E4D6',
  inkSoft: '#CFC9B8',
  muted: '#93A89C',
  faint: '#5F7A6E',
  accent: '#D9932E',
  accentSoft: 'rgba(217, 147, 46, 0.16)',
  hairline: 'rgba(233, 228, 214, 0.13)',
  hairlineSoft: 'rgba(233, 228, 214, 0.07)',
  danger: '#C4553B',
  // Luminous teal: the second accent, for active/glowing states.
  teal: '#3ED6C5',
  tealDeep: '#0E5F57',
  tealSoft: 'rgba(62, 214, 197, 0.14)',
  amberLight: '#F2B95C',
  // Glassy floating surfaces (tab bar, chips on imagery).
  glass: 'rgba(16, 42, 33, 0.88)',
  sheen: 'rgba(255, 255, 255, 0.08)',
};

// Gradient finishes for the glossy cards and buttons. expo-linear-
// gradient takes these as readonly tuples.
export const gradients = {
  // Resting card: a soft top-lit pine.
  card: ['#153629', '#0B2019'] as const,
  // Active card: teal-washed, gently lit from within.
  cardActive: ['#1B5643', '#0C2A20'] as const,
  // The now-playing hero: the deepest glow on the screen.
  hero: ['#1C5340', '#081C14'] as const,
  // Primary amber button, lamplight gloss.
  amberButton: ['#F2BC5E', '#D9932E'] as const,
  // Teal pill / toggle-on finish.
  tealButton: ['#55E3D0', '#15A48D'] as const,
  // Slider fill: teal running into amber at the thumb.
  sliderFill: ['#2BBFA9', '#D9932E'] as const,
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayLight: 'Fraunces_400Regular',
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodySemi: 'Archivo_600SemiBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};
