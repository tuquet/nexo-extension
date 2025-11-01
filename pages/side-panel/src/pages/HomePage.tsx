import { Button, Textarea, Label } from '@extension/ui';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

const HomePage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    chrome.runtime.sendMessage(
      {
        action: 'GENERATE_SCRIPT_FROM_PROMPT',
        prompt: prompt,
      },
      () => {
        // The background script will handle opening the tab.
        // We can reset the state here.
        setIsSubmitting(false);
        setPrompt('');
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="script-prompt">Mô tả kịch bản</Label>
        <Textarea
          id="script-prompt"
          placeholder="Ví dụ: Một bộ phim về một chàng trai trẻ hỏi thiền sư về ý nghĩa của sự giàu có và nghèo đói..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={8}
          className="text-sm"
        />
      </div>
      <Button type="submit" className="w-full" disabled={!prompt.trim() || isSubmitting}>
        <Sparkles className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Đang gửi...' : 'Tạo kịch bản với Gemini'}
      </Button>
    </form>
  );
};

export default HomePage;
