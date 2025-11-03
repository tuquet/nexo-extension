import { VBEE_API_BASE_URL } from '../../../../pages/new-tab/src/constants';
import { ApiAuthError } from '../../../../pages/new-tab/src/services/api-errors';
import type { ITTSService } from '../core/interfaces';

/**
 * Parameters for TTS project creation
 */
export interface CreateProjectParams {
  title: string;
  blocks: Array<{
    id: string;
    text: string;
    voiceCode: string;
    speed?: number;
    breakTime?: number;
  }>;
  bearerToken: string;
}

/**
 * Parameters for project status check
 */
export interface GetProjectStatusParams {
  projectId: string;
  bearerToken: string;
}

/**
 * Vbee project status response
 */
export interface ProjectStatusResponse {
  status: string;
  progress?: number;
  audioUrl?: string;
}

/**
 * VbeeTTSService - Encapsulates Vbee TTS API operations
 *
 * Implements ITTSService interface for dependency injection.
 * Handles project creation and status polling for async audio generation.
 *
 * @example
 * ```typescript
 * const service = new VbeeTTSService();
 * const { projectId } = await service.createProject({
 *   title: 'My Scene',
 *   blocks: [{ id: '1', text: 'Hello', voiceCode: 'en-US-Neural2-A' }],
 *   bearerToken: 'your-token',
 * });
 *
 * // Poll for status
 * const status = await service.getProjectStatus({ projectId, bearerToken });
 * ```
 */
export class VbeeTTSService implements ITTSService {
  /**
   * Create new TTS project
   *
   * Sends audio generation request to Vbee API.
   * Project will be processed asynchronously - use getProjectStatus to check progress.
   *
   * @param params Project parameters with title, blocks, and auth token
   * @returns Project ID for status tracking
   * @throws {ApiAuthError} If bearer token is missing
   * @throws {Error} If API returns non-2xx status
   */
  async createProject(params: CreateProjectParams): Promise<{ projectId: string }> {
    if (!params.bearerToken) {
      throw new ApiAuthError('Token Vbee chưa được thiết lập.');
    }

    const projectData = {
      title: params.title,
      blocks: params.blocks,
    };

    const response = await fetch(`${VBEE_API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.bearerToken}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Vbee API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return {
      projectId: result.result?.project?.id || result.id,
    };
  }

  /**
   * Get project status and audio URL when ready
   *
   * Call this repeatedly (polling) to check generation progress.
   * When status is 'completed', audioUrl will be available.
   *
   * @param params Project ID and bearer token
   * @returns Project status with optional progress and audio URL
   * @throws {ApiAuthError} If bearer token is missing
   * @throws {Error} If API returns non-2xx status
   */
  async getProjectStatus(params: GetProjectStatusParams): Promise<ProjectStatusResponse> {
    if (!params.bearerToken) {
      throw new ApiAuthError('Token Vbee chưa được thiết lập.');
    }

    const response = await fetch(`${VBEE_API_BASE_URL}/projects/${params.projectId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.bearerToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Vbee API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const project = result.result?.project || result;

    return {
      status: project.status || 'unknown',
      progress: project.progress,
      audioUrl: project.output_url || project.audioUrl,
    };
  }
}
