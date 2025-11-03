/**
 * Content script for Google AI Studio prompt auto-fill automation.
 * Supports full automation: prompt → wait response → extract JSON → save → close
 */

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
 * Wait for an element to appear in the DOM
 */
const waitForElement = (selector: string, timeoutMs = 5000): Promise<HTMLElement> =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing as HTMLElement);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element as HTMLElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeoutMs}ms`));
    }, timeoutMs);
  });

/**
 * Paste text directly into element - INSTANT, NO TYPING
 * Simple and direct approach for maximum speed
 */
const pasteText = (element: HTMLElement, text: string): void => {
  const isTextarea = element.tagName === 'TEXTAREA';
  const isInput = element.tagName === 'INPUT';
  const isContentEditable = element.isContentEditable;

  if (isTextarea || isInput) {
    // Direct value assignment for textarea/input (instant)
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    inputElement.value = text;

    // Trigger input event for React/Vue/Angular detection
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[Gemini Auto-Fill] Text pasted into textarea/input instantly');
  } else if (isContentEditable) {
    // Use execCommand for contentEditable elements
    element.focus();

    // Clear and insert text
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, text);

    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[Gemini Auto-Fill] Text pasted into contentEditable instantly');
  }
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
    'button[aria-label*="submit" i]',
    'button[type="submit"]',
    'button:has(svg)', // Button with icon (common for send buttons)
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && !button.disabled) {
      button.click();
      console.log('[Gemini Auto-Fill] Send button clicked');
      return;
    }
  }

  throw new Error('Send button not found');
};

/**
 * Wait for AI response to complete
 * Monitors for response container and checks if generation is complete
 */
const waitForAIResponse = async (maxWaitTime = 120000): Promise<HTMLElement> => {
  console.log('[Gemini Auto-Fill] Waiting for AI response...');
  const startTime = Date.now();

  // Selectors for response container
  const responseSelectors = [
    '[data-test-id="model-response"]',
    '.response-container',
    '[role="article"]',
    '.model-response',
    'pre code', // Code blocks often contain JSON
  ];

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval);
        reject(new Error('AI response timeout'));
        return;
      }

      // Try to find response container
      for (const selector of responseSelectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.textContent && element.textContent.trim().length > 100) {
          // Check if response seems complete (contains closing braces for JSON)
          const text = element.textContent.trim();
          if (text.includes('}') && text.length > 500) {
            clearInterval(checkInterval);
            console.log('[Gemini Auto-Fill] AI response detected');
            resolve(element);
            return;
          }
        }
      }

      // Check for "stop" button disappearing (generation complete)
      const stopButton = document.querySelector('button[aria-label*="stop" i]') as HTMLButtonElement;
      if (!stopButton || stopButton.disabled) {
        // Generation might be complete, try to find response
        const anyText = document.body.textContent || '';
        if (anyText.includes('"title"') && anyText.includes('"acts"')) {
          const codeBlock = document.querySelector('pre code') as HTMLElement;
          if (codeBlock) {
            clearInterval(checkInterval);
            console.log('[Gemini Auto-Fill] AI response complete (detected via code block)');
            resolve(codeBlock);
          }
        }
      }
    }, 1000); // Check every second
  });
};

/**
 * Extract JSON from AI response
 */
const extractJSON = (responseElement: HTMLElement): string => {
  let text = responseElement.textContent || '';

  // Try to find JSON in code blocks first
  const codeBlocks = responseElement.querySelectorAll('code, pre');
  if (codeBlocks.length > 0) {
    for (const block of Array.from(codeBlocks)) {
      const blockText = block.textContent || '';
      if (blockText.includes('"title"') && blockText.includes('"acts"')) {
        text = blockText;
        break;
      }
    }
  }

  // Remove markdown code fences if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');

  // Try to extract JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
};

/**
 * Validate JSON structure for script
 */
const validateScriptJSON = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);

    // Check required fields
    const requiredFields = ['title', 'logline', 'acts', 'characters'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        console.error(`[Gemini Auto-Fill] Missing required field: ${field}`);
        return false;
      }
    }

    // Check acts structure
    if (!Array.isArray(parsed.acts) || parsed.acts.length === 0) {
      console.error('[Gemini Auto-Fill] Invalid acts structure');
      return false;
    }

    // Check characters array
    if (!Array.isArray(parsed.characters) || parsed.characters.length === 0) {
      console.error('[Gemini Auto-Fill] Invalid characters structure');
      return false;
    }

    console.log('[Gemini Auto-Fill] JSON validation passed');
    return true;
  } catch (error) {
    console.error('[Gemini Auto-Fill] JSON parse error:', error);
    return false;
  }
};

/**
 * Save script via background service worker
 */
const saveScriptToDatabase = async (scriptJSON: string): Promise<void> => {
  console.log('[Gemini Auto-Fill] Saving script to database...');

  const response = await chrome.runtime.sendMessage({
    type: 'SAVE_GENERATED_SCRIPT',
    payload: { scriptJSON },
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to save script');
  }

  console.log('[Gemini Auto-Fill] Script saved successfully');
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
        pasteText(inputElement, message.payload.prompt);

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
        pasteText(inputElement, message.payload.prompt);
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
        const jsonString = extractJSON(responseElement);
        console.log('[Gemini Auto-Fill] ✓ JSON extracted, length:', jsonString.length);

        // Step 5: Validate JSON structure
        if (!validateScriptJSON(jsonString)) {
          throw new Error('Invalid script JSON structure');
        }
        console.log('[Gemini Auto-Fill] ✓ JSON validated');

        // Step 6: Copy to clipboard
        await navigator.clipboard.writeText(jsonString);
        console.log('[Gemini Auto-Fill] ✓ JSON copied to clipboard');

        // Step 7: Save to database via background
        await saveScriptToDatabase(jsonString);
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
