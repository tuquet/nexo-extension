/**
 * Base handler implementing Single Responsibility and Dependency Inversion principles
 * All handlers extend this to ensure consistent error handling and response formatting
 */

import type { BaseResponse } from '../types/messages';

export abstract class BaseHandler<TRequest, TResponse> {
  /**
   * Abstract method that each handler must implement
   * This enforces Open/Closed Principle - extend functionality without modifying base
   */
  protected abstract execute(request: TRequest): Promise<TResponse>;

  /**
   * Template method pattern - handles cross-cutting concerns
   * Follows Single Responsibility by separating error handling from business logic
   */
  async handle(request: TRequest): Promise<BaseResponse<TResponse>> {
    try {
      const data = await this.execute(request);
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Centralized error handling - can be overridden by specific handlers
   * Open/Closed Principle - open for extension via override
   */
  protected handleError(error: unknown): BaseResponse<TResponse> {
    console.error(`${this.constructor.name} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.getErrorCode(error);

    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
      },
    };
  }

  /**
   * Determines error code based on error type
   * Can be overridden for custom error classification
   */
  protected getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // Check if error has a custom code property
      if ('code' in error && typeof error.code === 'string') {
        return error.code;
      }
      // Map specific error types to codes
      if (error.name === 'ApiAuthError') return 'AUTH_ERROR';
      if (error.name === 'NetworkError') return 'NETWORK_ERROR';
      if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
}
