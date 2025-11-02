import { ModeToggle } from '@extension/ui';
import { Settings } from 'lucide-react';

const OptionsHeader = () => (
  <header className="border-b">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
          <Settings className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Extension Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your AI script generator</p>
        </div>
      </div>

      <ModeToggle />
    </div>
  </header>
);

export default OptionsHeader;
