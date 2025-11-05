import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@extension/ui';
import type React from 'react';

interface FilterBarProps {
  filterType: 'all' | 'image' | 'video' | 'audio';
  filterScriptId: string;
  searchTerm: string;
  scripts: Array<{ id: number | undefined; title: string }>;
  onFilterTypeChange: (value: 'all' | 'image' | 'video' | 'audio') => void;
  onFilterScriptIdChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onResetFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filterType,
  filterScriptId,
  searchTerm,
  scripts,
  onFilterTypeChange,
  onFilterScriptIdChange,
  onSearchTermChange,
  onResetFilters,
}) => (
  <div className="bg-card flex flex-wrap items-end gap-4 rounded-lg border p-4">
    <div className="min-w-[200px] flex-1">
      <Label htmlFor="filter-type" className="mb-2 block text-sm font-medium">
        Loai tai san
      </Label>
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger id="filter-type" className="w-full">
          <SelectValue placeholder="Chon loai" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tat ca</SelectItem>
          <SelectItem value="image">Hinh anh</SelectItem>
          <SelectItem value="video">Video</SelectItem>
          <SelectItem value="audio">Am thanh</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="min-w-[200px] flex-1">
      <Label htmlFor="filter-script" className="mb-2 block text-sm font-medium">
        Kich ban
      </Label>
      <Select value={filterScriptId} onValueChange={onFilterScriptIdChange}>
        <SelectTrigger id="filter-script" className="w-full">
          <SelectValue placeholder="Chon kich ban" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tat ca kich ban</SelectItem>
          {scripts
            .filter(script => script.id !== undefined)
            .map(script => (
              <SelectItem key={script.id} value={String(script.id)}>
                {script.title}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>

    <div className="min-w-[200px] flex-1">
      <Label htmlFor="search-term" className="mb-2 block text-sm font-medium">
        Tim kiem
      </Label>
      <Input
        id="search-term"
        type="text"
        placeholder="Tim theo ten kich ban..."
        value={searchTerm}
        onChange={e => onSearchTermChange(e.target.value)}
        className="w-full"
      />
    </div>

    <button
      type="button"
      onClick={onResetFilters}
      className="border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2 text-sm font-medium transition-colors">
      Xoa bo loc
    </button>
  </div>
);

export { FilterBar };
export type { FilterBarProps };
