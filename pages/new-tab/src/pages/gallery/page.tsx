import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@extension/ui';
import { AssetCard, FilterBar, PaginationControls, SelectionToolbar } from '@src/components/gallery';
import { ImportAssetModal } from '@src/components/gallery/import-asset-modal';
import { GalleryUploadProgressModal } from '@src/components/gallery/upload-progress-modal';
import { db } from '@src/db';
import { useAssetFilters } from '@src/hooks/use-asset-filters';
import { useAssetSelection } from '@src/hooks/use-asset-selection';
import { useAssets } from '@src/hooks/use-assets';
import { useGalleryAssets } from '@src/hooks/use-gallery-assets';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Download, ExternalLink, Image, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Asset } from '@src/hooks/use-gallery-assets';
import type React from 'react';

const AssetGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  const savedScripts = useScriptsStore(s => s.savedScripts);
  const { deleteAssetFromGallery } = useAssets(() => {});

  // Use custom hooks for state management (SOLID: Single Responsibility)
  const { assets, isLoading, currentPage, totalPages, setCurrentPage } = useGalleryAssets();
  const {
    isSelectionMode,
    selectedAssetKeys,
    toggleSelectionMode,
    toggleAsset,
    clearSelection,
    selectAll,
    isSelected,
    getAssetKey,
  } = useAssetSelection();
  const {
    filterType,
    filterScriptId,
    searchTerm,
    filterAssets,
    setFilterType,
    setFilterScriptId,
    setSearchTerm,
    resetFilters,
  } = useAssetFilters();

  // Local state for UI interactions
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Apply filters to assets
  const filteredAssets = filterAssets(assets);

  // Event handlers (SOLID: Single Responsibility - each handler does ONE thing)
  const handleAssetClick = (asset: Asset) => {
    if (isSelectionMode) {
      toggleAsset(asset);
    } else {
      setSelectedAsset(asset);
    }
  };

  const handleDeleteSelected = async () => {
    const deletePromises = Array.from(selectedAssetKeys).map(key => {
      const [type, idStr] = key.split('-');
      const asset = assets.find(a => getAssetKey(a) === key);
      if (asset) {
        // After schema v7: assets are independent, no scriptId needed for deletion
        return deleteAssetFromGallery(type as 'image' | 'video' | 'audio', parseInt(idStr, 10));
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
    clearSelection();
    toggleSelectionMode();
  };

  const handleOpenUploadModal = () => {
    if (selectedAssetKeys.size > 0) {
      setIsUploadModalOpen(true);
    }
  };

  const handleImportComplete = (assetIds: number[]) => {
    console.log('[AssetGallery] Imported assets:', assetIds);
    setIsImportModalOpen(false);
    // Trigger gallery refresh via custom event
    window.dispatchEvent(new CustomEvent('assets-changed'));
  };

  const handleDownloadAsset = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    const fileExtension = asset.dataType.split('/')[1] || 'data';
    link.download = `asset_${asset.type}_${asset.id}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoToScript = async (asset: Asset) => {
    // After schema v7: Query ScriptAssetMapping to find related scripts
    if (asset.scriptId) {
      // Legacy: Asset still has scriptId reference
      const scriptToActivate = savedScripts.find(s => s.id === asset.scriptId);
      if (scriptToActivate) {
        setActiveScript(scriptToActivate);
        navigate(`/script/${asset.scriptId}`);
      }
    } else {
      // New schema: Find scripts via mapping table
      const mappings = await db.scriptAssetMappings.where({ assetType: asset.type, assetId: asset.id }).toArray();

      if (mappings.length > 0) {
        const scriptId = mappings[0].scriptId;
        const scriptToActivate = savedScripts.find(s => s.id === scriptId);
        if (scriptToActivate) {
          setActiveScript(scriptToActivate);
          navigate(`/script/${scriptId}`);
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="border-t-primary-500 dark:border-t-primary-400 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600"></div>
        <h4 className="text-md mt-4 font-semibold text-slate-700 dark:text-slate-300">Đang tải tài sản...</h4>
      </div>
    );
  }

  // Empty state
  if (assets.length === 0 && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
        <Image className="h-20 w-20" strokeWidth={1.5} />
        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">Thư viện tài sản trống</h3>
        <p className="mt-1 text-sm">Tạo hình ảnh/video từ trình biên tập hoặc import files từ máy tính.</p>
        <Button variant="default" size="lg" onClick={() => setIsImportModalOpen(true)} className="mt-6">
          <Upload className="mr-2 h-4 w-4" />
          Import Files
        </Button>

        {/* Import Modal */}
        <ImportAssetModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={handleImportComplete}
        />
      </div>
    );
  }

  // Main render (SOLID: Composition Pattern)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thư viện tài sản</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Files
          </Button>
          {!isSelectionMode && selectedAssetKeys.size > 0 && (
            <Button variant="default" onClick={handleOpenUploadModal}>
              <Upload className="mr-2 h-4 w-4" />
              Tải lên CapCut ({selectedAssetKeys.size})
            </Button>
          )}
          <Button variant="outline" onClick={toggleSelectionMode}>
            {isSelectionMode ? 'Hủy chế độ chọn' : 'Chế độ chọn'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filterType={filterType}
        filterScriptId={filterScriptId}
        searchTerm={searchTerm}
        scripts={savedScripts.map(s => ({ id: s.id, title: s.title }))}
        onFilterTypeChange={setFilterType}
        onFilterScriptIdChange={setFilterScriptId}
        onSearchTermChange={setSearchTerm}
        onResetFilters={resetFilters}
      />

      {/* Selection Toolbar */}
      {isSelectionMode && (
        <>
          <SelectionToolbar
            selectedCount={selectedAssetKeys.size}
            totalCount={filteredAssets.length}
            onUploadSelected={handleOpenUploadModal}
            onDeleteSelected={() => {}} // Trigger AlertDialog instead
            onSelectAll={() => selectAll(filteredAssets)}
            onClearSelection={clearSelection}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={selectedAssetKeys.size === 0} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa {selectedAssetKeys.size} tài sản đã chọn
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ xóa vĩnh viễn {selectedAssetKeys.size} tài sản đã chọn. Không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* No results */}
      {filteredAssets.length === 0 && (
        <div className="mt-16 flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy tài sản</h3>
          <p className="mt-1 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        </div>
      )}

      {/* Asset Grid (SOLID: Composition with AssetCard) */}
      {filteredAssets.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {filteredAssets.map(asset => (
            <AssetCard
              key={getAssetKey(asset)}
              asset={asset}
              isSelected={isSelected(asset)}
              isSelectionMode={isSelectionMode}
              onClick={() => handleAssetClick(asset)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {selectedAsset && (
        <Dialog open={!!selectedAsset} onOpenChange={isOpen => !isOpen && setSelectedAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="capitalize">
                Chi tiết tài sản: {selectedAsset.type} #{selectedAsset.id}
              </DialogTitle>
            </DialogHeader>
            <div className="my-4 max-h-[60vh] overflow-y-auto">
              {selectedAsset.type === 'image' && (
                <img
                  src={selectedAsset.url}
                  alt={`Asset ${selectedAsset.id}`}
                  className="max-h-full w-full object-contain"
                />
              )}
              {selectedAsset.type === 'video' && (
                <video src={selectedAsset.url} controls className="w-full">
                  <track kind="captions" />
                </video>
              )}
              {selectedAsset.type === 'audio' && (
                <div className="p-4">
                  <audio controls src={selectedAsset.url} className="w-full">
                    <track kind="captions" />
                  </audio>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleDownloadAsset(selectedAsset)}>
                  <Download className="mr-2 h-4 w-4" /> Tải xuống
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => handleGoToScript(selectedAsset)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Đi đến kịch bản
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Modal */}
      <ImportAssetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Upload Modal */}
      <GalleryUploadProgressModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        assets={assets.filter(asset => selectedAssetKeys.has(getAssetKey(asset)))}
      />
    </div>
  );
};

export default AssetGalleryPage;
