import { BaseHandler } from '../core/base-handler';
import type { IScriptService } from '../core/interfaces';

/**
 * SaveScriptHandler - Handles saving generated scripts to database
 *
 * Saves script JSON to IndexedDB via messaging to new-tab page.
 */
export class SaveScriptHandler extends BaseHandler<
  { type: 'SAVE_GENERATED_SCRIPT'; payload: { scriptJSON: string } },
  { scriptId: number }
> {
  constructor(private readonly scriptService: IScriptService) {
    super();
  }

  protected async execute(message: { type: 'SAVE_GENERATED_SCRIPT'; payload: { scriptJSON: string } }): Promise<{
    scriptId: number;
  }> {
    const { scriptJSON } = message.payload;
    return this.scriptService.saveGeneratedScript(scriptJSON);
  }
}
