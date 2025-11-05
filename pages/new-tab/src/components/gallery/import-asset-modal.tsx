/**
 * Import Asset Modal
 * Allows users to import assets (images, videos, audio) from local files
 * Features: Drag & drop, file validation, preview, batch upload
 * SOLID: Single Responsibility - Only handles asset import UI
 */

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
} from '@extension/ui';
import { db } from '@src/db';
import { getFileUploadService } from '@src/services/file-upload-service';
import { CheckCircle2, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { AssetUploadSource } from '@extension/database';
import type { UploadedFile } from '@src/services/file-upload-service';
import type React from 'react';

interface ImportAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (assetIds: number[]) => void;
}

interface ImportStatus {
  file: UploadedFile;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  assetId?: number;
  error?: string;
}

const ImportAssetModal: React.FC<ImportAssetModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const fileUploadService = getFileUploadService();

  // Handle file selection
  const handleFilesSelected = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      try {
        const uploadedFiles = await fileUploadService.readFiles(fileList);
        setFiles(prev => [...prev, ...uploadedFiles]);
        setImportStatuses(prev => [
          ...prev,
          ...uploadedFiles.map(file => ({
            file,
            status: 'pending' as const,
          })),
        ]);
      } catch (error) {
        console.error('[ImportAssetModal] File read error:', error);
        alert(error instanceof Error ? error.message : 'Failed to read files');
      }
    },
    [fileUploadService],
  );

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      handleFilesSelected(droppedFiles);
    },
    [handleFilesSelected],
  );

  // Remove file from list
  const handleRemoveFile = useCallback(
    (index: number) => {
      setFiles(prev => {
        const newFiles = [...prev];
        const removed = newFiles.splice(index, 1)[0];
        fileUploadService.revokePreview(removed.preview);
        return newFiles;
      });
      setImportStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses.splice(index, 1);
        return newStatuses;
      });
    },
    [fileUploadService],
  );

  // Import assets to database
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    const uploadSource: AssetUploadSource = 'imported';
    const importedIds: number[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setImportStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[i] = { ...newStatuses[i], status: 'uploading' };
        return newStatuses;
      });

      try {
        let assetId: number | undefined;

        if (file.type === 'image') {
          assetId = await db.images.add({
            data: file.blob,
            uploadSource,
            originalFilename: file.filename,
            uploadedAt: new Date(),
            mimeType: file.mimeType,
          });
        } else if (file.type === 'video') {
          assetId = await db.videos.add({
            data: file.blob,
            uploadSource,
            originalFilename: file.filename,
            uploadedAt: new Date(),
            mimeType: file.mimeType,
          });
        } else if (file.type === 'audio') {
          assetId = await db.audios.add({
            data: file.blob,
            uploadSource,
            originalFilename: file.filename,
            uploadedAt: new Date(),
            mimeType: file.mimeType,
          });
        }

        if (assetId) {
          importedIds.push(assetId);
          setImportStatuses(prev => {
            const newStatuses = [...prev];
            newStatuses[i] = { ...newStatuses[i], status: 'success', assetId };
            return newStatuses;
          });
        }
      } catch (error) {
        console.error(`[ImportAssetModal] Failed to import ${file.filename}:`, error);
        setImportStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[i] = {
            ...newStatuses[i],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Import failed',
          };
          return newStatuses;
        });
      }
    }

    setIsImporting(false);
    onImportComplete(importedIds);

    // Cleanup previews
    files.forEach(file => fileUploadService.revokePreview(file.preview));
  }, [files, onImportComplete, fileUploadService]);

  // Close and cleanup
  const handleClose = useCallback(() => {
    if (!isImporting) {
      files.forEach(file => fileUploadService.revokePreview(file.preview));
      setFiles([]);
      setImportStatuses([]);
      onClose();
    }
  }, [isImporting, files, onClose, fileUploadService]);

  const hasFiles = files.length > 0;
  const successCount = importStatuses.filter(s => s.status === 'success').length;
  const failedCount = importStatuses.filter(s => s.status === 'failed').length;
  const hasStarted = importStatuses.some(s => s.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Import Assets
          </DialogTitle>
          <DialogDescription>Upload images, videos, or audio files to your asset gallery</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drag & Drop Zone */}
          {!hasStarted && (
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}>
              <Upload className="text-muted-foreground mx-auto mb-4 size-12" />
              <p className="mb-2 text-lg font-medium">{isDragging ? 'Drop files here' : 'Drag & drop files here'}</p>
              <p className="text-muted-foreground mb-4 text-sm">or</p>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,video/*,audio/*';
                  input.onchange = e => {
                    const target = e.target as HTMLInputElement;
                    handleFilesSelected(target.files);
                  };
                  input.click();
                }}>
                Browse Files
              </Button>
              <p className="text-muted-foreground mt-4 text-xs">
                Supported: Images (PNG, JPG, GIF, WebP), Videos (MP4, WebM), Audio (MP3, WAV, OGG)
              </p>
            </div>
          )}

          {/* File List */}
          {hasFiles && (
            <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-lg border p-4">
              {files.map((file, index) => {
                const status = importStatuses[index];
                return (
                  <div key={index} className="bg-card flex items-center gap-3 rounded-lg border p-3">
                    {/* Preview Thumbnail */}
                    <div className="bg-muted size-16 flex-shrink-0 overflow-hidden rounded">
                      {file.type === 'image' ? (
                        <img src={file.preview} alt={file.filename} className="size-full object-cover" />
                      ) : file.type === 'video' ? (
                        <video src={file.preview} className="size-full object-cover">
                          <track kind="captions" />
                        </video>
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Upload className="text-muted-foreground size-6" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.filename}</p>
                      <p className="text-muted-foreground text-xs">
                        {file.type} • {fileUploadService.formatFileSize(file.size)}
                      </p>
                      {status?.status === 'uploading' && <Progress value={50} className="mt-2 h-1" />}
                      {status?.error && <p className="mt-1 text-xs text-red-600">{status.error}</p>}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {status?.status === 'pending' && !isImporting && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                          <X className="size-4" />
                        </Button>
                      )}
                      {status?.status === 'uploading' && (
                        <div className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
                      )}
                      {status?.status === 'success' && <CheckCircle2 className="size-5 text-green-600" />}
                      {status?.status === 'failed' && <XCircle className="size-5 text-red-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Stats */}
          {hasStarted && !isImporting && (
            <div className="bg-muted/50 flex gap-4 rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="font-medium">{successCount} Successful</span>
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-600" />
                  <span className="font-medium">{failedCount} Failed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <DialogFooter>
          {!hasStarted ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!hasFiles || isImporting}>
                Import {hasFiles && `(${files.length})`}
              </Button>
            </>
          ) : isImporting ? (
            <Button disabled>
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Importing...
            </Button>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImportAssetModal };
export type { ImportAssetModalProps };
