/**
 * Type-safe Message Router
 * Implements Open/Closed Principle - add handlers without modifying router
 */

import type { BaseHandler } from './base-handler';
import type { BackgroundMessage, BackgroundResponse } from '../types/messages';

export class MessageRouter {
  private handlers = new Map<string, BaseHandler<BackgroundMessage, unknown>>();

  /**
   * Register a message handler
   * Open/Closed Principle: Add new handlers without modifying router code
   *
   * @param messageType The message type (e.g., 'GENERATE_SCRIPT')
   * @param handler The handler instance
   */
  register<TMessage extends BackgroundMessage, TResponse>(
    messageType: string,
    handler: BaseHandler<TMessage, TResponse>,
  ): void {
    this.handlers.set(messageType, handler as BaseHandler<BackgroundMessage, unknown>);
    console.log(`[Router] Registered handler for: ${messageType}`);
  }

  /**
   * Route a message to its appropriate handler
   *
   * @param message The incoming message
   * @returns Response from the handler
   */
  async route(message: BackgroundMessage): Promise<BackgroundResponse> {
    const messageType = message.type || (message as { action?: string }).action;

    if (!messageType) {
      console.error('[Router] Message missing type/action:', message);
      return {
        success: false,
        error: {
          message: 'Message must have a "type" or "action" field',
          code: 'INVALID_MESSAGE',
        },
      };
    }

    console.log('[Router] Routing message:', messageType, message);

    const handler = this.handlers.get(messageType);

    if (!handler) {
      console.warn('[Router] No handler found for:', messageType);
      return {
        success: false,
        error: {
          message: `No handler registered for message type: ${messageType}`,
          code: 'HANDLER_NOT_FOUND',
        },
      };
    }

    try {
      const response = await handler.handle(message);
      console.log('[Router] Handler response:', response);
      return response;
    } catch (error) {
      console.error(`[Router] Error handling message ${messageType}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'HANDLER_ERROR',
        },
      };
    }
  }

  /**
   * Check if a handler is registered for a message type
   */
  hasHandler(messageType: string): boolean {
    return this.handlers.has(messageType);
  }

  /**
   * Get all registered message types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Remove a handler
   */
  unregister(messageType: string): void {
    this.handlers.delete(messageType);
    console.log(`[Router] Unregistered handler for: ${messageType}`);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    console.log('[Router] Cleared all handlers');
  }
}

// Export singleton instance
export const router = new MessageRouter();

/**
 * Initialize the Chrome runtime message listener
 * Delegates all messages to the router
 */
export const initializeMessageRouter = (routerInstance: MessageRouter = router): void => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Router] Received message:', message.type || message.action, message);

    // Route the message asynchronously
    void routerInstance
      .route(message as BackgroundMessage)
      .then(response => {
        console.log('[Router] Sending response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('[Router] Unexpected error:', error);
        sendResponse({
          success: false,
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: 'UNEXPECTED_ERROR',
          },
        });
      });

    // Return true to indicate async response
    return true;
  });

  console.log('[Router] Message listener initialized. Registered handlers:', routerInstance.getRegisteredTypes());
};
