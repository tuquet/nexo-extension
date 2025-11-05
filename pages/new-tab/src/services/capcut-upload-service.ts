interface UploadAssetRequest {
  file: Blob;
  filename: string;
  type: 'image' | 'video' | 'audio';
}

interface UploadAssetResponse {
  success: boolean;
  local_path: string;
  asset_type: string;
  filename: string;
  size: number;
}

interface BatchUploadOptions {
  onProgress?: (assetId: number, progress: number) => void;
  onComplete?: (assetId: number, result: UploadAssetResponse) => void;
  onError?: (assetId: number, error: Error) => void;
  abortSignal?: AbortSignal;
}

class CapCutUploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'CapCutUploadError';
  }
}

class CapCutUploadService {
  private serverUrl: string;
  private defaultTimeout: number = 60000;

  constructor(serverUrl: string = 'http://localhost:9001') {
    this.serverUrl = serverUrl;
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/upload/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  }

  async uploadAsset(
    request: UploadAssetRequest,
    options?: { onProgress?: (progress: number) => void; abortSignal?: AbortSignal },
  ): Promise<UploadAssetResponse> {
    const formData = new FormData();
    formData.append('file', request.file, request.filename);

    return new Promise<UploadAssetResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable && options?.onProgress) {
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response);
            } else {
              reject(new CapCutUploadError(response.error || 'Upload failed', 'UPLOAD_FAILED', xhr.status));
            }
          } catch {
            reject(new CapCutUploadError('Invalid response', 'INVALID_RESPONSE', xhr.status));
          }
        } else {
          reject(new CapCutUploadError(`Upload failed with status ${xhr.status}`, 'HTTP_ERROR', xhr.status));
        }
      });

      xhr.addEventListener('error', () => reject(new CapCutUploadError('Network error', 'NETWORK_ERROR')));
      xhr.addEventListener('abort', () => reject(new CapCutUploadError('Upload aborted', 'ABORTED')));
      xhr.timeout = this.defaultTimeout;
      xhr.addEventListener('timeout', () => reject(new CapCutUploadError('Upload timeout', 'TIMEOUT')));

      if (options?.abortSignal) {
        options.abortSignal.addEventListener('abort', () => xhr.abort());
      }

      xhr.open('POST', `${this.serverUrl}/api/upload/asset`);
      xhr.send(formData);
    });
  }

  async uploadBatch(
    requests: Array<UploadAssetRequest & { id: number }>,
    options?: BatchUploadOptions,
  ): Promise<Map<number, UploadAssetResponse | Error>> {
    const results = new Map<number, UploadAssetResponse | Error>();

    for (const request of requests) {
      if (options?.abortSignal?.aborted) {
        results.set(request.id, new CapCutUploadError('Batch upload aborted', 'ABORTED'));
        break;
      }

      try {
        options?.onProgress?.(request.id, 0);
        const result = await this.uploadAsset(request, {
          onProgress: progress => options?.onProgress?.(request.id, progress),
          abortSignal: options?.abortSignal,
        });
        results.set(request.id, result);
        options?.onComplete?.(request.id, result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        results.set(request.id, err);
        options?.onError?.(request.id, err);
      }
    }

    return results;
  }
}

let instance: CapCutUploadService | null = null;

const getCapCutUploadService = (): CapCutUploadService => {
  if (!instance) {
    instance = new CapCutUploadService();
  }
  return instance;
};

const setCapCutUploadService = (service: CapCutUploadService): void => {
  instance = service;
};

export type { UploadAssetRequest, UploadAssetResponse, BatchUploadOptions };
export { CapCutUploadError, CapCutUploadService, getCapCutUploadService, setCapCutUploadService };
export { CapCutUploadService as default };
