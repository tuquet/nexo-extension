import { db } from '../db';
import { create } from 'zustand';
import type { Root } from '../types';
import type React from 'react';

type ActiveSceneIdentifier = { actIndex: number; sceneIndex: number } | null;

type ScriptsState = {
  savedScripts: Root[];
  activeScript: Root | null;
  activeSceneIdentifier: ActiveSceneIdentifier;
  scriptsError: string | null;
  currentView: 'script' | 'assets';
  setCurrentView: (v: 'script' | 'assets') => void;
  scriptViewMode: 'formatted' | 'json';
  setScriptViewMode: (m: 'formatted' | 'json') => void;
  isImporting: boolean;
  isZipping: boolean;
  settingsModalOpen: boolean;
  modelSettingsModalOpen: boolean;
  setModelSettingsModalOpen: (v: boolean) => void;
  setSettingsModalOpen: (v: boolean) => void;
  importData: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  importDataFromString: (jsonString: string) => Promise<void>;
  exportData: () => Promise<void>;
  exportZip: () => Promise<void>;
  init: () => Promise<void>;
  selectScript: (id: number) => void;
  newScript: () => void;
  saveActiveScript: (script: Root) => Promise<void>;
  deleteActiveScript: () => Promise<void>;
  clearAllData: () => Promise<void>;
  updateScriptField: (path: string, value: unknown) => Promise<void>;
  addScript: (script: Root) => Promise<Root>;
  setActiveSceneIdentifier: (id: ActiveSceneIdentifier) => void;
  setActiveScript: (s: Root | null) => void;
};

const setNestedValue = (obj: Record<string, unknown> | unknown[], path: string, value: unknown) => {
  const keys = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split('.');
  let current: unknown = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextKeyNumeric = !isNaN(parseInt(nextKey, 10));

    if (typeof current !== 'object' || current === null) {
      // Không thể đi sâu hơn, dừng lại.
      return obj;
    }

    const currObj = current as Record<string, unknown>;

    // Nếu key không tồn tại hoặc là null/undefined, tạo object/array mới
    if (currObj[key] === undefined || currObj[key] === null) {
      currObj[key] = isNextKeyNumeric ? [] : {};
    }
    current = currObj[key];
  }

  (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
  return obj;
};

const useScriptsStore = create<ScriptsState>((set, get) => ({
  // NOSONAR
  savedScripts: [],
  activeScript: null,
  activeSceneIdentifier: null,
  currentView: 'script',
  scriptViewMode: 'formatted',
  scriptsError: null,
  isImporting: false,
  isZipping: false,
  settingsModalOpen: false,
  modelSettingsModalOpen: false,

  init: async () => {
    try {
      const allScripts = await db.scripts.toArray();
      set({ savedScripts: allScripts });
      if (allScripts.length > 0) {
        const first = allScripts[0];
        set({ activeScript: first });
        if (first.acts?.[0]?.scenes?.[0]) set({ activeSceneIdentifier: { actIndex: 0, sceneIndex: 0 } });
      }
    } catch (err) {
      console.error('Failed to init scripts store', err);
      set({ scriptsError: 'Không thể tải danh sách kịch bản đã lưu.' });
    }
  },

  selectScript: id => {
    const script = get().savedScripts.find(s => s.id === id);
    if (script) {
      set({ activeScript: script });
      if (script.acts?.[0]?.scenes?.[0]) set({ activeSceneIdentifier: { actIndex: 0, sceneIndex: 0 } });
      else set({ activeSceneIdentifier: null });
    }
  },

  newScript: () => set({ activeScript: null, activeSceneIdentifier: null, scriptsError: null }),

  saveActiveScript: async scriptToSave => {
    try {
      await db.scripts.put(scriptToSave);
      set(state => ({ savedScripts: state.savedScripts.map(s => (s.id === scriptToSave.id ? scriptToSave : s)) }));
      if (get().activeScript?.id === scriptToSave.id) set({ activeScript: scriptToSave });
    } catch (err) {
      console.error('Failed to save script', err);
      set({ scriptsError: 'Không thể lưu các thay đổi của bạn.' });
    }
  },

  deleteActiveScript: async () => {
    const active = get().activeScript;
    if (!active || active.id === undefined) return;
    const id = active.id;
    try {
      await db.scripts.delete(id);
      await db.images.where({ scriptId: id }).delete();
      await db.videos.where({ scriptId: id }).delete();
      const remaining = get().savedScripts.filter(s => s.id !== id);
      set({ savedScripts: remaining });
      if (remaining.length > 0) {
        const first = remaining[0];
        set({ activeScript: first });
        if (first.acts?.[0]?.scenes?.[0]) set({ activeSceneIdentifier: { actIndex: 0, sceneIndex: 0 } });
        else set({ activeSceneIdentifier: null });
      } else {
        set({ activeScript: null, activeSceneIdentifier: null });
      }
      window.dispatchEvent(new CustomEvent('assets-changed'));
    } catch (err) {
      console.error('Failed to delete script', err);
      set({ scriptsError: err instanceof Error ? err.message : 'Không thể xóa kịch bản.' });
    }
  },

  clearAllData: async () => {
    try {
      await db.clearAllData();
      set({ savedScripts: [], activeScript: null, activeSceneIdentifier: null });
      window.dispatchEvent(new CustomEvent('assets-changed'));
    } catch (err) {
      console.error('Failed to clear data', err);
      set({ scriptsError: err instanceof Error ? err.message : 'Không thể dọn dẹp toàn bộ dữ liệu.' });
    }
  },

  importData: async event => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      set({ isImporting: true, scriptsError: null });

      const allScriptsToImport: Root[] = [];

      // Hàm đọc một file và trả về nội dung text
      const readFileAsText = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsText(file);
        });

      // Đọc tất cả các file song song
      const fileContents = await Promise.all(Array.from(files).map(readFileAsText));

      for (const text of fileContents) {
        const importedData = JSON.parse(text);
        const scriptsFromFile = Array.isArray(importedData) ? importedData : [importedData];

        const isValidScript = (script: unknown): script is Root =>
          script !== null && typeof script === 'object' && 'title' in script && 'acts' in script;

        if (!scriptsFromFile.every(isValidScript)) {
          // Có thể hiển thị lỗi cụ thể hơn, nhưng để đơn giản, ta sẽ bỏ qua file không hợp lệ
          console.warn('Một file chứa định dạng kịch bản không hợp lệ và đã được bỏ qua.');
          continue;
        }

        const scriptsToAdd = scriptsFromFile.map(s => {
          const { id: _id, ...rest } = s as Root & { id?: number };
          void _id; // Bỏ qua id cũ để Dexie tự tạo id mới
          return rest as Root;
        });
        allScriptsToImport.push(...scriptsToAdd);
      }

      if (allScriptsToImport.length > 0) await db.scripts.bulkAdd(allScriptsToImport);
      window.location.reload();
    } catch (err) {
      console.error('Lỗi nhập dữ liệu:', err);
      set({ scriptsError: err instanceof Error ? err.message : 'Không thể nhập dữ liệu.', isImporting: false });
    }
  },

  importDataFromString: async jsonString => {
    if (!jsonString.trim()) return;

    try {
      set({ isImporting: true, scriptsError: null });

      const importedData = JSON.parse(jsonString);
      const scriptsToImport = Array.isArray(importedData) ? importedData : [importedData];

      const isValidScript = (script: unknown): script is Root =>
        script !== null && typeof script === 'object' && 'title' in script && 'acts' in script;

      if (!scriptsToImport.every(isValidScript)) {
        throw new Error('Dữ liệu JSON không chứa định dạng kịch bản hợp lệ.');
      }

      const scriptsToAdd = scriptsToImport.map(s => {
        const { id: _id, ...rest } = s as Root & { id?: number };
        void _id; // Bỏ qua id cũ để Dexie tự tạo id mới
        return rest as Root;
      });

      if (scriptsToAdd.length > 0) {
        await db.scripts.bulkAdd(scriptsToAdd);
        window.location.reload(); // Tải lại để hiển thị dữ liệu mới
      } else {
        set({ isImporting: false });
      }
    } catch (err) {
      console.error('Lỗi nhập dữ liệu từ chuỗi:', err);
      set({ scriptsError: err instanceof Error ? err.message : 'Không thể nhập dữ liệu.', isImporting: false });
    }
  },

  exportData: async () => {
    try {
      const allScripts = await db.scripts.toArray();
      const jsonString = JSON.stringify(allScripts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Prefer using a script alias if available; otherwise fallback to date
      const defaultName = `cinegenie-scripts-${new Date().toISOString().slice(0, 10)}.json`;
      // If there's an active script with an alias, use that alias for the filename
      const active = get().activeScript;
      const aliasPart = active?.alias ? active.alias.replace(/[^a-z0-9]/gi, '_').toLowerCase() : null;
      a.download = aliasPart ? `${aliasPart}.json` : defaultName;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi xuất dữ liệu:', error);
      set({ scriptsError: 'Đã xảy ra lỗi trong quá trình xuất dữ liệu kịch bản.' });
    }
  },

  exportZip: async () => {
    const activeScript = get().activeScript;
    if (!activeScript) return;
    set({ isZipping: true, scriptsError: null });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const scriptJson = JSON.stringify(activeScript, null, 2);
      zip.file('script.json', scriptJson);

      for (const act of activeScript.acts) {
        for (const scene of act.scenes) {
          if (scene.generatedImageId) {
            const imageRecord = await db.images.get(scene.generatedImageId);
            if (imageRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.png`, imageRecord.data as Blob);
            }
          }
          if (scene.generatedVideoId) {
            const videoRecord = await db.videos.get(scene.generatedVideoId);
            if (videoRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.mp4`, videoRecord.data as Blob);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      // Prefer alias, then title, then 'script'
      const aliasPart = activeScript.alias ? activeScript.alias.replace(/[^a-z0-9]/gi, '_').toLowerCase() : null;
      const safeTitle = aliasPart || activeScript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'script';
      a.href = url;
      a.download = `${safeTitle}.zip`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi xuất file ZIP:', err);
      set({ scriptsError: err instanceof Error ? err.message : 'Không thể tạo file ZIP.' });
    } finally {
      set({ isZipping: false });
    }
  },

  updateScriptField: async (path: string, value: unknown) => {
    const active = get().activeScript;
    if (!active) return;
    const updated = structuredClone(active) as Root;
    setNestedValue(updated as unknown as Record<string, unknown>, path, value);
    set({ activeScript: updated });
    await get().saveActiveScript(updated);
  },

  addScript: async script => {
    try {
      const newId = await db.scripts.add(script);
      const scriptWithId = { ...script, id: newId } as Root;
      set(state => ({ savedScripts: [...state.savedScripts, scriptWithId], activeScript: scriptWithId }));
      if (scriptWithId.acts?.[0]?.scenes?.[0]) set({ activeSceneIdentifier: { actIndex: 0, sceneIndex: 0 } });
      return scriptWithId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lưu kịch bản mới.';
      set({ scriptsError: errorMsg });
      throw new Error(errorMsg);
    }
  },

  setActiveSceneIdentifier: id => set({ activeSceneIdentifier: id }),
  setActiveScript: s => set({ activeScript: s }),
  setCurrentView: v => set({ currentView: v }),
  setScriptViewMode: m => set({ scriptViewMode: m }),
  setSettingsModalOpen: v => set({ settingsModalOpen: v }),
  setModelSettingsModalOpen: v => set({ modelSettingsModalOpen: v }),
}));

export type { ScriptsState };
export { useScriptsStore, setNestedValue };
