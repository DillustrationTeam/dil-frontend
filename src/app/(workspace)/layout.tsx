'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TopNavbar from '@/components/navigation/TopNavbar';
import CollapsibleSidebar from '@/components/navigation/CollapsibleSidebar';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'creator'>('client');
  const pathname = usePathname();
  const router = useRouter();
  const activeRole = pathname?.startsWith('/creator') ? 'creator' : currentRole;

  const handleRoleChange = (role: 'client' | 'creator') => {
    setCurrentRole(role);
    router.push(role === 'creator' ? '/creator/commissions' : '/client/commissions');
  };

  return (
    <div className="min-h-screen bg-[#1F2335] text-[#e4e1e5] flex flex-col font-sora">
      <TopNavbar
        currentRole={activeRole}
        onRoleChange={handleRoleChange}
      />
      <div className="flex-1 flex w-full relative">
        <CollapsibleSidebar
          key={activeRole}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          role={activeRole}
        />
        <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
