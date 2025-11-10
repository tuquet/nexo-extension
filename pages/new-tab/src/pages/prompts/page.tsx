import { defaultPrompts } from '@extension/database';
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
  toast,
  CardAction,
} from '@extension/ui';
import { PromptForm } from '@src/components/prompts';
import { db } from '@src/db';
import { Edit, Plus, Search, Trash2, Copy, Download, Upload, FileJson, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PromptFormData } from '@src/components/prompts';
import type { PromptRecord } from '@src/db';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'script-generation', label: 'Script Generation' },
  { value: 'image-generation', label: 'Image Generation' },
  { value: 'video-generation', label: 'Video Generation' },
  { value: 'character-dev', label: 'Character Development' },
  { value: 'general', label: 'General' },
] as const;

const PromptsPage = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<PromptRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCreate = async (data: PromptFormData) => {
    try {
      const newPrompt: PromptRecord = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          author: 'User',
          version: '1.0.0',
          usageCount: 0,
          isFavorite: false,
        },
      };

      await db.prompts.add(newPrompt);
      await loadPrompts();
      setIsCreateDialogOpen(false);
      toast.success('Prompt created successfully');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      toast.error('Failed to create prompt');
    }
  };

  const handleEdit = async (data: PromptFormData) => {
    if (!currentPrompt?.id) return;

    try {
      await db.prompts.update(currentPrompt.id, {
        ...data,
        updatedAt: new Date(),
      });
      await loadPrompts();
      setIsEditDialogOpen(false);
      setCurrentPrompt(null);
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
    if (defaultPrompts.length === 0) {
      toast.error('No default prompts available', {
        description: 'Create your own prompts or import from a JSON file',
      });
      return;
    }

    try {
      const promptsToAdd: PromptRecord[] = defaultPrompts.map(p => ({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.prompts.bulkAdd(promptsToAdd);
      await loadPrompts();
      toast.success(`Imported ${promptsToAdd.length} default prompt${promptsToAdd.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to import defaults:', error);
      toast.error('Failed to import default prompts');
    }
  };

  const handleExport = async () => {
    try {
      const data = await db.prompts.reverse().toArray();
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
        const rawData = JSON.parse(text);

        // Handle both single object and array of objects
        const dataArray = Array.isArray(rawData) ? rawData : [rawData];

        // Transform and validate data
        const validatedData: PromptRecord[] = dataArray.map((item: Record<string, unknown>) => {
          // Remove id if exists (let DB auto-generate)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = item;

          // No need to normalize variableDefinitions - database hooks handle conversion automatically
          const normalizedPreprocessing = item.preprocessing as PromptRecord['preprocessing'];

          return {
            ...rest,
            // Ensure required fields
            title: (item.title as string) || 'Untitled Prompt',
            category: (item.category as PromptRecord['category']) || 'general',
            prompt: (item.prompt as string) || '',
            // Apply preprocessing as-is
            preprocessing: normalizedPreprocessing,
            // Convert date strings to Date objects
            createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
            // Handle metadata dates
            metadata: item.metadata
              ? {
                  ...(item.metadata as Record<string, unknown>),
                  lastUsedAt:
                    (item.metadata as Record<string, unknown>).lastUsedAt !== null &&
                    (item.metadata as Record<string, unknown>).lastUsedAt !== undefined
                      ? new Date((item.metadata as Record<string, unknown>).lastUsedAt as string)
                      : undefined,
                }
              : undefined,
          };
        });

        await db.prompts.bulkAdd(validatedData);
        await loadPrompts();
        toast.success(`Imported ${validatedData.length} prompt${validatedData.length > 1 ? 's' : ''}`);
      } catch (error) {
        console.error('Failed to import prompts:', error);
        toast.error('Failed to import prompts', {
          description: error instanceof Error ? error.message : 'Invalid JSON format',
        });
      }
    };
    input.click();
  };

  const handleCopyJSON = async (prompt: PromptRecord) => {
    try {
      // Create a shallow copy and remove id, createdAt, updatedAt
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...copy } = prompt;
      const json = JSON.stringify(copy, null, 2);

      await navigator.clipboard.writeText(json);
      toast.success('JSON copied to clipboard', {
        description: `"${prompt.title}" has been copied as JSON`,
      });
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      toast.error('Failed to copy JSON');
    }
  };

  const openCreateDialog = () => {
    setCurrentPrompt(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (prompt: PromptRecord) => {
    setCurrentPrompt(prompt);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (prompt: PromptRecord) => {
    setCurrentPrompt(prompt);
    setIsDeleteDialogOpen(true);
  };

  const handleUseForScript = (prompt: PromptRecord) => {
    // Navigate to script creation page with selected template
    navigate('/script/create', { state: { selectedTemplate: prompt } });
    toast.success(`Using template: ${prompt.title}`);
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
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center gap-2">
                        {prompt.icon && <span className="text-xl">{prompt.icon}</span>}
                        <h3 className="font-semibold">{prompt.title}</h3>
                        <Badge variant="secondary">{prompt.category}</Badge>
                      </div>
                    </CardTitle>
                    <CardAction>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUseForScript(prompt)}
                          title="Tạo kịch bản từ mẫu này">
                          <Sparkles className="mr-2 size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyJSON(prompt)}
                          title="Sao chép dưới dạng JSON">
                          <FileJson className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(prompt)} title="Sao chép">
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(prompt)} title="Chỉnh sửa">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(prompt)} title="Xóa">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardAction>
                    <CardDescription>
                      {prompt.description && <p className="text-muted-foreground text-sm">{prompt.description}</p>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prompt.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Prompt Form */}
      <PromptForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      <PromptForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEdit}
        mode="edit"
        initialData={currentPrompt || undefined}
      />

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

export default PromptsPage;
