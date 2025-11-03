/**
 * Content script for Google AI Studio prompt auto-fill automation.
 * Supports full automation: prompt → wait response → extract JSON → save → close
 */

import { createDebugLogger } from '../../utils/content-debug-logger';
import { clickElement, isButtonDisabled, pasteText, waitForElement } from '../../utils/dom-interactions';
import { extractJSON, saveScriptToDatabase, validateScriptJSON } from '../../utils/script-extraction';

// Initialize AI Studio debug logger
const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_AISTUDIO',
  context: 'AI Studio',
  themeColor: '#0f0',
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
    maxWaitTime?: number; // Max time to wait for AI response (ms)
  };
}

type ContentScriptMessage = FillPromptMessage | AutomateFullFlowMessage;

/**
 * Paste text with logging
 */
const pasteTextWithLog = (element: HTMLElement, text: string): void => {
  pasteText(element, text);
  const targetType = element.isContentEditable ? 'contentEditable' : element.tagName.toLowerCase();
  console.log(`[Gemini Auto-Fill] Text pasted into ${targetType} instantly`);
};

/**
 * Find the prompt input element in Google AI Studio
 * Tries multiple selectors as the UI may change
 */
const findPromptInput = async (): Promise<HTMLElement> => {
  const selectors = [
    'textarea[placeholder*="prompt" i]', // Case-insensitive search for "prompt"
    'textarea[placeholder*="enter" i]',
    'textarea[aria-label*="prompt" i]',
    '[contenteditable="true"][role="textbox"]', // Rich text editor
    'textarea', // Fallback: any textarea
    'div[contenteditable="true"]', // Fallback: any contentEditable div
  ];

  for (const selector of selectors) {
    try {
      const element = await waitForElement(selector, 2000);
      console.log(`[Gemini Auto-Fill] Found input with selector: ${selector}`);
      return element;
    } catch {
      // Try next selector
      continue;
    }
  }

  throw new Error('Could not find prompt input element');
};

/**
 * Find and click the send/submit button
 */
const clickSendButton = async (): Promise<void> => {
  const selectors = [
    'button[aria-label*="send" i]',
    'button[aria-label*="Gửi" i]', // Vietnamese
    'button[aria-label*="submit" i]',
    'button[type="submit"]',
    'button:has(svg)', // Button with icon (common for send buttons)
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && !isButtonDisabled(button) && button.offsetParent !== null) {
      await clickElement(button);
      console.log('[Gemini Auto-Fill] Send button clicked');
      return;
    }
  }

  throw new Error('Send button not found');
};

/**
 * Wait for AI response to complete
 * Monitors for response container and checks if generation is complete
 *
 * Strategy:
 * 1. Detect response container appears
 * 2. Wait for "stop generating" button to disappear (generation complete)
 * 3. Validate response contains expected JSON structure
 */
const waitForAIResponse = async (maxWaitTime = 120000): Promise<HTMLElement> => {
  console.log('[Gemini Auto-Fill] 🔄 Waiting for AI response...');
  debugLogger.info('Starting waitForAIResponse', { maxWaitTime });
  const startTime = Date.now();
  let lastTextLength = 0;
  let stableCount = 0;
  const STABLE_THRESHOLD = 3; // Response must be stable for 3 checks (3 seconds)

  // Broader selectors for response container (AI Studio UI changes frequently)
  const responseSelectors = [
    '[data-test-id*="response"]',
    '[data-test-id*="model"]',
    '[class*="response"]',
    '[class*="model-response"]',
    '[role="article"]',
    'pre code', // Code blocks
    'code', // Inline code
    'main [class*="markdown"]', // Markdown container
  ];

  // Selectors for "stop generating" button (when present, generation is ongoing)
  const stopButtonSelectors = [
    'button[aria-label*="stop" i]',
    'button[aria-label*="cancel" i]',
    'button:has([data-icon="stop"])',
    '[data-test-id*="stop"]',
  ];

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Check timeout
      if (elapsed > maxWaitTime) {
        clearInterval(checkInterval);
        reject(new Error(`AI response timeout after ${Math.floor(elapsed / 1000)}s`));
        return;
      }

      // Step 1: Check if stop button exists (generation ongoing)
      let isGenerating = false;
      for (const selector of stopButtonSelectors) {
        const stopButton = document.querySelector(selector) as HTMLButtonElement;
        if (stopButton && !stopButton.disabled && stopButton.offsetParent !== null) {
          // Button is visible and enabled = generation ongoing
          isGenerating = true;
          console.log(`[Gemini Auto-Fill] ⏳ Generating... (${Math.floor(elapsed / 1000)}s)`);
          debugLogger.debug(`Stop button found: ${selector}`, {
            disabled: stopButton.disabled,
            visible: stopButton.offsetParent !== null,
          });
          break;
        }
      }

      // If still generating, reset stability counter and continue
      if (isGenerating) {
        stableCount = 0;
        lastTextLength = 0;
        return;
      }

      // Step 2: Generation stopped, find response container
      console.log(`[Gemini Auto-Fill] ✓ Generation complete, looking for response... (${Math.floor(elapsed / 1000)}s)`);
      debugLogger.info('Generation stopped, searching for response');

      for (const selector of responseSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of Array.from(elements)) {
          const htmlElement = element as HTMLElement;
          const text = htmlElement.textContent?.trim() || '';

          // Must contain JSON structure indicators
          if (!text.includes('"title"') || !text.includes('"acts"')) {
            continue;
          }

          // Must be substantial (at least 1000 chars for a real script)
          if (text.length < 1000) {
            continue;
          }

          // Check if response is stable (not still loading)
          if (text.length === lastTextLength) {
            stableCount++;
            console.log(
              `[Gemini Auto-Fill] 📊 Response stable (${stableCount}/${STABLE_THRESHOLD}), length: ${text.length}`,
            );

            if (stableCount >= STABLE_THRESHOLD) {
              clearInterval(checkInterval);
              console.log(
                `[Gemini Auto-Fill] ✅ AI response complete! (${Math.floor(elapsed / 1000)}s, ${text.length} chars)`,
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
            // Text still changing, reset counter
            lastTextLength = text.length;
            stableCount = 0;
            console.log(`[Gemini Auto-Fill] 📝 Response growing: ${text.length} chars`);
            debugLogger.debug(`Response growing: ${text.length} chars`);
          }

          return; // Found candidate, continue monitoring
        }
      }

      // No response found yet
      console.log(`[Gemini Auto-Fill] 🔍 No response detected yet... (${Math.floor(elapsed / 1000)}s)`);
      debugLogger.debug('No response found', { elapsed: Math.floor(elapsed / 1000) });
    }, 1000); // Check every second
  });
};

/**
 * Main message handler
 */
chrome.runtime.onMessage.addListener((message: ContentScriptMessage, sender, sendResponse) => {
  if (message.type === 'FILL_PROMPT') {
    console.log('[Gemini Auto-Fill] Received FILL_PROMPT message', message.payload);

    (async () => {
      try {
        // Step 1: Find the prompt input
        const inputElement = await findPromptInput();
        console.log('[Gemini Auto-Fill] Input element found:', inputElement);

        // Step 2: Focus the element
        inputElement.focus();
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 3: Paste the prompt INSTANTLY (no typing, no delay)
        pasteTextWithLog(inputElement, message.payload.prompt);

        // Step 4: Optional auto-send
        if (message.payload.autoSend) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before sending
          await clickSendButton();
        }

        sendResponse({ success: true });
      } catch (error) {
        console.error('[Gemini Auto-Fill] Error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true; // Indicate async response
  }

  if (message.type === 'AUTOMATE_FULL_FLOW') {
    console.log('[Gemini Auto-Fill] Starting FULL AUTOMATION flow', message.payload);

    (async () => {
      try {
        // Step 1: Find and fill prompt input
        const inputElement = await findPromptInput();
        inputElement.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        pasteTextWithLog(inputElement, message.payload.prompt);
        console.log('[Gemini Auto-Fill] ✓ Prompt pasted');

        // Step 2: Click send button
        await new Promise(resolve => setTimeout(resolve, 500));
        await clickSendButton();
        console.log('[Gemini Auto-Fill] ✓ Send button clicked');

        // Step 3: Wait for AI response (with timeout)
        const maxWaitTime = message.payload.maxWaitTime || 120000;
        const responseElement = await waitForAIResponse(maxWaitTime);
        console.log('[Gemini Auto-Fill] ✓ AI response received');

        // Step 4: Extract JSON from response
        const jsonString = extractJSON(responseElement, debugLogger);
        console.log('[Gemini Auto-Fill] ✓ JSON extracted, length:', jsonString.length);

        // Step 5: Validate JSON structure
        if (!validateScriptJSON(jsonString, debugLogger)) {
          throw new Error('Invalid script JSON structure');
        }
        console.log('[Gemini Auto-Fill] ✓ JSON validated');

        // Step 6: Copy to clipboard
        await navigator.clipboard.writeText(jsonString);
        console.log('[Gemini Auto-Fill] ✓ JSON copied to clipboard');

        // Step 7: Save to database via background
        await saveScriptToDatabase(jsonString, debugLogger);
        console.log('[Gemini Auto-Fill] ✓ Script saved to database');

        // Step 8: Close tab on success
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay to see success
        chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
        console.log('[Gemini Auto-Fill] ✓ Tab close requested');

        sendResponse({ success: true, scriptJSON: jsonString });
      } catch (error) {
        console.error('[Gemini Auto-Fill] FULL AUTOMATION ERROR:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true; // Indicate async response
  }

  return false;
});

console.log('[Gemini Auto-Fill] Content script loaded with FULL AUTOMATION support');
