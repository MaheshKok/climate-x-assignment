/**
 * GET /assets
 * Retrieve stored assets with optional companyId filter
 */

import { NextApiRequest, NextApiResponse } from 'next';

import { assetStorage } from '../../../src/lib/storage';
import { AssetsListResponse } from '../../../src/types/asset';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetsListResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      assets: [],
      total: 0,
      error: 'Method not allowed',
    });
  }

  try {
    const { companyId } = req.query;

    // Use shared storage
    const assets = assetStorage.getAssets(companyId as string);

    return res.status(200).json({
      success: true,
      assets,
      total: assets.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      assets: [],
      total: 0,
      error: 'Internal server error',
    });
  }
}
