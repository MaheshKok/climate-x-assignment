/**
 * Shared in-memory storage for assets
 * In a real application, this would be a database
 */

import { Asset, AssetWithCompany } from '../types/asset';

// Global in-memory storage shared across API routes
class AssetStorage {
  private static instance: AssetStorage;
  private storage: { [companyId: string]: Asset[] } = {};

  private constructor() {
    // Initialize with sample data for demonstration
    this.storage = {
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
    };
  }

  public static getInstance(): AssetStorage {
    if (!AssetStorage.instance) {
      AssetStorage.instance = new AssetStorage();
    }
    return AssetStorage.instance;
  }

  public getAssets(companyId?: string): AssetWithCompany[] {
    if (companyId) {
      const assets = this.storage[companyId] || [];
      return assets.map(asset => ({ ...asset, companyId }));
    }

    // Return all assets with their companyId
    const allAssets: AssetWithCompany[] = [];
    for (const [compId, assets] of Object.entries(this.storage)) {
      allAssets.push(...assets.map(asset => ({ ...asset, companyId: compId })));
    }
    return allAssets;
  }

  public addAssets(
    companyId: string,
    assets: Asset[]
  ): { added: Asset[]; duplicatesSkipped: number } {
    if (!this.storage[companyId]) {
      this.storage[companyId] = [];
    }

    const existingAssets = this.storage[companyId];
    const newAssets: Asset[] = [];
    let duplicatesSkipped = 0;

    for (const asset of assets) {
      // Check for duplicates based on latitude, longitude, and companyId
      const isDuplicate = existingAssets.some(
        existing =>
          Math.abs(existing.latitude - asset.latitude) < 0.0001 &&
          Math.abs(existing.longitude - asset.longitude) < 0.0001
      );

      if (!isDuplicate) {
        newAssets.push(asset);
      } else {
        duplicatesSkipped++;
      }
    }

    this.storage[companyId].push(...newAssets);
    return { added: newAssets, duplicatesSkipped };
  }

  public deleteAsset(
    companyId: string,
    latitude: number,
    longitude: number
  ): { success: boolean; deletedAsset?: Asset } {
    if (!this.storage[companyId]) {
      return { success: false };
    }

    const assetsToDelete = this.storage[companyId].filter(
      asset =>
        Math.abs(asset.latitude - latitude) < 0.0001 &&
        Math.abs(asset.longitude - longitude) < 0.0001
    );

    if (assetsToDelete.length === 0) {
      return { success: false };
    }

    const deletedAsset = assetsToDelete[0];

    this.storage[companyId] = this.storage[companyId].filter(
      asset =>
        !(
          Math.abs(asset.latitude - latitude) < 0.0001 &&
          Math.abs(asset.longitude - longitude) < 0.0001
        )
    );

    // Clean up empty company arrays
    if (this.storage[companyId].length === 0) {
      delete this.storage[companyId];
    }

    return { success: true, ...(deletedAsset && { deletedAsset }) };
  }

  public getAllCompanies(): string[] {
    return Object.keys(this.storage);
  }

  public getTotalAssets(): number {
    return Object.values(this.storage).reduce((total, assets) => total + assets.length, 0);
  }
}

export const assetStorage = AssetStorage.getInstance();
