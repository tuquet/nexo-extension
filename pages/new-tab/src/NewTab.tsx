import CreateScriptForm from './components/script/create-script-form';
import LayoutContainerWrapper from './layout/layout-container-wrapper';
import Header from './layout/layout-header';
import AssetGalleryPage from './pages/gallery/page';
import PromptsListPage from './pages/prompts/list';
import ScriptDetailPage from './pages/script/detail';
import ScriptListPage from './pages/script/list';
import { usePreferencesStore } from './stores/use-preferences-store';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider, Toaster, useTheme } from '@extension/ui';
import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Sync component to bridge usePreferencesStore (chrome.storage) with ThemeProvider (DOM)
const ThemeSync = () => {
  const theme = usePreferencesStore(s => s.theme);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
};

const NewTab = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <ThemeSync />
    <HashRouter>
      <div className="bg-background min-h-screen">
        <Header />
        <LayoutContainerWrapper>
          <Routes>
            <Route path="/script" element={<ScriptListPage />} />
            <Route path="/script/new" element={<CreateScriptForm />} />
            <Route path="/script/:id" element={<ScriptDetailPage />} />
            <Route path="/asset" element={<AssetGalleryPage />} />
            <Route path="/prompts" element={<PromptsListPage />} />
            <Route path="/" element={<Navigate to="/script" replace />} />
          </Routes>
        </LayoutContainerWrapper>
      </div>
      <Toaster position="top-center" />
    </HashRouter>
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
