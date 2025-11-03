import { BaseHandler } from '../core/base-handler';
import type { AppSettings, ISettingsService } from '../core/interfaces';
import type { GetSettingsMessage, SaveSettingsMessage } from '../types/messages';

/**
 * GetSettingsHandler - Handles settings retrieval requests
 */
export class GetSettingsHandler extends BaseHandler<GetSettingsMessage, AppSettings> {
  constructor(private readonly settingsService: ISettingsService) {
    super();
  }

  protected async execute(): Promise<AppSettings> {
    return this.settingsService.getAll();
  }
}

/**
 * SaveSettingsHandler - Handles settings save requests
 */
export class SaveSettingsHandler extends BaseHandler<SaveSettingsMessage, { success: boolean }> {
  constructor(private readonly settingsService: ISettingsService) {
    super();
  }

  protected async execute(message: SaveSettingsMessage): Promise<{ success: boolean }> {
    const { payload } = message;
    await this.settingsService.saveAll(payload);
    return { success: true };
  }
}
