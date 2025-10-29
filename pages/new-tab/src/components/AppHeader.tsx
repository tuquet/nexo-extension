import { ThemeSwitcher } from './ThemeSwitcher';
import { useState, useRef, useEffect } from 'react';
import type { Root } from '../types';
import type { Theme } from './ThemeSwitcher';
import type React from 'react';

type ScriptViewMode = 'formatted' | 'json';

interface AppHeaderProps {
  scripts: Root[];
  activeScript: Root | null;
  onSelectScript: (id: number) => void;
  onNewScript: () => void;
  onDeleteActiveScript: () => void;
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportZip: () => void;
  isZipping: boolean;
  currentView: 'script' | 'assets';
  onViewChange: (view: 'script' | 'assets') => void;
  theme: Theme;
  onToggleTheme: () => void;
  scriptViewMode: ScriptViewMode;
  onScriptViewModeChange: (mode: ScriptViewMode) => void;
  onOpenSettings: () => void;
}

const Dropdown: React.FC<{ trigger: React.ReactNode; children: React.ReactNode; contentClasses?: string }> = ({
  trigger,
  children,
  contentClasses = 'w-56',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="focus:outline-none"
        tabIndex={0}>
        {trigger}
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 z-20 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 ${contentClasses}`}>
          <div
            className="py-1"
            role="menu"
            tabIndex={0}
            onClick={e => {
              if ((e.target as HTMLElement).closest('a, button')) {
                setIsOpen(false);
              }
            }}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).closest('a, button')) {
                setIsOpen(false);
              }
            }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const AppHeader: React.FC<AppHeaderProps> = ({
  scripts,
  activeScript,
  onSelectScript,
  onNewScript,
  onDeleteActiveScript,
  onClearAllData,
  onExportData,
  onImportData,
  onExportZip,
  isZipping,
  currentView,
  onViewChange,
  theme,
  onToggleTheme,
  scriptViewMode,
  onScriptViewModeChange,
  onOpenSettings,
}) => {
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmationPending, setConfirmationPending] = useState<'deleteScript' | 'clearAll' | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);

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
        onDeleteActiveScript();
      } else if (action === 'clearAll') {
        onClearAllData();
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
    <header className="z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* <span className="text-2xl">🎬</span> */}
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">CineGenie</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Dropdown
          trigger={
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
              <span className="max-w-[200px] truncate">{activeScript?.title || 'Chọn kịch bản'}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          }>
          {scripts.length > 0 ? (
            scripts.map(script => (
              <button
                key={script.id}
                type="button"
                onClick={() => onSelectScript(script.id!)}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                {script.title}
              </button>
            ))
          ) : (
            <span className="block px-4 py-2 text-sm text-slate-500">Chưa có kịch bản nào</span>
          )}
        </Dropdown>
        <button
          onClick={onNewScript}
          className="bg-primary hover:bg-primary-dark inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-white shadow-sm">
          + Mới
        </button>
      </div>

      <div className="flex items-center gap-2">
        {activeScript && (
          <div className="flex rounded-md bg-slate-100 p-0.5 shadow-sm dark:bg-slate-700">
            <button
              onClick={() => onViewChange('script')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${currentView === 'script' ? 'text-primary bg-white dark:bg-slate-600 dark:text-white' : 'text-slate-600 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-600/50'}`}>
              Kịch bản
            </button>
            <button
              onClick={() => onViewChange('assets')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${currentView === 'assets' ? 'text-primary bg-white dark:bg-slate-600 dark:text-white' : 'text-slate-600 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-600/50'}`}>
              Tài sản
            </button>
          </div>
        )}
        {activeScript && currentView === 'script' && (
          <div className="flex rounded-md bg-slate-100 p-0.5 shadow-sm dark:bg-slate-700">
            <button
              onClick={() => onScriptViewModeChange('formatted')}
              className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${scriptViewMode === 'formatted' ? 'text-primary bg-white dark:bg-slate-600 dark:text-white' : 'text-slate-600 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-600/50'}`}>
              Định dạng
            </button>
            <button
              onClick={() => onScriptViewModeChange('json')}
              className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${scriptViewMode === 'json' ? 'text-primary bg-white dark:bg-slate-600 dark:text-white' : 'text-slate-600 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-600/50'}`}>
              JSON
            </button>
          </div>
        )}
        <Dropdown
          trigger={
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          }>
          <button
            type="button"
            onClick={() => {
              if (activeScript) onExportZip();
            }}
            disabled={!activeScript}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${!activeScript ? 'cursor-not-allowed text-slate-400 dark:text-slate-500' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'}`}>
            {isZipping ? 'Đang nén...' : 'Xuất ZIP'}
          </button>
          <button
            type="button"
            onClick={() => {
              onExportData();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
            Xuất JSON
          </button>
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              importRef.current?.click();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
            Nhập JSON
          </button>
          <input type="file" accept=".json" onChange={onImportData} ref={importRef} className="hidden" />
          <hr className="my-1 border-slate-200 dark:border-slate-600" />
          <button
            type="button"
            onClick={() => {
              if (activeScript) handleDestructiveActionClick('deleteScript');
            }}
            disabled={!activeScript}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              !activeScript
                ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                : confirmationPending === 'deleteScript'
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50'
            }`}>
            {confirmationPending === 'deleteScript' ? 'Bạn chắc chắn?' : 'Xóa kịch bản'}
          </button>
          <button
            type="button"
            onClick={() => {
              handleDestructiveActionClick('clearAll');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              confirmationPending === 'clearAll'
                ? 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50'
            }`}>
            {confirmationPending === 'clearAll' ? 'Xác nhận xóa tất cả?' : 'Dọn dẹp tất cả'}
          </button>
        </Dropdown>
        <ThemeSwitcher theme={theme} onToggle={onToggleTheme} />
        <button
          onClick={onOpenSettings}
          className="focus:ring-primary flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-800"
          aria-label="Mở cài đặt API Key"
          title="Mở cài đặt API Key">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
