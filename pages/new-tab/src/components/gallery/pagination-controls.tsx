import { Button } from '@extension/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-card flex items-center justify-center gap-4 rounded-lg border p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang truoc">
        <ChevronLeft className="h-4 w-4" />
        Truoc
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Trang <span className="text-blue-600 dark:text-blue-400">{currentPage}</span> / {totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang ke tiep">
        Tiep
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { PaginationControls };
export type { PaginationControlsProps };
