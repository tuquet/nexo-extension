import { usePreferencesStore } from '../stores/use-preferences-store';
import { Button, ModeToggle, Separator } from '@extension/ui';
import { openOptionsPage } from '@src/services/background-api';
import { FileText, Image, Maximize2, Settings, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type React from 'react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'CG' }) => {
  const toggleSize = usePreferencesStore(s => s.toggleContainerSize);
  const containerSize = usePreferencesStore(s => s.containerSize);
  const location = useLocation();

  const handleOpenSettings = async () => {
    try {
      await openOptionsPage();
    } catch (error) {
      console.error('Failed to open options page:', error);
    }
  };

  const isScriptRouteActive = location.pathname === '/' || location.pathname.startsWith('/script');
  const isAssetRouteActive = location.pathname === '/asset';
  const isPromptsRouteActive = location.pathname === '/prompts';

  return (
    <header className="bg-background/70 sticky top-0 z-40 mb-4 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link to="/script" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold">
              {title}
            </div>
            <span className="hidden text-sm font-semibold sm:inline">CineGenie</span>
          </Link>

          {/* Navigation Tabs - Reordered: Prompts → Scripts → Assets */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant={isScriptRouteActive ? 'secondary' : 'ghost'} size="sm" className="gap-2" asChild>
              <Link to="/script">
                <FileText className="size-4" />
                <span>Kịch Bản</span>
              </Link>
            </Button>
            <Button variant={isPromptsRouteActive ? 'secondary' : 'ghost'} size="sm" className="gap-2" asChild>
              <Link to="/prompts">
                <Sparkles className="size-4" />
                <span>Prompts</span>
              </Link>
            </Button>
            <Button variant={isAssetRouteActive ? 'secondary' : 'ghost'} size="sm" className="gap-2" asChild>
              <Link to="/asset">
                <Image className="size-4" />
                <span>Tài sản</span>
              </Link>
            </Button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Toggle container size"
            title={`Container: ${containerSize}`}
            onClick={toggleSize}>
            <Maximize2 className="size-4" />
          </Button>

          <ModeToggle />

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button variant="ghost" size="icon" aria-label="Settings" title="Settings" onClick={handleOpenSettings}>
            <Settings className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation - Reordered: Prompts → Scripts → Assets */}
      <div className="border-t md:hidden">
        <nav className="flex items-center justify-around px-2 py-2">
          <Button variant={isPromptsRouteActive ? 'secondary' : 'ghost'} size="sm" className="flex-1 gap-1.5" asChild>
            <Link to="/prompts">
              <Sparkles className="size-4" />
              <span className="text-xs">Prompts</span>
            </Link>
          </Button>
          <Button variant={isScriptRouteActive ? 'secondary' : 'ghost'} size="sm" className="flex-1 gap-1.5" asChild>
            <Link to="/script">
              <FileText className="size-4" />
              <span className="text-xs">Kịch Bản</span>
            </Link>
          </Button>
          <Button variant={isAssetRouteActive ? 'secondary' : 'ghost'} size="sm" className="flex-1 gap-1.5" asChild>
            <Link to="/asset">
              <Image className="size-4" />
              <span className="text-xs">Tài sản</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
