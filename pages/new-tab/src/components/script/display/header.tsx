import ActionButton from '../actions/action-button';
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@extension/ui';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Film } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ScriptsState } from '@src/stores/use-scripts-store';
import type React from 'react';

interface HeaderProps {
  onOpenCapCutExport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCapCutExport }) => {
  const navigate = useNavigate();
  const { id: idFromUrl } = useParams<{ id: string }>();
  const scripts = useScriptsStore((s: ScriptsState) => s.savedScripts);
  const activeScript = useScriptsStore((s: ScriptsState) => s.activeScript);
  const confirmationTimeoutRef = useRef<number | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(idFromUrl);

  // Đồng bộ state cục bộ với activeScript từ store
  useEffect(() => {
    if (activeScript) {
      setSelectedValue(String(activeScript.id));
    }
  }, [activeScript]);

  useEffect(
    () => () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="bg-background sticky top-16 z-30 -mx-4 -mt-6 mb-6 border-b px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedValue}
            onValueChange={val => {
              // Đẩy việc điều hướng vào cuối event loop để cho phép Select component hoàn tất cập nhật trạng thái của nó trước.
              // Điều này tránh được race condition gây ra lỗi "pending".
              setTimeout(() => navigate(`/script/${val}`), 0);
            }}>
            <SelectTrigger className="w-[auto]" disabled={scripts.length === 0}>
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
          {onOpenCapCutExport && (
            <Button variant="outline" onClick={onOpenCapCutExport} disabled={!activeScript}>
              <Film className="mr-2 h-4 w-4" /> Export to CapCut
            </Button>
          )}
          <ActionButton />
        </div>
      </div>
    </div>
  );
};

export default Header;
