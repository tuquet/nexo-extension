import ScriptActionButton from './script-action-button';
import { useScriptsStore } from '../../stores/use-scripts-store';
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@extension/ui';
import { Settings } from 'lucide-react';
import { useRef, useEffect } from 'react';
import type { ScriptsState } from '../../stores/use-scripts-store';
import type React from 'react';

type ScriptViewMode = 'formatted' | 'json';

const ScriptHeader: React.FC = () => {
  const scripts = useScriptsStore((s: ScriptsState) => s.savedScripts);
  const activeScript = useScriptsStore((s: ScriptsState) => s.activeScript);
  const selectScript = useScriptsStore((s: ScriptsState) => s.selectScript);
  const currentView = useScriptsStore(s => s.currentView);
  const setModelSettingsModalOpen = useScriptsStore(s => s.setModelSettingsModalOpen);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  const setScriptViewMode = useScriptsStore(s => s.setScriptViewMode);
  const confirmationTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="bg-background w-full">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {activeScript && currentView === 'script' && (
            <Tabs value={scriptViewMode} onValueChange={v => setScriptViewMode(v as ScriptViewMode)}>
              <TabsList>
                <TabsTrigger value="formatted">Định dạng</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Select
            value={activeScript ? String(activeScript.id) : undefined}
            onValueChange={val => {
              const script = scripts.find(s => String(s.id) === val);
              if (script) selectScript(script.id!);
            }}>
            <SelectTrigger className="w-[auto]">
              <SelectValue placeholder="Chọn kịch bản" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Chọn kịch bản</SelectLabel>
                {scripts.length > 0 ? (
                  scripts.map(script => (
                    <SelectItem key={script.id} value={String(script.id)}>
                      {script.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Chưa có kịch bản nào
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setModelSettingsModalOpen(true)} disabled={!activeScript}>
            <Settings className="mr-2 h-4 w-4" /> Tùy chỉnh Model
          </Button>
          <ScriptActionButton />
        </div>
      </div>
    </div>
  );
};

export default ScriptHeader;
