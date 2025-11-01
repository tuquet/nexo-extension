import { handlePrimeGemini } from './gemini-primer-handler';

/**
 * A mapping of message actions to their corresponding handler functions.
 * This allows for a scalable way to add new background tasks.
 */
type MessageHandler = (message: unknown, sender: chrome.runtime.MessageSender) => Promise<unknown> | void;

const messageRoutes: { [key: string]: MessageHandler } = {
  PRIME_GEMINI_WITH_SCHEMA: handlePrimeGemini,
  GENERATE_SCRIPT_FROM_PROMPT: handlePrimeGemini, // Re-use the same handler
  // Add other actions here in the future
  // EXAMPLE_ACTION: (message) => console.log(message.data),
};

/**
 * Initializes the main message listener for the background script.
 * It delegates incoming messages to the appropriate handler based on the 'action' property.
 */
export const initializeMessageRouter = () => {
  chrome.runtime.onMessage.addListener((message, sender) => {
    const handler = messageRoutes[message.action];
    if (handler) {
      handler(message, sender);
    }
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  });
  console.log('Message router initialized.');
};
