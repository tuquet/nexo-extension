/**
 * Export Service
 *
 * Purpose: Handle script and asset export functionality
 * Responsibilities:
 * - Export scripts as JSON
 * - Export scripts with assets as ZIP
 * - Generate proper filenames
 * - Trigger browser downloads
 *
 * Benefits:
 * - Single place for all export logic
 * - Reusable across components
 * - Easy to test
 * - Separation of concerns (UI doesn't handle file creation)
 */

import { imageRepository, videoRepository, audioRepository } from './repositories';
import JSZip from 'jszip';
import type { ScriptStory } from '@src/types';

/**
 * Export format options
 */
type ExportFormat = 'json' | 'zip';

/**
 * Export options
 */
interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeAssets?: boolean;
}

/**
 * Generate safe filename from script
 */
const generateFilename = (script: ScriptStory, format: ExportFormat): string => {
  const aliasPart = script.alias
    ? script.alias.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'script';

  return format === 'json' ? `${aliasPart}.json` : `${aliasPart}.zip`;
};

/**
 * Generate default filename for multiple scripts
 */
const generateBatchFilename = (): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `cinegenie-scripts-${timestamp}.json`;
};

/**
 * Trigger browser download
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Export Service
 * Handles all export functionality
 */
class ExportService {
  /**
   * Export single script as JSON
   */
  async exportScriptAsJson(script: ScriptStory, filename?: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(script, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const finalFilename = filename || generateFilename(script, 'json');

      downloadBlob(blob, finalFilename);
    } catch (error) {
      console.error('[ExportService] Failed to export script as JSON:', error);
      throw new Error('Không thể xuất kịch bản dưới dạng JSON');
    }
  }

  /**
   * Export multiple scripts as JSON
   */
  async exportScriptsAsJson(scripts: ScriptStory[], filename?: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(scripts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const finalFilename = filename || generateBatchFilename();

      downloadBlob(blob, finalFilename);
    } catch (error) {
      console.error('[ExportService] Failed to export scripts as JSON:', error);
      throw new Error('Không thể xuất danh sách kịch bản');
    }
  }

  /**
   * Export script with all assets as ZIP
   */
  async exportScriptAsZip(script: ScriptStory, filename?: string): Promise<void> {
    if (!script.id) {
      throw new Error('Script ID is required for ZIP export');
    }

    try {
      const zip = new JSZip();

      // 1. Add script JSON
      const scriptJson = JSON.stringify(script, null, 2);
      zip.file('script.json', scriptJson);

      // 2. Add full script audio (if exists)
      const fullAudio = await audioRepository.getByScriptId(script.id);
      if (fullAudio.length > 0 && fullAudio[0].data) {
        zip.file('full_script_audio.mp3', fullAudio[0].data);
      }

      // 3. Add scene assets
      for (const act of script.acts) {
        for (const scene of act.scenes) {
          // Scene image
          if (scene.generatedImageId) {
            const imageData = await imageRepository.get(scene.generatedImageId);
            if (imageData?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.png`, imageData.data);
            }
          }

          // Scene video
          if (scene.generatedVideoId) {
            const videoData = await videoRepository.get(scene.generatedVideoId);
            if (videoData?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.mp4`, videoData.data);
            }
          }

          // Dialogue audio
          for (const [dialogueIndex, dialogue] of scene.dialogues.entries()) {
            if (dialogue.generatedAudioId) {
              try {
                const audioData = await audioRepository.get(dialogue.generatedAudioId);
                if (audioData?.data) {
                  zip.file(`scene_${scene.scene_number}_dialogue_${dialogueIndex + 1}.mp3`, audioData.data);
                } else {
                  console.warn(
                    `[ExportService] No audio found for scene ${scene.scene_number}, dialogue ${dialogueIndex + 1}`,
                  );
                }
              } catch (error) {
                console.warn(
                  `[ExportService] Failed to fetch audio for scene ${scene.scene_number}, dialogue ${dialogueIndex + 1}:`,
                  error,
                );
              }
            }
          }
        }
      }

      // 4. Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const finalFilename = filename || generateFilename(script, 'zip');

      downloadBlob(zipBlob, finalFilename);
    } catch (error) {
      console.error('[ExportService] Failed to export script as ZIP:', error);
      throw new Error(error instanceof Error ? error.message : 'Không thể tạo file ZIP');
    }
  }

  /**
   * Export script (auto-detect format)
   */
  async exportScript(script: ScriptStory, options: ExportOptions = { format: 'json' }): Promise<void> {
    if (options.format === 'zip') {
      return this.exportScriptAsZip(script, options.filename);
    } else {
      return this.exportScriptAsJson(script, options.filename);
    }
  }
}

/**
 * Singleton instance
 * Use this throughout the application
 */
const exportService = new ExportService();

export type { ExportFormat, ExportOptions };
export { ExportService, exportService };
