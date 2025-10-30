import { useScriptsStore } from '../stores/useScriptsStore';
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
import { useState, useRef, useEffect } from 'react';
import type { ScriptsState } from '../stores/useScriptsStore';
import type React from 'react';

type ScriptViewMode = 'formatted' | 'json';

const ScriptHeader: React.FC = () => {
  const scripts = useScriptsStore((s: ScriptsState) => s.savedScripts);
  const activeScript = useScriptsStore((s: ScriptsState) => s.activeScript);
  const selectScript = useScriptsStore((s: ScriptsState) => s.selectScript);
  const currentView = useScriptsStore(s => s.currentView);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  const setScriptViewMode = useScriptsStore(s => s.setScriptViewMode);
  const newScript = useScriptsStore((s: ScriptsState) => s.newScript);
  const deleteActiveScript = useScriptsStore((s: ScriptsState) => s.deleteActiveScript);
  const clearAllData = useScriptsStore((s: ScriptsState) => s.clearAllData);
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmationPending, setConfirmationPending] = useState<'deleteScript' | 'clearAll' | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);

  const importData = useScriptsStore(s => s.importData);
  const exportData = useScriptsStore(s => s.exportData);
  const exportZip = useScriptsStore(s => s.exportZip);
  const isZipping = useScriptsStore(s => s.isZipping);
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);

  useEffect(
    () => () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    },
    [],
  );

  const handleDestructiveActionClick = (action: 'deleteScript' | 'clearAll') => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }

    if (confirmationPending === action) {
      if (action === 'deleteScript') {
        deleteActiveScript();
      } else if (action === 'clearAll') {
        clearAllData();
      }
      setConfirmationPending(null);
    } else {
      setConfirmationPending(action);
      confirmationTimeoutRef.current = window.setTimeout(() => {
        setConfirmationPending(null);
      }, 3000);
    }
  };

  return (
    <div className="bg-background w-full border-b dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
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
          <Button onClick={newScript}>+ Mới</Button>
        </div>

        {activeScript && currentView === 'script' && (
          <Tabs value={scriptViewMode} onValueChange={v => setScriptViewMode(v as ScriptViewMode)}>
            <TabsList>
              <TabsTrigger value="formatted">Định dạng</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (activeScript) exportZip();
            }}
            disabled={!activeScript}>
            {isZipping ? 'Đang nén...' : 'Xuất ZIP'}
          </Button>
          <Button onClick={() => exportData()}>Xuất</Button>
          <Button
            onClick={() => {
              if (activeScript) handleDestructiveActionClick('deleteScript');
            }}
            disabled={!activeScript}>
            {confirmationPending === 'deleteScript' ? 'Bạn chắc chắn?' : 'Xóa'}
          </Button>
          <Button onClick={() => handleDestructiveActionClick('clearAll')}>
            {confirmationPending === 'clearAll' ? 'Xác nhận xóa tất cả?' : 'Dọn dẹp tất cả'}
          </Button>
          <Button onClick={() => importRef.current?.click()} title="Nhập">
            Nhập
          </Button>
          <input type="file" accept=".json" onChange={e => void importData(e)} ref={importRef} className="hidden" />
          <Button onClick={() => setSettingsModalOpen(true)}>
            <Settings />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScriptHeader;
