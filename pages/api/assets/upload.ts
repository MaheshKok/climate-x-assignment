/**
 * POST /assets/upload
 * Upload asset data via CSV or JSON file with companyId
 * Following the exact specification
 */

import multer, { memoryStorage } from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import Papa from 'papaparse';

import { assetStorage } from '../../../src/lib/storage';
import { Asset, AssetUploadResponse } from '../../../src/types/asset';

// Configure multer for file uploads
const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    // Only accept CSV and JSON files
    const allowedTypes = ['text/csv', 'application/json', 'text/json'];
    const allowedExtensions = ['.csv', '.json'];

    const hasValidMimeType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  },
});

// Middleware to handle multipart form data
const multerMiddleware = upload.single('assetFile');

// Helper to run middleware
function runMiddleware(req: NextApiRequest & { file?: any }, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Parse CSV data to Asset array
function parseCSV(fileContent: string): Asset[] {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value, header) => {
      // Convert latitude and longitude to numbers
      if (header === 'latitude' || header === 'longitude') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error(`Invalid ${header}: ${value}`);
        }
        return num;
      }
      return value;
    },
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parsed.errors[0]?.message || 'Unknown error'}`);
  }

  return parsed.data as Asset[];
}

// Parse JSON data to Asset array
function parseJSON(fileContent: string): Asset[] {
  try {
    const data = JSON.parse(fileContent);

    // Handle both single object and array of objects
    const assets = Array.isArray(data) ? data : [data];

    // Validate each asset has required fields
    assets.forEach((asset: any, index: number) => {
      if (!asset.address || typeof asset.address !== 'string') {
        throw new Error(`Asset ${index + 1}: address is required and must be a string`);
      }
      if (typeof asset.latitude !== 'number' || isNaN(asset.latitude)) {
        throw new Error(`Asset ${index + 1}: latitude must be a valid number`);
      }
      if (typeof asset.longitude !== 'number' || isNaN(asset.longitude)) {
        throw new Error(`Asset ${index + 1}: longitude must be a valid number`);
      }
    });

    return assets as Asset[];
  } catch (error) {
    throw new Error(
      `JSON parsing error: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    );
  }
}

// Validate Asset data
function validateAssets(assets: Asset[]): string[] {
  const errors: string[] = [];

  assets.forEach((asset, index) => {
    if (!asset.address?.trim()) {
      errors.push(`Asset ${index + 1}: address cannot be empty`);
    }
    if (typeof asset.latitude !== 'number' || asset.latitude < -90 || asset.latitude > 90) {
      errors.push(`Asset ${index + 1}: latitude must be a number between -90 and 90`);
    }
    if (typeof asset.longitude !== 'number' || asset.longitude < -180 || asset.longitude > 180) {
      errors.push(`Asset ${index + 1}: longitude must be a number between -180 and 180`);
    }
  });

  return errors;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetUploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only POST method is supported',
    });
  }

  try {
    // Handle multipart form data
    await runMiddleware(req as any, res, multerMiddleware);
    const reqWithFile = req as NextApiRequest & { file?: any; body: { companyId?: string } };

    // Validate required fields
    const { companyId } = reqWithFile.body;
    const file = reqWithFile.file;

    if (!companyId?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'companyId is required',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'assetFile is required',
      });
    }

    // Parse file content based on type
    const fileContent = file.buffer.toString('utf-8');
    let assets: Asset[];

    try {
      if (file.originalname.toLowerCase().endsWith('.csv')) {
        assets = parseCSV(fileContent);
      } else if (file.originalname.toLowerCase().endsWith('.json')) {
        assets = parseJSON(fileContent);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type',
          error: 'Only CSV and JSON files are supported',
        });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'File parsing failed',
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
      });
    }

    // Validate parsed assets
    const validationErrors = validateAssets(assets);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        error: validationErrors.join('; '),
      });
    }

    // Store assets using shared storage with duplicate detection
    const { added, duplicatesSkipped } = assetStorage.addAssets(companyId.trim(), assets);

    let message = `Successfully uploaded ${added.length} asset(s) for company ${companyId}`;
    if (duplicatesSkipped > 0) {
      message += `. ${duplicatesSkipped} duplicate(s) were skipped`;
    }

    return res.status(200).json({
      success: true,
      message,
      assets: added,
      duplicatesSkipped,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for multer
  },
};
