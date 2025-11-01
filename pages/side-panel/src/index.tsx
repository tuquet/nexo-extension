import '@src/index.css';
import SidePanel from '@src/SidePanel';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

const init = () => {
  const appContainer = document.querySelector('#app-container');

  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(
    <HashRouter>
      <SidePanel />
    </HashRouter>,
  );
};

init();
