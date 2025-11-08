/**
 * Standard Dialog Wrapper Component
 * Provides consistent Dialog structure across the application
 * Eliminates duplication in modal components
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@extension/ui';
import { cn } from '@extension/ui/lib/utils';
import type { ReactNode } from 'react';

interface StandardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
  className?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
} as const;

const StandardDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: StandardDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={cn('max-h-[90vh] overflow-y-auto', sizeClasses[size], className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div className="py-4">{children}</div>

      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogContent>
  </Dialog>
);

export { StandardDialog };
export type { StandardDialogProps };
