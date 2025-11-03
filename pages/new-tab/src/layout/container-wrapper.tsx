import { usePreferencesStore } from '../stores/use-preferences-store';
import type { PropsWithChildren } from 'react';

type Size = 'narrow' | 'normal' | 'wide' | 'fluid';

const sizeClasses: Record<Size, string> = {
  narrow: 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8',
  normal: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
  wide: 'mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8',
  fluid: 'w-full px-4 sm:px-6 lg:px-8',
};

const LayoutContainerWrapper = ({ children }: PropsWithChildren<object>) => {
  const size = usePreferencesStore(s => s.containerSize);

  return <main className={sizeClasses[size]}>{children}</main>;
};

export default LayoutContainerWrapper;
