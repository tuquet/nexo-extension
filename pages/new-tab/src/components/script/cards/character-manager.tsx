import EditableField from '../ui/editable-field';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '@extension/ui';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Users, Plus, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { Character } from '@src/types';
import type { FC } from 'react';

interface CharacterManagerProps {
  characters: Character[];
  language: 'en-US' | 'vi-VN';
}

const CharacterManager: FC<CharacterManagerProps> = ({ characters, language }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCharacter, setNewCharacter] = useState<{ name: string; description: string; roleId: string }>({
    name: '',
    description: '',
    roleId: '',
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const addCharacter = useScriptsStore(s => s.addCharacter);
  const updateCharacter = useScriptsStore(s => s.updateCharacter);
  const deleteCharacter = useScriptsStore(s => s.deleteCharacter);

  const handleAddCharacter = async () => {
    if (!newCharacter.name.trim() || !newCharacter.roleId.trim()) {
      toast.error('Vui lòng nhập tên và ID vai diễn');
      return;
    }

    await addCharacter({
      name: newCharacter.name.trim(),
      description: newCharacter.description.trim(),
      roleId: newCharacter.roleId.trim(),
    });

    setNewCharacter({ name: '', description: '', roleId: '' });
    setIsAdding(false);
    toast.success('Đã thêm nhân vật');
  };

  const handleDeleteCharacter = async (roleId: string) => {
    if (confirm(`Xóa nhân vật ${roleId}?`)) {
      await deleteCharacter(roleId);
      toast.success('Đã xóa nhân vật');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="size-5" />
            Nhân vật ({characters.length})
          </span>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="gap-1">
            <Plus className="size-4" />
            {isAdding ? 'Hủy' : 'Thêm nhân vật'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Add Character Form */}
          {isAdding && (
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
              <h4 className="mb-3 font-semibold text-slate-800 dark:text-slate-200">Thêm nhân vật mới</h4>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="roleId">
                    ID vai diễn (roleId) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCharacter.roleId}
                    onChange={e => setNewCharacter({ ...newCharacter, roleId: e.target.value })}
                    placeholder="Vd: protagonist, antagonist, narrator"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
                    Tên nhân vật <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCharacter.name}
                    onChange={e => setNewCharacter({ ...newCharacter, name: e.target.value })}
                    placeholder="Vd: John Doe"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    htmlFor="description">
                    Mô tả
                  </label>
                  <textarea
                    value={newCharacter.description}
                    onChange={e => setNewCharacter({ ...newCharacter, description: e.target.value })}
                    placeholder="Mô tả nhân vật..."
                    rows={3}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCharacter}>
                    Thêm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Character List */}
          {characters.length > 0 ? (
            <div className="space-y-2">
              {characters.map(character => (
                <div
                  key={character.roleId}
                  className="rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {character.roleId}
                        </Badge>
                        {editingRoleId === character.roleId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRoleId(null)}
                            className="size-6 p-0">
                            ✓
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRoleId(character.roleId)}
                            className="size-6 p-0">
                            <Pencil className="size-3" />
                          </Button>
                        )}
                      </div>
                      <div className="mb-1 font-semibold text-slate-800 dark:text-slate-200">
                        {editingRoleId === character.roleId ? (
                          <EditableField
                            initialValue={character.name}
                            onSave={v => updateCharacter(character.roleId, { name: v })}
                            context={`Character name for ${character.roleId}`}
                            language={language}
                            as="input"
                            textClassName="text-sm font-semibold"
                          />
                        ) : (
                          character.name
                        )}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {editingRoleId === character.roleId ? (
                          <EditableField
                            initialValue={character.description}
                            onSave={v => updateCharacter(character.roleId, { description: v })}
                            context={`Character description for ${character.roleId}`}
                            language={language}
                            textClassName="text-sm"
                          />
                        ) : (
                          character.description || <span className="italic">Chưa có mô tả</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCharacter(character.roleId)}
                      className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              Chưa có nhân vật. Nhấn "Thêm nhân vật" để bắt đầu.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterManager;
