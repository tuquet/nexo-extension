import CreateScriptForm from './components/script/forms/create-form';
import LayoutContainerWrapper from './layout/container-wrapper';
import Header from './layout/header';
import AssetGalleryPage from './pages/gallery/page';
import PromptsPage from './pages/prompts/page';
import ScriptDetailPage from './pages/script/detail';
import ScriptListPage from './pages/script/list';
import { useApiKey } from './stores/use-api-key';
import { db, seedDefaultPrompts } from '@extension/database';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider, Toaster } from '@extension/ui';
import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// API Key initialization
const ApiKeyInit = () => {
  const loadApiKey = useApiKey(s => s.loadApiKey);

  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  return null;
};

// Database initialization - seed default prompts if needed
const DatabaseInit = () => {
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const count = await seedDefaultPrompts(db);
        if (count > 0) {
          console.log(`[CineGenie] ✓ Seeded ${count} default prompt templates`);
        }
      } catch (error) {
        console.error('[CineGenie] Failed to seed database:', error);
      }
    };

    initDatabase();
  }, []);

  return null;
};

const NewTab = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <ApiKeyInit />
    <DatabaseInit />
    <HashRouter>
      <div className="bg-background min-h-screen">
        <Header />
        <LayoutContainerWrapper>
          <Routes>
            <Route path="/script" element={<ScriptListPage />} />
            <Route path="/script/new" element={<CreateScriptForm />} />
            <Route path="/script/:id" element={<ScriptDetailPage />} />
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/script/create" element={<CreateScriptForm />} />
            <Route path="/asset" element={<AssetGalleryPage />} />
            <Route path="/" element={<Navigate to="/script" replace />} />
          </Routes>
        </LayoutContainerWrapper>
      </div>
      <Toaster position="top-center" />
    </HashRouter>
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
