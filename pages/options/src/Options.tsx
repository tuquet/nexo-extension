import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ThemeProvider, ErrorDisplay, LoadingSpinner, Toaster } from '@extension/ui';
import OptionsLayout from '@src/components/layout/OptionsLayout';

const Options = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <OptionsLayout />
    <Toaster />
  </ThemeProvider>
);

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
