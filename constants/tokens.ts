// Design System Tokens — "The Nocturnal Sanctuary"
// From DESIGN.md — Vesper Witness

export const Colors = {
  // Surface hierarchy — tonal layering (no border lines)
  surface: '#121416',
  surfaceDim: '#121416',
  surfaceContainerLowest: '#0c0e10',
  surfaceContainerLow: '#1a1c1e',
  surfaceContainer: '#1e2022',
  surfaceContainerHigh: '#282a2c',
  surfaceContainerHighest: '#333537',
  surfaceBright: '#37393b',
  surfaceVariant: '#333537',
  surfaceTint: '#fabd00',

  // Primary — amber (signature gradient)
  primary: '#fabd00',
  primaryContainer: '#1c1200',
  onPrimary: '#3f2e00',
  onPrimaryContainer: '#a07800',
  primaryFixed: '#ffdf9e',
  primaryFixedDim: '#fabd00',
  inversePrimary: '#785900',

  // Secondary — muted teal (calm/relief)
  secondary: '#66d9cc',
  secondaryContainer: '#1ea296',
  onSecondary: '#003732',
  onSecondaryContainer: '#00302b',
  secondaryFixed: '#84f5e8',
  secondaryFixedDim: '#66d9cc',

  // Tertiary — muted blue-grey (metadata)
  tertiary: '#b1cad7',
  tertiaryContainer: '#00161f',
  onTertiary: '#1c333e',
  onTertiaryContainer: '#6a828d',
  tertiaryFixed: '#cde6f4',
  tertiaryFixedDim: '#b1cad7',

  // Surface text
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c6c6ca',
  onBackground: '#e2e2e5',
  background: '#121416',

  // Outline
  outline: '#8f9094',
  outlineVariant: '#45474a',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // Inverse
  inverseSurface: '#e2e2e5',
  inverseOnSurface: '#2f3133',
};

// Mood colors — for calendar dots, tags, filters
export const MoodColors = {
  heavy: '#a855f7',     // purple
  hopeful: '#66d9cc',   // teal
  angry: '#fb7185',     // coral
  calm: '#fabd00',      // amber
  confused: '#93c5fd',  // blue
  numb: '#6b7280',      // gray
  grateful: '#4ade80',  // green
};

export const MoodLabels = ['heavy', 'hopeful', 'angry', 'calm', 'confused', 'numb', 'grateful'] as const;
export type Mood = typeof MoodLabels[number];

// Typography
export const FontFamily = {
  headline: 'Manrope_700Bold',
  headlineXBold: 'Manrope_800ExtraBold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

// Border radius — "Softened Touch" (huggable, safe)
export const Radius = {
  sm: 8,
  md: 12,
  default: 16,   // 1rem
  lg: 32,        // 2rem
  xl: 48,        // 3rem
  full: 9999,
};

// Shadows — Amber Aura (soft glow, not harsh drop shadow)
export const Shadows = {
  amberAura: {
    shadowColor: '#fabd00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  amberFab: {
    shadowColor: '#fabd00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 48,
    elevation: 12,
  },
};

// Animation — "Viscous" transitions
export const Animation = {
  viscous: {
    duration: 500,
    easing: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  slow: {
    duration: 700,
    easing: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
};
