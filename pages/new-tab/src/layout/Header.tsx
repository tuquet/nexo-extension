import { Button, ModeToggle } from '@extension/ui';
import { Icon } from '@iconify/react';
import type React from 'react';

interface HeaderProps {
  title?: string;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'CineGenie', onSettingsClick }) => (
  <header className="bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/75">
    <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button variant="ghost" size="icon" aria-label="Cài đặt" onClick={onSettingsClick}>
          <Icon icon="lucide:settings" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </header>
);

export default Header;
