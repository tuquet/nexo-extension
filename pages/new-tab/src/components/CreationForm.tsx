import CreatableSelect from './CreatableSelect';
import { PREDEFINED_GENRES, DEFAULT_ASPECT_RATIO } from '../constants';
import { suggestPlotPoints } from '../services/geminiService';
import { useApiKey } from '../stores/useApiKey';
import { useState } from 'react';
import type { AspectRatio } from '../types';
import type React from 'react';

interface CreationFormProps {
  onGenerate: (prompt: string, language: 'en-US' | 'vi-VN', aspectRatio: AspectRatio) => void;
  isLoading: boolean;
}

const CreationForm: React.FC<CreationFormProps> = ({ onGenerate, isLoading }) => {
  const { apiKey, isApiKeySet } = useApiKey();
  const [logline, setLogline] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [language, setLanguage] = useState<'en-US' | 'vi-VN'>('vi-VN');
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  const [plotSuggestions, setPlotSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGenerateScript = (e: React.FormEvent) => {
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

    onGenerate(finalPrompt, language, defaultAspectRatio);
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
      const suggestions = await suggestPlotPoints(suggestionPrompt, language, apiKey!);
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tạo kịch bản mới</h2>
      <p className="mb-8 text-slate-500 dark:text-slate-400">Bắt đầu bằng cách điền vào các chi tiết bên dưới.</p>
      <form onSubmit={handleGenerateScript} className="space-y-6">
        {/* All form elements from App.tsx go here */}
        <div>
          <label htmlFor="logline" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tóm tắt / Ý tưởng chính
          </label>
          <textarea
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
          <button
            type="button"
            className="focus:ring-primary/50 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={handleSuggestPlotPoints}
            disabled={!logline.trim() || isLoading || isSuggesting || !isApiKeySet}
            title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để sử dụng' : ''}>
            {isSuggesting ? '🤔 Đang gợi ý...' : '💡 Gợi ý tình tiết'}
          </button>
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
            <select
              id="language"
              className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm transition focus:ring-2 disabled:bg-slate-100 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:disabled:bg-slate-700"
              value={language}
              onChange={e => setLanguage(e.target.value as 'en-US' | 'vi-VN')}
              disabled={isLoading}>
              <option value="vi-VN">Tiếng Việt</option>
              <option value="en-US">Tiếng Anh (Mỹ)</option>
            </select>
          </div>
          <div>
            <label htmlFor="length" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Độ dài kịch bản
            </label>
            <select
              id="length"
              className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm transition focus:ring-2 disabled:bg-slate-100 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:disabled:bg-slate-700"
              value={scriptLength}
              onChange={e => setScriptLength(e.target.value as 'short' | 'medium' | 'long')}
              disabled={isLoading}>
              <option value="short">Ngắn</option>
              <option value="medium">Trung bình</option>
              <option value="long">Dài</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="aspectRatio" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Định dạng Video (Mặc định)
          </label>
          <select
            id="aspectRatio"
            className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm transition focus:ring-2 disabled:bg-slate-100 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:disabled:bg-slate-700"
            value={defaultAspectRatio}
            onChange={e => setDefaultAspectRatio(e.target.value as AspectRatio)}
            disabled={isLoading}>
            <option value="16:9">16:9 (Ngang)</option>
            <option value="9:16">9:16 (Dọc)</option>
            <option value="1:1">1:1 (Vuông)</option>
            <option value="4:3">4:3 (Cổ điển)</option>
            <option value="3:4">3:4 (Chân dung)</option>
          </select>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark focus:ring-primary/50 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !isApiKeySet}
            title={!isApiKeySet ? 'Vui lòng đặt khóa API trong cài đặt để tạo kịch bản' : ''}>
            {isLoading ? '⏳ Đang tạo...' : '🎬 Tạo kịch bản'}
          </button>
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
