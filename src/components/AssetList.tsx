/**
 * Asset List Component
 * Display assets with address, latitude, longitude
 */

import { RepeatIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Input,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useBreakpointValue,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Flex,
  Spacer,
  useToast,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';

import { AssetWithCompany, AssetsListResponse } from '../types/asset';

interface AssetListProps {
  onAssetSelect?: (asset: AssetWithCompany) => void;
  refreshTrigger?: number;
}

export default function AssetList({ onAssetSelect, refreshTrigger }: AssetListProps) {
  const [assets, setAssets] = useState<AssetWithCompany[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [assetToDelete, setAssetToDelete] = useState<AssetWithCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = companyFilter
        ? `/api/assets?companyId=${encodeURIComponent(companyFilter)}`
        : '/api/assets';

      const response = await fetch(url);
      const data: AssetsListResponse = await response.json();

      if (data.success) {
        setAssets(data.assets);
        setFilteredAssets(data.assets);
      } else {
        throw new Error(data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setAssets([]);
      setFilteredAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter assets based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset =>
        asset.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAssets(filtered);
    }
  }, [assets, searchTerm]);

  // Fetch assets on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchAssets();
  }, [refreshTrigger]);

  // Debounce company filter changes to avoid interfering with typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssets();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [companyFilter]);

  const handleRefresh = () => {
    fetchAssets();
  };

  const handleDeleteClick = (asset: AssetWithCompany) => {
    setAssetToDelete(asset);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) {
      onClose();
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/assets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: assetToDelete.companyId,
          latitude: assetToDelete.latitude,
          longitude: assetToDelete.longitude,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const description = data.deletedAsset
          ? `Successfully deleted "${data.deletedAsset.address}" from ${data.deletedAsset.companyId}`
          : data.message;

        toast({
          title: 'Asset deleted',
          description: description,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });

        // Refresh the asset list
        fetchAssets();
      } else {
        toast({
          title: 'Delete failed',
          description: data.error || 'Failed to delete asset',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Network error occurred',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setAssetToDelete(null);
      onClose();
    }
  };

  if (loading) {
    return (
      <Center py={20}>
        <VStack spacing={4}>
          <Spinner size='lg' color='blue.500' />
          <Text color='gray.600'>Loading assets...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status='error' borderRadius='md'>
        <AlertIcon />
        <VStack align='start' spacing={2}>
          <Text fontWeight='semibold'>Error loading assets</Text>
          <Text fontSize='sm'>{error}</Text>
          <Button size='sm' colorScheme='red' onClick={handleRefresh}>
            Try Again
          </Button>
        </VStack>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align='stretch'>
      {/* Search and Filter Controls */}
      <HStack spacing={4} flexWrap='wrap'>
        <Box flex={1} minW='200px'>
          <Input
            placeholder='Search by address...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Box>
        <Box minW='150px'>
          <Input
            placeholder='Filter by Company ID'
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
          />
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={handleRefresh}
          colorScheme='blue'
          variant='outline'
        >
          Refresh
        </Button>
      </HStack>

      {/* Results Summary */}
      <Flex>
        <Text color='gray.600' fontSize='sm'>
          {filteredAssets.length === 0
            ? 'No assets found'
            : `Showing ${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''}`}
        </Text>
        <Spacer />
        {companyFilter && (
          <Badge colorScheme='blue' variant='outline'>
            Company: {companyFilter}
          </Badge>
        )}
      </Flex>

      {filteredAssets.length === 0 ? (
        <Center py={10}>
          <VStack spacing={4}>
            <Text fontSize='lg' color='gray.500'>
              {searchTerm || companyFilter
                ? 'No assets match your criteria'
                : 'No assets uploaded yet'}
            </Text>
            <Text fontSize='sm' color='gray.400'>
              {!companyFilter && !searchTerm && 'Upload some CSV or JSON files to get started'}
            </Text>
          </VStack>
        </Center>
      ) : (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <SimpleGrid columns={1} spacing={4}>
              {filteredAssets.map((asset, index) => (
                <Card
                  key={index}
                  cursor='pointer'
                  onClick={() => onAssetSelect?.(asset)}
                  _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                  transition='all 0.2s'
                >
                  <CardBody>
                    <VStack align='start' spacing={3}>
                      <HStack justify='space-between' width='100%'>
                        <Text fontWeight='semibold' color='blue.600'>
                          Asset #{index + 1}
                        </Text>
                        <Badge colorScheme='purple' variant='solid'>
                          {asset.companyId}
                        </Badge>
                      </HStack>
                      <VStack align='start' spacing={1}>
                        <Text fontSize='sm' color='gray.600'>
                          <strong>Address:</strong>
                        </Text>
                        <Text fontSize='sm'>{asset.address}</Text>
                      </VStack>
                      <HStack spacing={4}>
                        <VStack align='start' spacing={1}>
                          <Text fontSize='xs' color='gray.500'>
                            Latitude
                          </Text>
                          <Text fontSize='sm' fontWeight='semibold'>
                            {asset.latitude.toFixed(4)}
                          </Text>
                        </VStack>
                        <VStack align='start' spacing={1}>
                          <Text fontSize='xs' color='gray.500'>
                            Longitude
                          </Text>
                          <Text fontSize='sm' fontWeight='semibold'>
                            {asset.longitude.toFixed(4)}
                          </Text>
                        </VStack>
                        <VStack align='start' spacing={1}>
                          <Text fontSize='xs' color='gray.500'>
                            Actions
                          </Text>
                          <IconButton
                            size='xs'
                            colorScheme='red'
                            variant='outline'
                            aria-label='Delete asset'
                            icon={<DeleteIcon />}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteClick(asset);
                            }}
                          />
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            /* Desktop Table View */
            <Box overflowX='auto'>
              <Table variant='simple' size='md'>
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Company ID</Th>
                    <Th>Address</Th>
                    <Th isNumeric>Latitude</Th>
                    <Th isNumeric>Longitude</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredAssets.map((asset, index) => (
                    <Tr
                      key={index}
                      _hover={{ bg: 'gray.50' }}
                      cursor='pointer'
                      onClick={() => onAssetSelect?.(asset)}
                    >
                      <Td>
                        <Badge colorScheme='gray' variant='subtle'>
                          {index + 1}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme='purple' variant='solid'>
                          {asset.companyId}
                        </Badge>
                      </Td>
                      <Td>
                        <Text maxW='300px' isTruncated title={asset.address}>
                          {asset.address}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontFamily='mono' fontSize='sm'>
                          {asset.latitude.toFixed(4)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontFamily='mono' fontSize='sm'>
                          {asset.longitude.toFixed(4)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size='sm'
                            colorScheme='blue'
                            variant='ghost'
                            onClick={e => {
                              e.stopPropagation();
                              onAssetSelect?.(asset);
                            }}
                          >
                            View
                          </Button>
                          <IconButton
                            size='sm'
                            colorScheme='red'
                            variant='ghost'
                            aria-label='Delete asset'
                            icon={<DeleteIcon />}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteClick(asset);
                            }}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}

      {/* Asset Model Info */}
      <Box bg='gray.50' p={4} borderRadius='md' fontSize='sm'>
        <Text color='gray.600' mb={2} fontWeight='semibold'>
          Asset Model:
        </Text>
        <Text color='gray.600' fontSize='xs' fontFamily='mono'>
          {'{ address: string, latitude: number, longitude: number }'}
        </Text>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Delete Asset
            </AlertDialogHeader>

            <AlertDialogBody>
              {assetToDelete && (
                <>
                  <Text mb={4}>
                    Are you sure you want to delete this asset? This action cannot be undone.
                  </Text>
                  <Box bg='gray.50' p={3} borderRadius='md'>
                    <Text fontSize='sm' mb={1}>
                      <strong>Company ID:</strong> {assetToDelete.companyId}
                    </Text>
                    <Text fontSize='sm' mb={1}>
                      <strong>Address:</strong> {assetToDelete.address}
                    </Text>
                    <Text fontSize='sm' mb={1}>
                      <strong>Latitude:</strong> {assetToDelete.latitude.toFixed(4)}
                    </Text>
                    <Text fontSize='sm'>
                      <strong>Longitude:</strong> {assetToDelete.longitude.toFixed(4)}
                    </Text>
                  </Box>
                </>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                colorScheme='red'
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={isDeleting}
                loadingText='Deleting...'
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
