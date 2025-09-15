import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
};

const colors = {
  brand: {
    50: '#e3f2ff',
    100: '#b3d4ff',
    200: '#81b5ff',
    300: '#4e96ff',
    400: '#1c78ff',
    500: '#035fe6',
    600: '#0049b4',
    700: '#003381',
    800: '#001d4f',
    900: '#00071f',
  },
};

const components = {
  Button: {
    baseStyle: {
      borderRadius: 'lg',
      fontWeight: 'semibold',
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      textTransform: 'none',
    },
  },
  Tabs: {
    variants: {
      modern: (props: Record<string, unknown>) => ({
        tab: {
          _selected: {
            color: mode('brand.600', 'brand.300')(props),
            bg: mode('brand.50', 'gray.700')(props),
            fontWeight: 'semibold',
          },
          _focusVisible: {
            boxShadow: 'none',
          },
        },
      }),
    },
  },
};

export const theme = extendTheme({ config, fonts, colors, components });
