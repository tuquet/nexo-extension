import { db } from '../db';
import { useState, useEffect } from 'react';
import type { Root } from '../types';

type ActiveSceneIdentifier = { actIndex: number; sceneIndex: number } | null;

const setNestedValue = (obj: Record<string, unknown> | unknown[], path: string, value: unknown) => {
  const keys = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split('.');
  let current: unknown = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (typeof current !== 'object' || current === null) {
      console.error(`Path ${path} is invalid for the object.`);
      return obj;
    }

    const currObj = current as Record<string, unknown> & { [k: string]: unknown };
    if (!(key in currObj)) {
      console.error(`Path ${path} is invalid for the object.`);
      return obj;
    }

    current = currObj[key];
  }

  if (typeof current === 'object' && current !== null) {
    (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
  } else {
    console.error(`Path ${path} is invalid for the object.`);
  }

  return obj;
};

const useScripts = () => {
  const [savedScripts, setSavedScripts] = useState<Root[]>([]);
  const [activeScript, setActiveScript] = useState<Root | null>(null);
  const [activeSceneIdentifier, setActiveSceneIdentifier] = useState<ActiveSceneIdentifier>(null);
  const [scriptsError, setScriptsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScriptsAndSetActive = async () => {
      try {
        const allScripts = await db.scripts.toArray();
        setSavedScripts(allScripts);

        if (allScripts.length > 0) {
          const firstScript = allScripts[0];
          setActiveScript(firstScript);
          if (firstScript.acts?.[0]?.scenes?.[0]) {
            setActiveSceneIdentifier({ actIndex: 0, sceneIndex: 0 });
          }
        }
      } catch (e) {
        console.error('Không thể tải danh sách kịch bản:', e);
        setScriptsError('Không thể tải danh sách kịch bản đã lưu.');
      }
    };
    fetchScriptsAndSetActive();
  }, []);

  const selectScript = (id: number) => {
    const script = savedScripts.find(s => s.id === id);
    if (script) {
      setActiveScript(script);
      if (script.acts?.[0]?.scenes?.[0]) {
        setActiveSceneIdentifier({ actIndex: 0, sceneIndex: 0 });
      } else {
        setActiveSceneIdentifier(null);
      }
    }
  };

  const newScript = () => {
    setActiveScript(null);
    setActiveSceneIdentifier(null);
    setScriptsError(null);
  };

  const saveActiveScript = async (scriptToSave: Root) => {
    try {
      await db.scripts.put(scriptToSave);
      setSavedScripts(prev => prev.map(s => (s.id === scriptToSave.id ? scriptToSave : s)));
      if (activeScript?.id === scriptToSave.id) {
        setActiveScript(scriptToSave);
      }
    } catch (dbError) {
      console.error('Không thể cập nhật kịch bản trong cơ sở dữ liệu:', dbError);
      setScriptsError('Không thể lưu các thay đổi của bạn.');
    }
  };

  const deleteActiveScript = async () => {
    if (!activeScript || activeScript.id === undefined) return;
    const id = activeScript.id;
    try {
      await db.scripts.delete(id);
      await db.images.where({ scriptId: id }).delete();
      await db.videos.where({ scriptId: id }).delete();

      const remainingScripts = savedScripts.filter(s => s.id !== id);
      setSavedScripts(remainingScripts);

      if (remainingScripts.length > 0) {
        selectScript(remainingScripts[0].id!);
      } else {
        newScript();
      }
      window.dispatchEvent(new CustomEvent('assets-changed'));
    } catch (err) {
      console.error('Không thể xóa kịch bản:', err);
      setScriptsError(err instanceof Error ? err.message : 'Không thể xóa kịch bản.');
    }
  };

  const clearAllData = async () => {
    try {
      await db.clearAllData();
      setSavedScripts([]);
      newScript();
      window.dispatchEvent(new CustomEvent('assets-changed'));
    } catch (err) {
      console.error('Không thể dọn dẹp dữ liệu:', err);
      setScriptsError(err instanceof Error ? err.message : 'Không thể dọn dẹp toàn bộ dữ liệu.');
    }
  };

  const updateScriptField = async (path: string, value: unknown) => {
    if (!activeScript) return;
    const updatedScript = structuredClone(activeScript);
    setNestedValue(updatedScript as unknown as Record<string, unknown>, path, value);
    setActiveScript(updatedScript);
    await saveActiveScript(updatedScript);
  };

  const addScript = async (script: Root) => {
    try {
      const newId = await db.scripts.add(script);
      const scriptWithId = { ...script, id: newId };

      setSavedScripts(prev => [...prev, scriptWithId]);
      setActiveScript(scriptWithId);
      if (scriptWithId.acts?.[0]?.scenes?.[0]) {
        setActiveSceneIdentifier({ actIndex: 0, sceneIndex: 0 });
      }
      return scriptWithId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lưu kịch bản mới.';
      setScriptsError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    savedScripts,
    activeScript,
    activeSceneIdentifier,
    scriptsError,
    selectScript,
    newScript,
    deleteActiveScript,
    updateScriptField,
    addScript,
    setActiveSceneIdentifier,
    setActiveScript,
    clearAllData,
    saveActiveScript,
  };
};

export { useScripts, setNestedValue };
