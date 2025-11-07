/**
 * Navigation Dropdown Component
 * Atomic Design: Molecule
 * SOLID: Single Responsibility - Handles dropdown navigation menu
 */

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@extension/ui';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type React from 'react';

interface NavDropdownItem {
  label: string;
  to: string;
  icon?: LucideIcon;
  description?: string;
}

interface NavDropdownProps {
  label: string;
  icon: LucideIcon;
  items: NavDropdownItem[];
  isActive: boolean;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const NavDropdown: React.FC<NavDropdownProps> = ({
  label,
  icon: Icon,
  items,
  isActive,
  variant = 'ghost',
  size = 'sm',
  className = '',
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant={isActive ? 'secondary' : variant} size={size} className={`gap-2 ${className}`}>
        <Icon className="size-4" />
        <span>{label}</span>
        <ChevronDown className="size-3 opacity-50" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-56">
      {items.map((item, index) => (
        <div key={item.to}>
          {index > 0 && item.description && <DropdownMenuSeparator />}
          <DropdownMenuItem asChild>
            <Link to={item.to} className="flex cursor-pointer items-center gap-2">
              {item.icon && <item.icon className="size-4" />}
              <div className="flex flex-col">
                <span>{item.label}</span>
                {item.description && <span className="text-muted-foreground text-xs">{item.description}</span>}
              </div>
            </Link>
          </DropdownMenuItem>
        </div>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export { NavDropdown };
export type { NavDropdownItem, NavDropdownProps };
