/**
 * Content script for Google AI Studio prompt auto-fill automation.
 * Injects into aistudio.google.com pages to find textarea and simulate typing.
 */

interface FillPromptMessage {
  type: 'FILL_PROMPT';
  payload: {
    prompt: string;
    autoSend?: boolean;
  };
}

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
 * Simulate realistic typing with random delays
 */
const typeText = async (element: HTMLElement, text: string, baseDelayMs = 30): Promise<void> => {
  const isTextarea = element.tagName === 'TEXTAREA';
  const isInput = element.tagName === 'INPUT';
  const isContentEditable = element.isContentEditable;

  for (const char of text) {
    // Random delay between keystrokes (30-70ms by default)
    const delay = baseDelayMs + Math.random() * (baseDelayMs + 10);
    await new Promise(resolve => setTimeout(resolve, delay));

    if (isTextarea || isInput) {
      // For textarea/input: update value property
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      inputElement.value += char;

      // Trigger input and change events
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (isContentEditable) {
      // For contentEditable: insert text at cursor/end
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0) || document.createRange();

      const textNode = document.createTextNode(char);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  console.log('[Gemini Auto-Fill] Typing completed');
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
 * Find and click the send/submit button (optional)
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

  console.warn('[Gemini Auto-Fill] Send button not found');
};

/**
 * Main message handler
 */
chrome.runtime.onMessage.addListener((message: FillPromptMessage, sender, sendResponse) => {
  if (message.type !== 'FILL_PROMPT') {
    return;
  }

  console.log('[Gemini Auto-Fill] Received FILL_PROMPT message', message.payload);

  (async () => {
    try {
      // Step 1: Find the prompt input
      const inputElement = await findPromptInput();
      console.log('[Gemini Auto-Fill] Input element found:', inputElement);

      // Step 2: Focus the element
      inputElement.focus();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Type the prompt with realistic delays
      await typeText(inputElement, message.payload.prompt);

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
});

console.log('[Gemini Auto-Fill] Content script loaded');
