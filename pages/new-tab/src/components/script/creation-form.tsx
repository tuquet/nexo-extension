import {
  PREDEFINED_GENRES,
  DEFAULT_ASPECT_RATIO,
  SCRIPT_GENERATION_MODEL,
  PLOT_SUGGESTION_MODEL,
  AVAILABLE_TEXT_MODELS,
  IMAGE_GENERATION_MODEL,
  VIDEO_GENERATION_MODEL,
  AVAILABLE_IMAGE_MODELS,
  AVAILABLE_VIDEO_MODELS,
} from '../../constants';
import { suggestPlotPoints } from '../../services/gemini-service';
import { useApiKey } from '../../stores/use-api-key';
import CreatableSelect from '../script/creatable-select';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@extension/ui';
import usePersistentState from '@src/hooks/use-persistent-state';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { AspectRatio } from '../../types';
import type { FormEvent } from 'react';

const FORM_STORAGE_KEY = 'creationFormData';

interface CreationFormProps {
  onGenerate: (
    prompt: string,
    language: 'en-US' | 'vi-VN',
    aspectRatio: AspectRatio,
    scriptModel: string,
    imageModel: string,
    videoModel: string,
  ) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const CreationForm: React.FC<CreationFormProps> = ({ onGenerate, isLoading }) => {
  const { apiKey, isApiKeySet } = useApiKey();
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);

  // Sử dụng hook mới để quản lý trạng thái form
  const [logline, setLogline] = usePersistentState<string>(`${FORM_STORAGE_KEY}_logline`, '');
  const [genres, setGenres] = usePersistentState<string[]>(`${FORM_STORAGE_KEY}_genres`, []);
  const [language, setLanguage] = usePersistentState<'en-US' | 'vi-VN'>(`${FORM_STORAGE_KEY}_language`, 'vi-VN');
  const [scriptLength, setScriptLength] = usePersistentState<'short' | 'medium' | 'long'>(
    `${FORM_STORAGE_KEY}_scriptLength`,
    'short',
  );
  const [defaultAspectRatio, setDefaultAspectRatio] = usePersistentState<AspectRatio>(
    `${FORM_STORAGE_KEY}_aspectRatio`,
    DEFAULT_ASPECT_RATIO,
  );
  const [scriptModel, setScriptModel] = usePersistentState<string>(
    `${FORM_STORAGE_KEY}_scriptModel`,
    SCRIPT_GENERATION_MODEL,
  );
  const [suggestionModel, setSuggestionModel] = usePersistentState<string>(
    `${FORM_STORAGE_KEY}_suggestionModel`,
    PLOT_SUGGESTION_MODEL,
  );
  const [imageModel, setImageModel] = usePersistentState<string>(
    `${FORM_STORAGE_KEY}_imageModel`,
    IMAGE_GENERATION_MODEL,
  );
  const [videoModel, setVideoModel] = usePersistentState<string>(
    `${FORM_STORAGE_KEY}_videoModel`,
    VIDEO_GENERATION_MODEL,
  );

  const [plotSuggestions, setPlotSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

    onGenerate(finalPrompt, language, defaultAspectRatio, scriptModel, imageModel, videoModel);
    clearPersistedForm(); // Xóa dữ liệu sau khi gửi đi
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
    const suggestionPrompt = `**Logline / Core Idea:**\n${logline}\n\n**Genres:**\n${genres.join(', ')}`.trim();
    try {
      const suggestions = await suggestPlotPoints(suggestionPrompt, language, apiKey!, suggestionModel);
      setPlotSuggestions(suggestions);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gợi ý tình tiết.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddSuggestionToLogline = (suggestion: string) => {
    setLogline(prev => `${prev}\n\n- ${suggestion}`.trim());
  };

  const clearPersistedForm = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(FORM_STORAGE_KEY)) {
        sessionStorage.removeItem(key);
      }
    });
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
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

      <form onSubmit={handleGenerateScript} className="space-y-6">
        {/* All form elements from App.tsx go here */}
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
        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSuggestPlotPoints}
            disabled={!logline.trim() || isLoading || isSuggesting || !isApiKeySet}
            title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để sử dụng' : ''}>
            {isSuggesting ? '🤔 Đang gợi ý...' : '💡 Gợi ý tình tiết'}
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
              className="mt-2 space-y-1 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
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
            <Select value={language} onValueChange={val => setLanguage(val as 'en-US' | 'vi-VN')} disabled={isLoading}>
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
          <label htmlFor="aspectRatio" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
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

        <div className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
            <span>Tùy chọn nâng cao</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-2 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="scriptModel"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Model tạo kịch bản
                </label>
                <Select value={scriptModel} onValueChange={setScriptModel} disabled={isLoading}>
                  <SelectTrigger id="scriptModel" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TEXT_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="suggestionModel"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Model gợi ý tình tiết
                </label>
                <Select value={suggestionModel} onValueChange={setSuggestionModel} disabled={isLoading || isSuggesting}>
                  <SelectTrigger id="suggestionModel" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TEXT_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="imageModel"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Model tạo ảnh
                </label>
                <Select value={imageModel} onValueChange={setImageModel} disabled={isLoading}>
                  <SelectTrigger id="imageModel" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_IMAGE_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="videoModel"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Model tạo video
                </label>
                <Select value={videoModel} onValueChange={setVideoModel} disabled={isLoading}>
                  <SelectTrigger id="videoModel" className="focus:border-primary focus:ring-primary/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_VIDEO_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isApiKeySet}
            title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để tạo kịch bản' : ''}>
            {isLoading ? '⏳ Đang tạo...' : '🎬 Tạo kịch bản'}
          </Button>
        </div>
        {formError && (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            🚨 {formError}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreationForm;
