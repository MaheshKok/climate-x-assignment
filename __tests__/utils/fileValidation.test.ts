/**
 * Unit tests for file validation utilities
 * Tests file validation, parsing, and error handling
 */

import Papa from 'papaparse';

import {
  formatFileSize,
  generateAssetId,
  getFileExtension,
  getFileType,
  parseCsvFile,
  parseJsonFile,
  validateFile,
} from '../../src/utils/fileValidation';

// Mock Papa Parse at the top level
jest.mock('papaparse', () => ({
  parse: jest.fn((_input, options) => {
    // Default mock implementation
    const mockData = [
      { address: '123 Main St', latitude: '40.7128', longitude: '-74.006' },
      { address: '456 Oak Ave', latitude: '34.0522', longitude: '-118.2437' },
    ];

    setTimeout(() => {
      options.complete({
        data: mockData,
        meta: { fields: ['address', 'latitude', 'longitude'] },
        errors: [],
      });
    }, 0);
  }),
}));

describe('File Validation Utilities', () => {
  describe('validateFile', () => {
    it('should validate a normal CSV file', () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileInfo.name).toBe('test.csv');
      expect(result.fileInfo.type).toBe('text/csv');
    });

    it('should validate a normal JSON file', () => {
      const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file that exceeds CSV size limit', () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exceeds maximum allowed size')])
      );
    });

    it('should reject file that exceeds JSON size limit', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.json', { type: 'application/json' });
      const result = validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exceeds maximum allowed size')])
      );
    });

    it('should warn about missing file type', () => {
      const file = new File(['content'], 'test.csv', { type: '' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining(['File type could not be determined'])
      );
    });

    it('should reject file with extremely long name', () => {
      const longName = 'a'.repeat(256) + '.csv';
      const file = new File(['content'], longName, { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File name is too long (maximum 255 characters)');
    });

    it('should warn about special characters in filename', () => {
      const file = new File(['content'], 'test@#$.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining(['File name contains special characters that may cause issues'])
      );
    });

    it('should handle empty files', () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.fileInfo.size).toBe(0);
    });

    it('should handle files with valid special characters', () => {
      const file = new File(['content'], 'test-file_v1.2.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getFileType', () => {
    it('should return csv for text/csv mime type', () => {
      expect(getFileType('text/csv')).toBe('csv');
    });

    it('should return json for application/json mime type', () => {
      expect(getFileType('application/json')).toBe('json');
    });

    it('should default to json for unknown mime types', () => {
      expect(getFileType('text/plain')).toBe('json');
      expect(getFileType('application/unknown')).toBe('json');
      expect(getFileType('')).toBe('json');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(102400)).toBe('100 KB');
    });

    it('should format MB correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(104857600)).toBe('100 MB');
    });

    it('should format GB correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('should handle edge cases', () => {
      expect(formatFileSize(1025)).toBe('1.0 KB');
      expect(formatFileSize(1048577)).toBe('1.0 MB');
    });
  });

  describe('parseCsvFile', () => {
    it('should parse valid CSV with headers', async () => {
      const csvContent =
        'address,latitude,longitude\\n"123 Main St",40.7128,-74.006\\n"456 Oak Ave",34.0522,-118.2437';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCsvFile(file);

      expect(result.headers).toEqual(['address', 'latitude', 'longitude']);
      expect(result.data).toHaveLength(2);
      expect(result.totalRows).toBe(2);
      expect(result.preview).toHaveLength(2);
      expect(result.data[0]?.address).toBe('123 Main St');
    });

    it('should handle CSV with empty lines', async () => {
      const csvContent =
        'address,latitude,longitude\\n"123 Main St",40.7128,-74.006\\n\\n"456 Oak Ave",34.0522,-118.2437\\n\\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCsvFile(file);

      expect(result.data).toHaveLength(2); // Empty lines should be skipped
    });

    it('should limit preview to 10 rows', async () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        address: `Address ${i}`,
        latitude: `${40 + i}`,
        longitude: `${-74 - i}`,
      }));

      (Papa.parse as jest.Mock).mockImplementationOnce((_input, options) => {
        setTimeout(() => {
          options.complete({
            data: largeData,
            meta: { fields: ['address', 'latitude', 'longitude'] },
            errors: [],
          });
        }, 0);
      });

      const rows = Array.from({ length: 15 }, (_, i) => `"Address ${i}",${40 + i},${-74 - i}`).join(
        '\\n'
      );
      const csvContent = `address,latitude,longitude\\n${rows}`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCsvFile(file);

      expect(result.totalRows).toBe(15);
      expect(result.preview).toHaveLength(10);
    });

    it('should handle CSV parsing errors', async () => {
      (Papa.parse as jest.Mock).mockImplementationOnce((_input, options) => {
        setTimeout(() => {
          options.complete({
            data: [],
            meta: { fields: [] },
            errors: [{ message: 'Parsing failed' }],
          });
        }, 0);
      });

      const invalidCsv = 'invalid,csv,content\\n"unclosed quote,123,456';
      const file = new File([invalidCsv], 'invalid.csv', { type: 'text/csv' });

      await expect(parseCsvFile(file)).rejects.toThrow('CSV parsing error');
    });

    it('should handle CSV with missing headers', async () => {
      (Papa.parse as jest.Mock).mockImplementationOnce((_input, options) => {
        setTimeout(() => {
          options.complete({
            data: [
              ['123 Main St', '40.7128', '-74.006'],
              ['456 Oak Ave', '34.0522', '-118.2437'],
            ],
            meta: { fields: [] },
            errors: [],
          });
        }, 0);
      });

      const csvContent = '"123 Main St",40.7128,-74.006\\n"456 Oak Ave",34.0522,-118.2437';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCsvFile(file);

      expect(result.headers).toEqual([]); // No headers detected
    });

    it('should handle CSV with special characters', async () => {
      (Papa.parse as jest.Mock).mockImplementationOnce((_input, options) => {
        setTimeout(() => {
          options.complete({
            data: [{ address: '东京都千代田区 🏢', latitude: '35.6762', longitude: '139.6503' }],
            meta: { fields: ['address', 'latitude', 'longitude'] },
            errors: [],
          });
        }, 0);
      });

      const csvContent = 'address,latitude,longitude\\n"东京都千代田区 🏢",35.6762,139.6503';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCsvFile(file);

      expect(result.data[0]?.address).toBe('东京都千代田区 🏢');
    });
  });

  describe('parseJsonFile', () => {
    it('should parse JSON array structure', async () => {
      const jsonContent = JSON.stringify([
        { address: '123 Main St', latitude: 40.7128, longitude: -74.006 },
        { address: '456 Oak Ave', latitude: 34.0522, longitude: -118.2437 },
      ]);
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.structure).toBe('nested');
      expect(result.keys).toEqual(['address', 'latitude', 'longitude']);
      expect(result.preview).toHaveLength(2);
    });

    it('should parse simple JSON object', async () => {
      const jsonContent = JSON.stringify({
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
      });
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.structure).toBe('object');
      expect(result.keys).toEqual(['address', 'latitude', 'longitude']);
    });

    it('should detect nested structures', async () => {
      const jsonContent = JSON.stringify({
        company: 'Test Corp',
        assets: [{ address: '123 Main St', coordinates: { lat: 40.7128, lng: -74.006 } }],
      });
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.structure).toBe('nested');
    });

    it('should handle simple array structure', async () => {
      const jsonContent = JSON.stringify(['item1', 'item2', 'item3']);
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.structure).toBe('array');
      expect(result.keys).toEqual([]);
    });

    it('should limit preview to 10 items for arrays', async () => {
      const largeArray = Array.from({ length: 15 }, (_, i) => ({
        address: `Address ${i}`,
        latitude: 40 + i,
        longitude: -74 - i,
      }));
      const jsonContent = JSON.stringify(largeArray);
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.data).toHaveLength(15);
      expect(result.preview).toHaveLength(10);
    });

    it('should handle invalid JSON', async () => {
      const invalidJson = '{"invalid": json}';
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' });

      await expect(parseJsonFile(file)).rejects.toThrow('JSON parsing failed: Invalid JSON format');
    });

    it('should handle empty JSON file', async () => {
      const file = new File([''], 'empty.json', { type: 'application/json' });

      await expect(parseJsonFile(file)).rejects.toThrow('JSON parsing failed');
    });

    it('should handle JSON with Unicode characters', async () => {
      const jsonContent = JSON.stringify([
        { address: '东京都千代田区 🏢', latitude: 35.6762, longitude: 139.6503 },
      ]);
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await parseJsonFile(file);

      expect(result.data[0].address).toBe('东京都千代田区 🏢');
    });

    it('should handle FileReader errors', async () => {
      const file = new File(['content'], 'test.json', { type: 'application/json' });

      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = class MockErrorFileReader {
        onerror: (() => void) | null = null;
        constructor() {
          this.onerror = null;
        }
        readAsText() {
          if (this.onerror) {
            this.onerror();
          }
        }
      } as unknown as typeof FileReader;

      await expect(parseJsonFile(file)).rejects.toThrow('Failed to read file');

      global.FileReader = originalFileReader;
    });
  });

  describe('generateAssetId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAssetId();
      const id2 = generateAssetId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^asset_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^asset_\d+_[a-z0-9]{9}$/);
    });

    it('should include timestamp', () => {
      const beforeTime = Date.now();
      const id = generateAssetId();
      const afterTime = Date.now();

      const timestampPart = parseInt(id.split('_')[1] || '0');
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampPart).toBeLessThanOrEqual(afterTime);
    });

    it('should generate many unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateAssetId());
      }
      expect(ids.size).toBe(1000); // All should be unique
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.csv')).toBe('csv');
      expect(getFileExtension('test.json')).toBe('json');
      expect(getFileExtension('file.txt')).toBe('txt');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('file.name.with.dots.csv')).toBe('csv');
      expect(getFileExtension('backup.data.2023.json')).toBe('json');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('filename')).toBe('');
      expect(getFileExtension('no-extension')).toBe('');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('TEST.CSV')).toBe('csv');
      expect(getFileExtension('DATA.JSON')).toBe('json');
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
      expect(getFileExtension('file.')).toBe('');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => getFileExtension(undefined as unknown as string)).not.toThrow();
      expect(() => formatFileSize(undefined as unknown as number)).not.toThrow();
      expect(() => getFileType(undefined as unknown as string)).not.toThrow();
    });

    it('should handle extremely large file sizes', () => {
      const result = formatFileSize(Number.MAX_SAFE_INTEGER);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle negative file sizes', () => {
      const result = formatFileSize(-1024);
      expect(result).toBeDefined();
    });
  });
});
