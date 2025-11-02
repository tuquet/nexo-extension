/**
 * Prompts Management Page
 * CRUD interface for managing prompt templates
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  toast,
} from '@extension/ui';
import { db } from '@src/db';
import { Edit, Plus, Search, Trash2, Copy, Download, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@src/db';

// Default prompts for initial import
const GEMINI_PROMPTS: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'script-generation', label: 'Script Generation' },
  { value: 'image-generation', label: 'Image Generation' },
  { value: 'video-generation', label: 'Video Generation' },
  { value: 'character-dev', label: 'Character Development' },
  { value: 'general', label: 'General' },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  'script-generation': '🎬',
  'image-generation': '🖼️',
  'video-generation': '🎥',
  'character-dev': '👤',
  general: '💡',
};

const PromptsListPage = () => {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<PromptRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'general' as PromptRecord['category'],
    prompt: '',
    description: '',
    tags: '',
    icon: '',
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const allPrompts = await db.prompts.toArray();
      setPrompts(allPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch =
      searchQuery === '' ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreate = async () => {
    try {
      const newPrompt: PromptRecord = {
        title: formData.title,
        category: formData.category,
        prompt: formData.prompt,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
        icon: formData.icon || CATEGORY_ICONS[formData.category],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.prompts.add(newPrompt);
      await loadPrompts();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Prompt created successfully');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      toast.error('Failed to create prompt');
    }
  };

  const handleEdit = async () => {
    if (!currentPrompt?.id) return;

    try {
      await db.prompts.update(currentPrompt.id, {
        title: formData.title,
        category: formData.category,
        prompt: formData.prompt,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
        icon: formData.icon || CATEGORY_ICONS[formData.category],
        updatedAt: new Date(),
      });
      await loadPrompts();
      setIsEditDialogOpen(false);
      setCurrentPrompt(null);
      resetForm();
      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast.error('Failed to update prompt');
    }
  };

  const handleDelete = async () => {
    if (!currentPrompt?.id) return;

    try {
      await db.prompts.delete(currentPrompt.id);
      await loadPrompts();
      setIsDeleteDialogOpen(false);
      setCurrentPrompt(null);
      toast.success('Prompt deleted successfully');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleDuplicate = async (prompt: PromptRecord) => {
    try {
      const duplicated: PromptRecord = {
        ...prompt,
        title: `${prompt.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      delete duplicated.id;
      await db.prompts.add(duplicated);
      await loadPrompts();
      toast.success('Prompt duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate prompt:', error);
      toast.error('Failed to duplicate prompt');
    }
  };

  const handleImportDefaults = async () => {
    if (GEMINI_PROMPTS.length === 0) {
      toast.error('No default prompts available', {
        description: 'Create your own prompts or import from a JSON file',
      });
      return;
    }

    try {
      const defaultPrompts: PromptRecord[] = GEMINI_PROMPTS.map(p => ({
        title: p.title,
        category: p.category,
        prompt: p.prompt,
        description: p.description,
        tags: p.tags,
        icon: p.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.prompts.bulkAdd(defaultPrompts);
      await loadPrompts();
      toast.success(`Imported ${defaultPrompts.length} default prompts`);
    } catch (error) {
      console.error('Failed to import defaults:', error);
      toast.error('Failed to import default prompts');
    }
  };

  const handleExport = async () => {
    try {
      const data = await db.prompts.toArray();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prompts exported successfully');
    } catch (error) {
      console.error('Failed to export prompts:', error);
      toast.error('Failed to export prompts');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text) as PromptRecord[];
        await db.prompts.bulkAdd(data);
        await loadPrompts();
        toast.success(`Imported ${data.length} prompts`);
      } catch (error) {
        console.error('Failed to import prompts:', error);
        toast.error('Failed to import prompts');
      }
    };
    input.click();
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (prompt: PromptRecord) => {
    setCurrentPrompt(prompt);
    setFormData({
      title: prompt.title,
      category: prompt.category,
      prompt: prompt.prompt,
      description: prompt.description || '',
      tags: prompt.tags?.join(', ') || '',
      icon: prompt.icon || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (prompt: PromptRecord) => {
    setCurrentPrompt(prompt);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'general',
      prompt: '',
      description: '',
      tags: '',
      icon: '',
    });
  };

  return (
    <div className="space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prompt Templates</CardTitle>
              <CardDescription>Manage your AI prompt templates for quick access</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImportDefaults}>
                <Download className="mr-2 size-4" />
                Import Defaults
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 size-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="mr-2 size-4" />
                Import
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 size-4" />
                New Prompt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <Badge
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.value)}>
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Prompts List */}
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Loading prompts...</div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <p>No prompts found</p>
              <Button variant="link" onClick={openCreateDialog}>
                Create your first prompt
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrompts.map(prompt => (
                <Card key={prompt.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {prompt.icon && <span className="text-xl">{prompt.icon}</span>}
                          <h3 className="font-semibold">{prompt.title}</h3>
                          <Badge variant="secondary">{prompt.category}</Badge>
                        </div>
                        {prompt.description && <p className="text-muted-foreground text-sm">{prompt.description}</p>}
                        <p className="text-muted-foreground line-clamp-2 text-xs">{prompt.prompt}</p>
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prompt.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(prompt)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(prompt)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(prompt)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>Add a new prompt template to your library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter prompt title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={v => setFormData({ ...formData, category: v as PromptRecord['category'] })}>
                {CATEGORIES.slice(1).map(cat => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat.value} id={`create-${cat.value}`} />
                    <Label htmlFor={`create-${cat.value}`}>{cat.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-prompt">Prompt</Label>
              <Textarea
                id="create-prompt"
                value={formData.prompt}
                onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Enter the prompt text"
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description (optional)</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-tags">Tags (comma-separated)</Label>
                <Input
                  id="create-tags"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-icon">Icon (emoji)</Label>
                <Input
                  id="create-icon"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎬"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title || !formData.prompt}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>Update your prompt template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter prompt title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={v => setFormData({ ...formData, category: v as PromptRecord['category'] })}>
                {CATEGORIES.slice(1).map(cat => (
                  <div key={cat.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat.value} id={`edit-${cat.value}`} />
                    <Label htmlFor={`edit-${cat.value}`}>{cat.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prompt">Prompt</Label>
              <Textarea
                id="edit-prompt"
                value={formData.prompt}
                onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Enter the prompt text"
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon (emoji)</Label>
                <Input
                  id="edit-icon"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎬"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.title || !formData.prompt}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentPrompt?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptsListPage;
