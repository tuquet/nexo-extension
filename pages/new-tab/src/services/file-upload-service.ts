/**
 * File Upload Service
 * Handles file validation, reading, and preview generation for manual asset uploads
 * SOLID: Single Responsibility - Only handles file operations
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface FileValidationOptions {
  maxSizeBytes: number;
  allowedTypes: string[]; // MIME types: ['image/png', 'video/mp4', ...]
  allowedExtensions?: string[]; // Extensions: ['.png', '.mp4', ...]
}

interface UploadedFile {
  file: File;
  blob: Blob;
  type: 'image' | 'video' | 'audio';
  preview: string; // Object URL for preview
  size: number;
  filename: string;
  mimeType: string;
  lastModified: Date;
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

// ============================================================================
// Custom Errors
// ============================================================================

class FileUploadError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'READ_FAILED' | 'INVALID_FILE' | 'UNKNOWN_TYPE',
    public fileName?: string,
  ) {
    super(message);
    this.name = 'FileUploadError';
  }
}

// ============================================================================
// File Upload Service Class
// ============================================================================

class FileUploadService {
  private readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly DEFAULT_ALLOWED_TYPES = [
    // Images
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ];

  /**
   * Validate a single file
   */
  validateFile(file: File, options?: Partial<FileValidationOptions>): FileValidationResult {
    const maxSize = options?.maxSizeBytes ?? this.DEFAULT_MAX_SIZE;
    const allowedTypes = options?.allowedTypes ?? this.DEFAULT_ALLOWED_TYPES;
    const allowedExtensions = options?.allowedExtensions;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" is too large (${this.formatFileSize(file.size)}). Maximum allowed: ${this.formatFileSize(maxSize)}`,
      };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed for "${file.name}"`,
      };
    }

    // Check file extension if specified
    if (allowedExtensions) {
      const extension = this.getFileExtension(file.name);
      if (!allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension "${extension}" is not allowed for "${file.name}"`,
        };
      }
    }

    return { valid: true, file };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: FileList | File[], options?: Partial<FileValidationOptions>): FileValidationResult[] {
    const fileArray = Array.from(files);
    return fileArray.map(file => this.validateFile(file, options));
  }

  /**
   * Read files and create UploadedFile objects with previews
   */
  async readFiles(files: FileList | File[], options?: Partial<FileValidationOptions>): Promise<UploadedFile[]> {
    const fileArray = Array.from(files);
    const validationResults = this.validateFiles(files, options);

    const uploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validation = validationResults[i];

      if (!validation.valid) {
        throw new FileUploadError(validation.error!, 'INVALID_FILE', file.name);
      }

      try {
        const blob = await this.readFileAsBlob(file);
        const assetType = this.determineAssetType(file.type);
        const preview = this.createPreview(blob);

        uploadedFiles.push({
          file,
          blob,
          type: assetType,
          preview,
          size: file.size,
          filename: file.name,
          mimeType: file.type,
          lastModified: new Date(file.lastModified),
        });
      } catch (error) {
        throw new FileUploadError(
          `Failed to read file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          'READ_FAILED',
          file.name,
        );
      }
    }

    return uploadedFiles;
  }

  /**
   * Read a single file as Blob
   */
  async readFileAsBlob(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Blob([reader.result], { type: file.type }));
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };

      reader.onerror = () => reject(new Error(reader.error?.message || 'File read error'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Create object URL for preview
   */
  createPreview(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke object URL to free memory
   */
  revokePreview(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Batch revoke multiple previews
   */
  revokePreviews(urls: string[]): void {
    urls.forEach(url => this.revokePreview(url));
  }

  /**
   * Determine asset type from MIME type
   */
  determineAssetType(mimeType: string): 'image' | 'video' | 'audio' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    throw new FileUploadError(`Unknown file type: ${mimeType}`, 'UNKNOWN_TYPE');
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get duration from video/audio file
   */
  async getMediaDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const media = file.type.startsWith('video') ? document.createElement('video') : document.createElement('audio');

      media.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(media.duration);
      };

      media.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load media metadata'));
      };

      media.src = url;
    });
  }

  /**
   * Create thumbnail for video file
   */
  async createVideoThumbnail(file: File, timeSeconds: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(timeSeconds, video.duration);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };

      video.src = url;
    });
  }
}

// ============================================================================
// Singleton Instance & Factory
// ============================================================================

let fileUploadServiceInstance: FileUploadService | null = null;

const getFileUploadService = (): FileUploadService => {
  if (!fileUploadServiceInstance) {
    fileUploadServiceInstance = new FileUploadService();
  }
  return fileUploadServiceInstance;
};

const setFileUploadService = (service: FileUploadService): void => {
  fileUploadServiceInstance = service;
};

// ============================================================================
// Exports
// ============================================================================

export { FileUploadError, FileUploadService, getFileUploadService, setFileUploadService };
export type { FileValidationOptions, FileValidationResult, UploadedFile };
