export const LIGHT_COLORS = {
  primary: '#051923',     // Deep Obsidian (Structural)
  secondary: '#C5A059',   // Imperial Gold (Action)
  background: '#F9F8F6',  // Silk Ivory (Clean Canvas)
  text: '#051923',        // High Contrast Obsidian
  textSecondary: '#4A5568',
  white: '#FFFFFF',
  cardBackground: '#FFFFFF',
  gray: '#EDF2F7',
  shadow: '#000000',
  success: '#10B981',
  error: '#EF4444',
  star: '#F59E0B',
  border: '#E2E8F0',
};

export const DARK_COLORS = {
  primary: '#C5A059',      // Imperial Gold (Primary Highlight)
  secondary: '#051923',    // Deep Obsidian (Supporting)
  background: '#050B10',   // Midnight Void
  text: '#F9F8F6',         // Silk Ivory (High Contrast)
  textSecondary: '#94A3B8',
  white: '#1A202C',
  cardBackground: '#121926',
  gray: '#2D3748',
  shadow: '#000000',
  success: '#10B981',
  error: '#EF4444',
  star: '#C5A059',
  border: '#2D3748',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  radius_sm: 8,
  radius_md: 16,
  radius_lg: 20,
  radius_xl: 24,
};

export const SHADOWS = {
  small: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  light: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heavy: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};
