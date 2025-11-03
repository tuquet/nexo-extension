import { BaseHandler } from '../core/base-handler';
import type { IAIService } from '../core/interfaces';

/**
 * TestConnectionHandler - Handles API key validation
 *
 * Tests Gemini API key by making minimal API call.
 */
export class TestConnectionHandler extends BaseHandler<
  { type: 'TEST_GEMINI_CONNECTION'; payload: { apiKey: string } },
  { valid: boolean; model?: string }
> {
  constructor(private readonly aiService: IAIService) {
    super();
  }

  protected async execute(message: {
    type: 'TEST_GEMINI_CONNECTION';
    payload: { apiKey: string };
  }): Promise<{ valid: boolean; model?: string }> {
    return this.aiService.testConnection(message.payload.apiKey);
  }
}
