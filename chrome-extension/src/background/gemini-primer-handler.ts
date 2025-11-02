import { SCRIPT_GENERATION_SCHEMA } from './constants';

interface PrimeGeminiMessage {
  action: 'PASTE_AND_SEND_SCHEMA';
  schemaText: string;
}

export const handlePrimeGemini = async () => {
  try {
    // Legacy: Convert schema object to JSON string for old handler
    const schemaText = JSON.stringify(SCRIPT_GENERATION_SCHEMA, null, 2);
    const tab = await chrome.tabs.create({ url: 'https://gemini.google.com/' });

    // Listener to ensure the content script receives the message only when the tab is fully loaded.
    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        const primeMessage: PrimeGeminiMessage = {
          action: 'PASTE_AND_SEND_SCHEMA',
          schemaText: schemaText,
        };

        // Clean up the listener after it has done its job.
        void chrome.tabs.sendMessage(tab.id!, primeMessage);
        chrome.tabs.onUpdated.removeListener(listener);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  } catch (error) {
    console.error('Failed to execute Prime Gemini feature:', error);
  }
};
