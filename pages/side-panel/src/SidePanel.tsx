import '@src/SidePanel.css';
import HomePage from './pages/HomePage';
import { PROJECT_URL_OBJECT, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { Route, Routes, Outlet } from 'react-router-dom';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';

  return (
    <div className={cn('flex h-screen flex-col', isLight ? 'bg-slate-50' : 'bg-gray-900')}>
      <header className={cn('flex justify-center border-b p-4', isLight ? 'border-slate-200' : 'border-gray-700')}>
        <button onClick={() => chrome.tabs.create(PROJECT_URL_OBJECT)}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
      </header>
      <main className="flex-grow overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Bạn có thể thêm các route khác ở đây */}
        </Routes>
        <Outlet />
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
