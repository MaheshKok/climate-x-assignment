/**
 * Unit tests for GET /api/assets endpoint
 * Tests asset retrieval, filtering, and error handling
 */

import { createMocks } from 'node-mocks-http';

import handler from '../../pages/api/assets/index';
import { assetStorage } from '../../src/lib/storage';

// Mock the storage module
jest.mock('../../src/lib/storage', () => ({
  assetStorage: {
    getAssets: jest.fn(),
  },
}));

const mockAssetStorage = assetStorage as jest.Mocked<typeof assetStorage>;

describe('/api/assets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should return all assets when no companyId is provided', async () => {
      const mockAssets = [
        {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.006,
          companyId: 'company1',
        },
        {
          address: '456 Oak Ave, Los Angeles, CA',
          latitude: 34.0522,
          longitude: -118.2437,
          companyId: 'company2',
        },
      ];

      mockAssetStorage.getAssets.mockReturnValue(mockAssets);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered assets when companyId is provided', async () => {
      const mockAssets = [
        {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.006,
          companyId: 'company1',
        },
      ];

      mockAssetStorage.getAssets.mockReturnValue(mockAssets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: 'company1',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.assets[0].companyId).toBe('company1');
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith('company1');
    });

    it('should handle partial company name matching', async () => {
      const mockAssets = [
        {
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.006,
          companyId: 'company1',
        },
        {
          address: '456 Oak Ave',
          latitude: 34.0522,
          longitude: -118.2437,
          companyId: 'company2',
        },
      ];

      mockAssetStorage.getAssets.mockReturnValue(mockAssets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: 'comp',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(2);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith('comp');
    });

    it('should return empty array when no assets match', async () => {
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: 'nonexistent',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('should handle empty string companyId', async () => {
      const mockAssets = [
        {
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.006,
          companyId: 'company1',
        },
      ];

      mockAssetStorage.getAssets.mockReturnValue(mockAssets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: '',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith('');
    });

    it('should handle multiple query parameters correctly', async () => {
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: 'test',
          otherParam: 'ignored',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith('test');
    });

    it('should handle array companyId query parameter', async () => {
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: ['company1', 'company2'],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Should use the first value when array is provided
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith('company1,company2');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when storage throws an error', async () => {
      mockAssetStorage.getAssets.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.assets).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should handle storage returning null/undefined', async () => {
      mockAssetStorage.getAssets.mockReturnValue(null as any);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assets).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('HTTP method validation', () => {
    it('should return 405 for POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
      expect(data.assets).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return 405 for PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should return 405 for DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should return 405 for PATCH requests', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('Response format validation', () => {
    it('should always return consistent response structure', async () => {
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('assets');
      expect(data).toHaveProperty('total');
      expect(typeof data.success).toBe('boolean');
      expect(Array.isArray(data.assets)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('should include error field in error responses', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });

  describe('Performance and stress testing', () => {
    it('should handle large number of assets efficiently', async () => {
      const largeAssetArray = Array.from({ length: 10000 }, (_, i) => ({
        address: `Address ${i}`,
        latitude: 40 + i * 0.001,
        longitude: -74 - i * 0.001,
        companyId: `company${i % 10}`,
      }));

      mockAssetStorage.getAssets.mockReturnValue(largeAssetArray);

      const { req, res } = createMocks({
        method: 'GET',
      });

      const startTime = Date.now();
      await handler(req, res);
      const endTime = Date.now();

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.assets).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests appropriately', async () => {
      mockAssetStorage.getAssets.mockReturnValue([
        {
          address: '123 Test St',
          latitude: 40.0,
          longitude: -74.0,
          companyId: 'test',
        },
      ]);

      const promises = Array.from({ length: 100 }, () => {
        const { req, res } = createMocks({
          method: 'GET',
        });
        return handler(req, res).then(() => res);
      });

      const responses = await Promise.all(promises);

      responses.forEach(res => {
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long company names', async () => {
      const longCompanyName = 'a'.repeat(1000);
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: longCompanyName,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith(longCompanyName);
    });

    it('should handle Unicode characters in company names', async () => {
      const unicodeCompanyName = '会社名 🏢';
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: unicodeCompanyName,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith(unicodeCompanyName);
    });

    it('should handle special characters in company names', async () => {
      const specialCompanyName = 'company@#$%^&*()_+-=';
      mockAssetStorage.getAssets.mockReturnValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          companyId: specialCompanyName,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockAssetStorage.getAssets).toHaveBeenCalledWith(specialCompanyName);
    });
  });
});
