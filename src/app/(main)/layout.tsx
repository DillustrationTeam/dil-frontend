'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TopNavbar from '@/components/navigation/TopNavbar';
import CollapsibleSidebar from '@/components/navigation/CollapsibleSidebar';
import CreateCommissionModal from '@/components/modals/CreateCommissionModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'creator'>('client');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeRole = pathname?.startsWith('/creator') ? 'creator' : currentRole;

  const handleRoleChange = (role: 'client' | 'creator') => {
    setCurrentRole(role);
    router.push(role === 'creator' ? '/creator/commissions' : '/client/commissions');
  };

  return (
    <div className="min-h-screen bg-[#1F2335] text-[#e4e1e5] flex flex-col font-sora">
      {/* Top Navbar */}
      <TopNavbar
        currentRole={activeRole}
        onRoleChange={handleRoleChange}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full relative">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar
          key={activeRole}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          role={activeRole}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Commission Creation Pop-up Modal */}
      <CreateCommissionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitSuccess={() => {
          console.log('Commission created successfully');
        }}
      />
    </div>
  );
}
