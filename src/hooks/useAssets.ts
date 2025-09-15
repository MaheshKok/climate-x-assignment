/**
 * React Query hooks for asset management
 * Custom hooks for fetching, uploading, and deleting assets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../lib/queryClient';
import { AssetWithCompany, AssetsListResponse, AssetUploadResponse } from '../types/asset';

export function useAssets(companyId?: string) {
  return useQuery({
    queryKey: queryKeys.assets.list(companyId),
    queryFn: async (): Promise<AssetWithCompany[]> => {
      const url = companyId
        ? `/api/assets?companyId=${encodeURIComponent(companyId)}`
        : '/api/assets';

      const response = await fetch(url);
      const data: AssetsListResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch assets');
      }

      return data.assets;
    },
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData): Promise<AssetUploadResponse> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            // Progress tracking could be implemented here if needed
            Math.round((event.loaded / event.total) * 100);
          }
        };

        xhr.onload = () => {
          try {
            if (xhr.status === 200) {
              const response: AssetUploadResponse = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } else {
              let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText || 'Request failed'}`;
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.error || errorMessage;
              } catch {
                // Use default error message
              }
              reject(new Error(errorMessage));
            }
          } catch (error) {
            reject(new Error(error instanceof Error ? error.message : 'Unexpected error occurred'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };

        xhr.open('POST', '/api/assets/upload');
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
    retry: 1,
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: { companyId: string; latitude: number; longitude: number }) => {
      const response = await fetch('/api/assets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete asset');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
    retry: 1,
  });
}
