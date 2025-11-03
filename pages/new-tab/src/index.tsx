import '@src/index.css';
import { db } from '@extension/database';
import NewTab from '@src/NewTab';
import { createRoot } from 'react-dom/client';

// Message handler for saving script from automation
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ADD_SCRIPT_TO_DB') {
    (async () => {
      try {
        const scriptData = message.payload.script;
        const scriptId = await db.scripts.add({
          title: scriptData.title,
          logline: scriptData.logline,
          genre: Array.isArray(scriptData.genre) ? scriptData.genre : [],
          alias: scriptData.alias || '',
          tone: scriptData.tone || '',
          notes: scriptData.notes || '',
          setting: scriptData.setting || { time: '', location: '' },
          themes: Array.isArray(scriptData.themes) ? scriptData.themes : [],
          characters: scriptData.characters,
          acts: scriptData.acts,
        });
        sendResponse({ success: true, scriptId });
      } catch (error) {
        console.error('[NewTab] Failed to save script:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    return true; // Keep channel open for async response
  }
  return false; // Not our message type
});

const init = () => {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(<NewTab />);
};

init();
