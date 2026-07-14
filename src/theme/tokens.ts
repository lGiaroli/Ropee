import { ColorSchemeName } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 14,
  pill: 999,
};

export const typography = {
  family: undefined,
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 30,
    hero: 54,
  },
};

export const lightColors = {
  background: '#F7F5FF',
  surface: '#FFFFFF',
  surfaceStrong: '#EEE9FF',
  text: '#171427',
  textMuted: '#706B84',
  border: '#E7E0F8',
  primary: '#6F5BFF',
  primaryDark: '#4F3DDA',
  accent: '#FFB45F',
  danger: '#FF5B6E',
  rest: '#64B8FF',
  jump: '#31D083',
  strength: '#A45CFF',
  warning: '#F2903D',
  chartA: '#31D083',
  chartB: '#64B8FF',
  chartC: '#FFB45F',
  chartD: '#A45CFF',
};

export const darkColors = {
  background: '#0F1512',
  surface: '#18221D',
  surfaceStrong: '#223328',
  text: '#F4FFF7',
  textMuted: '#A7B5AB',
  border: '#334238',
  primary: '#35E58D',
  primaryDark: '#1AAD69',
  accent: '#FFC05A',
  danger: '#FF7A73',
  rest: '#69A7FF',
  jump: '#35E58D',
  strength: '#CE89FF',
  warning: '#FFAA52',
  chartA: '#35E58D',
  chartB: '#69A7FF',
  chartC: '#FFC05A',
  chartD: '#CE89FF',
};

export const colorsForScheme = (scheme: ColorSchemeName) =>
  scheme === 'dark' ? darkColors : lightColors;
