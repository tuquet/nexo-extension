import { usePreferencesStore } from '../stores/use-preferences-store';
import type { PropsWithChildren } from 'react';

type Size = 'narrow' | 'normal' | 'wide';

const sizeClasses: Record<Size, string> = {
  narrow: 'mx-auto max-w-full px-4 sm:px-6 lg:px-8',
  normal: 'mx-auto max-w-full px-4 sm:px-6 lg:px-8',
  wide: 'mx-auto max-w-full px-4 sm:px-6 lg:px-8',
};

const LayoutContainerWrapper = ({ children }: PropsWithChildren<object>) => {
  const size = usePreferencesStore(s => s.containerSize);

  return (
    <div className="relative w-full">
      <div className={sizeClasses[size]}>{children}</div>
    </div>
  );
};

export default LayoutContainerWrapper;
