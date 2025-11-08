/**
 * Gallery Upload Progress Modal
 * Shows real-time upload progress for batch asset uploads to CapCut server
 * REFACTORED: Uses capcut-upload-service.ts (SOLID: Dependency Inversion Principle)
 */

import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@extension/ui';
import { getCapCutUploadService } from '@src/services/capcut-upload-service';
import { useCapCutStore } from '@src/stores/use-capcut-store';
import { AlertCircle, CheckCircle2, CloudUpload, Download, Loader2, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

interface Asset {
  id: number;
  scriptId?: number; // Optional after schema v7 migration
  type: 'image' | 'video' | 'audio';
  url: string;
  scriptTitle?: string;
  dataType: string;
  data: Blob;
}

interface GalleryUploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

interface UploadResult {
  asset: Asset;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  localPath?: string;
  error?: string;
}

const GalleryUploadProgressModal: React.FC<GalleryUploadProgressModalProps> = ({ isOpen, onClose, assets }) => {
  const { serverUrl, isServerConnected, setServerConnected } = useCapCutStore();
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  // Initialize upload results when modal opens
  useEffect(() => {
    if (isOpen && assets.length > 0) {
      setUploadResults(
        assets.map(asset => ({
          asset,
          status: 'pending',
          progress: 0,
        })),
      );
      setOverallProgress(0);
    }
  }, [isOpen, assets]);

  // Check server health on mount (SOLID: Use service abstraction)
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const uploadService = getCapCutUploadService();
        uploadService.setServerUrl(serverUrl);
        const healthy = await uploadService.healthCheck();
        setServerConnected(healthy);
      } catch {
        setServerConnected(false);
      }
    };

    if (isOpen) {
      checkHealth();
    }
  }, [isOpen, serverUrl, setServerConnected]);

  // Cleanup abort controllers on unmount
  useEffect(
    () => () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    },
    [],
  );

  const updateResult = useCallback((assetId: number, updates: Partial<UploadResult>) => {
    setUploadResults(prev => prev.map(result => (result.asset.id === assetId ? { ...result, ...updates } : result)));
  }, []);

  const handleStartUpload = useCallback(async () => {
    if (!isServerConnected) return;

    setIsUploading(true);
    const uploadService = getCapCutUploadService();
    uploadService.setServerUrl(serverUrl);

    // Upload assets sequentially to avoid overwhelming the server
    let completedCount = 0;
    const totalCount = uploadResults.length;

    for (const result of uploadResults) {
      const controller = new AbortController();
      abortControllersRef.current.set(result.asset.id, controller);

      updateResult(result.asset.id, { status: 'uploading', progress: 0 });

      try {
        // Generate filename based on asset type and ID
        const extension = result.asset.dataType.split('/')[1] || 'bin';
        const filename = `${result.asset.type}_${result.asset.id}.${extension}`;

        // Use service abstraction (SOLID: Dependency Inversion)
        const response = await uploadService.uploadAsset(
          {
            file: result.asset.data,
            filename,
            type: result.asset.type,
          },
          {
            onProgress: (progressPercent: number) => {
              updateResult(result.asset.id, { progress: progressPercent });
            },
            abortSignal: controller.signal,
          },
        );

        updateResult(result.asset.id, {
          status: 'success',
          progress: 100,
          localPath: response.local_path,
        });
      } catch (error) {
        updateResult(result.asset.id, {
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      } finally {
        abortControllersRef.current.delete(result.asset.id);
        completedCount++;
        setOverallProgress((completedCount / totalCount) * 100);
      }
    }

    setIsUploading(false);
  }, [isServerConnected, serverUrl, uploadResults, updateResult]);

  const handleCancel = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    setIsUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isUploading) {
      handleCancel();
    }
    onClose();
  }, [isUploading, handleCancel, onClose]);

  const handleDownloadReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      totalAssets: uploadResults.length,
      successful: uploadResults.filter(r => r.status === 'success').length,
      failed: uploadResults.filter(r => r.status === 'failed').length,
      results: uploadResults.map(r => ({
        assetId: r.asset.id,
        assetType: r.asset.type,
        scriptTitle: r.asset.scriptTitle,
        status: r.status,
        localPath: r.localPath,
        error: r.error,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capcut-upload-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [uploadResults]);

  const successCount = uploadResults.filter(r => r.status === 'success').length;
  const failedCount = uploadResults.filter(r => r.status === 'failed').length;
  const hasStarted = uploadResults.some(r => r.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="size-5" />
            Upload Assets to CapCut
          </DialogTitle>
          <DialogDescription>
            Upload {assets.length} asset{assets.length !== 1 ? 's' : ''} to CapCut server for editing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Server Status */}
          {!isServerConnected && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                CapCut server is not running. Please start the server at{' '}
                <code className="bg-muted rounded px-1 py-0.5">{serverUrl}</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Overall Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary Stats (After Upload) */}
          {hasStarted && !isUploading && (
            <div className="bg-muted/50 flex gap-4 rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="font-medium">{successCount} Successful</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-red-600" />
                <span className="font-medium">{failedCount} Failed</span>
              </div>
            </div>
          )}

          {/* Upload Results List */}
          <div className="max-h-[300px] overflow-y-auto rounded-lg border">
            <div className="space-y-2 p-4">
              {uploadResults.map(result => (
                <div key={result.asset.id} className="bg-card flex items-center gap-3 rounded-lg border p-3 text-sm">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {result.status === 'pending' && <div className="border-muted size-5 rounded-full border-2" />}
                    {result.status === 'uploading' && <Loader2 className="size-5 animate-spin text-blue-600" />}
                    {result.status === 'success' && <CheckCircle2 className="size-5 text-green-600" />}
                    {result.status === 'failed' && <XCircle className="size-5 text-red-600" />}
                  </div>

                  {/* Asset Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{result.asset.type}</span>
                      <span className="text-muted-foreground">#{result.asset.id}</span>
                      {result.asset.scriptTitle && (
                        <span className="text-muted-foreground">• {result.asset.scriptTitle}</span>
                      )}
                    </div>

                    {/* Progress Bar (Uploading) */}
                    {result.status === 'uploading' && (
                      <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200"
                          style={{ width: `${result.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Success Message */}
                    {result.status === 'success' && result.localPath && (
                      <p className="text-muted-foreground">
                        Path: <code className="bg-muted rounded px-1">{result.localPath}</code>
                      </p>
                    )}

                    {/* Error Message */}
                    {result.status === 'failed' && result.error && <p className="text-red-600">{result.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions (Before Upload) */}
          {!hasStarted && (
            <div className="bg-muted/50 rounded-lg border p-4 text-sm">
              <p className="mb-2 font-medium">What will happen:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-1">
                <li>Each asset will be uploaded to CapCut server</li>
                <li>Server returns local file path for each asset</li>
                <li>You can use these paths for draft creation</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!hasStarted ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartUpload} disabled={!isServerConnected || assets.length === 0}>
                {!isServerConnected && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isServerConnected && <CloudUpload className="mr-2 size-4" />}
                Start Upload
              </Button>
            </>
          ) : isUploading ? (
            <Button variant="destructive" onClick={handleCancel}>
              <X className="mr-2 size-4" />
              Cancel Upload
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {successCount > 0 && (
                <Button onClick={handleDownloadReport}>
                  <Download className="mr-2 size-4" />
                  Download Report
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { GalleryUploadProgressModal };
