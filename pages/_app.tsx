/**
 * Next.js App Component
 * Chakra UI provider and global configuration
 */

import { ChakraProvider } from '@chakra-ui/react';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
