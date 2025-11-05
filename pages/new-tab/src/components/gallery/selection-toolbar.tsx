import { Button } from '@extension/ui';
import { Check, Trash2, Upload, X } from 'lucide-react';
import type React from 'react';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onUploadSelected: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isUploading?: boolean;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onUploadSelected,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
  isUploading = false,
}) => (
  <div className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
    <div className="flex items-center gap-3">
      <p className="text-sm font-medium">
        Da chon: <span className="text-blue-600 dark:text-blue-400">{selectedCount}</span> / {totalCount}
      </p>
      <Button variant="outline" size="sm" onClick={onSelectAll} disabled={selectedCount === totalCount}>
        <Check className="mr-2 h-4 w-4" />
        Chon tat ca
      </Button>
      <Button variant="outline" size="sm" onClick={onClearSelection} disabled={selectedCount === 0}>
        <X className="mr-2 h-4 w-4" />
        Bo chon
      </Button>
    </div>

    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={onUploadSelected} disabled={selectedCount === 0 || isUploading}>
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Đang tải lên...' : `Tải lên Capcut (${selectedCount})`}
      </Button>
      <Button variant="destructive" size="sm" onClick={onDeleteSelected} disabled={selectedCount === 0 || isUploading}>
        <Trash2 className="mr-2 h-4 w-4" />
        Xoa
      </Button>
    </div>
  </div>
);

export { SelectionToolbar };
export type { SelectionToolbarProps };
