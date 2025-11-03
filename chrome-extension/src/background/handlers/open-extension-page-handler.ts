import { BaseHandler } from '../core/base-handler';
import type { IPageOpenerService } from '../core/interfaces';
import type { OpenExtensionPageMessage } from '../types/messages';

/**
 * OpenExtensionPageHandler - Handles opening extension pages
 *
 * Opens new-tab, options, side-panel, etc. in tabs or windows.
 */
export class OpenExtensionPageHandler extends BaseHandler<
  OpenExtensionPageMessage,
  { tabId?: number; windowId?: number }
> {
  constructor(private readonly pageOpenerService: IPageOpenerService) {
    super();
  }

  protected async execute(message: OpenExtensionPageMessage): Promise<{ tabId?: number; windowId?: number }> {
    const { page, newWindow, windowOptions } = message.payload;

    // Filter out 'panel' type which is not supported by IPageOpenerService
    const filteredOptions = windowOptions
      ? {
          ...windowOptions,
          type: windowOptions.type === 'panel' ? 'popup' : windowOptions.type,
        }
      : undefined;

    return this.pageOpenerService.openExtensionPage({
      page,
      newWindow,
      windowOptions: filteredOptions as {
        type?: 'normal' | 'popup';
        width?: number;
        height?: number;
        left?: number;
        top?: number;
      },
    });
  }
}
