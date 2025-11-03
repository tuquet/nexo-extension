/**
 * Content script for Gemini Web App (gemini.google.com/app) automation.
 * Supports full automation: prompt → wait response → extract JSON → save → close
 *
 * Similar to AI Studio but with different DOM selectors for Gemini UI.
 */

import { createDebugLogger } from '../../utils/content-debug-logger';
import { clickElement, isButtonDisabled, pasteText, waitForElement } from '../../utils/dom-interactions';
import { extractJSON, saveScriptToDatabase, validateScriptJSON } from '../../utils/script-extraction';

// Initialize Gemini Web debug logger
const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_GEMINI',
  context: 'Gemini Web',
  themeColor: '#4285f4', // Google Blue
  getDOMSnapshot: () => {
    const promptInput = document.querySelector('rich-textarea, [contenteditable="true"]');
    const sendButton = document.querySelector('button[aria-label*="Send" i]');
    const responseMessages = document.querySelectorAll('[data-test-id*="conversation-turn"]');
    const codeBlocks = document.querySelectorAll('pre code, code-block');

    return {
      title: document.title,
      url: window.location.href,
      promptInputFound: !!promptInput,
      sendButtonEnabled: sendButton && !(sendButton as HTMLButtonElement).disabled,
      messageCount: responseMessages.length,
      codeBlockCount: codeBlocks.length,
      conversationId: window.location.pathname.split('/').pop() || 'new',
    };
  },
});

interface FillPromptMessage {
  type: 'FILL_PROMPT';
  payload: {
    prompt: string;
    autoSend?: boolean;
    typingDelay?: number; // DEPRECATED: No longer used (instant paste now)
  };
}

interface AutomateFullFlowMessage {
  type: 'AUTOMATE_FULL_FLOW';
  payload: {
    prompt: string;
    language: 'en-US' | 'vi-VN';
    maxWaitTime?: number;
  };
}

type ContentScriptMessage = FillPromptMessage | AutomateFullFlowMessage;

/**
 * Paste text with logging
 */
const pasteTextWithLog = (element: HTMLElement, text: string): void => {
  pasteText(element, text);
  const targetType = element.isContentEditable ? 'contentEditable' : element.tagName.toLowerCase();
  console.log(`[Gemini Web Auto-Fill] Text pasted into ${targetType}`);
  debugLogger.debug('Text pasted', { targetType, length: text.length });
};

/**
 * Find the prompt input element in Gemini Web
 * Gemini uses rich-textarea or contentEditable elements
 */
const findPromptInput = async (): Promise<HTMLElement> => {
  debugLogger.info('Searching for prompt input');

  const selectors = [
    'rich-textarea [contenteditable="true"]', // Gemini's rich text area
    '[data-test-id*="prompt-input"]',
    'textarea[placeholder*="Enter" i]',
    'textarea[placeholder*="Type" i]',
    'textarea[aria-label*="prompt" i]',
    '[contenteditable="true"][role="textbox"]',
    'textarea', // Fallback
    'div[contenteditable="true"]',
  ];

  for (const selector of selectors) {
    try {
      const element = await waitForElement(selector, 2000);
      console.log(`[Gemini Web Auto-Fill] Found input with selector: ${selector}`);
      debugLogger.info('Prompt input found', { selector, tagName: element.tagName });
      return element;
    } catch {
      debugLogger.debug('Selector not found', { selector });
      continue;
    }
  }

  debugLogger.error('Prompt input not found');
  throw new Error('Could not find prompt input element');
};

/**
 * Find and click the send button
 * Gemini Web has different button patterns than AI Studio
 */
const clickSendButton = async (): Promise<void> => {
  debugLogger.info('Searching for send button');

  const selectors = [
    'button[aria-label*="Send" i]',
    'button[aria-label*="Gửi" i]', // Vietnamese
    'button[aria-label*="Submit" i]',
    'button[data-test-id*="send"]',
    'button[type="submit"]',
    'button:has(svg[aria-label*="send" i])',
    'button:has(mat-icon[fonticon="send"])', // Material icon with send icon
    'button.send-button',
    'button.submit',
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && !isButtonDisabled(button) && button.offsetParent !== null) {
      await clickElement(button);
      console.log('[Gemini Web Auto-Fill] Send button clicked');
      debugLogger.info('Send button clicked', { selector });
      return;
    }
  }

  debugLogger.error('Send button not found or disabled');
  throw new Error('Send button not found');
};

/**
 * Wait for Gemini response to complete
 * Similar strategy to AI Studio but with Gemini-specific selectors
 */
const waitForAIResponse = async (maxWaitTime = 120000): Promise<HTMLElement> => {
  console.log('[Gemini Web Auto-Fill] 🔄 Waiting for AI response...');
  debugLogger.info('Starting waitForAIResponse', { maxWaitTime });

  const startTime = Date.now();
  let lastTextLength = 0;
  let stableCount = 0;
  const STABLE_THRESHOLD = 3;

  // Gemini Web response selectors
  const responseSelectors = [
    '[data-test-id*="conversation-turn"]:last-child', // Latest message
    '[data-test-id*="model-response"]',
    'message-content',
    'model-response-text',
    '[class*="model-response"]',
    '[class*="response-container"]',
    'pre code', // Code blocks
    'code-block',
    '[role="article"]:last-of-type',
  ];

  // Stop button selectors for Gemini
  const stopButtonSelectors = [
    'button[aria-label*="Stop" i]',
    'button[aria-label*="Dừng" i]', // Vietnamese
    'button[aria-label*="Cancel" i]',
    'button[aria-label*="Hủy" i]', // Vietnamese
    'button[data-test-id*="stop"]',
    'button[data-test-id*="cancel"]',
    'button.stop', // Common class pattern
    'button.submit:not([aria-disabled="true"])', // Submit button active = generating
    '[class*="stop-button"]',
  ];

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed > maxWaitTime) {
        clearInterval(checkInterval);
        debugLogger.error('Response timeout', { elapsed: Math.floor(elapsed / 1000) });
        reject(new Error(`AI response timeout after ${Math.floor(elapsed / 1000)}s`));
        return;
      }

      // Check if still generating
      let isGenerating = false;
      for (const selector of stopButtonSelectors) {
        const stopButton = document.querySelector(selector) as HTMLButtonElement;
        if (stopButton && !stopButton.disabled && stopButton.offsetParent !== null) {
          isGenerating = true;
          console.log(`[Gemini Web Auto-Fill] ⏳ Generating... (${Math.floor(elapsed / 1000)}s)`);
          debugLogger.debug('Still generating', { selector, elapsed: Math.floor(elapsed / 1000) });
          break;
        }
      }

      if (isGenerating) {
        stableCount = 0;
        lastTextLength = 0;
        return;
      }

      console.log(
        `[Gemini Web Auto-Fill] ✓ Generation complete, looking for response... (${Math.floor(elapsed / 1000)}s)`,
      );
      debugLogger.info('Generation stopped, searching for response');

      // Find response container
      for (const selector of responseSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of Array.from(elements)) {
          const htmlElement = element as HTMLElement;
          const text = htmlElement.textContent?.trim() || '';

          // Must contain script structure
          if (!text.includes('"title"') || !text.includes('"acts"')) {
            continue;
          }

          // Must be substantial
          if (text.length < 1000) {
            continue;
          }

          // Check stability
          if (text.length === lastTextLength) {
            stableCount++;
            console.log(`[Gemini Web Auto-Fill] 📊 Response stable (${stableCount}/${STABLE_THRESHOLD})`);

            if (stableCount >= STABLE_THRESHOLD) {
              clearInterval(checkInterval);
              console.log(
                `[Gemini Web Auto-Fill] ✅ Response complete! (${Math.floor(elapsed / 1000)}s, ${text.length} chars)`,
              );
              debugLogger.info('Response ready', {
                duration: Math.floor(elapsed / 1000),
                length: text.length,
                selector,
              });
              resolve(htmlElement);
              return;
            }
          } else {
            lastTextLength = text.length;
            stableCount = 0;
            console.log(`[Gemini Web Auto-Fill] 📝 Response growing: ${text.length} chars`);
            debugLogger.debug('Response growing', { length: text.length });
          }

          return;
        }
      }

      console.log(`[Gemini Web Auto-Fill] 🔍 No response yet... (${Math.floor(elapsed / 1000)}s)`);
      debugLogger.debug('No response found', { elapsed: Math.floor(elapsed / 1000) });
    }, 1000);
  });
};

/**
 * Main message handler
 */
chrome.runtime.onMessage.addListener((message: ContentScriptMessage, sender, sendResponse) => {
  if (message.type === 'FILL_PROMPT') {
    console.log('[Gemini Web Auto-Fill] Received FILL_PROMPT message', message.payload);
    debugLogger.info('Received FILL_PROMPT', { promptLength: message.payload.prompt.length });

    (async () => {
      try {
        const inputElement = await findPromptInput();
        inputElement.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        pasteTextWithLog(inputElement, message.payload.prompt);

        if (message.payload.autoSend) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await clickSendButton();
        }

        debugLogger.info('FILL_PROMPT completed');
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Gemini Web Auto-Fill] Error:', error);
        debugLogger.error('FILL_PROMPT failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true;
  }

  if (message.type === 'AUTOMATE_FULL_FLOW') {
    console.log('[Gemini Web Auto-Fill] Starting FULL AUTOMATION flow', message.payload);
    debugLogger.info('Starting AUTOMATE_FULL_FLOW', {
      promptLength: message.payload.prompt.length,
      language: message.payload.language,
      maxWaitTime: message.payload.maxWaitTime,
    });

    (async () => {
      try {
        // Step 1: Fill prompt
        const inputElement = await findPromptInput();
        inputElement.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        pasteTextWithLog(inputElement, message.payload.prompt);
        console.log('[Gemini Web Auto-Fill] ✓ Prompt pasted');

        // Step 2: Send
        await new Promise(resolve => setTimeout(resolve, 500));
        await clickSendButton();
        console.log('[Gemini Web Auto-Fill] ✓ Send button clicked');

        // Step 3: Wait for response
        const maxWaitTime = message.payload.maxWaitTime || 120000;
        const responseElement = await waitForAIResponse(maxWaitTime);
        console.log('[Gemini Web Auto-Fill] ✓ AI response received');

        // Step 4: Extract JSON
        const jsonString = extractJSON(responseElement, debugLogger);
        console.log('[Gemini Web Auto-Fill] ✓ JSON extracted, length:', jsonString.length);

        // Step 5: Validate
        if (!validateScriptJSON(jsonString, debugLogger)) {
          throw new Error('Invalid script JSON structure');
        }
        console.log('[Gemini Web Auto-Fill] ✓ JSON validated');

        // Step 6: Copy to clipboard
        await navigator.clipboard.writeText(jsonString);
        console.log('[Gemini Web Auto-Fill] ✓ JSON copied to clipboard');

        // Step 7: Save to database
        await saveScriptToDatabase(jsonString, debugLogger);
        console.log('[Gemini Web Auto-Fill] ✓ Script saved to database');

        // Step 8: Close tab
        await new Promise(resolve => setTimeout(resolve, 1000));
        chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
        console.log('[Gemini Web Auto-Fill] ✓ Tab close requested');

        debugLogger.info('AUTOMATE_FULL_FLOW completed successfully');
        sendResponse({ success: true, scriptJSON: jsonString });
      } catch (error) {
        console.error('[Gemini Web Auto-Fill] FULL AUTOMATION ERROR:', error);
        debugLogger.error('AUTOMATE_FULL_FLOW failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true;
  }

  return false;
});

// Initialize debug logger on load
void debugLogger.init();

console.log('[Gemini Web Auto-Fill] Content script loaded with FULL AUTOMATION support');
debugLogger.info('Content script initialized');
