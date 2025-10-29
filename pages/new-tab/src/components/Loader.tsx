import type React from 'react';

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="border-t-primary h-12 w-12 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600"></div>
    <h4 className="mt-6 text-lg font-semibold text-slate-800 dark:text-slate-200">Đang tạo kịch bản của bạn...</h4>
    <p className="text-slate-500 dark:text-slate-400">
      AI đang dựng bối cảnh. Quá trình này có thể mất một chút thời gian.
    </p>
  </div>
);

export default Loader;
