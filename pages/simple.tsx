/**
 * Simple Asset Management Test Page
 * Basic functionality without complex Chakra UI components
 */

import Head from 'next/head';
import React, { useState } from 'react';

import { Asset, AssetUploadResponse } from '../src/types/asset';

export default function SimplePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', 'Test upload');

    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data: AssetUploadResponse = await response.json();

      if (data.success && data.assets) {
        setMessage(`Upload successful: ${data.assets.length} assets uploaded`);
        setFile(null);
        loadAssets(); // Reload assets list
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setUploading(false);
  };

  const loadAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();

      if (data.success) {
        setAssets(data.assets);
      } else {
        setMessage(`Failed to load assets: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Load error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load assets on component mount
  React.useEffect(() => {
    loadAssets();
  }, []);

  return (
    <>
      <Head>
        <title>Simple Asset Management Test</title>
        <meta name='description' content='Simple test page for asset management functionality' />
      </Head>

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h1 style={{ color: '#2d3748', marginBottom: '30px' }}>Asset Management System Test</h1>

        {/* File Upload Section */}
        <div
          style={{
            border: '2px dashed #cbd5e0',
            padding: '40px',
            marginBottom: '30px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h2>Upload File</h2>
          <input
            type='file'
            onChange={handleFileChange}
            accept='.csv,.json,.jpg,.jpeg,.png,.pdf,.txt'
            style={{ marginBottom: '20px' }}
          />
          {file && (
            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#4a5568' }}>
              Selected: {file.name} ({Math.round(file.size / 1024)}KB)
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              backgroundColor: uploading ? '#a0aec0' : '#3182ce',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: message.includes('successful') ? '#c6f6d5' : '#fed7d7',
              border: `1px solid ${message.includes('successful') ? '#9ae6b4' : '#feb2b2'}`,
              borderRadius: '6px',
              color: message.includes('successful') ? '#22543d' : '#742a2a',
            }}
          >
            {message}
          </div>
        )}

        {/* Assets List */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2>Uploaded Assets ({assets.length})</h2>
            <button
              onClick={loadAssets}
              style={{
                backgroundColor: '#e2e8f0',
                color: '#2d3748',
                padding: '8px 16px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          {assets.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#a0aec0',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              No assets uploaded yet. Upload some files to get started!
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f7fafc' }}>
                  <tr>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      Size
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      Upload Date
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <tr
                      key={index}
                      style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}
                    >
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div>
                          <strong>{asset.address}</strong>
                          <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                            {asset.latitude}, {asset.longitude}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <span
                          style={{
                            backgroundColor: '#3182ce',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Asset
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>N/A</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>N/A</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <span
                          style={{
                            backgroundColor: '#e2e8f0',
                            color: '#4a5568',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                          }}
                        >
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* API Test Section */}
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
          }}
        >
          <h3>API Endpoints</h3>
          <ul style={{ marginTop: '10px' }}>
            <li>
              <strong>POST /api/assets/upload</strong> - Upload files with multipart form data
            </li>
            <li>
              <strong>GET /api/assets</strong> - Retrieve assets with filtering options
            </li>
          </ul>
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#4a5568' }}>
            Test the API endpoints using this interface or any HTTP client.
          </p>
        </div>
      </div>
    </>
  );
}
