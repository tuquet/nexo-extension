import { db } from '../db';
import { useAssets } from '../hooks/useAssets';
import { useScriptsStore } from '../stores/useScriptsStore';
import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';

interface Asset {
  id: number;
  scriptId: number;
  type: 'image' | 'video';
  url: string;
  dataType: string; // mime type
}

const AssetGallery: React.FC = () => {
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);
  const { deleteAssetFromGallery } = useAssets(setActiveScript, saveActiveScript, () => {});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const objectUrlsRef = useRef<string[]>([]);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    // Revoke old URLs before creating new ones to prevent memory leaks
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];

    try {
      const imageRecords = await db.images.toArray();
      const videoRecords = await db.videos.toArray();

      const loadedAssets: Asset[] = [];
      const newUrls: string[] = [];

      imageRecords.forEach(record => {
        if (record.id && record.scriptId) {
          const url = URL.createObjectURL(record.data);
          newUrls.push(url);
          loadedAssets.push({
            id: record.id,
            scriptId: record.scriptId,
            type: 'image',
            url: url,
            dataType: record.data.type,
          });
        }
      });

      videoRecords.forEach(record => {
        if (record.id && record.scriptId) {
          const url = URL.createObjectURL(record.data);
          newUrls.push(url);
          loadedAssets.push({
            id: record.id,
            scriptId: record.scriptId,
            type: 'video',
            url: url,
            dataType: record.data.type,
          });
        }
      });

      objectUrlsRef.current = newUrls;
      setAssets(loadedAssets.sort((a, b) => b.id - a.id)); // Show newest first
    } catch (error) {
      console.error('Failed to load assets from database:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();

    window.addEventListener('assets-changed', fetchAssets);

    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      window.removeEventListener('assets-changed', fetchAssets);
    };
  }, [fetchAssets]);

  const handleDeleteClick = async (asset: Asset) => {
    await deleteAssetFromGallery(asset.type, asset.id, asset.scriptId);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="border-t-primary h-10 w-10 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600"></div>
        <h4 className="text-md mt-4 font-semibold text-slate-700 dark:text-slate-300">Đang tải tài sản...</h4>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
        <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">Thư viện tài sản trống</h3>
        <p className="mt-1 text-sm">Tạo một số hình ảnh hoặc video trong trình biên tập để chúng xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-slate-800 dark:text-slate-100">Thư viện tài sản</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {assets.map(asset => (
          <div
            key={`${asset.type}-${asset.id}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {asset.type === 'image' ? (
              <img src={asset.url} alt={`Asset ${asset.id}`} className="h-full w-full object-cover" />
            ) : (
              <video src={asset.url} controls className="h-full w-full object-cover">
                <track kind="captions" label="No captions" />
              </video>
            )}
            <div className="absolute right-0 top-0 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => handleDeleteClick(asset)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600"
                title="Xóa vĩnh viễn tài sản">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate font-mono text-xs text-white">{asset.dataType}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetGallery;
