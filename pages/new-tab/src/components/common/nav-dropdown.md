/**
 * NavDropdown Component Documentation
 * ===================================
 * 
 * Component architecture following SOLID principles and Atomic Design
 * 
 * ## Architecture Pattern
 * 
 * ### Atomic Design Level: Molecule
 * - Composed of atoms: Button, DropdownMenu components from @extension/ui
 * - Reusable across different navigation contexts
 * - Self-contained with clear interface
 * 
 * ### SOLID Principles Applied
 * 
 * 1. **Single Responsibility Principle (SRP)**
 *    - Only responsible for rendering dropdown navigation menu
 *    - Navigation logic handled by react-router-dom Link
 *    - State management delegated to parent (Header component)
 * 
 * 2. **Open/Closed Principle (OCP)**
 *    - Open for extension via `items` prop (add new menu items without modifying component)
 *    - Closed for modification (component logic stable)
 *    - Example: Adding new menu item = just add to items array in parent
 * 
 * 3. **Liskov Substitution Principle (LSP)**
 *    - Can replace regular Button navigation without breaking UI
 *    - Props interface compatible with navigation requirements
 * 
 * 4. **Interface Segregation Principle (ISP)**
 *    - Minimal interface: only required props (label, icon, items, isActive)
 *    - Optional props for customization (variant, size, className)
 *    - NavDropdownItem interface focused on navigation needs
 * 
 * 5. **Dependency Inversion Principle (DIP)**
 *    - Depends on abstractions (LucideIcon type, Link component)
 *    - Not coupled to specific icon library implementation
 *    - Uses composition over inheritance
 * 
 * ## Usage Example
 * 
 * ```tsx
 * import { NavDropdown } from '@src/components/common/nav-dropdown';
 * import { FileText, List, PlusCircle } from 'lucide-react';
 * 
 * const scriptMenuItems = [
 *   {
 *     label: 'Danh sách kịch bản',
 *     to: '/script',
 *     icon: List,
 *     description: 'Xem tất cả kịch bản',
 *   },
 *   {
 *     label: 'Tạo kịch bản mới',
 *     to: '/script/create',
 *     icon: PlusCircle,
 *     description: 'Tạo kịch bản từ đầu',
 *   },
 * ];
 * 
 * <NavDropdown
 *   label="Kịch Bản"
 *   icon={FileText}
 *   items={scriptMenuItems}
 *   isActive={isScriptRouteActive}
 * />
 * ```
 * 
 * ## Props Interface
 * 
 * ```typescript
 * interface NavDropdownProps {
 *   label: string;              // Display text for dropdown button
 *   icon: LucideIcon;           // Icon component from lucide-react
 *   items: NavDropdownItem[];   // Array of menu items
 *   isActive: boolean;          // Highlight state (routes to secondary variant)
 *   variant?: ButtonVariant;    // Button style (default: 'ghost')
 *   size?: ButtonSize;          // Button size (default: 'sm')
 *   className?: string;         // Additional CSS classes
 * }
 * 
 * interface NavDropdownItem {
 *   label: string;              // Menu item text
 *   to: string;                 // React Router path
 *   icon?: LucideIcon;          // Optional icon
 *   description?: string;       // Optional subtitle/tooltip
 * }
 * ```
 * 
 * ## Features
 * 
 * - ✅ Keyboard accessible (via shadcn DropdownMenu)
 * - ✅ Responsive design (works on mobile & desktop)
 * - ✅ Theme support (light/dark mode via CSS variables)
 * - ✅ Icon support (optional per menu item)
 * - ✅ Description support (optional subtitle for menu items)
 * - ✅ Active state indication (secondary variant when route active)
 * - ✅ Chevron indicator (shows dropdown affordance)
 * 
 * ## Extension Points
 * 
 * To add new functionality without modifying component:
 * 
 * 1. **Add menu sections**: Use separator in items array
 * 2. **Add badges**: Extend NavDropdownItem interface
 * 3. **Add keyboard shortcuts**: Extend NavDropdownItem interface
 * 4. **Add custom actions**: Use onClick in items instead of 'to'
 * 
 * ## Testing Considerations
 * 
 * - Verify dropdown opens on click
 * - Verify navigation works for each menu item
 * - Verify active state highlights correctly
 * - Verify keyboard navigation (Tab, Enter, Escape)
 * - Verify mobile vs desktop rendering
 */
