/**
 * Unit tests for AssetStorage class
 * Tests all CRUD operations, edge cases, and error conditions
 */

import { AssetStorage } from '../../src/lib/storage';
import { Asset } from '../../src/types/asset';

describe('AssetStorage', () => {
  let storage: AssetStorage;

  beforeEach(() => {
    // Create a fresh instance for each test to avoid side effects
    storage = AssetStorage.getInstance();
    // Clear existing data by creating new storage with empty data
    (storage as any).storage = {};
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = AssetStorage.getInstance();
      const instance2 = AssetStorage.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAssets', () => {
    beforeEach(() => {
      // Setup test data
      (storage as any).storage = {
        company1: [
          {
            address: '123 Main St, New York, NY',
            latitude: 40.7128,
            longitude: -74.006,
          },
          {
            address: '456 Oak Ave, Los Angeles, CA',
            latitude: 34.0522,
            longitude: -118.2437,
          },
        ],
        company2: [
          {
            address: '789 Pine Rd, Chicago, IL',
            latitude: 41.8781,
            longitude: -87.6298,
          },
        ],
        testCompany: [
          {
            address: '100 Test Ave, Seattle, WA',
            latitude: 47.6062,
            longitude: -122.3321,
          },
        ],
      };
    });

    it('should return all assets when no companyId is provided', () => {
      const assets = storage.getAssets();
      expect(assets).toHaveLength(4);
      expect(assets.every(asset => 'companyId' in asset)).toBe(true);
    });

    it('should return assets for exact company match', () => {
      const assets = storage.getAssets('company1');
      expect(assets).toHaveLength(2);
      expect(assets.every(asset => asset.companyId === 'company1')).toBe(true);
    });

    it('should return assets for partial company match', () => {
      const assets = storage.getAssets('comp');
      expect(assets).toHaveLength(4); // company1 + company2 + testCompany (all contain 'comp')
      expect(assets.some(asset => asset.companyId === 'company1')).toBe(true);
      expect(assets.some(asset => asset.companyId === 'company2')).toBe(true);
      expect(assets.some(asset => asset.companyId === 'testCompany')).toBe(true);
    });

    it('should be case-insensitive for partial matching', () => {
      const assets = storage.getAssets('COMPANY1');
      expect(assets).toHaveLength(2);
      expect(assets.every(asset => asset.companyId === 'company1')).toBe(true);
    });

    it('should return empty array for non-matching company', () => {
      const assets = storage.getAssets('nonexistent');
      expect(assets).toHaveLength(0);
    });

    it('should return empty array when no companies exist', () => {
      (storage as any).storage = {};
      const assets = storage.getAssets();
      expect(assets).toHaveLength(0);
    });

    it('should handle special characters in company search', () => {
      (storage as any).storage = {
        'company-with-dash': [
          {
            address: '123 Special St',
            latitude: 40.0,
            longitude: -74.0,
          },
        ],
      };
      const assets = storage.getAssets('with-dash');
      expect(assets).toHaveLength(1);
    });
  });

  describe('addAssets', () => {
    it('should add assets to new company', () => {
      const newAssets: Asset[] = [
        {
          address: '100 New St, Boston, MA',
          latitude: 42.3601,
          longitude: -71.0589,
        },
      ];

      const result = storage.addAssets('newCompany', newAssets);

      expect(result.added).toHaveLength(1);
      expect(result.duplicatesSkipped).toBe(0);

      const storedAssets = storage.getAssets('newCompany');
      expect(storedAssets).toHaveLength(1);
      expect(storedAssets[0]?.address).toBe('100 New St, Boston, MA');
    });

    it('should add assets to existing company', () => {
      // Setup existing company
      const existingAssets: Asset[] = [
        {
          address: '123 Main St',
          latitude: 40.0,
          longitude: -74.0,
        },
      ];
      storage.addAssets('existingCompany', existingAssets);

      // Add more assets
      const newAssets: Asset[] = [
        {
          address: '456 Oak Ave',
          latitude: 41.0,
          longitude: -75.0,
        },
      ];
      const result = storage.addAssets('existingCompany', newAssets);

      expect(result.added).toHaveLength(1);
      expect(result.duplicatesSkipped).toBe(0);

      const allAssets = storage.getAssets('existingCompany');
      expect(allAssets).toHaveLength(2);
    });

    it('should detect and skip duplicate assets', () => {
      const asset1: Asset = {
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Add asset first time
      storage.addAssets('company', [asset1]);

      // Try to add same asset again
      const result = storage.addAssets('company', [asset1]);

      expect(result.added).toHaveLength(0);
      expect(result.duplicatesSkipped).toBe(1);

      const assets = storage.getAssets('company');
      expect(assets).toHaveLength(1);
    });

    it('should handle mixed new and duplicate assets', () => {
      const asset1: Asset = {
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
      };

      storage.addAssets('company', [asset1]);

      const mixedAssets: Asset[] = [
        asset1, // duplicate
        {
          address: '456 Oak Ave',
          latitude: 34.0522,
          longitude: -118.2437,
        }, // new
      ];

      const result = storage.addAssets('company', mixedAssets);

      expect(result.added).toHaveLength(1);
      expect(result.duplicatesSkipped).toBe(1);

      const assets = storage.getAssets('company');
      expect(assets).toHaveLength(2);
    });

    it('should handle empty assets array', () => {
      const result = storage.addAssets('company', []);

      expect(result.added).toHaveLength(0);
      expect(result.duplicatesSkipped).toBe(0);
    });

    it('should handle very close coordinates as duplicates', () => {
      const asset1: Asset = {
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
      };

      const asset2: Asset = {
        address: '123 Main St Nearby',
        latitude: 40.712801, // Only 0.000001 difference
        longitude: -74.006001,
      };

      storage.addAssets('company', [asset1]);
      const result = storage.addAssets('company', [asset2]);

      expect(result.duplicatesSkipped).toBe(1);
    });
  });

  describe('deleteAsset', () => {
    beforeEach(() => {
      // Setup test data
      (storage as any).storage = {
        company1: [
          {
            address: '123 Main St, New York, NY',
            latitude: 40.7128,
            longitude: -74.006,
          },
          {
            address: '456 Oak Ave, Los Angeles, CA',
            latitude: 34.0522,
            longitude: -118.2437,
          },
        ],
      };
    });

    it('should delete asset with exact coordinates', () => {
      const result = storage.deleteAsset('company1', 40.7128, -74.006);

      expect(result.success).toBe(true);
      expect(result.deletedAsset).toBeDefined();
      expect(result.deletedAsset?.address).toBe('123 Main St, New York, NY');

      const remainingAssets = storage.getAssets('company1');
      expect(remainingAssets).toHaveLength(1);
    });

    it('should delete asset with slightly different coordinates (within tolerance)', () => {
      const result = storage.deleteAsset('company1', 40.7129, -74.0061); // Slightly different

      expect(result.success).toBe(true);
      expect(result.deletedAsset?.address).toBe('123 Main St, New York, NY');
    });

    it('should not delete asset with coordinates outside tolerance', () => {
      const result = storage.deleteAsset('company1', 40.72, -74.01); // Too different

      expect(result.success).toBe(false);
      expect(result.deletedAsset).toBeUndefined();

      const assets = storage.getAssets('company1');
      expect(assets).toHaveLength(2); // No deletion
    });

    it('should return false for non-existent company', () => {
      const result = storage.deleteAsset('nonexistent', 40.7128, -74.006);

      expect(result.success).toBe(false);
      expect(result.deletedAsset).toBeUndefined();
    });

    it('should clean up empty company arrays', () => {
      // Delete both assets from company1
      storage.deleteAsset('company1', 40.7128, -74.006);
      storage.deleteAsset('company1', 34.0522, -118.2437);

      const companies = storage.getAllCompanies();
      expect(companies).not.toContain('company1');
    });

    it('should handle edge case coordinates', () => {
      (storage as any).storage = {
        edgeCompany: [
          {
            address: 'North Pole',
            latitude: 90.0,
            longitude: 0.0,
          },
          {
            address: 'South Pole',
            latitude: -90.0,
            longitude: 180.0,
          },
        ],
      };

      const result = storage.deleteAsset('edgeCompany', 90.0, 0.0);
      expect(result.success).toBe(true);
    });
  });

  describe('getAllCompanies', () => {
    it('should return all company IDs', () => {
      (storage as any).storage = {
        company1: [{ address: '123 Main', latitude: 40.0, longitude: -74.0 }],
        company2: [{ address: '456 Oak', latitude: 41.0, longitude: -75.0 }],
        company3: [{ address: '789 Pine', latitude: 42.0, longitude: -76.0 }],
      };

      const companies = storage.getAllCompanies();
      expect(companies).toHaveLength(3);
      expect(companies).toContain('company1');
      expect(companies).toContain('company2');
      expect(companies).toContain('company3');
    });

    it('should return empty array when no companies exist', () => {
      (storage as any).storage = {};
      const companies = storage.getAllCompanies();
      expect(companies).toHaveLength(0);
    });
  });

  describe('getTotalAssets', () => {
    it('should return total count across all companies', () => {
      (storage as any).storage = {
        company1: [
          { address: '123 Main', latitude: 40.0, longitude: -74.0 },
          { address: '456 Oak', latitude: 41.0, longitude: -75.0 },
        ],
        company2: [{ address: '789 Pine', latitude: 42.0, longitude: -76.0 }],
      };

      const total = storage.getTotalAssets();
      expect(total).toBe(3);
    });

    it('should return 0 when no assets exist', () => {
      (storage as any).storage = {};
      const total = storage.getTotalAssets();
      expect(total).toBe(0);
    });

    it('should return 0 when companies exist but have no assets', () => {
      (storage as any).storage = {
        company1: [],
        company2: [],
      };
      const total = storage.getTotalAssets();
      expect(total).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      expect(() => storage.getAssets('')).not.toThrow();
      expect(() => storage.addAssets('', [])).not.toThrow();
      expect(() => storage.deleteAsset('', 0, 0)).not.toThrow();
    });

    it('should handle extremely large coordinates', () => {
      const asset: Asset = {
        address: 'Large coordinates',
        latitude: 999999.999999,
        longitude: -999999.999999,
      };

      expect(() => storage.addAssets('test', [asset])).not.toThrow();
      const result = storage.deleteAsset('test', 999999.999999, -999999.999999);
      expect(result.success).toBe(true);
    });

    it('should handle very long addresses', () => {
      const longAddress = 'A'.repeat(1000);
      const asset: Asset = {
        address: longAddress,
        latitude: 40.0,
        longitude: -74.0,
      };

      expect(() => storage.addAssets('test', [asset])).not.toThrow();
      const assets = storage.getAssets('test');
      expect(assets[0]?.address).toBe(longAddress);
    });

    it('should handle Unicode characters in addresses and company IDs', () => {
      const unicodeAsset: Asset = {
        address: '东京都千代田区 🏢',
        latitude: 35.6762,
        longitude: 139.6503,
      };

      storage.addAssets('会社名', [unicodeAsset]);
      const assets = storage.getAssets('会社');
      expect(assets).toHaveLength(1);
      expect(assets[0]?.address).toBe('东京都千代田区 🏢');
    });
  });
});
