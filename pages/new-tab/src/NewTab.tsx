import CreateScriptForm from './components/script/create-script-form';
import LayoutContainerWrapper from './layout/layout-container-wrapper';
import Header from './layout/layout-header';
import WelcomePage from './pages/welcome/page';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider, Toaster } from '@extension/ui';
import AssetGalleryPage from '@src/pages/gallery/page';
import ScriptListPage from '@src/pages/script/page';
import { HashRouter, Routes, Route } from 'react-router-dom';

const NewTab = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <HashRouter>
      <LayoutContainerWrapper>
        <Header />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/asset" element={<AssetGalleryPage />} />
          <Route path="/script" element={<ScriptListPage />} />
          <Route path="/script/new" element={<CreateScriptForm />} />
        </Routes>
        <Toaster position="top-center" />
      </LayoutContainerWrapper>
    </HashRouter>
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
