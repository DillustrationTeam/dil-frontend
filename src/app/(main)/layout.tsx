'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import TopNavbar from '@/components/navigation/TopNavbar';
import CollapsibleSidebar from '@/components/navigation/CollapsibleSidebar';
import { useAuthStore } from '@/store/use-auth-store';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'creator'>('client');
  const pathname = usePathname();
  const router = useRouter();
  const isCreator = useAuthStore(state => state.roles.some(role => role.toLowerCase() === 'creator'));
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
      />

      <nav aria-label="Mobile navigation" className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-2 text-xs md:hidden">
        <Link href="/client/commissions" className="shrink-0 rounded-lg bg-white/5 px-3 py-2">My commissions</Link>
        {isCreator && <Link href="/creator/commissions" className="shrink-0 rounded-lg bg-white/5 px-3 py-2">Creator studio</Link>}
        <Link href="/wallet" className="shrink-0 rounded-lg bg-white/5 px-3 py-2">Wallet</Link>
      </nav>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full relative">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar
          key={activeRole}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          role={activeRole}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
