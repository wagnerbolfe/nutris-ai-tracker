const primary = '#298f50';
const primaryDark = '#1e6b3c';

export const Colors = {
  primary,
  primaryDark,
  
  // Base background
  background: '#0F0F1A',
  backgroundGradient: ['#0F0F1A', '#1A0E2E', '#0F1729'] as const,
  
  // Typography
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  inputLabel: '#D1D5DB',
  placeholderText: '#4A4A6A',
  
  // UI Elements
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.1)',
  
  // Input fields
  inputBackground: 'rgba(255, 255, 255, 0.07)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputFocusedBackground: 'rgba(41, 143, 80, 0.08)', // derived from primary #298f50
  
  // Logo
  logoBackground: 'rgba(41, 143, 80, 0.15)', // derived from primary
  logoBorder: 'rgba(41, 143, 80, 0.4)', // derived from primary
  
  // Social Buttons
  googleButtonBackground: 'rgba(255, 255, 255, 0.05)',
  googleButtonBorder: 'rgba(255, 255, 255, 0.15)',
  googleIcon: '#EA4335',
  googleText: '#E5E7EB',
  
  // Errors
  errorBackground: 'rgba(239, 68, 68, 0.15)',
  errorBorder: 'rgba(239, 68, 68, 0.4)',
  errorText: '#FCA5A5',

  // Decorative blobs (adjusted to match green theme)
  blob1: '#1b5e34', // darker green
  blob2: '#164a38', // very dark teal/green
  blob3: primaryDark,
};
