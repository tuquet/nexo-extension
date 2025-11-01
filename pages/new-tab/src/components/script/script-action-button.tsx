import ScriptTtsExportModal from './script-tts-export-modal';
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
import { FileJson, ChevronDown, Trash, FolderDown, MicVocal, Wand2 } from 'lucide-react';
import { useState, useRef } from 'react';
import type { ScriptsState } from '@src/stores/use-scripts-store';

const ScriptActionButton = () => {
  const activeScript = useScriptsStore((s: ScriptsState) => s.activeScript);
  const deleteActiveScript = useScriptsStore((s: ScriptsState) => s.deleteActiveScript);
  const [confirmationPending, setConfirmationPending] = useState<'deleteScript' | null>(null);

  const confirmationTimeoutRef = useRef<number | null>(null);
  const handleDestructiveActionClick = (action: 'deleteScript') => {
    if (confirmationPending === action) {
      if (action === 'deleteScript') {
        if (activeScript?.id !== undefined) {
          void deleteActiveScript(activeScript.id);
        }
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

  const [isVbeeModalOpen, setIsVbeeModalOpen] = useState(false);

  return (
    <>
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
              <DropdownMenuItem onSelect={() => setIsVbeeModalOpen(true)} disabled={!activeScript}>
                <MicVocal className="mr-2 h-4 w-4" />
                Tạo Tài Nguyên TTS
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => e.preventDefault()}
                onClick={() => {
                  if (activeScript) exportZip();
                }}
                disabled={!activeScript}>
                <FolderDown className="mr-2 h-4 w-4" />
                {isZipping ? 'Đang nén...' : 'Xuất ZIP'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => e.preventDefault()}
                onClick={() => exportData()}
                disabled={!activeScript}>
                <FileJson className="mr-2 h-4 w-4" />
                Xuất JSON
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled={true}>
                <Wand2 className="mr-2 h-4 w-4" />
                Làm sạch kịch bản (Sắp có)
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={e => e.preventDefault()}
                className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-300"
                onClick={e => {
                  e.stopPropagation(); // Ngăn sự kiện lan truyền thêm
                  handleDestructiveActionClick('deleteScript');
                }}
                disabled={!activeScript}>
                <Trash className="mr-2 h-4 w-4" />
                {confirmationPending === 'deleteScript' ? 'Bạn chắc chắn?' : 'Xóa kịch bản'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      <ScriptTtsExportModal isOpen={isVbeeModalOpen} onClose={() => setIsVbeeModalOpen(false)} />
    </>
  );
};

export default ScriptActionButton;
