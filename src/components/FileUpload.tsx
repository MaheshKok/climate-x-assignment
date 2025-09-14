/**
 * File Upload Component
 * Upload CSV/JSON files with companyId
 */

import { AttachmentIcon, CheckIcon } from '@chakra-ui/icons';
import {
  Box,
  VStack,
  Button,
  Text,
  Progress,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Divider,
} from '@chakra-ui/react';
import React, { useState, useRef } from 'react';

import { Asset, AssetUploadResponse, FileUploadProgress } from '../types/asset';

interface FileUploadProps {
  onUploadSuccess?: (assets: Asset[]) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [errors, setErrors] = useState<{ companyId?: string; file?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Validate file type (only CSV and JSON )
  const validateFile = (file: File): boolean => {
    const allowedExtensions = ['.csv', '.json'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    const allowedTypes = ['text/csv', 'application/json', 'text/json'];
    const isValidType = allowedTypes.includes(file.type);

    return isValidExtension || isValidType;
  };

  const handleFileSelect = (file: File) => {
    setErrors({});

    if (!validateFile(file)) {
      const error = 'Only CSV and JSON files are allowed';
      setErrors({ file: error });
      onUploadError?.(error);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { companyId?: string; file?: string } = {};

    if (!companyId.trim()) {
      newErrors.companyId = 'Company ID is required';
    }

    if (!selectedFile) {
      newErrors.file = 'Please select a CSV or JSON file';
    } else if (selectedFile.size === 0) {
      newErrors.file = 'Selected file is empty. Please choose a file with content.';
    } else if (selectedFile.size > 10 * 1024 * 1024) {
      // 10MB limit
      newErrors.file = 'File size must be less than 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      return;
    }

    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('companyId', companyId.trim());
      formData.append('assetFile', selectedFile!);

      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({ progress, status: 'uploading' });
        }
      };

      xhr.onload = () => {
        try {
          if (xhr.status === 200) {
            const response: AssetUploadResponse = JSON.parse(xhr.responseText);
            if (response.success && response.assets) {
              setUploadProgress({ progress: 100, status: 'success' });
              onUploadSuccess?.(response.assets);

              let toastStatus: 'success' | 'warning' = 'success';
              if (response.duplicatesSkipped && response.duplicatesSkipped > 0) {
                toastStatus = 'warning';
              }

              toast({
                title: 'Upload completed',
                description: response.message,
                status: toastStatus,
                duration: 6000,
                isClosable: true,
              });

              // Reset form
              setSelectedFile(null);
              setCompanyId('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            } else {
              // Handle API error response
              const errorMessage = response.error || 'Upload failed';
              setUploadProgress({ progress: 0, status: 'error', error: errorMessage });

              toast({
                title: 'Upload failed',
                description: errorMessage,
                status: 'error',
                duration: 6000,
                isClosable: true,
              });
            }
          } else {
            // Handle HTTP error status
            let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText || 'Request failed'}`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.error || errorMessage;
            } catch (parseError) {
              // Use the default error message if JSON parsing fails
            }

            setUploadProgress({ progress: 0, status: 'error', error: errorMessage });

            toast({
              title: 'Upload failed',
              description: errorMessage,
              status: 'error',
              duration: 6000,
              isClosable: true,
            });
          }
        } catch (error) {
          // Handle any unexpected errors in onload
          const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
          setUploadProgress({ progress: 0, status: 'error', error: errorMessage });

          toast({
            title: 'Upload failed',
            description: errorMessage,
            status: 'error',
            duration: 6000,
            isClosable: true,
          });
        }
      };

      xhr.onerror = () => {
        const errorMessage = 'Network error occurred';
        setUploadProgress({ progress: 0, status: 'error', error: errorMessage });

        toast({
          title: 'Upload failed',
          description: errorMessage,
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
      };

      xhr.open('POST', '/api/assets/upload');
      xhr.send(formData);
    } catch (error) {
      // Handle any synchronous errors (like FormData creation)
      const errorMessage = error instanceof Error ? error.message : 'Upload preparation failed';
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });

      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const isUploading = uploadProgress.status === 'uploading';

  return (
    <VStack spacing={6} align='stretch'>
      {/* Company ID Input */}
      <FormControl isRequired isInvalid={!!errors.companyId}>
        <FormLabel>Company ID</FormLabel>
        <Input
          placeholder='Enter your company ID (e.g., company123)'
          value={companyId}
          onChange={e => setCompanyId(e.target.value)}
          disabled={isUploading}
        />
        {errors.companyId && <FormErrorMessage>{errors.companyId}</FormErrorMessage>}
      </FormControl>

      <Divider />

      {/* File Upload Area */}
      <FormControl isInvalid={!!errors.file}>
        <FormLabel>Asset File (CSV or JSON)</FormLabel>
        <Box
          border='2px dashed'
          borderColor={isDragOver ? 'blue.400' : errors.file ? 'red.300' : 'gray.300'}
          borderRadius='md'
          p={8}
          textAlign='center'
          bg={isDragOver ? 'blue.50' : errors.file ? 'red.50' : 'gray.50'}
          cursor='pointer'
          transition='all 0.2s'
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <VStack spacing={4}>
            <AttachmentIcon boxSize={8} color={errors.file ? 'red.400' : 'gray.400'} />
            <VStack spacing={2}>
              <Text
                fontSize='lg'
                fontWeight='semibold'
                color={errors.file ? 'red.600' : 'gray.700'}
              >
                {selectedFile ? selectedFile.name : 'Drop your asset file here'}
              </Text>
              <Text fontSize='sm' color='gray.500'>
                or click to browse - CSV and JSON files only
              </Text>
              {selectedFile && (
                <Text fontSize='xs' color='green.600'>
                  ✓ File selected: {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </VStack>
          </VStack>
        </Box>
        {errors.file && <FormErrorMessage>{errors.file}</FormErrorMessage>}

        <Input
          ref={fileInputRef}
          type='file'
          accept='.csv,.json'
          onChange={handleFileInputChange}
          display='none'
        />
      </FormControl>

      {/* Upload Progress */}
      {uploadProgress.status !== 'idle' && (
        <Box>
          {uploadProgress.status === 'uploading' && (
            <VStack spacing={2}>
              <Text fontSize='sm' color='blue.600'>
                Uploading... {uploadProgress.progress}%
              </Text>
              <Progress
                value={uploadProgress.progress}
                colorScheme='blue'
                size='lg'
                hasStripe
                isAnimated
              />
            </VStack>
          )}
        </Box>
      )}

      {/* Upload Button */}
      <Button
        leftIcon={uploadProgress.status === 'success' ? <CheckIcon /> : <AttachmentIcon />}
        colorScheme='blue'
        size='lg'
        onClick={handleUpload}
        isDisabled={!selectedFile || !companyId.trim()}
        isLoading={isUploading}
        loadingText='Uploading...'
      >
        Upload Asset File
      </Button>

      {/* File Type Info */}
      <Box bg='gray.100' p={4} borderRadius='md'>
        <Text fontSize='sm' color='gray.600' mb={2} fontWeight='semibold'>
          Supported File Formats:
        </Text>
        <VStack align='start' spacing={1}>
          <Text fontSize='xs' color='gray.600'>
            • <strong>CSV files:</strong> Must contain columns: address, latitude, longitude
          </Text>
          <Text fontSize='xs' color='gray.600'>
            • <strong>JSON files:</strong> Array of objects or single object with: address,
            latitude, longitude
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}
