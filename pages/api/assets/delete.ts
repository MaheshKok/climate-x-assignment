/**
 * DELETE /assets/delete
 * Delete asset by latitude, longitude and companyId
 */

import { NextApiRequest, NextApiResponse } from 'next';

import { assetStorage } from '../../../src/lib/storage';
import { AssetDeleteResponse } from '../../../src/types/asset';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetDeleteResponse>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only DELETE method is supported',
    });
  }

  try {
    const { companyId, latitude, longitude } = req.body;

    // Validate required fields
    if (!companyId?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'companyId is required',
      });
    }

    if (typeof latitude !== 'number' || isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'latitude must be a valid number',
      });
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'longitude must be a valid number',
      });
    }

    // Validate latitude/longitude ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'latitude must be between -90 and 90',
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'longitude must be between -180 and 180',
      });
    }

    // Attempt to delete the asset
    const deleteResult = assetStorage.deleteAsset(companyId, latitude, longitude);

    if (deleteResult.success && deleteResult.deletedAsset) {
      return res.status(200).json({
        success: true,
        message: `Asset "${deleteResult.deletedAsset.address}" deleted successfully from company ${companyId}`,
        deletedAsset: {
          address: deleteResult.deletedAsset.address,
          companyId: companyId,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
        error: `No asset found at coordinates (${latitude}, ${longitude}) for company ${companyId}`,
      });
    }
  } catch (error) {
    console.error('Delete asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
}
