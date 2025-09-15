/**
 * File Validation Utilities
 * Handles file validation and parsing logic
 */

import Papa from 'papaparse';

import { AssetValidationResult, ParsedCsvData, ParsedJsonData } from '../types/asset';

// File type mappings
const FILE_TYPE_MAPPINGS = {
  'text/csv': 'csv',
  'application/json': 'json',
} as const;

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  csv: 50 * 1024 * 1024, // 50MB
  json: 10 * 1024 * 1024, // 10MB
  other: 10 * 1024 * 1024, // 10MB
};

export function validateFile(file: File): AssetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // File size validation
  const fileType = getFileType(file.type);
  const maxSize = MAX_FILE_SIZES[fileType];

  if (file.size > maxSize) {
    errors.push(
      `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`
    );
  }

  // File type validation
  if (!file.type) {
    warnings.push('File type could not be determined');
  }

  // File name validation
  if (file.name.length > 255) {
    errors.push('File name is too long (maximum 255 characters)');
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    warnings.push('File name contains special characters that may cause issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      size: file.size,
      type: file.type,
      name: file.name,
    },
  };
}

export function getFileType(mimeType: string): 'csv' | 'json' {
  return FILE_TYPE_MAPPINGS[mimeType as keyof typeof FILE_TYPE_MAPPINGS] || 'json';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function parseCsvFile(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0]?.message || 'Unknown error'}`));
          return;
        }

        const headers = results.meta.fields || [];
        const data = results.data as Record<string, any>[];

        resolve({
          headers,
          data,
          totalRows: data.length,
          preview: data.slice(0, 10), // First 10 rows for preview
        });
      },
      error: error => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

export async function parseJsonFile(file: File): Promise<ParsedJsonData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        let structure: 'object' | 'array' | 'nested' = 'object';
        let keys: string[] = [];

        if (Array.isArray(data)) {
          structure = 'array';
          if (data.length > 0 && typeof data[0] === 'object') {
            keys = Object.keys(data[0]);
            structure = 'nested';
          }
        } else if (typeof data === 'object' && data !== null) {
          keys = Object.keys(data);

          // Check if it contains nested objects or arrays
          const hasNestedStructures = keys.some(
            key => typeof data[key] === 'object' && data[key] !== null
          );

          if (hasNestedStructures) {
            structure = 'nested';
          }
        }

        resolve({
          structure,
          keys,
          data,
          preview: Array.isArray(data) ? data.slice(0, 10) : data,
        });
      } catch (error) {
        reject(new Error(`JSON parsing failed: Invalid JSON format`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}
