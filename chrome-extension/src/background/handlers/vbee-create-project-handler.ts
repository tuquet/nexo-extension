import { BaseHandler } from '../core/base-handler';
import type { ISettingsService, ITTSService } from '../core/interfaces';
import type { VbeeCreateProjectMessage } from '../types/messages';

/**
 * VbeeCreateProjectHandler - Handles TTS project creation
 */
export class VbeeCreateProjectHandler extends BaseHandler<VbeeCreateProjectMessage, { projectId: string }> {
  constructor(
    private readonly ttsService: ITTSService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: VbeeCreateProjectMessage): Promise<{ projectId: string }> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const bearerToken = payload.bearerToken || settings.apiKeys?.vbee || '';

    // Map API field names to service interface
    const blocks = payload.projectData.blocks.map(block => ({
      id: block.id,
      text: block.text,
      voiceCode: block.voice_code,
      speed: block.speed,
      breakTime: block.break_time,
    }));

    return this.ttsService.createProject({
      title: payload.projectData.title,
      blocks,
      bearerToken,
    });
  }
}
