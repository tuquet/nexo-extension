/**
 * Script Actions Hook
 * Reusable actions for script management (delete, duplicate, export, import)
 * Extracted from list.tsx to eliminate duplication and improve testability
 */

import { toast } from '@extension/ui';
import { db } from '@src/db';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import type { ScriptStory } from '@src/db';

const useScriptActions = () => {
  const deleteActiveScript = useScriptsStore(s => s.deleteActiveScript);
  const reloadFromDB = useScriptsStore(s => s.reloadFromDB);

  const handleDelete = async (script: ScriptStory) => {
    try {
      await deleteActiveScript(script.id as number);
      await reloadFromDB();
      toast.success('Script deleted successfully');
    } catch (error) {
      console.error('Failed to delete script:', error);
      toast.error('Failed to delete script');
    }
  };

  const handleDuplicate = async (script: ScriptStory) => {
    try {
      const duplicated: ScriptStory = {
        ...script,
        title: `${script.title} (Copy)`,
      };
      delete duplicated.id;
      await db.scripts.add(duplicated);
      await reloadFromDB();
      toast.success('Script duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate script:', error);
      toast.error('Failed to duplicate script');
    }
  };

  const handleExport = async () => {
    try {
      const scripts = await db.scripts.toArray();
      const blob = new Blob([JSON.stringify(scripts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scripts-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Scripts exported successfully');
    } catch (error) {
      console.error('Failed to export scripts:', error);
      toast.error('Failed to export scripts');
    }
  };

  const handleImportFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const rawData = JSON.parse(text);
      const dataArray = Array.isArray(rawData) ? rawData : [rawData];

      // Import scripts
      const validatedData: ScriptStory[] = dataArray.map((item: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = item;
        return {
          ...rest,
          title: (item.title as string) || 'Untitled Script',
          genre: (item.genre as string[]) || [],
          alias: (item.alias as string) || '',
          logline: (item.logline as string) || '',
          tone: (item.tone as string) || '',
          notes: (item.notes as string) || '',
          setting: (item.setting as ScriptStory['setting']) || { time: '', location: '' },
          themes: (item.themes as string[]) || [],
          characters: (item.characters as ScriptStory['characters']) || [],
          acts: (item.acts as ScriptStory['acts']) || [],
        };
      });

      await db.scripts.bulkAdd(validatedData);
      await reloadFromDB();

      const count = validatedData.length;
      toast.success(`Imported ${count} script${count > 1 ? 's' : ''} successfully`);
    } catch (error) {
      console.error('Failed to import scripts:', error);
      toast.error('Failed to import scripts. Please check the file format.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleImportFromFile(file);
      }
    };
    input.click();
  };

  return {
    handleDelete,
    handleDuplicate,
    handleExport,
    handleImport,
    handleImportFromFile,
  };
};

export { useScriptActions };
