'use client';

import React from 'react';
import TopNavbar from '@/components/navigation/TopNavbar';

export interface AdminTopNavbarProps {
  adminBadgeText?: string;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  showMarketplaceLink?: boolean;
  className?: string;
}

export function AdminTopNavbar({
  onToggleMobileMenu,
}: AdminTopNavbarProps) {
  return (
    <TopNavbar
      currentRole="admin"
      showRoleSwitcher={false}
      onToggleSidebar={onToggleMobileMenu}
    />
  );
}

// Named alias
export const AdminHeader = AdminTopNavbar;
export default AdminTopNavbar;
