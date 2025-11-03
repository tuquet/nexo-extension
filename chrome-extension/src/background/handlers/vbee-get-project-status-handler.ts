import { BaseHandler } from '../core/base-handler';
import type { ISettingsService, ITTSService } from '../core/interfaces';
import type { VbeeGetProjectStatusMessage, VbeeProjectStatusResponse } from '../types/messages';

/**
 * VbeeGetProjectStatusHandler - Handles TTS project status checks
 */
export class VbeeGetProjectStatusHandler extends BaseHandler<VbeeGetProjectStatusMessage, VbeeProjectStatusResponse> {
  constructor(
    private readonly ttsService: ITTSService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: VbeeGetProjectStatusMessage): Promise<VbeeProjectStatusResponse> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const bearerToken = payload.bearerToken || settings.apiKeys?.vbee || '';

    const status = await this.ttsService.getProjectStatus({
      projectId: payload.projectId,
      bearerToken,
    });

    // Wrap in VbeeProjectStatusResponse format
    return {
      result: {
        project: {
          id: payload.projectId,
          status: status.status as 'processing' | 'done' | 'error',
          audio_link: status.audioUrl,
          blocks: [],
        },
      },
    };
  }
}
