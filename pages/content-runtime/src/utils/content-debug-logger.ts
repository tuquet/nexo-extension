/**
 * Generic Debug Logger for Content Scripts
 *
 * Provides detailed logging and debugging utilities for development/testing.
 * Controlled by DEBUG_MODE_<CONTEXT> flag in chrome.storage.
 *
 * @example
 * // For AI Studio content script:
 * const logger = createDebugLogger({
 *   storageKey: 'DEBUG_MODE_AISTUDIO',
 *   context: 'AI Studio',
 *   themeColor: '#0f0'
 * });
 * await logger.init();
 *
 * // For ChatGPT content script:
 * const logger = createDebugLogger({
 *   storageKey: 'DEBUG_MODE_CHATGPT',
 *   context: 'ChatGPT',
 *   themeColor: '#10a37f'
 * });
 */

interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

interface DebugState {
  enabled: boolean;
  logs: LogEntry[];
  maxLogs: number;
}

interface DebugLoggerConfig {
  /**
   * Chrome storage key to check for debug mode (e.g., 'DEBUG_MODE_AISTUDIO')
   */
  storageKey: string;

  /**
   * Context name for log messages (e.g., 'AI Studio', 'ChatGPT', 'Claude')
   */
  context: string;

  /**
   * Theme color for debug UI (hex color)
   */
  themeColor?: string;

  /**
   * Maximum number of logs to keep in memory
   */
  maxLogs?: number;

  /**
   * Custom DOM snapshot function
   * If not provided, uses default implementation
   */
  getDOMSnapshot?: () => Record<string, unknown>;
}

class ContentDebugLogger {
  private state: DebugState;
  private config: Required<DebugLoggerConfig>;
  private panelId: string;

  constructor(config: DebugLoggerConfig) {
    this.config = {
      storageKey: config.storageKey,
      context: config.context,
      themeColor: config.themeColor || '#0f0',
      maxLogs: config.maxLogs || 100,
      getDOMSnapshot: config.getDOMSnapshot || this.defaultGetDOMSnapshot.bind(this),
    };

    this.panelId = `debug-panel-${config.context.toLowerCase().replace(/\s+/g, '-')}`;

    this.state = {
      enabled: false,
      logs: [],
      maxLogs: this.config.maxLogs,
    };
  }

  /**
   * Initialize debug mode from chrome.storage
   */
  async init(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.config.storageKey);
      this.state.enabled = result[this.config.storageKey] === true;

      if (this.state.enabled) {
        console.log(
          `%c[${this.config.context} Debug] 🔧 Debug mode ENABLED`,
          `color: ${this.config.themeColor}; font-weight: bold`,
        );
        this.addDebugUI();
      }
    } catch (error) {
      console.error(`[${this.config.context} Debug] Failed to init:`, error);
    }
  }

  /**
   * Log a message (only in debug mode)
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    // Add to history
    this.state.logs.push(entry);
    if (this.state.logs.length > this.state.maxLogs) {
      this.state.logs.shift(); // Remove oldest
    }

    // Console output
    if (this.state.enabled) {
      const emoji = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
      const color = { debug: '#999', info: '#00f', warn: '#fa0', error: '#f00' }[level];
      const style = `color: ${color}; font-weight: bold`;

      console.log(`%c[${this.config.context} ${emoji}] ${message}`, style, data || '');
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  /**
   * Default DOM snapshot implementation
   * Can be overridden via config.getDOMSnapshot
   */
  private defaultGetDOMSnapshot(): Record<string, unknown> {
    const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]')).map(
      el => `${el.tagName}${el.className ? `.${el.className.split(' ').join('.')}` : ''}`,
    );

    const buttons = Array.from(document.querySelectorAll('button')).map(btn => {
      const label = btn.getAttribute('aria-label') || btn.textContent?.trim() || '';
      return `${btn.className.split(' ').slice(0, 2).join('.')} [${label.slice(0, 20)}]`;
    });

    const codeBlocks = document.querySelectorAll('pre code, code').length;

    const responseSelectors = [
      '[data-test-id*="response"]',
      '[class*="response"]',
      '[role="article"]',
      'main [class*="markdown"]',
    ];
    const responseContainers = responseSelectors
      .map(sel => {
        const el = document.querySelector(sel);
        return el ? `${sel} (${el.textContent?.length || 0} chars)` : null;
      })
      .filter(Boolean) as string[];

    return {
      title: document.title,
      url: window.location.href,
      inputElements: inputs,
      buttons: buttons.slice(0, 10), // First 10 buttons
      codeBlocks,
      responseContainers,
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        context: this.config.context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        logs: this.state.logs,
        domSnapshot: this.config.getDOMSnapshot(),
      },
      null,
      2,
    );
  }

  /**
   * Add debug UI overlay to page
   */
  private addDebugUI(): void {
    if (document.getElementById(this.panelId)) return;

    const panel = document.createElement('div');
    panel.id = this.panelId;
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-height: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: ${this.config.themeColor};
      border: 2px solid ${this.config.themeColor};
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      z-index: 999999;
      overflow-y: auto;
      box-shadow: 0 4px 12px ${this.hexToRgba(this.config.themeColor, 0.3)};
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #0ff;">🔧 ${this.config.context} Debug</strong>
        <button id="${this.panelId}-export-btn" style="
          background: ${this.config.themeColor};
          color: #000;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">Export Logs</button>
      </div>
      <div id="${this.panelId}-log-container" style="
        max-height: 200px;
        overflow-y: auto;
        font-size: 11px;
        line-height: 1.4;
      "></div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${this.config.themeColor}; font-size: 10px;">
        <div>DOM Snapshot:</div>
        <pre id="${this.panelId}-snapshot" style="margin: 4px 0; color: #999; white-space: pre-wrap;"></pre>
      </div>
    `;

    document.body.appendChild(panel);

    // Export logs button
    document.getElementById(`${this.panelId}-export-btn`)?.addEventListener('click', () => {
      const logs = this.exportLogs();
      navigator.clipboard.writeText(logs);
      alert('Debug logs copied to clipboard!');
    });

    // Update log display every second
    setInterval(() => {
      this.updateDebugUI();
    }, 1000);
  }

  /**
   * Update debug UI with latest logs
   */
  private updateDebugUI(): void {
    const container = document.getElementById(`${this.panelId}-log-container`);
    if (container) {
      container.innerHTML = this.state.logs
        .slice(-20) // Last 20 logs
        .map(
          log => `
          <div style="margin: 2px 0; color: ${
            { debug: '#999', info: '#0ff', warn: '#fa0', error: '#f00' }[log.level]
          };">
            [${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}
          </div>
        `,
        )
        .join('');

      // Auto-scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    // Update DOM snapshot
    const snapshotEl = document.getElementById(`${this.panelId}-snapshot`);
    if (snapshotEl) {
      const snapshot = this.config.getDOMSnapshot();
      snapshotEl.textContent = this.formatSnapshot(snapshot);
    }
  }

  /**
   * Format snapshot object for display
   */
  private formatSnapshot(snapshot: Record<string, unknown>): string {
    return Object.entries(snapshot)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.length}`;
        }
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value).length} chars`;
        }
        return `${key}: ${value}`;
      })
      .join(' | ');
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Enable debug mode programmatically (useful for testing)
   */
  async enable(): Promise<void> {
    await chrome.storage.local.set({ [this.config.storageKey]: true });
    this.state.enabled = true;
    this.addDebugUI();
    this.info('Debug mode enabled programmatically');
  }

  /**
   * Disable debug mode programmatically
   */
  async disable(): Promise<void> {
    await chrome.storage.local.remove(this.config.storageKey);
    this.state.enabled = false;
    document.getElementById(this.panelId)?.remove();
    this.info('Debug mode disabled programmatically');
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.state.logs = [];
    this.info('Logs cleared');
  }
}

/**
 * Factory function to create debug logger instance
 */
const createDebugLogger = (config: DebugLoggerConfig): ContentDebugLogger => new ContentDebugLogger(config);

export { ContentDebugLogger, createDebugLogger };
export type { DebugLoggerConfig, LogEntry };
