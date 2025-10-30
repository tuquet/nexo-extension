import '@src/index.css';
import { syncHtmlDarkClass } from '@extension/shared';
import { themeStorage } from '@extension/storage';
import Popup from '@src/Popup';
import { createRoot } from 'react-dom/client';

const init = () => {
  const appContainer = document.querySelector('#app-container');
  themeStorage.get().then(state => syncHtmlDarkClass(state.theme));
  themeStorage.subscribe(() => {
    themeStorage.get().then(state => syncHtmlDarkClass(state.theme));
  });
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(<Popup />);
};

init();
