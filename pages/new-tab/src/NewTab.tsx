import Header from './layout/Header';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider } from '@extension/ui';
import ScriptsPage from '@src/pages/Scripts';

const NewTab = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Header />
    <ScriptsPage />
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
