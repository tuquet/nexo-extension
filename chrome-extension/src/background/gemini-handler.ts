import { GEMINI_SCRIPT_SCHEMA } from './constants';

const GEMINI_URL = 'https://gemini.google.com/';

/**
 * Tìm một tab Gemini đang mở, nếu không có thì tạo một tab mới.
 * @returns ID của tab Gemini đã tìm thấy hoặc mới được tạo.
 */
const findOrCreateGeminiTab = async (): Promise<number | undefined> => {
  const tabs = await chrome.tabs.query({ url: `${GEMINI_URL}*` });

  if (tabs.length > 0 && tabs[0].id) {
    // Kích hoạt tab đã tồn tại và focus vào cửa sổ của nó
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
    return tabs[0].id;
  }

  // Tạo tab mới nếu chưa có
  const newTab = await chrome.tabs.create({ url: GEMINI_URL });
  return newTab.id;
};

/**
 * Gửi một message đến một tab cụ thể sau khi tab đó đã tải xong.
 * @param tabId ID của tab đích.
 * @param message Message cần gửi.
 */
const sendMessageOnTabLoad = (tabId: number, message: object): void => {
  const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (updatedTabId === tabId && changeInfo.status === 'complete') {
      void chrome.tabs.sendMessage(tabId, message);
      chrome.tabs.onUpdated.removeListener(listener);
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
};

/**
 * Handler để mở tab Gemini và dán schema vào.
 */
export const handlePrimeGeminiWithSchema = async () => {
  try {
    const tabId = await findOrCreateGeminiTab();
    if (!tabId) return;

    const primeMessage = {
      action: 'PASTE_AND_SEND_SCHEMA',
      schemaText: GEMINI_SCRIPT_SCHEMA,
    };

    sendMessageOnTabLoad(tabId, primeMessage);
  } catch (error) {
    console.error('Failed to execute Prime Gemini feature:', error);
  }
};

/**
 * Handler để mở tab Gemini và gửi một prompt cụ thể.
 * @param message Message chứa prompt trong payload.
 */
export const handleGenerateScriptFromPrompt = async (message: unknown) => {
  // Type guard
  if (typeof message !== 'object' || message === null || !('payload' in message)) {
    console.error('Invalid message format for GENERATE_SCRIPT_FROM_PROMPT');
    return;
  }

  try {
    const tabId = await findOrCreateGeminiTab();
    if (!tabId) return;

    const promptMessage = {
      action: 'PASTE_AND_SEND_PROMPT',
      prompt: (message as { payload: { prompt: string } }).payload.prompt,
    };

    sendMessageOnTabLoad(tabId, promptMessage);
  } catch (error) {
    console.error('Failed to execute Generate Script from Prompt feature:', error);
  }
};
