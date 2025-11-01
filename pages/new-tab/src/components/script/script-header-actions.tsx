import { Button } from '@extension/ui';
import { Sparkles } from 'lucide-react';
import type React from 'react';

const ScriptHeaderActions: React.FC = () => {
  const handlePrimeGemini = () => {
    chrome.runtime.sendMessage({ action: 'PRIME_GEMINI_WITH_SCHEMA' });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePrimeGemini} title="Mở Gemini và gửi schema kịch bản">
        <Sparkles className="mr-2 h-4 w-4" />
        Prime Gemini
      </Button>
      {/* Bạn có thể thêm các nút hành động khác vào đây trong tương lai */}
    </div>
  );
};

export default ScriptHeaderActions;
