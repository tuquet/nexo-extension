import { useMemo, useState } from 'react';
import type { Asset } from './use-gallery-assets';

type FilterType = 'all' | 'image' | 'video' | 'audio';

interface UseAssetFiltersReturn {
  filterType: FilterType;
  filterScriptId: string;
  searchTerm: string;
  setFilterType: (type: FilterType) => void;
  setFilterScriptId: (scriptId: string) => void;
  setSearchTerm: (term: string) => void;
  filterAssets: (assets: Asset[]) => Asset[];
  resetFilters: () => void;
}

const useAssetFilters = (): UseAssetFiltersReturn => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterScriptId, setFilterScriptId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filterAssets = useMemo(
    () =>
      (assets: Asset[]): Asset[] =>
        assets
          .filter(asset => filterType === 'all' || asset.type === filterType)
          // After schema v7: scriptId is optional, filter by scriptId only if it exists
          .filter(asset => filterScriptId === 'all' || asset.scriptId === Number(filterScriptId))
          // Search by filename for imported assets, or by script title
          .filter(
            asset =>
              !searchTerm ||
              asset.scriptTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              asset.originalFilename?.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
    [filterType, filterScriptId, searchTerm],
  );

  const resetFilters = () => {
    setFilterType('all');
    setFilterScriptId('all');
    setSearchTerm('');
  };

  return {
    filterType,
    filterScriptId,
    searchTerm,
    setFilterType,
    setFilterScriptId,
    setSearchTerm,
    filterAssets,
    resetFilters,
  };
};

export { useAssetFilters };
export type { FilterType, UseAssetFiltersReturn };
