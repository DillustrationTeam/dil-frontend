import { ReactNode } from 'react';

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  materialIcon?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
  screenId?: string;
  exact?: boolean;
}

export interface AdminNavSection {
  title?: string;
  items: AdminNavItem[];
}

export interface AdminVerticalNavbarProps {
  /**
   * List of navigation items. Defaults to the standard admin screens.
   */
  items?: AdminNavItem[];

  /**
   * Grouped navigation sections with headers, matching CollapsibleSidebar.
   */
  sections?: AdminNavSection[];

  /**
   * Whether the sidebar is collapsed (w-20 vs w-64).
   */
  isCollapsed?: boolean;

  /**
   * Callback to toggle collapse state.
   */
  onToggleCollapse?: () => void;

  /**
   * Explicitly set active href. If not provided, automatically resolved via Next.js usePathname().
   */
  activeHref?: string;

  /**
   * Administrator display name. Falls back to auth user full name or "System Admin".
   */
  adminName?: string;

  /**
   * Administrator role or title. Defaults to "Platform Control".
   */
  adminRole?: string;

  /**
   * Text/initials shown inside the avatar circle. Defaults to "ADM" or user initials.
   */
  avatarText?: string;

  /**
   * Whether to display the admin profile header. Defaults to true.
   */
  showProfile?: boolean;

  /**
   * Whether to show screen ID badges (e.g. SCR-24). Defaults to false.
   */
  showScreenIds?: boolean;

  /**
   * Whether to show the bottom footer with quick marketplace link and logout. Defaults to true.
   */
  showFooter?: boolean;

  /**
   * Optional custom footer content.
   */
  footerContent?: ReactNode;

  /**
   * Custom additional container CSS classes.
   */
  className?: string;

  /**
   * Callback when a navigation item is clicked.
   */
  onItemClick?: (item: AdminNavItem) => void;

  /**
   * Callback when logout button is clicked.
   */
  onLogout?: () => void;
}
