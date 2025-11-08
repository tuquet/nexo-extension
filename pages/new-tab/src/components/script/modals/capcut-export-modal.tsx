/**
 * CapCut Export Modal
 * UI for exporting script with assets to CapCut draft
 */

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
  Alert,
  AlertDescription,
} from '@extension/ui';
import { db } from '@src/db';
import { capcutAPI } from '@src/services/capcut-api';
import { useCapCutStore } from '@src/stores/use-capcut-store';
import { Film, Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { ScriptStory } from '@src/types';
import type React from 'react';

interface CapCutExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ScriptStory;
}

const CapCutExportModal: React.FC<CapCutExportModalProps> = ({ isOpen, onClose, script }) => {
  const {
    isExporting,
    currentStage,
    progress,
    error,
    startExport,
    setStage,
    setDraftId,
    setTaskId,
    updateTaskStatus,
    completeExport,
    failExport,
    cancelExport,
    resetExport,
    serverUrl,
    isServerConnected,
    setServerConnected,
  } = useCapCutStore();

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

  // Check server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        capcutAPI.setConfig({ serverUrl });
        const healthy = await capcutAPI.healthCheck();
        setServerConnected(healthy);
      } catch {
        setServerConnected(false);
      }
    };

    if (isOpen) {
      checkHealth();
    }
  }, [isOpen, serverUrl, setServerConnected]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (abortController) {
        abortController.abort();
      }
    },
    [abortController],
  );

  const handleExport = useCallback(async () => {
    if (!script.id) return;

    const controller = new AbortController();
    setAbortController(controller);

    try {
      startExport(script.id, script.title);

      // Gather all assets from scenes
      const videos: { blob: Blob; filename: string; start: number; duration?: number }[] = [];
      const images: { blob: Blob; filename: string; start: number; duration?: number }[] = [];
      const audios: { blob: Blob; filename: string; start: number; volume?: number }[] = [];

      let currentTime = 0;

      for (const act of script.acts) {
        for (const scene of act.scenes) {
          // Get video if exists
          if (scene.generatedVideoId) {
            const video = await db.videos.get(scene.generatedVideoId);
            if (video?.data) {
              videos.push({
                blob: video.data,
                filename: `video_${scene.scene_number}.mp4`,
                start: currentTime,
              });
              currentTime += 5; // Assume 5s per video
            }
          }

          // Get image if exists
          if (scene.generatedImageId) {
            const image = await db.images.get(scene.generatedImageId);
            if (image?.data) {
              images.push({
                blob: image.data,
                filename: `image_${scene.scene_number}.png`,
                start: currentTime,
                duration: 5, // 5s per image
              });
              currentTime += 5;
            }
          }

          // Get audios from dialogues
          for (const dialogue of scene.dialogues) {
            if (dialogue.generatedAudioId) {
              const audio = await db.audios.get(dialogue.generatedAudioId);
              if (audio?.data) {
                audios.push({
                  blob: audio.data,
                  filename: `audio_${scene.scene_number}_${dialogue.roleId}.mp3`,
                  start: currentTime,
                  volume: 1.0,
                });
              }
            }
          }
        }
      }

      // Check if there are any assets
      if (videos.length === 0 && images.length === 0 && audios.length === 0) {
        throw new Error('No assets found. Please generate images, videos, or audio first.');
      }

      // Configure API
      capcutAPI.setConfig({ serverUrl });

      // Start export
      const videoUrl = await capcutAPI.exportScript({
        videos,
        images,
        audios,
        signal: controller.signal,
        onProgress: (stage, prog) => {
          setStage(stage, prog);

          // Update draft/task IDs when available
          if (stage === 'Creating draft' && prog > 5) {
            // Draft ID will be set via API response
          }
        },
      });

      setResultVideoUrl(videoUrl);
      completeExport(videoUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('abort')) {
          cancelExport();
        } else {
          failExport(err.message);
        }
      } else {
        failExport('Unknown error occurred');
      }
    } finally {
      setAbortController(null);
    }
  }, [
    script,
    startExport,
    setStage,
    setDraftId,
    setTaskId,
    updateTaskStatus,
    completeExport,
    failExport,
    cancelExport,
    serverUrl,
  ]);

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      cancelExport();
    }
  }, [abortController, cancelExport]);

  const handleClose = useCallback(() => {
    if (isExporting) {
      handleCancel();
    }
    resetExport();
    setResultVideoUrl(null);
    onClose();
  }, [isExporting, handleCancel, resetExport, onClose]);

  const handleDownload = useCallback(() => {
    if (resultVideoUrl) {
      window.open(resultVideoUrl, '_blank');
    }
  }, [resultVideoUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="size-5" />
            Export to CapCut
          </DialogTitle>
          <DialogDescription>Export your script with all generated assets to CapCut draft</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Server Status */}
          {!isServerConnected && !isExporting && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                CapCut server is not running. Please start the server at{' '}
                <code className="bg-muted rounded px-1 py-0.5">{serverUrl}</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Section */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{currentStage}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error Section */}
          {error && !isExporting && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Section */}
          {resultVideoUrl && !isExporting && (
            <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
              <CheckCircle2 className="size-4" />
              <AlertDescription>Export completed successfully!</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          {!isExporting && !error && !resultVideoUrl && (
            <div className="bg-muted/50 rounded-lg border p-4 text-sm">
              <p className="mb-2 font-medium">What will be exported:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-1">
                <li>All generated videos from scenes</li>
                <li>All generated images from scenes</li>
                <li>All generated audio/voiceovers</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                The process may take 5-10 minutes depending on the number of assets.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {isExporting ? (
            <Button variant="destructive" onClick={handleCancel}>
              <X className="mr-2 size-4" />
              Cancel Export
            </Button>
          ) : resultVideoUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download Video
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={!isServerConnected}>
                {!isServerConnected && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isServerConnected && <Film className="mr-2 size-4" />}
                Start Export
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CapCutExportModal };
