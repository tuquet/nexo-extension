import CreateScriptForm from './components/script/create-script-form';
import LayoutContainerWrapper from './layout/layout-container-wrapper';
import Header from './layout/layout-header';
import AssetGalleryPage from './pages/gallery/page';
import ScriptDetailPage from './pages/script/detail';
import ScriptListPage from './pages/script/list';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider, Toaster } from '@extension/ui';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

const NewTab = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <HashRouter>
      <div className="bg-background min-h-screen">
        <Header />
        <LayoutContainerWrapper>
          <Routes>
            <Route path="/script" element={<ScriptListPage />} />
            <Route path="/script/new" element={<CreateScriptForm />} />
            <Route path="/script/:id" element={<ScriptDetailPage />} />
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
