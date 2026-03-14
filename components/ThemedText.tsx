import React from 'react';
import { Text as NativeText, TextProps, StyleSheet } from 'react-native';

interface ThemedTextProps extends TextProps {
  weight?: '400' | '500' | '600' | '700' | '800';
}

export function Text({ style, weight = '400', ...props }: ThemedTextProps) {
  let fontFamily = 'Inter_400Regular';

  switch (weight) {
    case '500':
      fontFamily = 'Inter_500Medium';
      break;
    case '600':
      fontFamily = 'Inter_600SemiBold';
      break;
    case '700':
      fontFamily = 'Inter_700Bold';
      break;
    case '800':
      fontFamily = 'Inter_800ExtraBold';
      break;
  }

  // React Native automatically merges styles. 
  // Custom fontWeight in `style` will override the font family behavior if not careful,
  // but this is the simplest global approach.
  return (
    <NativeText 
      style={[{ fontFamily }, style]} 
      {...props} 
    />
  );
}
