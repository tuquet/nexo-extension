import { Button } from '../components/ui/button';
import { useStorage } from '@extension/shared';
import { themeStorage } from '@extension/storage';
import { Icon } from '@iconify/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ToggleButtonProps = ComponentPropsWithoutRef<'button'>;

export const ToggleButton = ({ className, children, ...props }: ToggleButtonProps) => {
  const { isLight } = useStorage(themeStorage);

  let content: ReactNode = children;
  if (content === undefined || content === null) {
    content = isLight ? (
      <Icon icon="lucide:sun-medium" width={20} height={20} />
    ) : (
      <Icon icon="lucide:moon" width={20} height={20} />
    );
  }

  return (
    <Button className={className} onClick={themeStorage.toggle} {...props}>
      {content}
    </Button>
  );
};
