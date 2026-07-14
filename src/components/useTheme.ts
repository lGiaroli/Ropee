import { useColorScheme } from 'react-native';
import { colorsForScheme } from '@/theme/tokens';

export const useTheme = () => {
  const scheme = useColorScheme();
  return {
    scheme,
    colors: colorsForScheme(scheme),
  };
};
