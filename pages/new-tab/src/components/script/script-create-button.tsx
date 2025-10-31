import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  ButtonGroup,
} from '@extension/ui';
import JsonImportModal from '@src/components/script/json-import-modal';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { ChevronDown, FileUp, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type React from 'react';

const ScriptCreateButton = () => {
  const importRef = useRef<HTMLInputElement>(null);
  const importData = useScriptsStore(s => s.importData);
  const importDataFromString = useScriptsStore(s => s.importDataFromString);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void importData(event);
  };

  const handleStringImport = (jsonString: string) => {
    void importDataFromString(jsonString);
  };

  return (
    <ButtonGroup>
      <Button asChild>
        <Link to="/script/new">Tạo Mới</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="!pl-2">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="[--radius:1rem]">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={e => e.preventDefault()} // Ngăn menu đóng và cho phép sự kiện click lan truyền
              onClick={() => importRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Nhập kịch bản từ file
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                ref={importRef}
                className="hidden"
                multiple // Cho phép chọn nhiều file
              />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsImportModalOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Nhập từ văn bản
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleStringImport}
      />
    </ButtonGroup>
  );
};

export default ScriptCreateButton;
