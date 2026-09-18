'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CommissionStepper from '@/components/commission/CommissionStepper';

export default function CommissionCreateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active step based on pathname
  let currentStep = 1;
  if (pathname.includes('/timeline') || pathname.includes('step=2')) currentStep = 2;
  else if (pathname.includes('/assets') || pathname.includes('step=3')) currentStep = 3;
  else if (pathname.includes('/review') || pathname.includes('step=4')) currentStep = 4;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stepper Header (Only shown inside /commission/create routes) */}
      <div className="bg-[#161926]/85 backdrop-blur-[32px] border border-white/10 rounded-[28px] p-6 shadow-2xl">
        <CommissionStepper currentStep={currentStep} />
      </div>

      {/* Child Route Page */}
      <div>{children}</div>
    </div>
  );
}
