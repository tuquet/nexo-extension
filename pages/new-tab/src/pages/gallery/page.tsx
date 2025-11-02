import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Card,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@extension/ui';
import { db } from '@src/db';
import { useAssets, ASSET_EVENTS } from '@src/hooks/use-assets';
import { useStoreHydration } from '@src/hooks/use-store-hydration';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Search, Download, Trash2, ExternalLink, Eye, Music, Image, CheckCircle2, X } from 'lucide-react';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type React from 'react';

interface Asset {
  id: number;
  scriptId: number;
  sceneId?: string; // Add sceneId for images and videos
  type: 'image' | 'video' | 'audio';
  url: string;
  scriptTitle?: string;
  dataType: string; // mime type
  data: Blob; // Keep the original blob for download
}

const AssetGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  const savedScripts = useScriptsStore(s => s.savedScripts);
  const hasHydrated = useStoreHydration();
  const { deleteAssetFromGallery } = useAssets(() => {});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const objectUrlsRef = useRef<string[]>([]);

  // State for filters and search
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [filterScriptId, setFilterScriptId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // State for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<Set<string>>(new Set());
  const getAssetKey = (asset: Asset) => `${asset.type}-${asset.id}`;

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const ITEMS_PER_PAGE = 30;

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    // Revoke old URLs before creating new ones to prevent memory leaks
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];

    try {
      const scriptMap = new Map(savedScripts.map(script => [script.id, script.title]));

      // Bước 1: Đếm tổng số tài sản để tính toán phân trang
      const imageCount = await db.images.count();
      const videoCount = await db.videos.count();
      const audioCount = await db.audios.count();
      const totalCount = imageCount + videoCount + audioCount;
      setTotalAssets(totalCount);

      // Bước 2: Truy vấn ID từ tất cả các bảng, sắp xếp và lấy ra ID cho trang hiện tại
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // Lấy chỉ ID để tối ưu hóa bộ nhớ
      const imageKeys = (await db.images.toCollection().keys()) as number[];
      const videoKeys = (await db.videos.toCollection().keys()) as number[];
      const audioKeys = (await db.audios.toCollection().keys()) as number[];

      // Gộp và sắp xếp tất cả các ID (giả định ID lớn hơn là mới hơn)
      const allAssetKeys = [
        ...imageKeys.map(id => ({ type: 'image' as const, id })),
        ...videoKeys.map(id => ({ type: 'video' as const, id })),
        ...audioKeys.map(id => ({ type: 'audio' as const, id })),
      ].sort((a, b) => b.id - a.id);

      // Lấy ra các khóa cho trang hiện tại
      const paginatedKeys = allAssetKeys.slice(offset, offset + ITEMS_PER_PAGE);

      // Phân loại các khóa theo từng bảng để thực hiện bulkGet
      const imageIdsToGet = paginatedKeys.filter(k => k.type === 'image').map(k => k.id);
      const videoIdsToGet = paginatedKeys.filter(k => k.type === 'video').map(k => k.id);
      const audioIdsToGet = paginatedKeys.filter(k => k.type === 'audio').map(k => k.id);

      // Bước 3: Sử dụng bulkGet để lấy dữ liệu đầy đủ chỉ cho các mục trên trang hiện tại
      const [imageRecords, videoRecords, audioRecords] = await Promise.all([
        db.images.bulkGet(imageIdsToGet),
        db.videos.bulkGet(videoIdsToGet),
        db.audios.bulkGet(audioIdsToGet),
      ]);

      const loadedAssets: Asset[] = [];
      const newUrls: string[] = [];

      // Xử lý và gộp kết quả
      [...imageRecords, ...videoRecords, ...audioRecords].forEach(record => {
        if (record && record.id && record.scriptId) {
          // Sửa lại logic để xác định đúng loại tài sản
          const mimeType = record.data.type;
          console.log(mimeType, 'mimeType');
          const type = mimeType.startsWith('audio') ? 'audio' : mimeType.startsWith('video') ? 'video' : 'image';
          const url = URL.createObjectURL(record.data);
          newUrls.push(url);
          loadedAssets.push({
            id: record.id,
            scriptId: record.scriptId,
            type: type,
            url: url,
            scriptTitle: scriptMap.get(record.scriptId),
            dataType: record.data.type,
            data: record.data,
          });
        }
      });

      objectUrlsRef.current = newUrls;
      // Sắp xếp lại lần cuối để đảm bảo thứ tự đúng trên giao diện
      setAssets(loadedAssets.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Failed to load assets from database:', error);
    } finally {
      setIsLoading(false);
    }
  }, [savedScripts, currentPage]);

  useEffect(() => {
    if (hasHydrated) {
      // Store đã sẵn sàng, tiến hành fetch assets
      fetchAssets();
      window.addEventListener(ASSET_EVENTS.CHANGED, fetchAssets);

      return () => {
        window.removeEventListener(ASSET_EVENTS.CHANGED, fetchAssets);
      };
    } else {
      // Store chưa sẵn sàng, đảm bảo hiển thị màn hình loading
      setIsLoading(true);
      return undefined;
    }
  }, [fetchAssets, hasHydrated, currentPage]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAssetKeys(new Set()); // Clear selection when toggling mode
  };

  const handleAssetClick = (asset: Asset) => {
    if (isSelectionMode) {
      const key = getAssetKey(asset);
      const newSelection = new Set(selectedAssetKeys);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      setSelectedAssetKeys(newSelection);
    } else {
      setSelectedAsset(asset); // Open modal in normal mode
    }
  };

  const handleDeleteSelected = async () => {
    const deletePromises = Array.from(selectedAssetKeys).map(key => {
      const [type, idStr] = key.split('-');
      const asset = assets.find(a => getAssetKey(a) === key);
      if (asset) {
        return deleteAssetFromGallery(type as 'image' | 'video' | 'audio', parseInt(idStr, 10), asset.scriptId);
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
    toggleSelectionMode(); // Exit selection mode after deletion
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

  const handleGoToScript = (asset: Asset) => {
    const scriptToActivate = savedScripts.find(s => s.id === asset.scriptId);
    if (scriptToActivate) {
      setActiveScript(scriptToActivate);
      navigate(`/script/${asset.scriptId}`);
      // TODO: Add logic in ScriptEditorPage to scroll to the specific sceneId if asset.sceneId exists
    }
  };

  const filteredAssets = useMemo(
    () =>
      assets
        .filter(asset => filterType === 'all' || asset.type === filterType)
        .filter(asset => filterScriptId === 'all' || asset.scriptId === Number(filterScriptId))
        .filter(asset => asset.scriptTitle?.toLowerCase().includes(searchTerm.toLowerCase())),
    [assets, filterType, filterScriptId, searchTerm],
  );

  const totalPages = Math.ceil(totalAssets / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="border-t-primary-500 dark:border-t-primary-400 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600"></div>
        <h4 className="text-md mt-4 font-semibold text-slate-700 dark:text-slate-300">Đang tải tài sản...</h4>
      </div>
    );
  }

  if (assets.length === 0 && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
        <Image className="h-20 w-20" strokeWidth={1.5} />
        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">Thư viện tài sản trống</h3>
        <p className="mt-1 text-sm">Tạo một số hình ảnh hoặc video trong trình biên tập để chúng xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thư viện tài sản</h2>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {isSelectionMode ? (
            <>
              <span className="text-sm text-slate-500">{selectedAssetKeys.size} mục đã chọn</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={selectedAssetKeys.size === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Xóa mục đã chọn
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
              <Button variant="ghost" onClick={toggleSelectionMode}>
                <X className="mr-2 h-4 w-4" /> Hủy
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={toggleSelectionMode}>
              Chọn để xóa
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm theo tên kịch bản..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-48 pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={value => setFilterType(value as typeof filterType)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Loại tài sản" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="image">Hình ảnh</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Âm thanh</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterScriptId} onValueChange={setFilterScriptId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kịch bản" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kịch bản</SelectItem>
              {savedScripts.map(script => (
                <SelectItem key={script.id} value={String(script.id)}>
                  {script.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAssets.length === 0 && (
        <div className="mt-16 flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy tài sản</h3>
          <p className="mt-1 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {filteredAssets.map(asset => (
          <Card
            key={`${asset.type}-${asset.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Chọn tài sản ${asset.type} #${asset.id}`}
            className={`group relative cursor-pointer overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${selectedAssetKeys.has(getAssetKey(asset)) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleAssetClick(asset)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAssetClick(asset);
              }
            }}>
            <div className="relative">
              {asset.type === 'image' ? (
                <img src={asset.url} alt={`Asset ${asset.id}`} className="aspect-square h-full w-full object-cover" />
              ) : asset.type === 'video' ? (
                <video src={asset.url} className="aspect-video h-full w-full bg-black object-cover">
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center bg-slate-100 p-4 dark:bg-slate-800">
                  <Music className="h-16 w-16 text-slate-400 dark:text-slate-500" />
                  <p className="mt-3 font-mono text-xs text-slate-500">Audio Asset</p>
                </div>
              )}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isSelectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                <Eye className="h-8 w-8 text-white" />
              </div>
              <div
                className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white/80 text-blue-600 backdrop-blur-sm transition-opacity ${selectedAssetKeys.has(getAssetKey(asset)) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {selectedAssetKeys.has(getAssetKey(asset)) && <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-12">
              <p className="truncate text-sm font-semibold text-white">{asset.scriptTitle || 'Kịch bản không rõ'}</p>
              <p className="truncate font-mono text-xs text-slate-300">{asset.dataType}</p>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink>
                  Trang {currentPage} / {totalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
    </div>
  );
};

export default AssetGalleryPage;
