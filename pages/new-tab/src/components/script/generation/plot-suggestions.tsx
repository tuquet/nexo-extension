interface PlotSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  onAddToLogline: (suggestion: string) => void;
}

export const PlotSuggestions: React.FC<PlotSuggestionsProps> = ({ suggestions, isLoading, error, onAddToLogline }) => {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
        🚨 {error}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div>
      <label htmlFor="plot-suggestions-list" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Gợi ý (nhấp để thêm vào tóm tắt)
      </label>
      <div
        id="plot-suggestions-list"
        className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {suggestions.map((item, index) => (
          <div key={index}>
            <button
              type="button"
              onClick={() => onAddToLogline(item)}
              className="text-primary block w-full cursor-pointer p-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
              disabled={isLoading}>
              {item}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
