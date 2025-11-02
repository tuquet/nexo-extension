import { getSettings } from './settings-handler';
import { VBEE_API_BASE_URL } from '../../../pages/new-tab/src/constants';
import { ApiAuthError } from '../../../pages/new-tab/src/services/api-errors';
import type {
  BaseResponse,
  VbeeCreateProjectMessage,
  VbeeGetProjectStatusMessage,
  VbeeProjectStatusResponse,
} from './types/messages';

/**
 * Wraps an API call in a standard response format.
 * @param promise The API call promise.
 * @returns A BaseResponse object with either 'data' or 'error'.
 */
const handleApiResponse = async <T>(promise: Promise<T>): Promise<BaseResponse<T>> => {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    console.error('Vbee API Handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof ApiAuthError ? 'AUTH_ERROR' : 'API_ERROR';
    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
      },
    };
  }
};

export const handleCreateVbeeProject = async (
  message: VbeeCreateProjectMessage,
): Promise<BaseResponse<{ projectId: string }>> => {
  const { payload } = message;

  return handleApiResponse<{ projectId: string }>(
    (async () => {
      const settings = await getSettings();
      const bearerToken = payload.bearerToken || settings.apiKeys?.vbee || '';
      if (!bearerToken) {
        throw new ApiAuthError('Token Vbee chưa được thiết lập.');
      }

      const response = await fetch(`${VBEE_API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify(payload.projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vbee API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      const result = await response.json();
      return { projectId: result.result?.project?.id || result.id };
    })(),
  );
};

export const handleGetVbeeProjectStatus = async (
  message: VbeeGetProjectStatusMessage,
): Promise<BaseResponse<VbeeProjectStatusResponse>> => {
  const { payload } = message;

  return handleApiResponse<VbeeProjectStatusResponse>(
    (async () => {
      const settings = await getSettings();
      const bearerToken = payload.bearerToken || settings.apiKeys?.vbee || '';
      if (!bearerToken) {
        throw new ApiAuthError('Token Vbee chưa được thiết lập.');
      }

      const response = await fetch(`${VBEE_API_BASE_URL}/projects/${payload.projectId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vbee API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      return response.json();
    })(),
  );
};
