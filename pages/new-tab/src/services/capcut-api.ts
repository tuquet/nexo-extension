/**
 * CapCut API Service
 * Handles communication with self-hosted CapCutAPI server
 *
 * Flow: Upload Assets → Create Draft → Add Media → Save Draft → Poll Status → Download
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface CapCutConfig {
  serverUrl: string; // e.g., 'http://localhost:9001'
  width: number;
  height: number;
}

interface UploadAssetResponse {
  success: boolean;
  local_path?: string;
  asset_type?: 'video' | 'image' | 'audio';
  filename?: string;
  size?: number;
  error?: string;
}

interface CreateDraftResponse {
  success: boolean;
  output?: {
    draft_id: string;
    draft_url: string;
  };
  error?: string;
}

interface AddMediaResponse {
  success: boolean;
  output?: {
    draft_id: string;
    draft_url: string;
  };
  error?: string;
}

interface SaveDraftResponse {
  success: boolean;
  output?: {
    task_id: string;
    draft_id: string;
  };
  error?: string;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress?: number; // 0-100
  video_url?: string;
  error?: string;
}

interface QueryTaskStatusResponse {
  success: boolean;
  output?: TaskStatus;
  error?: string;
}

// ============================================================================
// Error Classes
// ============================================================================

class CapCutAPIError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'CapCutAPIError';
  }
}

class UploadError extends CapCutAPIError {
  constructor(message: string, details?: unknown) {
    super(message, 'UPLOAD_ERROR', details);
    this.name = 'UploadError';
  }
}

class RenderTimeoutError extends CapCutAPIError {
  constructor(message: string) {
    super(message, 'RENDER_TIMEOUT');
    this.name = 'RenderTimeoutError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch wrapper with error handling
 */
const fetchWithErrorHandling = async <T>(url: string, options: RequestInit): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new CapCutAPIError(`HTTP ${response.status}: ${response.statusText}`, 'HTTP_ERROR', {
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof CapCutAPIError) {
      throw error;
    }

    throw new CapCutAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error,
    );
  }
};

// ============================================================================
// Main CapCut API Service
// ============================================================================

class CapCutAPIService {
  private config: CapCutConfig;

  constructor(config: Partial<CapCutConfig> = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:9001',
      width: config.width || 1080,
      height: config.height || 1920,
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CapCutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetchWithErrorHandling<{ success: boolean }>(
        `${this.config.serverUrl}/api/upload/health`,
        { method: 'GET' },
      );
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Step 1: Upload asset (video/image/audio) to server
   */
  async uploadAsset(blob: Blob, filename: string, onProgress?: (progress: number) => void): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, filename);

    try {
      // Note: Fetch API doesn't support upload progress natively
      // For progress tracking, consider using XMLHttpRequest
      const response = await fetchWithErrorHandling<UploadAssetResponse>(`${this.config.serverUrl}/api/upload/asset`, {
        method: 'POST',
        body: formData,
      });

      if (!response.success || !response.local_path) {
        throw new UploadError(response.error || 'Upload failed', response);
      }

      onProgress?.(100);
      return response.local_path;
    } catch (error) {
      if (error instanceof CapCutAPIError) {
        throw error;
      }
      throw new UploadError(
        `Failed to upload asset: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Step 2: Create new draft
   */
  async createDraft(width?: number, height?: number): Promise<{ draftId: string; draftUrl: string }> {
    const response = await fetchWithErrorHandling<CreateDraftResponse>(`${this.config.serverUrl}/create_draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: width || this.config.width,
        height: height || this.config.height,
      }),
    });

    if (!response.success || !response.output) {
      throw new CapCutAPIError(response.error || 'Failed to create draft');
    }

    return {
      draftId: response.output.draft_id,
      draftUrl: response.output.draft_url,
    };
  }

  /**
   * Step 3a: Add video to draft
   */
  async addVideo(params: {
    draftId: string;
    videoPath: string; // Local path from uploadAsset
    start?: number;
    end?: number;
    targetStart?: number;
    speed?: number;
    volume?: number;
    trackName?: string;
  }): Promise<void> {
    const response = await fetchWithErrorHandling<AddMediaResponse>(`${this.config.serverUrl}/add_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft_id: params.draftId,
        video_url: params.videoPath,
        start: params.start || 0,
        end: params.end,
        target_start: params.targetStart || 0,
        speed: params.speed || 1.0,
        volume: params.volume || 1.0,
        track_name: params.trackName || 'video_main',
        width: this.config.width,
        height: this.config.height,
      }),
    });

    if (!response.success) {
      throw new CapCutAPIError(response.error || 'Failed to add video');
    }
  }

  /**
   * Step 3b: Add image to draft
   */
  async addImage(params: {
    draftId: string;
    imagePath: string;
    targetStart?: number;
    duration?: number;
    trackName?: string;
  }): Promise<void> {
    const response = await fetchWithErrorHandling<AddMediaResponse>(`${this.config.serverUrl}/add_image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft_id: params.draftId,
        image_url: params.imagePath,
        target_start: params.targetStart || 0,
        duration: params.duration || 5.0,
        track_name: params.trackName || 'image_main',
        width: this.config.width,
        height: this.config.height,
      }),
    });

    if (!response.success) {
      throw new CapCutAPIError(response.error || 'Failed to add image');
    }
  }

  /**
   * Step 3c: Add audio to draft
   */
  async addAudio(params: {
    draftId: string;
    audioPath: string;
    targetStart?: number;
    volume?: number;
    speed?: number;
    trackName?: string;
  }): Promise<void> {
    const response = await fetchWithErrorHandling<AddMediaResponse>(`${this.config.serverUrl}/add_audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft_id: params.draftId,
        audio_url: params.audioPath,
        target_start: params.targetStart || 0,
        volume: params.volume || 1.0,
        speed: params.speed || 1.0,
        track_name: params.trackName || 'audio_main',
        width: this.config.width,
        height: this.config.height,
      }),
    });

    if (!response.success) {
      throw new CapCutAPIError(response.error || 'Failed to add audio');
    }
  }

  /**
   * Step 4: Save draft and start rendering
   */
  async saveDraft(draftId: string): Promise<string> {
    const response = await fetchWithErrorHandling<SaveDraftResponse>(`${this.config.serverUrl}/save_draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId }),
    });

    if (!response.success || !response.output?.task_id) {
      throw new CapCutAPIError(response.error || 'Failed to save draft');
    }

    return response.output.task_id;
  }

  /**
   * Step 5: Query task status (single call)
   */
  async queryTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetchWithErrorHandling<QueryTaskStatusResponse>(
      `${this.config.serverUrl}/query_task_status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      },
    );

    if (!response.success || !response.output) {
      throw new CapCutAPIError(response.error || 'Failed to query task status');
    }

    return response.output;
  }

  /**
   * Step 6: Poll task status until completion
   */
  async pollTaskStatus(
    taskId: string,
    options: {
      maxAttempts?: number; // Default: 120 (10 minutes with 5s interval)
      interval?: number; // Default: 5000ms (5 seconds)
      onProgress?: (status: TaskStatus) => void;
      signal?: AbortSignal; // For cancellation
    } = {},
  ): Promise<string> {
    const { maxAttempts = 120, interval = 5000, onProgress, signal } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if cancelled
      if (signal?.aborted) {
        throw new CapCutAPIError('Render cancelled by user', 'CANCELLED');
      }

      const status = await this.queryTaskStatus(taskId);
      onProgress?.(status);

      if (status.status === 'success' && status.video_url) {
        return status.video_url;
      }

      if (status.status === 'failed') {
        throw new CapCutAPIError(status.error || 'Render failed', 'RENDER_FAILED');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new RenderTimeoutError(`Render timeout after ${(maxAttempts * interval) / 1000} seconds`);
  }

  /**
   * Complete workflow: Upload → Create → Add Media → Render → Poll
   */
  async exportScript(params: {
    videos?: { blob: Blob; filename: string; start?: number; duration?: number }[];
    images?: { blob: Blob; filename: string; start?: number; duration?: number }[];
    audios?: { blob: Blob; filename: string; start?: number; volume?: number }[];
    onProgress?: (stage: string, progress: number) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    const { videos = [], images = [], audios = [], onProgress, signal } = params;

    try {
      // Stage 1: Create draft
      onProgress?.('Creating draft', 5);
      const { draftId } = await this.createDraft();

      // Stage 2: Upload assets
      const totalAssets = videos.length + images.length + audios.length;
      let uploadedAssets = 0;

      const updateUploadProgress = () => {
        uploadedAssets++;
        const progress = 5 + (uploadedAssets / totalAssets) * 30; // 5-35%
        onProgress?.('Uploading assets', Math.round(progress));
      };

      // Upload videos
      const uploadedVideos = await Promise.all(
        videos.map(async v => {
          const path = await this.uploadAsset(v.blob, v.filename);
          updateUploadProgress();
          return { path, start: v.start, duration: v.duration };
        }),
      );

      // Upload images
      const uploadedImages = await Promise.all(
        images.map(async img => {
          const path = await this.uploadAsset(img.blob, img.filename);
          updateUploadProgress();
          return { path, start: img.start, duration: img.duration };
        }),
      );

      // Upload audios
      const uploadedAudios = await Promise.all(
        audios.map(async a => {
          const path = await this.uploadAsset(a.blob, a.filename);
          updateUploadProgress();
          return { path, start: a.start, volume: a.volume };
        }),
      );

      // Stage 3: Add media to draft
      onProgress?.('Adding media to draft', 40);

      for (const video of uploadedVideos) {
        await this.addVideo({
          draftId,
          videoPath: video.path,
          targetStart: video.start,
          end: video.duration,
        });
      }

      for (const image of uploadedImages) {
        await this.addImage({
          draftId,
          imagePath: image.path,
          targetStart: image.start,
          duration: image.duration,
        });
      }

      for (const audio of uploadedAudios) {
        await this.addAudio({
          draftId,
          audioPath: audio.path,
          targetStart: audio.start,
          volume: audio.volume,
        });
      }

      // Stage 4: Save draft and start rendering
      onProgress?.('Starting render', 50);
      const taskId = await this.saveDraft(draftId);

      // Stage 5: Poll until completion
      const videoUrl = await this.pollTaskStatus(taskId, {
        signal,
        onProgress: status => {
          const progress = 50 + (status.progress || 0) * 0.5; // 50-100%
          onProgress?.('Rendering video', Math.round(progress));
        },
      });

      onProgress?.('Complete', 100);
      return videoUrl;
    } catch (error) {
      if (error instanceof CapCutAPIError) {
        throw error;
      }
      throw new CapCutAPIError(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPORT_FAILED',
        error,
      );
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const capcutAPI = new CapCutAPIService();

// ============================================================================
// Exports
// ============================================================================

export type {
  CapCutConfig,
  UploadAssetResponse,
  CreateDraftResponse,
  AddMediaResponse,
  SaveDraftResponse,
  TaskStatus,
  QueryTaskStatusResponse,
};
export { CapCutAPIService, CapCutAPIError, UploadError, RenderTimeoutError, capcutAPI };
