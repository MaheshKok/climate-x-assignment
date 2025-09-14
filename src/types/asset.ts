/**
 * Asset Management System Types
 */

// Asset model
export interface Asset {
  address: string;
  latitude: number;
  longitude: number;
}

// Asset with company information for display purposes
export interface AssetWithCompany extends Asset {
  companyId: string;
}

// API Response types
export interface AssetUploadResponse {
  success: boolean;
  message: string;
  assets?: Asset[];
  duplicatesSkipped?: number;
  error?: string;
}

export interface AssetDeleteResponse {
  success: boolean;
  message: string;
  deletedAsset?: {
    address: string;
    companyId: string;
  };
  error?: string;
}

export interface AssetsListResponse {
  success: boolean;
  assets: AssetWithCompany[];
  total: number;
  error?: string;
}

// Upload form data
export interface UploadFormData {
  companyId: string;
  assetFile: File;
}

// File validation result
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
}

// Upload progress tracking
export interface FileUploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

// File validation result (used by fileValidation.ts)
export interface AssetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    size: number;
    type: string;
    name: string;
  };
}

// Parsed CSV data structure
export interface ParsedCsvData {
  headers: string[];
  data: Record<string, any>[];
  totalRows: number;
  preview: Record<string, any>[];
}

// Parsed JSON data structure
export interface ParsedJsonData {
  structure: 'object' | 'array' | 'nested';
  keys: string[];
  data: any;
  preview: any;
}
