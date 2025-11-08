import { db } from '../db';
import { Badge, Button, Card, CardContent, Input, toast } from '@extension/ui';
import { Copy, Search, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@extension/database';

interface AutomatePromptData {
  prompt: string;
  systemInstruction?: string;
  language: 'en-US' | 'vi-VN';
  timestamp: number;
}

interface PromptLibraryProps {
  automatePromptData?: AutomatePromptData | null;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ automatePromptData }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);

  // Load prompts from DB on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const dbPrompts = await db.prompts.toArray();
      setPrompts(dbPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      setPrompts([]);
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter(p => {
    const matchSearch =
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  // Handle use prompt - send to background for automation
  const handleUsePrompt = async (prompt: PromptRecord | 'automate') => {
    setIsProcessing(true);

    try {
      let promptText = '';
      let titleText = '';

      if (prompt === 'automate' && automatePromptData) {
        promptText = automatePromptData.prompt;
        titleText = 'Template automation';
      } else if (typeof prompt === 'object') {
        promptText = prompt.prompt;
        titleText = prompt.title;
      }

      const response = await chrome.runtime.sendMessage({
        type: 'AUTO_FILL_GEMINI_PROMPT',
        payload: {
          prompt: promptText,
          autoSend: false, // Let user review before sending
        },
      });

      if (response?.success) {
        toast.success(`"${titleText}" đã được điền vào Gemini`, {
          description: 'Tab Gemini đã được mở. Bạn có thể chỉnh sửa trước khi gửi.',
        });

        // Clear automate data after use
        if (prompt === 'automate') {
          await chrome.storage.local.remove('automatePromptData');
        }
      } else {
        toast.error('Không thể điền prompt', {
          description: response?.error?.message || 'Vui lòng thử lại',
        });
      }
    } catch {
      toast.error('Lỗi kết nối', {
        description: 'Không thể giao tiếp với background script',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      toast.success('Đã sao chép prompt', {
        description: 'Prompt đã được copy vào clipboard',
      });
    } catch {
      toast.error('Không thể sao chép', {
        description: 'Vui lòng thử lại',
      });
    }
  };

  // Category labels
  const categories = [
    { value: 'all', label: '🎯 Tất cả' },
    { value: 'script-generation', label: '🎬 Kịch bản' },
    { value: 'image-generation', label: '📸 Hình ảnh' },
    { value: 'video-generation', label: '🎥 Video' },
    { value: 'character-dev', label: '🎭 Nhân vật' },
    { value: 'general', label: '✨ Chung' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="mb-2 text-lg font-semibold">Thư viện Prompt</h2>
        <p className="text-muted-foreground">Click "Sử dụng" để tự động điền prompt vào Google AI Studio</p>
      </div>

      {/* Automate prompt button (if available) */}
      {automatePromptData && (
        <div className="border-b p-4">
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">Prompt từ Template</h3>
                  <p className="text-muted-foreground mt-1">Sử dụng prompt đã được chuẩn bị từ New Tab</p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleUsePrompt('automate')}
                  disabled={isProcessing}
                  className="shrink-0">
                  <Zap className="mr-1 size-3" />
                  Sử dụng ngay
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search bar */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm kiếm prompt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="border-b p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              className="cursor-pointer select-none"
              onClick={() => setSelectedCategory(cat.value)}>
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-4">
          {filteredPrompts.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              <p>Không tìm thấy prompt nào</p>
              <p className="">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            filteredPrompts.map(prompt => (
              <Card key={prompt.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {prompt.icon && <span className="text-lg">{prompt.icon}</span>}
                        <div className="flex-1">
                          <h3 className="font-semibold leading-tight">{prompt.title}</h3>
                          {prompt.description && <p className="text-muted-foreground mt-1">{prompt.description}</p>}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {categories.find(c => c.value === prompt.category)?.label.split(' ')[0] || '✨'}
                      </Badge>
                    </div>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUsePrompt(prompt)}
                        disabled={isProcessing}>
                        <Sparkles className="mr-1 size-3" />
                        Sử dụng
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopyPrompt(prompt)}>
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="border-t p-3 text-center">
        <p className="text-muted-foreground">
          Hiển thị {filteredPrompts.length} / {prompts.length} prompts
        </p>
      </div>
    </div>
  );
};

export { PromptLibrary };
