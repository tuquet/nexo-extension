/**
 * Dependency Injection Container
 * Implements Dependency Inversion Principle - centralized service management
 */

export class DIContainer {
  private services = new Map<string, unknown>();
  private singletons = new Map<string, unknown>();

  /**
   * Register a service instance
   * @param key Service identifier
   * @param service Service instance
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Register a service factory (lazy initialization)
   * @param key Service identifier
   * @param factory Factory function that creates the service
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  /**
   * Register a singleton service (created once on first resolve)
   * @param key Service identifier
   * @param factory Factory function that creates the service
   */
  registerSingleton<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
    this.singletons.set(key, null); // Mark as singleton
  }

  /**
   * Resolve a service by key
   * @param key Service identifier
   * @returns Service instance
   * @throws Error if service not found
   */
  resolve<T>(key: string): T {
    // Check if it's a singleton that's already created
    if (this.singletons.has(key)) {
      const existing = this.singletons.get(key);
      if (existing !== null) {
        return existing as T;
      }
    }

    const service = this.services.get(key);

    if (!service) {
      throw new Error(`Service "${key}" not registered in DI container`);
    }

    // If it's a factory function, call it
    if (typeof service === 'function') {
      const instance = (service as () => T)();

      // Cache singleton
      if (this.singletons.has(key)) {
        this.singletons.set(key, instance);
      }

      return instance;
    }

    return service as T;
  }

  /**
   * Check if a service is registered
   * @param key Service identifier
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Remove a specific service
   * @param key Service identifier
   */
  remove(key: string): void {
    this.services.delete(key);
    this.singletons.delete(key);
  }
}

// Export singleton instance
export const container = new DIContainer();
