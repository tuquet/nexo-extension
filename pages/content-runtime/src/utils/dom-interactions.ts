/**
 * DOM Interaction Utilities
 * Simulate realistic user interactions for better compatibility with modern frameworks
 * (React, Vue, Angular, Material UI, etc.)
 */

/**
 * Simulate realistic click with full event sequence
 * This is more reliable than element.click() for frameworks that rely on event bubbling
 */
export const simulateClick = (element: HTMLElement): void => {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Full event sequence: mouseenter → mouseover → mousedown → focus → mouseup → click
  const events = [
    new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
    new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 }),
    new FocusEvent('focus', { bubbles: true, cancelable: true }),
    new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 }),
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 }),
  ];

  events.forEach(event => element.dispatchEvent(event));
};

/**
 * Click element with enhanced compatibility
 * Uses both realistic event simulation and native click for maximum compatibility
 */
export const clickElement = async (element: HTMLElement): Promise<void> => {
  // Ensure element is visible
  if (element.offsetParent === null) {
    throw new Error('Element is not visible');
  }

  // Scroll into view
  element.scrollIntoView({ behavior: 'instant', block: 'center' });

  // Focus first (may trigger UI state changes)
  element.focus();
  await new Promise(resolve => setTimeout(resolve, 100));

  // Method 1: Realistic event simulation (best for frameworks)
  simulateClick(element);
  await new Promise(resolve => setTimeout(resolve, 50));
};

/**
 * Check if button is disabled (supports multiple patterns)
 */
export const isButtonDisabled = (button: HTMLElement): boolean =>
  (button as HTMLButtonElement).disabled ||
  button.getAttribute('aria-disabled') === 'true' ||
  button.classList.contains('disabled');

/**
 * Wait for an element to appear in the DOM
 */
export const waitForElement = (selector: string, timeoutMs = 5000): Promise<HTMLElement> =>
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
 * Paste text into element (textarea, input, or contentEditable)
 */
export const pasteText = (element: HTMLElement, text: string): void => {
  const isTextarea = element.tagName === 'TEXTAREA';
  const isInput = element.tagName === 'INPUT';
  const isContentEditable = element.isContentEditable;

  if (isTextarea || isInput) {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    inputElement.value = text;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (isContentEditable) {
    element.focus();
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
