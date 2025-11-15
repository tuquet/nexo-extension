/**
 * Content script for Gemini Web App (gemini.google.com/app) automation.
 * Supports full automation: prompt → wait response → extract JSON → save → close
 *
 * Similar to AI Studio but with different DOM selectors for Gemini UI.
 */

import { createDebugLogger } from '../../utils/content-debug-logger';
import { clickElement, isButtonDisabled, pasteText, waitForElement } from '../../utils/dom-interactions';

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
        console.log('1. [Gemini Web Auto-Fill] ✓ Prompt pasted');

        // Step 2: Send
        await new Promise(resolve => setTimeout(resolve, 500));
        await clickSendButton();
        console.log('2. [Gemini Web Auto-Fill] ✓ Send button clicked');
      } catch (error) {
        console.error('9. [Gemini Web Auto-Fill] FULL AUTOMATION ERROR:', error);
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
