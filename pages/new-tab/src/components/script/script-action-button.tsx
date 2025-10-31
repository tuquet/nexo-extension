import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  ButtonGroup,
} from '@extension/ui';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { FileJson, ChevronDown, Trash, FolderDown } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ScriptsState } from '@src/stores/use-scripts-store';

const ScriptActionButton = () => {
  const confirmationTimeoutRef = useRef<number | null>(null);
  const activeScript = useScriptsStore((s: ScriptsState) => s.activeScript);
  const deleteActiveScript = useScriptsStore((s: ScriptsState) => s.deleteActiveScript);
  const [confirmationPending, setConfirmationPending] = useState<'deleteScript' | 'clearAll' | null>(null);
  const clearAllData = useScriptsStore((s: ScriptsState) => s.clearAllData);
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
  const exportData = useScriptsStore(s => s.exportData);
  const exportZip = useScriptsStore(s => s.exportZip);
  const isZipping = useScriptsStore(s => s.isZipping);

  return (
    <ButtonGroup>
      <Button variant="outline">Hành Động</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="!pl-2">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="[--radius:1rem]">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={e => e.preventDefault()}
              onClick={() => {
                if (activeScript) exportZip();
              }}
              disabled={!activeScript}>
              <FolderDown className="mr-2 h-4 w-4" />
              {isZipping ? 'Đang nén...' : 'Xuất ZIP'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={e => e.preventDefault()} onClick={() => exportData()} disabled={!activeScript}>
              <FileJson className="mr-2 h-4 w-4" />
              Xuất JSON
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={e => e.preventDefault()}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-300"
              onClick={e => {
                e.stopPropagation(); // Ngăn sự kiện lan truyền thêm
                if (activeScript) handleDestructiveActionClick('deleteScript');
              }}
              disabled={!activeScript}>
              <Trash className="mr-2 h-4 w-4" />
              {confirmationPending === 'deleteScript' ? 'Bạn chắc chắn?' : 'Xóa kịch bản'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};

export default ScriptActionButton;
