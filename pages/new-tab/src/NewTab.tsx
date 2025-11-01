import CreateScriptForm from './components/script/create-script-form';
import LayoutContainerWrapper from './layout/layout-container-wrapper';
import Header from './layout/layout-header';
import AssetGalleryPage from './pages/gallery/page';
import HomePage from './pages/home/page';
import ScriptDetailPage from './pages/script/detail';
import ScriptListPage from './pages/script/list';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider, Toaster } from '@extension/ui';
import { HashRouter, Routes, Route } from 'react-router-dom';

const NewTab = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <HashRouter>
      <LayoutContainerWrapper>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/asset" element={<AssetGalleryPage />} />
          <Route path="/script" element={<ScriptListPage />} /> {/* Route cho trang danh sách */}
          <Route path="/script/:id" element={<ScriptDetailPage />} /> {/* Route cho trang chi tiết */}
          <Route path="/script/new" element={<CreateScriptForm />} />
        </Routes>
        <Toaster position="top-center" />
      </LayoutContainerWrapper>
    </HashRouter>
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
