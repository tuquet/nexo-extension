import { db } from '@extension/database';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@extension/ui';
import { Sparkles, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@extension/database';

interface TemplateSelectorProps {
  onSelectTemplate: (prompt: PromptRecord) => void;
  isLoading?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'script-generation': 'Tạo kịch bản',
  'image-generation': 'Tạo ảnh',
  'video-generation': 'Tạo video',
  'character-dev': 'Phát triển nhân vật',
  general: 'Tổng quát',
};

const CATEGORY_COLORS: Record<string, string> = {
  'script-generation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'image-generation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'video-generation': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'character-dev': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, isLoading = false }) => {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<PromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    void loadPrompts();
  }, []);

  useEffect(() => {
    void filterPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, prompts]);

  const loadPrompts = async () => {
    try {
      const allPrompts = await db.prompts.toArray();
      setPrompts(allPrompts);
      setFilteredPrompts(allPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some(tag => tag.toLowerCase().includes(query)),
      );
    }

    setFilteredPrompts(filtered);
  };

  const extractVariables = (promptText: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(promptText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  return (
    <div className="space-y-6">
      {/* Header with search and filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chọn Template Có Sẵn</h3>
        </div>

        <Input
          placeholder="Tìm kiếm template theo tên, mô tả, hoặc tags..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}>
            Tất cả ({prompts.length})
          </Badge>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = prompts.filter(p => p.category === key).length;
            return (
              <Badge
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(key)}>
                {label} ({count})
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'Không tìm thấy template phù hợp. Thử thay đổi bộ lọc.'
                : 'Chưa có template nào. Hãy tạo template đầu tiên trong trang Prompts!'}
            </p>
          </div>
        ) : (
          filteredPrompts.map(prompt => {
            const variables = extractVariables(prompt.prompt);
            return (
              <Card
                key={prompt.id}
                className="transition-all hover:shadow-md hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {prompt.icon && <span className="text-xl">{prompt.icon}</span>}
                        {prompt.title}
                      </CardTitle>
                      {prompt.description && (
                        <CardDescription className="mt-1 line-clamp-2">{prompt.description}</CardDescription>
                      )}
                    </div>
                    <Badge className={CATEGORY_COLORS[prompt.category] || 'bg-gray-100 text-gray-800'}>
                      {CATEGORY_LABELS[prompt.category] || prompt.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tags */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Badge variant="outline" className="">
                          +{prompt.tags.length - 3} thêm
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Variables preview */}
                  {variables.length > 0 && (
                    <div className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Biến:</span>{' '}
                      {variables
                        .slice(0, 5)
                        .map(v => `{{${v}}}`)
                        .join(', ')}
                      {variables.length > 5 && ` (+${variables.length - 5} biến)`}
                    </div>
                  )}

                  {/* Model settings info */}
                  {prompt.modelSettings && (
                    <div className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Model:</span> {prompt.modelSettings.preferredModel || 'Mặc định'}
                      {prompt.modelSettings.temperature !== undefined && (
                        <span className="ml-2">Temp: {prompt.modelSettings.temperature.toFixed(1)}</span>
                      )}
                    </div>
                  )}

                  <Button onClick={() => onSelectTemplate(prompt)} disabled={isLoading} className="w-full" size="sm">
                    Sử dụng Template Này
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
