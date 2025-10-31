import { usePreferencesStore } from '../stores/use-preferences-store';
import { Button, ModeToggle, Separator } from '@extension/ui';
import { Icon } from '@iconify/react';
import ScriptSettingModal from '@src/components/common/app-setting-modal';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Link, useLocation } from 'react-router-dom';
import type React from 'react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'CG' }) => {
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const toggleSize = usePreferencesStore(s => s.toggleContainerSize);
  const containerSize = usePreferencesStore(s => s.containerSize);
  const isSettingsModalOpen = useScriptsStore(s => s.settingsModalOpen);
  const setIsSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const location = useLocation();

  const isScriptRouteActive = location.pathname === '/' || location.pathname.startsWith('/script');
  const isAssetRouteActive = location.pathname === '/asset';

  return (
    <div className="bg-background/70 sticky top-0 z-40 w-full backdrop-blur-sm">
      <div className="mx-auto flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-foreground text-lg font-bold">{title}</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/script">
              <Button variant={isScriptRouteActive ? 'secondary' : 'ghost'}>Kịch Bản</Button>
            </Link>
            <Link to="/asset">
              <Button variant={isAssetRouteActive ? 'secondary' : 'ghost'}>Tài sản</Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle container size"
            title={`Container size: ${containerSize}`}
            onClick={toggleSize}>
            <span className="sr-only">Toggle container size</span>
            <span className="bg-muted/10 text-foreground inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-xs font-medium">
              {containerSize === 'narrow' ? 'N' : containerSize === 'normal' ? 'M' : 'W'}
            </span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon" aria-label="Cài đặt" onClick={() => setSettingsModalOpen(true)}>
            <Icon icon="lucide:settings" className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <ScriptSettingModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
};

export default Header;
