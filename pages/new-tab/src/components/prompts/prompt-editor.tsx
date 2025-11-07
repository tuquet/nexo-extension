import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  toast,
} from '@extension/ui';
import { X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PromptRecord } from '@extension/database';

interface VariableDefinition {
  name: string;
  type: 'text' | 'select' | 'number' | 'textarea';
  label: string;
  placeholder?: string;
  default?: string;
  required?: boolean;
  options?: string[];
}

interface EditablePromptData {
  title: string;
  category: string;
  description: string;
  icon: string;
  tags: string[];
  outputFormat: string;
  systemInstruction: string;
  preprocessing: {
    enableVariables: boolean;
    injectContext: boolean;
    variableDefinitions: VariableDefinition[];
  };
  modelSettings: {
    preferredModel: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: PromptRecord;
  onSave: (data: Partial<PromptRecord>) => void;
  title: string;
  description?: string;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  title,
  description,
}) => {
  const [formData, setFormData] = useState<EditablePromptData>({
    title: '',
    category: '',
    description: '',
    icon: '',
    tags: [],
    outputFormat: '',
    systemInstruction: '',
    preprocessing: {
      enableVariables: false,
      injectContext: false,
      variableDefinitions: [],
    },
    modelSettings: {
      preferredModel: '',
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  const [newTag, setNewTag] = useState('');
  const [editingVarIndex, setEditingVarIndex] = useState<number | null>(null);
  const [varForm, setVarForm] = useState({
    name: '',
    type: 'text' as VariableDefinition['type'],
    label: '',
    placeholder: '',
    default: '',
    required: false,
    optionsText: '',
  });

  // Load initial data
  useEffect(() => {
    if (!open) return;

    let variableDefinitions: VariableDefinition[] = [];
    try {
      if (initialData.preprocessing?.variableDefinitions) {
        variableDefinitions = JSON.parse(initialData.preprocessing.variableDefinitions);
      }
    } catch {
      variableDefinitions = [];
    }

    setFormData({
      title: initialData.title,
      category: initialData.category,
      description: initialData.description || '',
      icon: initialData.icon || '',
      tags: initialData.tags || [],
      outputFormat: initialData.outputFormat || 'json-structured',
      systemInstruction: initialData.systemInstruction || '',
      preprocessing: {
        enableVariables: initialData.preprocessing?.enableVariables ?? false,
        injectContext: initialData.preprocessing?.injectContext ?? false,
        variableDefinitions,
      },
      modelSettings: {
        preferredModel: initialData.modelSettings?.preferredModel || '',
        temperature: initialData.modelSettings?.temperature ?? 1.0,
        topP: initialData.modelSettings?.topP ?? 0.95,
        topK: initialData.modelSettings?.topK ?? 40,
        maxOutputTokens: initialData.modelSettings?.maxOutputTokens ?? 8192,
      },
    });
  }, [open, initialData]);

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }

    const updatedData: Partial<PromptRecord> = {
      title: formData.title,
      category: formData.category,
      description: formData.description || undefined,
      icon: formData.icon || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      outputFormat: formData.outputFormat || undefined,
      systemInstruction: formData.systemInstruction || undefined,
      preprocessing: {
        enableVariables: formData.preprocessing.enableVariables,
        injectContext: formData.preprocessing.injectContext,
        variableDefinitions: JSON.stringify(formData.preprocessing.variableDefinitions),
      },
      modelSettings:
        formData.modelSettings.preferredModel || formData.modelSettings.temperature !== 1.0
          ? formData.modelSettings
          : undefined,
    };

    onSave(updatedData);
    onOpenChange(false);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
    setNewTag('');
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  const addVariable = () => {
    if (!varForm.name || !varForm.label) {
      toast.error('Variable name and label are required');
      return;
    }

    const newVar: VariableDefinition = {
      name: varForm.name,
      type: varForm.type,
      label: varForm.label,
      placeholder: varForm.placeholder || undefined,
      default: varForm.default || undefined,
      required: varForm.required,
      options:
        varForm.type === 'select' && varForm.optionsText
          ? varForm.optionsText
              .split('\n')
              .map(o => o.trim())
              .filter(Boolean)
          : undefined,
    };

    setFormData({
      ...formData,
      preprocessing: {
        ...formData.preprocessing,
        variableDefinitions: [...formData.preprocessing.variableDefinitions, newVar],
      },
    });

    resetVarForm();
  };

  const updateVariable = () => {
    if (editingVarIndex === null) return;

    const updated = [...formData.preprocessing.variableDefinitions];
    updated[editingVarIndex] = {
      name: varForm.name,
      type: varForm.type,
      label: varForm.label,
      placeholder: varForm.placeholder || undefined,
      default: varForm.default || undefined,
      required: varForm.required,
      options:
        varForm.type === 'select' && varForm.optionsText
          ? varForm.optionsText
              .split('\n')
              .map(o => o.trim())
              .filter(Boolean)
          : undefined,
    };

    setFormData({
      ...formData,
      preprocessing: {
        ...formData.preprocessing,
        variableDefinitions: updated,
      },
    });

    setEditingVarIndex(null);
    resetVarForm();
  };

  const startEditVariable = (index: number) => {
    const v = formData.preprocessing.variableDefinitions[index];
    setEditingVarIndex(index);
    setVarForm({
      name: v.name,
      type: v.type,
      label: v.label,
      placeholder: v.placeholder || '',
      default: v.default || '',
      required: v.required || false,
      optionsText: v.options?.join('\n') || '',
    });
  };

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      preprocessing: {
        ...formData.preprocessing,
        variableDefinitions: formData.preprocessing.variableDefinitions.filter((_, i) => i !== index),
      },
    });
  };

  const resetVarForm = () => {
    setVarForm({
      name: '',
      type: 'text',
      label: '',
      placeholder: '',
      default: '',
      required: false,
      optionsText: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Template title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Short Film, Music Video"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this template does"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🎬"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="outputFormat">Output Format</Label>
                  <Select
                    value={formData.outputFormat}
                    onValueChange={value => setFormData({ ...formData, outputFormat: value })}>
                    <SelectTrigger id="outputFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json-structured">JSON Structured</SelectItem>
                      <SelectItem value="json-free">JSON Free-form</SelectItem>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-sm dark:bg-slate-700">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeTag(idx)}>
                        <X className="size-3" />
                      </Button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag and press Enter"
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preprocessing Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preprocessing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableVariables">Enable Variables</Label>
                  <p className="text-muted-foreground text-xs">Allow {'{{variable}}'} syntax in prompts</p>
                </div>
                <Switch
                  id="enableVariables"
                  checked={formData.preprocessing.enableVariables}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      preprocessing: { ...formData.preprocessing, enableVariables: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="injectContext">Inject Context</Label>
                  <p className="text-muted-foreground text-xs">Auto-inject character/setting context</p>
                </div>
                <Switch
                  id="injectContext"
                  checked={formData.preprocessing.injectContext}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      preprocessing: { ...formData.preprocessing, injectContext: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Variable Definitions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variable Definitions ({formData.preprocessing.variableDefinitions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variables List */}
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {formData.preprocessing.variableDefinitions.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded border bg-slate-50 p-2 dark:bg-slate-900">
                    <div>
                      <span className="text-sm font-medium">{v.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({v.name} - {v.type})
                      </span>
                      {v.required && <span className="ml-1 text-xs text-red-500">*required</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => startEditVariable(idx)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeVariable(idx)}>
                        <X className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Variable Form */}
              <div className="rounded border bg-slate-50 p-4 dark:bg-slate-900">
                <h5 className="mb-3 text-sm font-medium">
                  {editingVarIndex !== null ? 'Edit Variable' : 'Add Variable'}
                </h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="varName">Variable Name</Label>
                      <Input
                        id="varName"
                        value={varForm.name}
                        onChange={e => setVarForm({ ...varForm, name: e.target.value })}
                        placeholder="e.g., genre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="varType">Type</Label>
                      <Select
                        value={varForm.type}
                        onValueChange={(value: VariableDefinition['type']) => setVarForm({ ...varForm, type: value })}>
                        <SelectTrigger id="varType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="varLabel">Label</Label>
                    <Input
                      id="varLabel"
                      value={varForm.label}
                      onChange={e => setVarForm({ ...varForm, label: e.target.value })}
                      placeholder="Display label"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="varPlaceholder">Placeholder</Label>
                      <Input
                        id="varPlaceholder"
                        value={varForm.placeholder}
                        onChange={e => setVarForm({ ...varForm, placeholder: e.target.value })}
                        placeholder="Hint text"
                      />
                    </div>
                    <div>
                      <Label htmlFor="varDefault">Default Value</Label>
                      <Input
                        id="varDefault"
                        value={varForm.default}
                        onChange={e => setVarForm({ ...varForm, default: e.target.value })}
                        placeholder="Default"
                      />
                    </div>
                  </div>

                  {varForm.type === 'select' && (
                    <div>
                      <Label htmlFor="varOptions">Options (one per line)</Label>
                      <Textarea
                        id="varOptions"
                        value={varForm.optionsText}
                        onChange={e => setVarForm({ ...varForm, optionsText: e.target.value })}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      id="varRequired"
                      checked={varForm.required}
                      onCheckedChange={checked => setVarForm({ ...varForm, required: checked })}
                    />
                    <Label htmlFor="varRequired">Required field</Label>
                  </div>

                  <div className="flex gap-2">
                    {editingVarIndex !== null ? (
                      <>
                        <Button type="button" onClick={updateVariable} className="flex-1">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingVarIndex(null);
                            resetVarForm();
                          }}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={addVariable} className="w-full">
                        <Plus className="mr-1 size-4" />
                        Add Variable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferredModel">Preferred Model</Label>
                <Input
                  id="preferredModel"
                  value={formData.modelSettings.preferredModel}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      modelSettings: { ...formData.modelSettings, preferredModel: e.target.value },
                    })
                  }
                  placeholder="e.g., gemini-2.0-flash-exp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature ({formData.modelSettings.temperature})</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={formData.modelSettings.temperature}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        modelSettings: { ...formData.modelSettings, temperature: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="topP">Top P ({formData.modelSettings.topP})</Label>
                  <Input
                    id="topP"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={formData.modelSettings.topP}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        modelSettings: { ...formData.modelSettings, topP: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topK">Top K</Label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.modelSettings.topK}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        modelSettings: { ...formData.modelSettings, topK: parseInt(e.target.value) || 1 },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Output Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={1}
                    max={65536}
                    value={formData.modelSettings.maxOutputTokens}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        modelSettings: { ...formData.modelSettings, maxOutputTokens: parseInt(e.target.value) || 1024 },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Instruction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Instruction</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.systemInstruction}
                onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
                placeholder="Optional system instruction override for this prompt..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
