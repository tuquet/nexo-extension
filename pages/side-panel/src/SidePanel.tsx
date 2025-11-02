import '@src/SidePanel.css';
import HomePage from './pages/HomePage';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { Route, Routes, Outlet } from 'react-router-dom';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);

  return (
    <div className={cn('flex h-screen flex-col', isLight ? 'bg-slate-50' : 'bg-gray-900')}>
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
