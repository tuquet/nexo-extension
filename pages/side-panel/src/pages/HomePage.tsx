import { PromptLibrary } from '../components/PromptLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@extension/ui';
import { Info, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type React from 'react';

interface AutomatePromptData {
  prompt: string;
  systemInstruction?: string;
  language: 'en-US' | 'vi-VN';
  timestamp: number;
}

const HomePage: React.FC = () => {
  const [automateData, setAutomateData] = useState<AutomatePromptData | null>(null);

  // Check if there's automation data from new-tab
  useEffect(() => {
    const checkAutomateData = async () => {
      try {
        const result = await chrome.storage.local.get('automatePromptData');
        if (result.automatePromptData) {
          const data = result.automatePromptData as AutomatePromptData;
          // Only show if data is recent (within 10 seconds)
          if (Date.now() - data.timestamp < 10000) {
            setAutomateData(data);
          }
        }
      } catch (error) {
        console.error('Failed to load automate data:', error);
      }
    };

    void checkAutomateData();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="text-primary size-5" />
          AI Script Automation
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Tự động hóa quy trình tạo kịch bản với Google AI Studio</p>
      </div>

      {/* Automation context card (if triggered from new-tab) */}
      {automateData && (
        <Card className="border-primary bg-primary/5 m-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4" />
              Đã sẵn sàng tự động điền prompt
            </CardTitle>
            <CardDescription>
              Prompt đã được chuẩn bị từ template. Click "Sử dụng" bên dưới để tự động điền vào Google AI Studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-muted-foreground bg-background rounded-md p-3 text-sm">
              <strong>Ngôn ngữ:</strong> {automateData.language === 'vi-VN' ? 'Tiếng Việt' : 'English'}
            </div>
            <div className="text-muted-foreground bg-background rounded-md p-3 text-sm">
              <strong>System Instruction:</strong> {automateData.systemInstruction ? 'Đã thiết lập' : 'Mặc định'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="text-base">Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full font-bold">
              1
            </div>
            <p className="text-sm">Chọn một template từ thư viện bên dưới hoặc sử dụng prompt đã được chuẩn bị</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full font-bold">
              2
            </div>
            <p className="text-sm">Click nút "Sử dụng" để tự động mở Google AI Studio và điền prompt</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full font-bold">
              3
            </div>
            <p className="text-sm">Chỉnh sửa prompt nếu cần, sau đó gửi để AI tạo kịch bản</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full font-bold">
              4
            </div>
            <p className="text-sm">Sao chép kết quả và nhập vào New Tab để hoàn tất quy trình</p>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Library */}
      <div className="flex-1 overflow-hidden">
        <PromptLibrary automatePromptData={automateData} />
      </div>
    </div>
  );
};

export default HomePage;
