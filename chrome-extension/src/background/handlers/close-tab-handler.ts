import { BaseHandler } from '../core/base-handler';
import type { IPageOpenerService } from '../core/interfaces';

/**
 * CloseTabHandler - Handles closing current tab
 *
 * Closes the active tab (useful after automation tasks complete).
 */
export class CloseTabHandler extends BaseHandler<{ type: 'CLOSE_CURRENT_TAB' }, { success: boolean }> {
  constructor(private readonly pageOpenerService: IPageOpenerService) {
    super();
  }

  protected async execute(): Promise<{ success: boolean }> {
    await this.pageOpenerService.closeCurrentTab();
    return { success: true };
  }
}
