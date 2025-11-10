import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from '@extension/ui';
import { StandardDialog } from '@src/components/common/standard-dialog';
import { AVAILABLE_TTS_MODELS } from '@src/constants';
import { useErrorHandler } from '@src/hooks';
import { createVbeeProject } from '@src/services/background-api';
import { transformScriptToVbeeProject } from '@src/services/vbee-service';
import { useModelSettings } from '@src/stores/use-model-settings';
import { useScriptsStore, selectActiveScriptCharacters, selectAllDialogueLines } from '@src/stores/use-scripts-store';
import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { VbeeTransformationResult } from '@src/services/vbee-service';
import type React from 'react';

interface TtsExportProps {
  isOpen: boolean;
  onClose: () => void;
}

const TtsExport: React.FC<TtsExportProps> = ({ isOpen, onClose }) => {
  const activeScript = useScriptsStore(s => s.activeScript);
  const [projectJsonText, setProjectJsonText] = useState(''); // Payload for Project tab
  const [plainText, setPlainText] = useState(''); // Plain text for TTS tab
  const [token, setToken] = useState('');
  const { error, setError, clearError } = useErrorHandler({ showToast: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('project');
  const [copied, setCopied] = useState<'project' | 'text' | null>(null);
  const characters = useScriptsStore(selectActiveScriptCharacters);
  const allDialogueLines = useScriptsStore(selectAllDialogueLines);
  const [characterVoiceMap, setCharacterVoiceMap] = useState<Record<string, string>>({});
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);

  const handleOpenVbeeTab = useCallback(() => {
    chrome.tabs.create({ url: 'https://studio.vbee.vn' });
  }, []);

  const handleCopy = (text: string, type: 'project' | 'text') => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000); // Reset after 2 seconds
    });
  };

  const handleVoiceMappingChange = (character: string, voiceId: string) => {
    setCharacterVoiceMap(prev => ({
      ...prev,
      [character]: voiceId,
    }));
  };

  const handleProjectSubmit = useCallback(async () => {
    if (!projectJsonText.trim()) {
      setError('Vui lòng dán nội dung JSON vào ô bên dưới.');
      return;
    }
    if (!token.trim()) {
      setError('Vui lòng cung cấp Bearer Token. Bạn có thể dùng nút "Trích xuất Token" để lấy tự động.');
      return;
    }

    setIsSubmitting(true);
    clearError();

    // Lấy phiên bản mới nhất của activeScript từ store ngay trước khi thực hiện hành động
    const currentActiveScript = useScriptsStore.getState().activeScript;
    if (!currentActiveScript) {
      setError('Không tìm thấy kịch bản đang hoạt động.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { payload, updatedScript } = JSON.parse(projectJsonText) as VbeeTransformationResult;
      const vbeeResponse = await createVbeeProject({
        projectData: payload,
        bearerToken: token,
      });
      const projectId = vbeeResponse?.projectId;
      if (projectId) {
        updatedScript.buildMeta = { ...updatedScript.buildMeta, vbeeProjectId: projectId };
        await saveActiveScript(updatedScript);
        toast.success(`Đã tạo dự án trên Vbee thành công! ID: ${projectId}`);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
      console.error('Lỗi khi xuất dự án Vbee:', e);
    } finally {
      setIsSubmitting(false);
    }
  }, [projectJsonText, token, onClose, saveActiveScript, clearError, setError]);

  const handleTextSubmit = useCallback(async () => {
    if (!plainText.trim()) {
      setError('Vui lòng nhập văn bản cần chuyển đổi.');
      return;
    }
    if (!token.trim()) {
      setError('Vui lòng cung cấp Bearer Token.');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      // TODO: Implement the API call for plain text TTS
      // For now, we'll just show an alert as a placeholder.
      toast.info('Chức năng tạo TTS từ văn bản thuần chưa được kết nối API.');
      // await createTtsFromText(plainText, token);
      // onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSubmitting(false);
    }
  }, [plainText, token, clearError, setError]);

  const { ttsModel } = useModelSettings();

  useEffect(() => {
    if (isOpen && activeScript) {
      // Khởi tạo map giọng nói với giọng mặc định
      const initialVoiceMap = characters.reduce(
        (acc, char) => {
          acc[char] = ttsModel;
          return acc;
        },
        {} as Record<string, string>,
      );
      setCharacterVoiceMap(initialVoiceMap);

      // Tạo nội dung văn bản thuần túy
      const allDialogueLinesText = allDialogueLines.join('\n');
      setPlainText(allDialogueLinesText);

      // Khi modal mở, thử lấy token đã lưu
      chrome.storage.local.get('vbee_token').then(result => {
        if (result.vbee_token) {
          setToken(result.vbee_token);
        }
      });
    } else if (!isOpen) {
      setProjectJsonText('');
      setPlainText('');
      // Không reset token để người dùng có thể tái sử dụng nếu mở lại modal
      setError(null);
    }

    // Lắng nghe tin nhắn từ background script
    const messageListener = (message: { type: string; token?: string }) => {
      if (message.type === 'VBEE_TOKEN_CAPTURED' && message.token) {
        setToken(message.token);
        toast.success('Đã tự động trích xuất và điền token Vbee thành công!');
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Dọn dẹp listener khi component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [isOpen, activeScript, ttsModel, characters, allDialogueLines, setError]);

  // Cập nhật payload JSON khi có thay đổi về ánh xạ giọng nói hoặc tab
  useEffect(() => {
    if (isOpen && activeScript && activeTab === 'project') {
      const transformation = transformScriptToVbeeProject(activeScript, ttsModel, characterVoiceMap);
      setProjectJsonText(JSON.stringify(transformation, null, 2));
    }
  }, [isOpen, activeScript, activeTab, characterVoiceMap, ttsModel]);

  return (
    <StandardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="Tạo Tài Nguyên TTS"
      size="5xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={() => void (activeTab === 'project' ? handleProjectSubmit() : handleTextSubmit())}
            disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Tạo'}
          </Button>
        </>
      }>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Tạo dự án studio.vbee.vn </TabsTrigger>
          <TabsTrigger value="text">Tạo TTS từ văn bản</TabsTrigger>
        </TabsList>
        <TabsContent value="project" className="mt-4">
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Cấu hình giọng nói cho từng nhân vật. Payload JSON sẽ được tự động cập nhật.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-2 lg:grid-cols-3 dark:border-slate-700">
            {characters.map(character => (
              <div key={character} className="flex items-center justify-between">
                <Label htmlFor={`voice-for-${character}`} className="capitalize">
                  {character}
                </Label>
                <Select
                  value={characterVoiceMap[character] || ttsModel}
                  onValueChange={value => handleVoiceMappingChange(character, value)}>
                  <SelectTrigger id={`voice-for-${character}`} className="w-[220px]">
                    <SelectValue placeholder="Chọn giọng nói" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TTS_MODELS.map(voice => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            JSON payload được tạo từ kịch bản hiện tại để tạo dự án trên Vbee Studio.
          </p>
          <div className="relative">
            <Textarea value={projectJsonText} onChange={e => setProjectJsonText(e.target.value)} rows={15} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              onClick={() => handleCopy(projectJsonText, 'project')}>
              {copied === 'project' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="text" className="mt-4">
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Dán văn bản thuần túy vào đây để chuyển đổi thành giọng nói.
          </p>
          <div className="relative">
            <Textarea
              value={plainText}
              onChange={e => setPlainText(e.target.value)}
              rows={15}
              placeholder="Nhập văn bản của bạn ở đây..."
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              onClick={() => handleCopy(plainText, 'text')}>
              {copied === 'text' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <Label htmlFor="vbee-token">Vbee Bearer Token</Label>
        <div className="flex items-center gap-2">
          <Input
            id="vbee-token"
            type="password"
            className="flex-grow"
            placeholder="Dán token vào đây hoặc dùng nút trích xuất"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <Button variant="outline" onClick={handleOpenVbeeTab}>
            Trích xuất Token
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">Mở tab Vbee Studio, đăng nhập và token sẽ được tự động điền.</p>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </StandardDialog>
  );
};

export { TtsExport };
