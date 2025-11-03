import { ModelSettings } from '../settings/model-settings';
import CreatableSelect from '../ui/creatable-select';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@extension/ui';
import { PREDEFINED_GENRES, DEFAULT_MODELS, SCRIPT_GENERATION_LOADING_MESSAGES } from '@src/constants';
import usePersistentState from '@src/hooks/use-persistent-state';
import { suggestPlotPoints } from '@src/services/background-api';
import { useApiKey } from '@src/stores/use-api-key';
import { useModelSettings } from '@src/stores/use-model-settings';
import { usePreferencesStore } from '@src/stores/use-preferences-store';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { AlertCircle, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AspectRatio } from '@src/types';
import type { FormEvent } from 'react';

const FORM_STORAGE_KEY = 'creationFormData';

interface CreationFormProps {
  onGenerate: (
    prompt: string,
    language: 'en-US' | 'vi-VN',
    scriptModel: string,
    temperature: number,
    topP: number,
  ) => void;
  onImportJson: (jsonString: string) => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const ManualCreationForm: React.FC<CreationFormProps> = ({ onGenerate, onImportJson, onImportFile, isLoading }) => {
  const { apiKey, isApiKeySet } = useApiKey();
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const { model, temperature, topP } = useModelSettings();
  const importFileRef = useRef<HTMLInputElement>(null);
  const { defaultAspectRatio, setDefaultAspectRatio } = usePreferencesStore();

  const [logline, setLogline] = usePersistentState<string>(`${FORM_STORAGE_KEY}_logline`, '');
  const [genres, setGenres] = usePersistentState<string[]>(`${FORM_STORAGE_KEY}_genres`, []);
  const [language, setLanguage] = usePersistentState<'en-US' | 'vi-VN'>(`${FORM_STORAGE_KEY}_language`, 'vi-VN');
  const [scriptLength, setScriptLength] = usePersistentState<'short' | 'medium' | 'long'>(
    `${FORM_STORAGE_KEY}_scriptLength`,
    'short',
  );
  const [suggestionModel] = usePersistentState<string>(
    `${FORM_STORAGE_KEY}_suggestionModel`,
    DEFAULT_MODELS.plotSuggestion,
  );

  const [plotSuggestions, setPlotSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ai');
  const [jsonText, setJsonText] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(SCRIPT_GENERATION_LOADING_MESSAGES[0]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      // Bắt đầu chạy chữ khi loading
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = SCRIPT_GENERATION_LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % SCRIPT_GENERATION_LOADING_MESSAGES.length;
          return SCRIPT_GENERATION_LOADING_MESSAGES[nextIndex];
        });
      }, 3000); // Thay đổi thông báo mỗi 3 giây
    }
    // Dọn dẹp interval khi không còn loading hoặc component bị hủy
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGenerateScript = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!isApiKeySet) {
      setFormError('Vui lòng thiết lập khóa API của bạn trong phần cài đặt (⚙️) trước khi tạo kịch bản.');
      return;
    }
    if (!logline.trim()) {
      setFormError('Vui lòng nhập tóm tắt hoặc ý tưởng chính để tạo kịch bản.');
      return;
    }

    const finalPrompt = `
      **Logline / Core Idea:** ${logline}
      **Genres:** ${genres.join(', ')}
      **Desired Script Length:** ${scriptLength}
      Based on the provided logline, genres, and desired length, please generate a full movie script.`.trim();

    onGenerate(finalPrompt, language, model, temperature, topP);
    clearPersistedForm();
  };

  const handleSuggestPlotPoints = async () => {
    if (!isApiKeySet) {
      setSuggestionError('Vui lòng thiết lập khóa API của bạn trong phần cài đặt (⚙️) để nhận gợi ý.');
      return;
    }
    if (!logline.trim()) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    setPlotSuggestions([]);
    const suggestionPrompt = `**Logline / Core Idea:**
${logline}

**Genres:**
${genres.join(', ')}`.trim();
    try {
      const suggestions = await suggestPlotPoints({
        prompt: suggestionPrompt,
        apiKey: apiKey!,
        modelName: suggestionModel,
        count: 5,
      });
      setPlotSuggestions(suggestions);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gợi ý tình tiết.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddSuggestionToLogline = (suggestion: string) => {
    setLogline(prev =>
      `${prev}

- ${suggestion}`.trim(),
    );
  };

  const handleCopyPrompt = () => {
    const finalPrompt = `
      **Logline / Core Idea:** ${logline}
      **Genres:** ${genres.join(', ')}
      **Desired Script Length:** ${scriptLength}
      Based on the provided logline, genres, and desired length, please generate a full movie script.`.trim();

    const systemInstruction = `You are a professional screenwriter. Based on the user's prompt, generate a complete and detailed movie script in ${language}.
        The script must follow the three-act structure.
        Ensure every field in the provided JSON schema is filled with creative, relevant, and well-written content.
        The 'roleId' in dialogue must correspond to one of the character roleIds defined in the 'characters' array (e.g., 'Protagonist', 'Mentor'). Do not invent new roleIds for dialogue.
        For each dialogue 'line', provide only the spoken words. Do not include parenthetical remarks, actions, or context like '(internal monologue)' or '(shouting)'.
        IMPORTANT RULE: Always include a character with the roleId 'narrator' in the 'characters' list. For any scene that has no character dialogue, you MUST create a single entry in the 'dialogues' array. This entry will have the 'roleId' set to 'narrator' and the 'line' will be the exact content of the 'action' field for that scene. This ensures every scene has content for voice-over.`;

    const fullPromptText = `--- SYSTEM PROMPT ---\n${systemInstruction}\n\n--- USER PROMPT ---\n${finalPrompt}`;

    void navigator.clipboard.writeText(fullPromptText).then(() => {
      toast.success('Đã sao chép toàn bộ prompt vào clipboard!');
    });
  };

  const handleImportClick = () => {
    setFormError(null);
    if (!jsonText.trim()) {
      setFormError('Vui lòng dán nội dung JSON vào ô bên dưới.');
      return;
    }
    try {
      JSON.parse(jsonText); // Thử parse để kiểm tra JSON hợp lệ
      onImportJson(jsonText);
    } catch {
      setFormError('Nội dung JSON không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  const clearPersistedForm = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(FORM_STORAGE_KEY)) {
        sessionStorage.removeItem(key);
      }
    });
  };

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tạo kịch bản mới</h2>
      <p className="mb-8 text-slate-500 dark:text-slate-400">Bắt đầu bằng cách điền vào các chi tiết bên dưới.</p>

      {!isApiKeySet && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p>Bạn cần thiết lập khóa API Gemini để có thể tạo kịch bản và sử dụng các tính năng AI.</p>
            <Button
              variant="link"
              className="h-auto p-0 text-yellow-800 dark:text-yellow-200"
              onClick={() => setSettingsModalOpen(true)}>
              Mở cài đặt và thêm khóa API
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="ai">Tạo bằng AI</TabsTrigger>
          <TabsTrigger value="json">Nhập từ JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-6">
          <form onSubmit={handleGenerateScript} className="space-y-6">
            <div>
              <label htmlFor="logline" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tóm tắt / Ý tưởng chính
              </label>
              <Textarea
                id="logline"
                rows={5}
                className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white shadow-sm transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-100 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500 dark:disabled:bg-slate-700"
                value={logline}
                onChange={e => setLogline(e.target.value)}
                placeholder="VD: Một thám tử trong thành phố cyberpunk đuổi theo một AI nổi loạn..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="genres" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Thể loại
              </label>
              <CreatableSelect
                options={PREDEFINED_GENRES}
                value={genres}
                onChange={setGenres}
                placeholder="Chọn hoặc tạo thể loại..."
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-grow">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSuggestPlotPoints}
                  disabled={!logline.trim() || isLoading || isSuggesting || !isApiKeySet}
                  title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để sử dụng' : ''}>
                  {isSuggesting ? 'Đang gợi ý...' : 'Gợi ý tình tiết'}
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={handleCopyPrompt} title="Sao chép Prompt">
                <Copy className="h-5 w-5" />
                <span className="sr-only">Sao chép Prompt</span>
              </Button>
            </div>
            {suggestionError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                🚨 {suggestionError}
              </div>
            )}
            {plotSuggestions.length > 0 && (
              <div>
                <label
                  htmlFor="plot-suggestions-list"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Gợi ý (nhấp để thêm vào tóm tắt)
                </label>
                <div
                  id="plot-suggestions-list"
                  className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  {plotSuggestions.map((item, index) => (
                    <div key={index}>
                      <button
                        type="button"
                        onClick={() => handleAddSuggestionToLogline(item)}
                        className="text-primary block w-full cursor-pointer p-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        {item}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="language" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ngôn ngữ
                </label>
                <Select
                  value={language}
                  onValueChange={val => setLanguage(val as 'en-US' | 'vi-VN')}
                  disabled={isLoading}>
                  <SelectTrigger id="language" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi-VN">Tiếng Việt</SelectItem>
                    <SelectItem value="en-US">Tiếng Anh (Mỹ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="length" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Độ dài kịch bản
                </label>
                <Select
                  value={scriptLength}
                  onValueChange={val => setScriptLength(val as 'short' | 'medium' | 'long')}
                  disabled={isLoading}>
                  <SelectTrigger id="length" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Ngắn</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="long">Dài</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label
                htmlFor="aspectRatio"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Định dạng Video (Mặc định)
              </label>
              <Select
                value={defaultAspectRatio}
                onValueChange={val => setDefaultAspectRatio(val as AspectRatio)}
                disabled={isLoading}>
                <SelectTrigger id="aspectRatio" className="focus:border-primary focus:ring-primary/20 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Ngang)</SelectItem>
                  <SelectItem value="9:16">9:16 (Dọc)</SelectItem>
                  <SelectItem value="1:1">1:1 (Vuông)</SelectItem>
                  <SelectItem value="4:3">4:3 (Cổ điển)</SelectItem>
                  <SelectItem value="3:4">3:4 (Chân dung)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Tùy chọn nâng cao</div>
              <ModelSettings disabled={isLoading} />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isApiKeySet}
                title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để tạo kịch bản' : ''}>
                {isLoading ? 'Đang tạo...' : 'Tạo kịch bản'}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="json" className="mt-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="json-input" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nội dung JSON kịch bản
              </label>
              <Textarea
                id="json-input"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='[{"title": "My Movie", "acts": [...]}]'
                rows={20}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImportClick} className="flex-1" disabled={isLoading}>
                {isLoading ? 'Đang nhập...' : 'Nhập từ văn bản'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => importFileRef.current?.click()}
                disabled={isLoading}>
                Nhập từ File
              </Button>
              <input
                type="file"
                ref={importFileRef}
                className="hidden"
                accept=".json"
                multiple
                onChange={onImportFile}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {formError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {formError}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300"></div>
            <h4 className="mt-6 text-lg font-semibold text-slate-800 dark:text-slate-200">
              Đang tạo kịch bản của bạn...
            </h4>
            <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualCreationForm;
