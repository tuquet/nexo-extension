import { useUIStateStore } from './use-ui-state-store';
import { db } from '../db';
import { exportService } from '../services/export-service';
import { scriptRepository } from '../services/repositories';
import { produce } from 'immer';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScriptStory, Scene } from '../types';
import type React from 'react';

type ActiveSceneIdentifier = { actIndex: number; sceneIndex: number } | null;

type ScriptsState = {
  savedScripts: ScriptStory[];
  activeScript: ScriptStory | null;
  activeSceneIdentifier: ActiveSceneIdentifier;
  scriptsError: string | null;
  importData: (event: React.ChangeEvent<HTMLInputElement>) => Promise<number | undefined>;
  importDataFromString: (jsonString: string) => Promise<number | undefined>;
  exportData: () => Promise<void>;
  exportZip: () => Promise<void>;
  init: () => Promise<void>;
  reloadFromDB: () => Promise<void>;
  selectScript: (id: number) => void;
  newScript: () => void;
  saveActiveScript: (script: ScriptStory) => Promise<void>;
  deleteActiveScript: (id: number) => Promise<void>;
  // Thay thế updateScriptField bằng các hàm chuyên biệt
  updateRootField: (field: 'title' | 'logline', value: string) => Promise<void>;
  updateActSummary: (actIndex: number, value: string) => Promise<void>;
  updateSceneField: (
    actIndex: number,
    sceneIndex: number,
    field: 'action' | 'visual_style' | 'audio_style' | 'location' | 'time',
    value: string,
  ) => Promise<void>;
  updateDialogueLine: (actIndex: number, sceneIndex: number, dialogueIndex: number, value: string) => Promise<void>;
  updateSceneGeneratedAssetId: (
    actIndex: number,
    sceneIndex: number,
    assetType: 'image' | 'video',
    assetId: number | undefined,
  ) => Promise<void>;
  addScript: (script: ScriptStory) => Promise<ScriptStory>;
  addAct: () => Promise<void>;
  deleteAct: (actIndex: number) => Promise<void>;
  addScene: (actIndex: number) => Promise<void>;
  deleteScene: (actIndex: number, sceneIndex: number) => Promise<void>;
  addDialogue: (actIndex: number, sceneIndex: number, roleId?: string) => Promise<void>;
  updateDialogueRoleId: (actIndex: number, sceneIndex: number, dialogueIndex: number, roleId: string) => Promise<void>;
  deleteDialogue: (actIndex: number, sceneIndex: number, dialogueIndex: number) => Promise<void>;
  mergeDialoguesInScene: (actIndex: number, sceneIndex: number) => Promise<void>;
  reorderDialogues: (actIndex: number, sceneIndex: number, oldIndex: number, newIndex: number) => Promise<void>;
  addCharacter: (character: { name: string; description: string; roleId: string }) => Promise<void>;
  updateCharacter: (roleId: string, updates: Partial<{ name: string; description: string }>) => Promise<void>;
  deleteCharacter: (roleId: string) => Promise<void>;
  setActiveSceneIdentifier: (id: ActiveSceneIdentifier) => void;
  setActiveScript: (s: ScriptStory | null) => void;
  _updateActiveScript: (updater: (draft: ScriptStory) => void) => Promise<void>;
  clearAllData: () => Promise<void>;
};

/**
 * Hàm nội bộ để xử lý và lưu các kịch bản từ một chuỗi JSON.
 * @param jsonString Chuỗi JSON chứa một hoặc một mảng các đối tượng kịch bản.
 * @returns Promise trả về ID của kịch bản cuối cùng được thêm vào.
 */
const _processAndSaveScripts = async (jsonString: string): Promise<number | undefined> => {
  const importedData = JSON.parse(jsonString);
  const scriptsToImport = Array.isArray(importedData) ? importedData : [importedData];

  const isValidScript = (script: unknown): script is ScriptStory =>
    script !== null && typeof script === 'object' && 'title' in script && 'acts' in script;

  if (!scriptsToImport.every(isValidScript)) {
    throw new Error('Dữ liệu JSON không chứa định dạng kịch bản hợp lệ.');
  }

  const scriptsToAdd = scriptsToImport.map(s => {
    const { id: _id, ...rest } = s as ScriptStory & { id?: number };
    void _id; // Bỏ qua ID hiện có để DB tự tạo ID mới
    return rest as ScriptStory;
  });

  const newIds = await scriptRepository.bulkAdd(scriptsToAdd);
  return newIds.length > 0 ? newIds[newIds.length - 1] : undefined;
};

const useScriptsStore = create<ScriptsState>()(
  persist(
    (set, get) => ({
      // NOSONAR
      savedScripts: [],
      activeScript: null,
      activeSceneIdentifier: null,
      scriptsError: null,

      init: async () => {
        if (useScriptsStore.persist.hasHydrated() && get().activeScript) return;
        const scripts = get().savedScripts;
        if (scripts.length > 0 && !get().activeScript) {
          const latest = scripts[scripts.length - 1];
          get().selectScript(latest.id as number);
        }
      },

      reloadFromDB: async () => {
        try {
          const scripts = await scriptRepository.getAll();
          set({ savedScripts: scripts });
        } catch (err) {
          console.error('Failed to reload scripts from DB:', err);
          set({ scriptsError: 'Không thể tải lại danh sách kịch bản.' });
        }
      },

      selectScript: id => {
        const script = get().savedScripts.find(s => s.id === id);
        // Chỉ cập nhật nếu kịch bản được chọn khác với kịch bản đang hoạt động
        // Điều này ngăn chặn việc re-render và các hiệu ứng phụ không cần thiết.
        if (script && script.id === get().activeScript?.id) return;
        if (script) {
          const newActiveSceneIdentifier = script.acts?.[0]?.scenes?.[0] ? { actIndex: 0, sceneIndex: 0 } : null;
          set({
            activeScript: script,
            activeSceneIdentifier: newActiveSceneIdentifier,
          });
        }
      },

      newScript: () => set({ activeScript: null, activeSceneIdentifier: null, scriptsError: null }),

      saveActiveScript: async scriptToSave => {
        try {
          await scriptRepository.update(scriptToSave);
          set(state => ({
            savedScripts: state.savedScripts.map(s => (s.id === scriptToSave.id ? scriptToSave : s)),
            activeScript: state.activeScript?.id === scriptToSave.id ? scriptToSave : state.activeScript,
          }));
        } catch (err) {
          console.error('Failed to save script', err);
          set({ scriptsError: 'Không thể lưu các thay đổi của bạn.' });
        }
      },

      deleteActiveScript: async id => {
        if (id === undefined) return;
        try {
          await scriptRepository.delete(id);
          await db.images.where({ scriptId: id }).delete();
          await db.videos.where({ scriptId: id }).delete();
          const remaining = get().savedScripts.filter(s => s.id !== id);
          let nextActive = null;
          if (remaining.length > 0) {
            nextActive = remaining[0];
          }
          // Gộp các lệnh set để đảm bảo tính nguyên tử
          set({ savedScripts: remaining, activeScript: nextActive, activeSceneIdentifier: null });
          window.dispatchEvent(new CustomEvent('assets-changed'));
        } catch (err) {
          console.error('Failed to delete script', err);
          set({ scriptsError: err instanceof Error ? err.message : 'Không thể xóa kịch bản.' });
        }
      },

      // Hàm helper để cập nhật activeScript một cách an toàn và hiệu quả
      _updateActiveScript: async (updater: (draft: ScriptStory) => void) => {
        const active = get().activeScript;
        if (!active) return;

        const updatedScript = produce(active, updater);

        set({ activeScript: updatedScript });
        await get().saveActiveScript(updatedScript);
      },

      updateRootField: async (field, value) => {
        await get()._updateActiveScript(draft => {
          draft[field] = value;
        });
      },

      updateActSummary: async (actIndex, value) => {
        await get()._updateActiveScript(draft => {
          if (draft.acts[actIndex]) {
            draft.acts[actIndex].summary = value;
          }
        });
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
        if (!files || files.length === 0) return undefined;

        try {
          useUIStateStore.getState().setIsImporting(true);
          set({ scriptsError: null });

          const readFileAsText = (file: File): Promise<string> =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = e => resolve(e.target?.result as string);
              reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
              reader.readAsText(file);
            });

          const fileContents = await Promise.all(Array.from(files).map(readFileAsText));

          let lastImportedId: number | undefined;
          for (const text of fileContents) {
            const newId = await _processAndSaveScripts(text);
            if (newId !== undefined) {
              lastImportedId = newId;
            }
          }

          const allScripts = await scriptRepository.getAll();
          const lastScript = allScripts.find(s => s.id === lastImportedId);
          set({ savedScripts: allScripts, activeScript: lastScript });
          return lastImportedId;
        } catch (err) {
          console.error('Lỗi nhập dữ liệu:', err);
          set({ scriptsError: err instanceof Error ? err.message : 'Không thể nhập dữ liệu.' });
          throw err; // Ném lỗi ra ngoài để component có thể bắt
        } finally {
          useUIStateStore.getState().setIsImporting(false);
        }
      },

      importDataFromString: async jsonString => {
        if (!jsonString.trim()) return undefined;

        try {
          useUIStateStore.getState().setIsImporting(true);
          set({ scriptsError: null });

          const lastImportedId = await _processAndSaveScripts(jsonString);
          const allScripts = await scriptRepository.getAll();
          const lastScript = allScripts.find(s => s.id === lastImportedId);
          set({ savedScripts: allScripts, activeScript: lastScript });
          return lastImportedId;
        } catch (err) {
          console.error('Lỗi nhập dữ liệu từ chuỗi:', err);
          set({ scriptsError: err instanceof Error ? err.message : 'Không thể nhập dữ liệu.' });
          throw err;
        } finally {
          useUIStateStore.getState().setIsImporting(false);
        }
      },

      exportData: async () => {
        try {
          const active = get().activeScript;
          if (active) {
            await exportService.exportScriptAsJson(active);
          } else {
            // Export all scripts if no active script
            const allScripts = get().savedScripts;
            await exportService.exportScriptsAsJson(allScripts);
          }
        } catch (error) {
          console.error('Lỗi xuất dữ liệu:', error);
          set({ scriptsError: 'Đã xảy ra lỗi trong quá trình xuất dữ liệu kịch bản.' });
        }
      },

      exportZip: async () => {
        const activeScript = get().activeScript;
        if (!activeScript) return;
        useUIStateStore.getState().setIsZipping(true);
        set({ scriptsError: null });
        try {
          await exportService.exportScriptAsZip(activeScript);
        } catch (err) {
          console.error('Lỗi xuất file ZIP:', err);
          set({ scriptsError: err instanceof Error ? err.message : 'Không thể tạo file ZIP.' });
        } finally {
          useUIStateStore.getState().setIsZipping(false);
        }
      },

      updateSceneField: async (actIndex, sceneIndex, field, value) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            (scene as unknown as Record<string, unknown>)[field] = value;
          }
        });
      },
      updateDialogueLine: async (actIndex, sceneIndex, dialogueIndex, value) => {
        await get()._updateActiveScript(draft => {
          const dialogue = draft.acts[actIndex]?.scenes[sceneIndex]?.dialogues[dialogueIndex];
          if (dialogue) {
            dialogue.line = value;
          }
        });
      },
      updateSceneGeneratedAssetId: async (actIndex, sceneIndex, assetType, assetId) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            if (assetType === 'image') {
              scene.generatedImageId = assetId;
            } else if (assetType === 'video') {
              scene.generatedVideoId = assetId;
            }
          }
        });
      },

      addScript: async (script): Promise<ScriptStory> => {
        try {
          const newId = await scriptRepository.add(script);
          const scriptWithId = { ...script, id: newId } as ScriptStory;
          set(state => {
            const newActiveSceneIdentifier = scriptWithId.acts?.[0]?.scenes?.[0]
              ? { actIndex: 0, sceneIndex: 0 }
              : null;
            return {
              savedScripts: [...state.savedScripts, scriptWithId],
              activeScript: scriptWithId,
              activeSceneIdentifier: newActiveSceneIdentifier,
            };
          });
          return scriptWithId;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Không thể lưu kịch bản mới.';
          set({ scriptsError: errorMsg });
          throw new Error(errorMsg);
        }
      },

      addAct: async () => {
        await get()._updateActiveScript(draft => {
          const newActNumber = draft.acts.length + 1;
          draft.acts.push({
            act_number: newActNumber,
            summary: `Act ${newActNumber}`,
            scenes: [
              {
                scene_number: 1,
                time: '',
                location: '',
                action: '',
                audio_style: '',
                visual_style: '',
                dialogues: [],
                actIndex: draft.acts.length,
                sceneIndex: 0,
              },
            ],
          });
        });
      },

      deleteAct: async actIndex => {
        await get()._updateActiveScript(draft => {
          if (draft.acts.length > 1) {
            draft.acts.splice(actIndex, 1);
            // Re-number remaining acts
            draft.acts.forEach((act, idx) => {
              act.act_number = idx + 1;
              act.scenes.forEach(scene => {
                scene.actIndex = idx;
              });
            });
          }
        });
      },

      addScene: async actIndex => {
        await get()._updateActiveScript(draft => {
          const act = draft.acts[actIndex];
          if (act) {
            const newSceneNumber = act.scenes.length + 1;
            const previousScene = act.scenes[act.scenes.length - 1];

            // Clone default values from previous scene (location, time, narrator, action)
            const newScene: Scene = {
              scene_number: newSceneNumber,
              time: previousScene?.time || '',
              location: previousScene?.location || '',
              action: previousScene?.action || '',
              audio_style: previousScene?.audio_style || '',
              visual_style: previousScene?.visual_style || '',
              dialogues: [],
              actIndex,
              sceneIndex: act.scenes.length,
            };

            act.scenes.push(newScene);
          }
        });
      },

      deleteScene: async (actIndex, sceneIndex) => {
        await get()._updateActiveScript(draft => {
          const act = draft.acts[actIndex];
          if (act && act.scenes.length > 1) {
            act.scenes.splice(sceneIndex, 1);
            // Re-number remaining scenes
            act.scenes.forEach((scene, idx) => {
              scene.scene_number = idx + 1;
              scene.sceneIndex = idx;
            });
          }
        });
      },

      addDialogue: async (actIndex, sceneIndex, roleId) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            scene.dialogues.push({
              roleId: roleId || 'Narrator',
              line: '',
            });
          }
        });
      },

      updateDialogueRoleId: async (actIndex, sceneIndex, dialogueIndex, roleId) => {
        await get()._updateActiveScript(draft => {
          const dialogue = draft.acts[actIndex]?.scenes[sceneIndex]?.dialogues[dialogueIndex];
          if (dialogue) {
            dialogue.roleId = roleId;
          }
        });
      },

      deleteDialogue: async (actIndex, sceneIndex, dialogueIndex) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            scene.dialogues.splice(dialogueIndex, 1);
          }
        });
      },

      mergeDialoguesInScene: async (actIndex, sceneIndex) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            const mergedDialogues: Scene['dialogues'] = [];
            scene.dialogues.forEach(dialogue => {
              const existing = mergedDialogues.find(d => d.roleId === dialogue.roleId);
              if (existing) {
                existing.line += `\n${dialogue.line}`;
              } else {
                mergedDialogues.push({ ...dialogue });
              }
            });
            scene.dialogues = mergedDialogues;
          }
        });
      },

      reorderDialogues: async (actIndex, sceneIndex, oldIndex, newIndex) => {
        await get()._updateActiveScript(draft => {
          const scene = draft.acts[actIndex]?.scenes[sceneIndex];
          if (scene) {
            const [movedDialogue] = scene.dialogues.splice(oldIndex, 1);
            scene.dialogues.splice(newIndex, 0, movedDialogue);
          }
        });
      },

      addCharacter: async character => {
        await get()._updateActiveScript(draft => {
          // Check if roleId already exists
          const exists = draft.characters.some(c => c.roleId === character.roleId);
          if (!exists) {
            draft.characters.push(character);
          }
        });
      },

      updateCharacter: async (roleId, updates) => {
        await get()._updateActiveScript(draft => {
          const character = draft.characters.find(c => c.roleId === roleId);
          if (character) {
            if (updates.name !== undefined) character.name = updates.name;
            if (updates.description !== undefined) character.description = updates.description;
          }
        });
      },

      deleteCharacter: async roleId => {
        await get()._updateActiveScript(draft => {
          const index = draft.characters.findIndex(c => c.roleId === roleId);
          if (index !== -1) {
            draft.characters.splice(index, 1);
          }
        });
      },

      setActiveSceneIdentifier: id => set({ activeSceneIdentifier: id }),
      setActiveScript: s => set({ activeScript: s }),
    }),
    {
      name: 'cinegenie-scripts-storage', // Tên để lưu trong storage
      storage: createJSONStorage(() => ({
        // Custom storage adapter để tương tác với Dexie (IndexedDB)
        getItem: async name => {
          console.log(name, 'has been retrieved');
          const allScripts = await db.scripts.toArray();
          // Chỉ lưu `savedScripts` vào storage, các state khác sẽ là tạm thời
          return JSON.stringify({ state: { savedScripts: allScripts } });
        },
        setItem: async (name, value) => {
          console.log(name, 'with value', value, 'has been saved');
          // `setItem` sẽ được gọi bởi `saveActiveScript`, `addScript`, etc.
          // Chúng ta đã xử lý việc lưu vào DB trong các hàm đó,
          // nên ở đây không cần làm gì thêm để tránh ghi đè.
        },
        removeItem: name => {
          console.log(name, 'has been removed');
          // Tương tự, việc xóa được xử lý trong `clearAllData` hoặc `deleteActiveScript`
        },
      })),
      // Chỉ persist `savedScripts`. Các state khác sẽ được reset khi tải lại.
      partialize: state => ({ savedScripts: state.savedScripts }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('An error happened during hydration', error);
        } else {
          // Sau khi hydrate xong, gọi init để set active script
          state?.init();
        }
      },
    },
  ),
);

/**
 *
 * Helper function to get the duration of an audio blob in seconds.
 * It creates an in-memory audio element to read metadata without adding it to the DOM.
 * @param audioBlob The audio file as a Blob.
 * @returns A promise that resolves with the duration in seconds.
 */
const getAudioDuration = (audioBlob: Blob): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(audioBlob);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    });
    audio.addEventListener('error', e => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Error loading audio metadata: ${e.message}`));
    });
    audio.src = objectUrl;
  });

/** Formats seconds into SRT timestamp format (HH:MM:SS,mmm) */
const formatSrtTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

/** A selector to get a flat array of all scenes from the active script. */
const selectAllScenes = (state: ScriptsState) => {
  if (!state.activeScript) {
    return [];
  }
  return state.activeScript.acts.flatMap(act => act.scenes);
};

/** A selector to get a flat array of all dialogue objects from the active script. */
const selectAllDialogues = (state: ScriptsState) => {
  if (!state.activeScript) {
    return [];
  }
  return state.activeScript.acts.flatMap(act => act.scenes.flatMap(scene => scene.dialogues ?? []));
};

/**
 * A selector to get a unique list of character roleIds from the active script.
 * This is a derived state and is memoized by default by Zustand's `useStore` hook.
 * @param state The current ScriptsState.
 * @returns An array of unique character roleId strings.
 */
const selectActiveScriptCharacters = (state: ScriptsState) => {
  const allDialogues = selectAllDialogues(state);
  const uniqueCharacters = new Set<string>();
  allDialogues.forEach(dialogue => {
    if (dialogue.roleId) {
      uniqueCharacters.add(dialogue.roleId);
    }
  });
  return Array.from(uniqueCharacters);
};

/** A selector to get a flat array of all dialogue lines (strings) from the active script. */
const selectAllDialogueLines = (state: ScriptsState) => selectAllDialogues(state).map(d => d.line);

/** A selector to get the currently active scene object. */
const selectActiveScene = (state: ScriptsState) => {
  const { activeScript, activeSceneIdentifier } = state;
  if (!activeScript || !activeSceneIdentifier) {
    return null;
  }
  const { actIndex, sceneIndex } = activeSceneIdentifier;
  return activeScript.acts?.[actIndex]?.scenes?.[sceneIndex] ?? null;
};

/** A selector to get the total number of scenes in the active script. */
const selectTotalScenesCount = (state: ScriptsState) => {
  if (!state.activeScript) {
    return 0;
  }
  return state.activeScript.acts.reduce((count, act) => count + act.scenes.length, 0);
};

/** A selector to get the 1-based number of the current scene. */
const selectCurrentSceneNumber = (state: ScriptsState) => {
  const { activeScript, activeSceneIdentifier } = state;
  if (!activeScript || !activeSceneIdentifier) return 0;

  let sceneCount = 0;
  for (let i = 0; i < activeScript.acts.length; i++) {
    const act = activeScript.acts[i];
    if (i < activeSceneIdentifier.actIndex) {
      sceneCount += act.scenes.length;
    } else if (i === activeSceneIdentifier.actIndex) {
      sceneCount += activeSceneIdentifier.sceneIndex + 1;
      break;
    }
  }
  return sceneCount;
};

const getFlatSceneIdentifiers = (state: ScriptsState) => {
  if (!state.activeScript) return [];
  return state.activeScript.acts.flatMap((act, actIndex) =>
    act.scenes.map((_, sceneIndex) => ({ actIndex, sceneIndex })),
  );
};

/** A selector that returns the identifier for the next scene, or null if at the end. */
const selectNextSceneIdentifier = (state: ScriptsState) => {
  const flatScenes = getFlatSceneIdentifiers(state);
  const currentIndex = flatScenes.findIndex(
    id =>
      id.actIndex === state.activeSceneIdentifier?.actIndex &&
      id.sceneIndex === state.activeSceneIdentifier?.sceneIndex,
  );
  return currentIndex !== -1 && currentIndex < flatScenes.length - 1 ? flatScenes[currentIndex + 1] : null;
};

/** A selector that returns the identifier for the previous scene, or null if at the beginning. */
const selectPreviousSceneIdentifier = (state: ScriptsState) => {
  const flatScenes = getFlatSceneIdentifiers(state);
  const currentIndex = flatScenes.findIndex(
    id =>
      id.actIndex === state.activeSceneIdentifier?.actIndex &&
      id.sceneIndex === state.activeSceneIdentifier?.sceneIndex,
  );
  return currentIndex > 0 ? flatScenes[currentIndex - 1] : null;
};

export type { ScriptsState };
export {
  useScriptsStore,
  getAudioDuration,
  formatSrtTime,
  selectActiveScene,
  selectTotalScenesCount,
  selectCurrentSceneNumber,
  selectNextSceneIdentifier,
  selectPreviousSceneIdentifier,
  selectAllScenes,
  selectAllDialogues,
  selectAllDialogueLines,
  selectActiveScriptCharacters,
};
