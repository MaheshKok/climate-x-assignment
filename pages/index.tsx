/**
 * Asset Management System - Main Page
 * Integrates file upload and asset display components
 */

import { AttachmentIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import Head from 'next/head';
import { useState } from 'react';

import AssetList from '../src/components/AssetList';
import FileUpload from '../src/components/FileUpload';
import { Asset } from '../src/types/asset';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const toast = useToast();

  const handleUploadSuccess = (_assets: Asset[]) => {
    // Refresh the asset list (toast is handled by FileUpload component)
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadError = (_error: string) => {
    // Error toast is handled by FileUpload component
    // Just refresh if needed or handle other side effects
  };

  const handleAssetSelect = (asset: Asset) => {
    // Could open a modal or navigate to detailed view
    toast({
      title: 'Asset selected',
      description: `Selected asset at ${asset.address}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <>
      <Head>
        <title>Asset Management System</title>
        <meta
          name='description'
          content='Next.js asset management system with file upload and display capabilities'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box minH='100vh' bg='gray.50'>
        <Container maxW='7xl' py={8}>
          <VStack spacing={8} align='stretch'>
            {/* Header */}
            <Box textAlign='center' py={6}>
              <Heading
                as='h1'
                size='2xl'
                fontWeight='bold'
                bgGradient='linear(to-r, blue.400, blue.600)'
                bgClip='text'
                mb={4}
              >
                Asset Management System
              </Heading>
              <Text fontSize='lg' color='gray.600' maxW='2xl' mx='auto'>
                Upload asset data via CSV or JSON files and view them in a clean interface. Each
                asset contains an address, latitude, and longitude
              </Text>
            </Box>

            <Divider />

            {/* Main Content */}
            <Tabs variant='enclosed' colorScheme='blue'>
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={AttachmentIcon} />
                    <Text>Upload Assets</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={ViewIcon} />
                    <Text>View Assets</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Upload Tab */}
                <TabPanel px={0} py={6}>
                  <VStack spacing={6} align='stretch'>
                    <Box>
                      <Heading size='lg' mb={2}>
                        Upload Asset Data
                      </Heading>
                      <Text color='gray.600' mb={4}>
                        Upload CSV or JSON files containing asset data with address, latitude, and
                        longitude. Include your Company ID to organize assets by company.
                      </Text>
                      <HStack spacing={4} flexWrap='wrap'>
                        <Badge colorScheme='blue' p={2}>
                          CSV Files Only
                        </Badge>
                        <Badge colorScheme='green' p={2}>
                          JSON Files Only
                        </Badge>
                      </HStack>
                    </Box>

                    <FileUpload
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </VStack>
                </TabPanel>

                {/* Assets List Tab */}
                <TabPanel px={0} py={6}>
                  <VStack spacing={6} align='stretch'>
                    <Box>
                      <Flex justify='space-between' align='start' mb={4}>
                        <Box>
                          <Heading size='lg' mb={2}>
                            Your Assets
                          </Heading>
                          <Text color='gray.600'>
                            Browse, search, and manage your uploaded assets with advanced filtering
                            options.
                          </Text>
                        </Box>
                      </Flex>
                    </Box>

                    <AssetList onAssetSelect={handleAssetSelect} refreshTrigger={refreshTrigger} />
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Footer */}
            <Divider />
            <Box textAlign='center' py={4}>
              <Text fontSize='sm' color='gray.500'>
                Asset Management System - Built with Next.js, TypeScript, and Chakra UI
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    </>
  );
}
