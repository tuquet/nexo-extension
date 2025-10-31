import { Button, Spinner } from '@extension/ui';
import type React from 'react';

interface ScriptLoaderProps {
  onCancel: () => void;
}

const ScriptLoader: React.FC<ScriptLoaderProps> = ({ onCancel }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <Spinner className="size-8" />
    <h4 className="mt-6 text-lg font-semibold text-slate-800 dark:text-slate-200">Đang tạo kịch bản của bạn...</h4>
    <p className="text-slate-500 dark:text-slate-400">
      AI đang dựng bối cảnh. Quá trình này có thể mất một chút thời gian.
    </p>
    <Button variant="outline" onClick={onCancel} className="mt-6">
      Hủy
    </Button>
  </div>
);

export default ScriptLoader;
